$(document).ready(function () {
    let pdf = null;
    let scale = 1.5;
    let totalPages = 0;

    document.addEventListener("click", function (event) {
        let targetElement = event.target.closest('[data-embed]');
        
        if (targetElement) {
            let embedValue = targetElement.getAttribute('data-embed');
            let embedTitle = targetElement.getAttribute('data-name');
            var url = `/embed/${embedValue}`; 
            var viewerContainer = document.getElementById('viewerContainer');
            var pdfViewer = document.getElementById('pdfViewer');
            var pageTitle = document.getElementById('pageTitle');
            var openInTab = document.getElementById('openInTab');

            // Clear the viewer for a new PDF
            pdfViewer.innerHTML = '';
            pageTitle.innerHTML = (embedTitle || 'Document Preview');

            document.getElementById('currentPage').textContent = 1;
            document.getElementById('totalPages').textContent = 1;

            viewerContainer.style.display = 'block';

            openInTab.setAttribute("onclick", `window.open('/viewer/${embedValue}', '_blank')`);

            pdfViewer.innerHTML = `<div id="loaderPdf" style="font-size: 1.5rem; color: white; position: absolute; top: 50%; display: block">Loading pdf</div> `;

            pdfjsLib.getDocument(url).promise.then(function (pdfDoc) {
                pdf = pdfDoc;
                totalPages = pdf.numPages;
                document.getElementById('totalPages').textContent = totalPages;

                // Fetch and render all pages
                for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                    renderPage(pageNum);
                }
            }).catch((err) => {
                console.clear();
                pdfViewer.innerHTML = `<div style=" font-size: 1.5rem; color: white; position: absolute; top: 50%; display: block;">Error while Loading pdf</div>`;
            });
        }
    });

    function renderPage(pageNum) {
        var pdfViewer = document.getElementById('pdfViewer');
        if (pdf) {
            pdf.getPage(pageNum).then(function (page) {
                var viewport = page.getViewport({ scale: scale });

                // Create a new canvas element for the current page
                var pageCanvas = document.createElement('canvas');
                pageCanvas.id = `page-${pageNum}`;

                var context = pageCanvas.getContext('2d');
                pageCanvas.height = viewport.height;
                pageCanvas.width = viewport.width;

                var renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };

                page.render(renderContext).promise.then(function () {

                    // Append the page canvas to the viewer after rendering is complete

                    if (pageNum != 1) {
                        document.getElementById('pdfViewer').appendChild(pageCanvas);
                    }  else {
                        document.getElementById('pdfViewer').innerHTML = '';
                        document.getElementById('pdfViewer').appendChild(pageCanvas);
                    }
                }).catch((err) => {
                    console.clear()
                });
            }).catch ((err) => {
                console.clear()
            });
        }
    }

    // Update the current page number based on scroll position
    document.getElementById('pdfViewer').addEventListener('scroll', function () {
        let pdfViewer = document.getElementById('pdfViewer');
        let scrollPosition = pdfViewer.scrollTop;
        let viewerHeight = pdfViewer.clientHeight;

        // Loop through all canvas elements to determine which page is currently visible
        let canvases = pdfViewer.getElementsByTagName('canvas');
        for (let i = 0; i < canvases.length; i++) {
            let canvasTop = canvases[i].offsetTop;
            let canvasHeight = canvases[i].clientHeight;

            // Check if the top of the canvas is within the visible viewport
            if (scrollPosition >= canvasTop && scrollPosition < (canvasTop + canvasHeight)) {
                let currentPage = i + 1; // Page numbers are 1-based
                document.getElementById('currentPage').textContent = currentPage;
                break;
            }
        }
    });

    function closeViewer() {
        var viewerContainer = document.getElementById('viewerContainer');
        viewerContainer.style.display = 'none';

        // Clear the PDF viewer for the next use
        document.getElementById('pdfViewer').innerHTML = '';
    }

    document.getElementById('closeViewerButton').addEventListener('click', closeViewer);
});

document.getElementById('goto-button').addEventListener('click', function () {
    let totalPagesCount = parseInt(totalPages.innerHTML);
    const gotoInput = document.getElementById('goto-input');
    const pageNum = parseInt(gotoInput.value);

    if (pageNum >= 1 && pageNum <= totalPagesCount) {
        const pdfContainer = document.getElementById('pdf-container');
        const targetCanvas = document.getElementById(`page-${pageNum}`);

        // Scroll to the target canvas
        if (targetCanvas) {
            targetCanvas.scrollIntoView({ behavior: 'smooth' });
            currentPage = pageNum;
        }
    } else {
        alert(`Please enter a valid page number between 1 and ${totalPagesCount}.`);
    }
});
