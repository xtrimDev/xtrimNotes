let currentPage = 1, totalPages = 1;

function getLastSegment(url) {
    return new URL(url).pathname.split('/').pop() || '';
}

const currentUrl = window.location.href;
const lastValue = getLastSegment(currentUrl);
const loadingMessage = document.getElementById('loading');
loadingMessage.style.display = 'block';

const cachedPdf = localStorage.getItem(`pdf-${lastValue}`);

if (cachedPdf) {
    // Load PDF from cache
    loadAndRenderPDF(new Uint8Array(JSON.parse(cachedPdf)));
} else {
    // Fetch PDF and cache it
    fetch(`/embed/${lastValue}`)
        .then(response => response.arrayBuffer())
        .then(buffer => {
            // Store the PDF data in cache
            localStorage.setItem(`pdf-${lastValue}`, JSON.stringify(Array.from(new Uint8Array(buffer))));
            loadAndRenderPDF(new Uint8Array(buffer));
        })
        .catch(() => {
            loadingMessage.innerText = "Error while loading PDF...";
            loadingMessage.style.display = 'block';
        });
}

function loadAndRenderPDF(pdfData) {
    pdfjsLib.getDocument({ data: pdfData }).promise
        .then(pdfDoc => {
            totalPages = pdfDoc.numPages;
            document.getElementById('total-pages').textContent = totalPages;

            const pdfContainer = document.getElementById('pdf-container');
            for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                const canvas = document.createElement('canvas');
                canvas.id = `page-${pageNum}`;
                pdfContainer.appendChild(canvas);

                pdfDoc.getPage(pageNum).then(page => {
                    const scale = 1.5, viewport = page.getViewport({ scale });
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    page.render({ canvasContext: canvas.getContext('2d'), viewport });

                    if (pageNum === totalPages) loadingMessage.style.display = 'none';
                }).catch(console.clear());
            }
        })
        .catch(() => {
            loadingMessage.innerText = "Error while loading PDF...";
            loadingMessage.style.display = 'block';
        });
}

document.getElementById('pdf-container').addEventListener('scroll', () => {
    const pageCanvases = document.querySelectorAll('#pdf-container canvas');
    pageCanvases.forEach((canvas, index) => {
        if (canvas.getBoundingClientRect().top >= 0 && canvas.getBoundingClientRect().top <= window.innerHeight / 2) {
            currentPage = index + 1;
            document.getElementById('current-page').textContent = currentPage;
        }
    });
});

document.getElementById('goto-button').addEventListener('click', () => {
    const pageNum = parseInt(document.getElementById('goto-input').value);
    if (pageNum >= 1 && pageNum <= totalPages) {
        const targetCanvas = document.getElementById(`page-${pageNum}`);
        if (targetCanvas) {
            targetCanvas.scrollIntoView({ behavior: 'smooth' });
            currentPage = pageNum;
            document.getElementById('current-page').textContent = currentPage;
        }
    } else {
        alert(`Please enter a valid page number between 1 and ${totalPages}.`);
    }
});
