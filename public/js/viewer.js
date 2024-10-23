let currentPage = 1;
let totalPages = 1;

function getLastSegment(url) {
    const segments = new URL(url).pathname.split('/');
    return segments.pop() || segments[segments.length - 1];
}

const currentUrl = window.location.href;

const lastValue = getLastSegment(currentUrl);

// Show loading message
const loadingMessage = document.getElementById('loading');
loadingMessage.style.display = 'block';


try {
    // Load PDF and render pages
    pdfjsLib.getDocument(`/embed/${lastValue}`).promise.then(function (pdfDoc) {
        totalPages = pdfDoc.numPages;
        document.getElementById('total-pages').textContent = totalPages;

        const pdfContainer = document.getElementById('pdf-container');

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            const canvas = document.createElement('canvas');
            canvas.id = `page-${pageNum}`;
            pdfContainer.appendChild(canvas);

            pdfDoc.getPage(pageNum).then(function (page) {
                const scale = 1.5;
                const viewport = page.getViewport({ scale });
                const context = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                const renderContext = {
                    canvasContext: context,
                    viewport
                };
                page.render(renderContext);

                // Hide loading message when all pages are rendered
                if (pageNum === totalPages) {
                    loadingMessage.style.display = 'none'; // Hide loading message
                }
            }).catch(() => {
                console.clear();
            } );
        }
    }).catch((err) => {
        console.clear()
        const loadingMessage = document.getElementById('loading');
        loadingMessage.innerText = "Error while loading PDF...";
        loadingMessage.style.display = 'block';
    });
} catch {
    const loadingMessage = document.getElementById('loading');
    loadingMessage.innerText = "Error while loading PDF...";
    loadingMessage.style.display = 'block';
}


// Update the page number while scrolling
document.getElementById('pdf-container').addEventListener('scroll', function () {
    const pageCanvases = document.querySelectorAll('#pdf-container canvas');
    pageCanvases.forEach((canvas, index) => {
        const rect = canvas.getBoundingClientRect();
        if (rect.top >= 0 && rect.top <= window.innerHeight / 2) {
            currentPage = index + 1;
            document.getElementById('current-page').textContent = currentPage;
        }
    });
});

// Go to specific page
document.getElementById('goto-button').addEventListener('click', function () {
    const gotoInput = document.getElementById('goto-input');
    const pageNum = parseInt(gotoInput.value);

    if (pageNum >= 1 && pageNum <= totalPages) {
        const pdfContainer = document.getElementById('pdf-container');
        const targetCanvas = document.getElementById(`page-${pageNum}`);

        // Scroll to the target canvas
        if (targetCanvas) {
            targetCanvas.scrollIntoView({ behavior: 'smooth' });
            currentPage = pageNum;
            document.getElementById('current-page').textContent = currentPage;
        }
    } else {
        alert(`Please enter a valid page number between 1 and ${totalPages}.`);
    }
});