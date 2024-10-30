$(document).ready(function () {
    let pdf = null, scale = 1.5, totalPages = 0;

    document.addEventListener("click", function (event) {
        let targetElement = event.target.closest('[data-embed]');
      
        if (targetElement) {
            const targetDiv = document.querySelector(".titlebar");
           
            const embedValue = targetElement.getAttribute('data-embed');
            const innerDiv = document.getElementById(`star-${embedValue}`);
            const embedTitle = targetElement.getAttribute('data-name') || 'Document Preview';
            const url = `/embed/${embedValue}`;
            const cachedPdf = localStorage.getItem(`pdf-${embedValue}`);
            const viewerContainer = $('#viewerContainer');
            const pdfViewer = $('#pdfViewer');
            const pageTitle = $('#pageTitle');
            const openInTab = $('#openInTab');
        if (innerDiv==null) { 
            // Create button
            const button = document.createElement("button");
            button.className = "bookmark-btn";
            button.onclick = () => toggleBookmark(embedValue); // Set the onclick function
            
            // Create icon element
            const icon = document.createElement("i");
            icon.className = "icon fa-star";
            icon.id = `star-${embedValue}`;
            
            // Append icon to button, then button to targetDiv
            button.appendChild(icon);
            if (targetDiv.children.length >= 1) {
                targetDiv.insertBefore(button, targetDiv.children[1]);
            } else {
                targetDiv.appendChild(button); // Fallback if there's no second element
            }
        }
        loadBookmarks();
       

            pdfViewer.empty().append('<div id="loaderPdf" style="font-size: 1.5rem; color: white; position: absolute; top: 50%;">Loading PDF...</div>');
            pageTitle.text(embedTitle);
            $('#currentPage').text(1);
            $('#totalPages').text(1);
            viewerContainer.show();
            openInTab.attr("onclick", `window.open('/viewer/${embedValue}', '_blank')`);

            if (cachedPdf) {
                // Load PDF from localStorage
                const pdfData = new Uint8Array(JSON.parse(cachedPdf));
                loadAndRenderPDF(pdfData);
            } else {
                // Fetch PDF from server once
                fetch(url)
                    .then(response => response.arrayBuffer())
                    .then(buffer => {
                        // Cache the data in localStorage
                        localStorage.setItem(`pdf-${embedValue}`, JSON.stringify(Array.from(new Uint8Array(buffer))));
                        loadAndRenderPDF(new Uint8Array(buffer));
                    })
                    .catch(() => {
                        pdfViewer.html('<div style="font-size: 1.5rem; color: white; position: absolute; top: 50%;">Error while loading PDF...</div>');
                    });
            }
        }
    });

    function loadAndRenderPDF(pdfData) {
        pdfjsLib.getDocument({data: pdfData}).promise.then(pdfDoc => {
            pdf = pdfDoc;
            totalPages = pdf.numPages;
            $('#totalPages').text(totalPages);
            $('#pdfViewer').empty();
            renderPagesSequentially(1);
        }).catch(() => {
            $('#pdfViewer').html('<div style="font-size: 1.5rem; color: white; position: absolute; top: 50%;">Error while loading PDF...</div>');
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
