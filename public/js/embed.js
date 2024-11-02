$(document).ready(function () {
    let pdf = null, scale = 1.5, totalPages = 0;

    document.addEventListener("click", async function (event) {
        let targetElement = event.target.closest('[data-embed]');

        if (targetElement) {
            const embedValue = targetElement.getAttribute('data-embed');
            const BookmarkBtn = $("#bookmark-btn");
            const BookmarkBtnIcon = $("#bookmark-btn .icon");
            const embedTitle = targetElement.getAttribute('data-name') || 'Document Preview';
            const url = `/embed/${embedValue}`;
            const cachedPdf = localStorage.getItem(`pdf-${embedValue}`);
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

            let data = cache.has("/bookmarks") ? cache.get("/bookmarks") : null;

            if (!data) {
                try {
                    const response = await fetch("/bookmarks", { method: "POST" });
                    if (!response.ok) throw new Error("Failed to fetch bookmarks");
                    data = await response.json();
                    cache.set("/bookmarks", data); // Set the initial cache if not present
                } catch (error) {
                    Toast.fire({
                        icon: "error",
                        title: "Something went wrong"
                    });
                    $(".swal2-container").attr("style", "z-index: 100000 !important;");
                    return;
                }
            }

            const index = data.files.findIndex(file => file.uniqueName === embedValue);
            const isBookmarked = index >= 0;

            if (isBookmarked) {
                BookmarkBtnIcon.attr("class", "icon fa-star fa-solid")
                BookmarkBtn.removeAttr("disabled")
            } else {
                let checked = false;
                
                fetch(`/get/bookmark/${embedValue}`, { method: "POST" })
                    .then((response) => response.json())  // Call json() as a function
                    .then((data) => {
                        (data.bookmarked)
                            ? checked = true
                            : checked = false
                    }).catch(() => {
                        Toast.fire({
                            icon: "error",
                            title: "Something Went wrong"
                        });
                    })

                if (checked) {
                    data.files.push({ name: embedTitle, uniqueName: embedValue }); // Add the new file
                    BookmarkBtnIcon.attr("class", "icon fa-star fa-solid")
                } else {
                    BookmarkBtnIcon.attr("class", "icon fa-star fa-regular")
                }

                BookmarkBtn.removeAttr("disabled")
            }

            if (cachedPdf) {
                // Load PDF from localStorage
                const pdfData = new Uint8Array(JSON.parse(cachedPdf));
                loadAndRenderPDF(pdfData);
            } else {
                // Fetch PDF from server once
                fetch(url, { method: "POST" })
                    .then(response => response.arrayBuffer())
                    .then(buffer => {
                        // Cache the data in localStorage
                        localStorage.setItem(`pdf-${embedValue}`, JSON.stringify(Array.from(new Uint8Array(buffer))));
                        loadAndRenderPDF(new Uint8Array(buffer));
                    })
                    .catch(() => {
                        pdfViewer.html('<div style="font-size: 1.5rem; color: white; position: relative; top: 50%;">Error while loading PDF...</div>');
                    });
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
        if (pageNum > totalPages) return; // Exit condition
        pdf.getPage(pageNum).then(page => {
            const viewport = page.getViewport({ scale });
            const pageCanvas = $('<canvas>').attr('id', `page-${pageNum}`).attr('width', viewport.width).attr('height', viewport.height)[0];
            const context = pageCanvas.getContext('2d');

            page.render({ canvasContext: context, viewport }).promise.then(() => {
                $('#pdfViewer').append(pageCanvas);
                renderPagesSequentially(pageNum + 1); // Render the next page
            });
        });
    }

    $('#pdfViewer').on('scroll', function () {
        const canvases = this.getElementsByTagName('canvas');
        const scrollPosition = this.scrollTop;
        for (let i = 0; i < canvases.length; i++) {
            const canvasTop = canvases[i].offsetTop;
            const canvasHeight = canvases[i].clientHeight;
            if (scrollPosition >= canvasTop && scrollPosition < (canvasTop + canvasHeight)) {
                $('#currentPage').text(i + 1);
                break;
            }
        }
    });

    $('#closeViewerButton').on('click', function () {
        $('#viewerContainer').hide();
        $('#pdfViewer').empty();
    });

    $('#goto-button').on('click', function () {
        const pageNum = parseInt($('#goto-input').val());
        if (pageNum >= 1 && pageNum <= totalPages) {
            $(`#page-${pageNum}`)[0]?.scrollIntoView({ behavior: 'smooth' });
        } else {
            alert(`Please enter a valid page number between 1 and ${totalPages}.`);
        }
    });
});
