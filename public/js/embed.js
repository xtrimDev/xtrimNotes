$(document).ready(function () {
    let pdf = null, scale = 1.5, totalPages = 0;

    // IndexedDB Setup
    function initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("PDFCacheDB", 1);
            request.onupgradeneeded = function (event) {
                const db = event.target.result;
                if (!db.objectStoreNames.contains("PDFStore")) {
                    db.createObjectStore("PDFStore", { keyPath: "key" });
                }
            };
            request.onsuccess = function (event) {
                resolve(event.target.result);
            };
            request.onerror = function () {
                reject("Failed to initialize IndexedDB");
            };
        });
    }

    async function storePDFInIndexedDB(key, pdfData) {
        const db = await initIndexedDB();
        const transaction = db.transaction("PDFStore", "readwrite");
        const store = transaction.objectStore("PDFStore");
        store.put({ key, data: pdfData });
    }

    async function getPDFfromIndexedDB(key) {
        return new Promise(async (resolve, reject) => {
            const db = await initIndexedDB();
            const transaction = db.transaction("PDFStore", "readonly");
            const store = transaction.objectStore("PDFStore");
            const request = store.get(key);
            request.onsuccess = function () {
                resolve(request.result ? request.result.data : null);
            };
            request.onerror = function () {
                reject("Failed to retrieve PDF from IndexedDB");
            };
        });
    }

    document.addEventListener("click", async function (event) {
        let targetElement = event.target.closest('[data-embed]');

        if (targetElement) {
            const embedValue = targetElement.getAttribute('data-embed');
            const BookmarkBtn = $("#bookmark-btn");
            const BookmarkBtnIcon = $("#bookmark-btn .icon");
            const embedTitle = targetElement.getAttribute('data-name') || 'Document Preview';
            const url = `/embed/${embedValue}`;
            const viewerContainer = $('#viewerContainer');
            const pdfViewer = $('#pdfViewer');
            const pageTitle = $('#pageTitle');
            const openInTab = $('#openInTab');

            pdfViewer.empty().append('<div id="loaderPdf" style="font-size: 1.5rem; color: white; position: relative; top: 50%;">Loading PDF...</div>');
            pageTitle.text(embedTitle);
            $('#currentPage').text(1);
            $('#totalPages').text(1);
            viewerContainer.show();
            openInTab.attr("onclick", `window.open('/viewer/${embedValue}', '_blank')`);

            BookmarkBtnIcon.attr("class", "icon fa-solid fa-spinner fa-spin-pulse");
            BookmarkBtn.attr("disabled", true);
            BookmarkBtn.attr("onclick", `toggleBookmark('${embedValue}', '${embedTitle}')`);

            try {
                const cachedPdf = await getPDFfromIndexedDB(embedValue);
                if (cachedPdf) {
                    loadAndRenderPDF(new Uint8Array(cachedPdf));
                } else {
                    const response = await fetch(url, { method: "POST" });
                    const buffer = await response.arrayBuffer();
                    const pdfData = new Uint8Array(buffer);
                    await storePDFInIndexedDB(embedValue, Array.from(pdfData));
                    loadAndRenderPDF(pdfData);
                }
            } catch {
                pdfViewer.html('<div style="font-size: 1.5rem; color: white; position: relative; top: 50%;">Error while loading PDF...</div>');
            }

            let data = cache.has("/bookmarks") ? cache.get("/bookmarks") : null;

            if (!data) {
                try {
                    const response = await fetch("/bookmarks", { method: "POST" });
                    if (!response.ok) throw new Error("Failed to fetch bookmarks");
                    data = await response.json();
                    cache.set("/bookmarks", data);
                } catch (error) {
                    Toast.fire({
                        icon: "error",
                        title: "Something went wrong"
                    });
                    $(".swal2-container").attr("style", "z-index: 100000 !important;");
                }
            }

            const index = data.files.findIndex(file => file.uniqueName === embedValue);
            const isBookmarked = index >= 0;

            if (isBookmarked) {
                BookmarkBtnIcon.attr("class", "icon fa-star fa-solid")
                BookmarkBtn.removeAttr("disabled")
            } else {
                let checked = false;

                try {
                    const response = await fetch(`/get/bookmark/${embedValue}`, { method: "POST" });
                    const result = await response.json();
                    checked = result.bookmarked;
                } catch {
                    Toast.fire({
                        icon: "error",
                        title: "Something Went wrong"
                    });
                    $(".swal2-container").attr("style", "z-index: 100000 !important;");
                }

                if (checked) {
                    data.files.push({ name: embedTitle, uniqueName: embedValue });
                    BookmarkBtnIcon.attr("class", "icon fa-star fa-solid");
                } else {
                    BookmarkBtnIcon.attr("class", "icon fa-star fa-regular");
                }

                BookmarkBtn.removeAttr("disabled");
            }
        }
    });

    function loadAndRenderPDF(pdfData) {
        pdfjsLib.getDocument({ data: pdfData }).promise.then(pdfDoc => {
            pdf = pdfDoc;
            totalPages = pdf.numPages;
            $('#totalPages').text(totalPages);
            $('#pdfViewer').empty();
            renderPagesSequentially(1);
        }).catch(() => {
            $('#pdfViewer').html('<div style="font-size: 1.5rem; color: white; position: relative; top: 50%;">Error while loading PDF...</div>');
        });
    }

    function renderPagesSequentially(pageNum) {
        if (pageNum > totalPages) return;
        pdf.getPage(pageNum).then(page => {
            const viewport = page.getViewport({ scale });
            const pageCanvas = $('<canvas>').attr('id', `page-${pageNum}`).attr('width', viewport.width).attr('height', viewport.height)[0];
            const context = pageCanvas.getContext('2d');

            page.render({ canvasContext: context, viewport }).promise.then(() => {
                $('#pdfViewer').append(pageCanvas);
                renderPagesSequentially(pageNum + 1);
            });
        });
    }

    $('#pdfViewer').on('scroll', function () {
        const canvases = this.getElementsByTagName('canvas');
        const scrollPosition = this.scrollTop;
        for (let i = 0; i < canvases.length; i++) {
            const canvasTop = canvases[i].offsetTop;
            const canvasHeight = canvases[i].clientHeight;
            if (scrollPosition >= canvasTop - 200 && scrollPosition < (canvasTop + canvasHeight - 200)) {
                $('#current-page').val(i + 1);
                break;
            }
        }
    });

    $('#closeViewerButton').on('click', function () {
        $('#viewerContainer').hide();
        $('#pdfViewer').empty();
    });

    $('#current-page').on('keypress', (event) => {
        if (event.key == "Enter") {
            const pageNum = event.target.value;
            if (pageNum >= 1 && pageNum <= totalPages) {
                $(`#page-${pageNum}`)[0]?.scrollIntoView({ behavior: 'smooth' });
            } else {
                alert(`Please enter a valid page number between 1 and ${totalPages}.`);
            }
        }
    });
});
