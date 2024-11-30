let currentPage = 1, totalPages = 1;

function getLastSegment(url) {
    return new URL(url).pathname.split('/').pop() || '';
}

const currentUrl = window.location.href;
const lastValue = getLastSegment(currentUrl);
const loadingMessage = document.getElementById('loading');
loadingMessage.style.display = 'block';

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

// Attempt to retrieve from IndexedDB
(async () => {
    try {
        const cachedPdf = await getPDFfromIndexedDB(lastValue);
        if (cachedPdf) {
            loadAndRenderPDF(new Uint8Array(cachedPdf));
        } else {
            fetch(`/embed/${lastValue}`, { method: "POST" })
                .then(response => response.arrayBuffer())
                .then(async buffer => {
                    const pdfData = Array.from(new Uint8Array(buffer));
                    await storePDFInIndexedDB(lastValue, pdfData);
                    loadAndRenderPDF(new Uint8Array(buffer));
                })
                .catch(() => {
                    loadingMessage.innerText = "Error while loading PDF...";
                    loadingMessage.style.display = 'block';
                });
        }
    } catch {
        loadingMessage.innerText = "Error while loading PDF...";
        loadingMessage.style.display = 'block';
    }
})();

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
            document.getElementById('current-page').value = currentPage;
        }
    });
});

document.getElementById('current-page').addEventListener('keypress', (event) => {
    if (event.key == "Enter") {
        const pageNum = event.target.value;
        if (pageNum >= 1 && pageNum <= totalPages) {
            const targetCanvas = document.getElementById(`page-${pageNum}`);
            if (targetCanvas) {
                targetCanvas.scrollIntoView({ behavior: 'smooth' });
                currentPage = pageNum;
                document.getElementById('current-page').value = currentPage;
            }
        } else {
            alert(`Please enter a valid page number between 1 and ${totalPages}.`);
        }
    }
});
