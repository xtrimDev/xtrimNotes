$(document).ready(function () {
    let pdf = null;
    let currentPage = 1;
    let scale = 1.5;

    document.addEventListener("click", function (event) {
        let targetElement = event.target.closest('[data-embed]');
        
        if (targetElement) {
            let embedValue = targetElement.getAttribute('data-embed');
            var url = `/embed/${embedValue}`;; 
            var viewerContainer = document.getElementById('viewerContainer');
            var pdfViewer = document.getElementById('pdfViewer');

            viewerContainer.style.display = 'block';

            pdfjsLib.getDocument(url).promise.then(function (pdfDoc) {
                pdf = pdfDoc;
                document.getElementById('totalPages').textContent = pdf.numPages;
                renderPage(currentPage);
            });
        }
    });

    function renderPage(pageNum) {
        if (pdf) {
            pdf.getPage(pageNum).then(function (page) {
                var viewport = page.getViewport({ scale: scale });

                var context = pdfViewer.getContext('2d');
                pdfViewer.height = viewport.height;
                pdfViewer.width = viewport.width;

                var renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                page.render(renderContext);
                document.getElementById('currentPage').textContent = pageNum;
            });
        }
    }

    function closeViewer() {
        var viewerContainer = document.getElementById('viewerContainer');
        viewerContainer.style.display = 'none';
    }

    document.getElementById('closeViewerButton').addEventListener('click', closeViewer);

    document.getElementById('nextPageButton').addEventListener('click', function () {
        if (pdf && currentPage < pdf.numPages) {
            currentPage++;
            renderPage(currentPage);
        }
    });

    document.getElementById('prevPageButton').addEventListener('click', function () {
        if (pdf && currentPage > 1) {
            currentPage--;
            renderPage(currentPage);
        }
    });
});
