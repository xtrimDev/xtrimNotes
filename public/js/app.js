document.body.setAttribute('oncontextmenu', "return false;");
document.body.setAttribute('onload', "hideLoader()");

function hideLoader() {
    setTimeout(() => {
        $('.section-loader').fadeOut('fast');
        $(".container").css("display", "flex");
    }, 500);
}

const expand = document.querySelectorAll(".toggle");

for (let i = 0; i < expand.length; i++) {
    expand[i].addEventListener('click', (e) => {
        const change = e.target.parentNode.nextElementSibling;

        if (e.target.innerText === '-') {
            e.target.innerText = '+';
        } else {
            e.target.innerText = '-';
        }

        if (change) {
            change.classList.toggle('hidden');
        }
    });
}

const line = document.getElementsByClassName("line");
const left = document.getElementsByClassName("left");

line[0].addEventListener("click", (e) => {
    left[0].classList.toggle('collapse');
});

/** toggle theme*/
const body = document.body;
const togglebtn = document.getElementById('toggle-theme');

togglebtn.addEventListener("click", () => {
    if (togglebtn.checked == false) {
        body.classList.remove('dark');
        body.classList.add('light');
    } else {
        body.classList.remove('light');
        body.classList.add('dark');
    }
});


$(document).ready(function () {
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme) {
        if (savedTheme === "dark") {
            body.classList.remove('light');
            body.classList.add('dark');
            togglebtn.checked = true;
        } else {
            body.classList.remove('dark');
            body.classList.add('light');
            togglebtn.checked = false;
        }
    } else {
        body.classList.remove('light');
        body.classList.add('dark');
        togglebtn.checked = true;
        localStorage.setItem('theme', 'dark');
    }

    togglebtn.addEventListener('change', function () {
        if (this.checked) {
            body.classList.remove('light');
            body.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark');
            body.classList.add('light');
            localStorage.setItem('theme', 'light');
        }
    });

    document.getElementById("add-file").addEventListener("click", () => {
        Swal.fire({
            title: 'Upload a File',
            html: `
                <form id="uploadForm">
                    <div class="swal2-input">
                        <label for="fileInput">Select File:</label>
                        <input type="file" id="fileInput" name="file">
                    </div>
                    <div class="swal2-input">
                        <label for="fileName">File Name:</label>
                        <input type="text" id="fileName" name="fileName" placeholder="Enter file name">
                    </div>
                    <div class="swal2-input">
                        <label for="slug">Slug:</label>
                        <input type="text" id="slug" name="slug" placeholder="Enter slug">
                    </div>
                    <div class="swal2-input">
                        <label for="visibility">Visibility:</label>
                        <select id="visibility" name="visibility">
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                        </select>
                    </div>
                </form>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Submit',
            customClass: {
                popup: 'swal2-popup-custom',
                confirmButton: 'swal2-confirm-custom',
                cancelButton: 'swal2-cancel-custom'
            },
            preConfirm: () => {
                const file = document.getElementById('fileInput').files[0];
                const fileName = document.getElementById('fileName').value;
                const slug = document.getElementById('slug').value;
                const visibility = document.getElementById('visibility').value;

                if (!file || !fileName || !slug) {
                    Swal.showValidationMessage('Please fill all the fields');
                    return false;
                }

                return { file, fileName, slug, visibility };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                console.log('File:', result.value.file);
                console.log('File Name:', result.value.fileName);
                console.log('Slug:', result.value.slug);
                console.log('Visibility:', result.value.visibility);
            }
        });
    });

    document.getElementById("add-folder").addEventListener("click", () => {
        Swal.fire({
            title: 'Create a Folder',
            html: `
                <form id="uploadForm">
                    <div class="swal2-input">
                        <label for="folderName">Folder Name:</label>
                        <input type="text" id="folderName" name="folderName" placeholder="Enter folder name">
                    </div>
                    <div class="swal2-input">
                        <label for="slug">Slug:</label>
                        <input type="text" id="slug" name="slug" placeholder="Enter slug">
                    </div>
                    <div class="swal2-input">
                        <label for="visibility">Visibility:</label>
                        <select id="visibility" name="visibility">
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                        </select>
                    </div>
                </form>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Submit',
            customClass: {
                popup: 'swal2-popup-custom',
                confirmButton: 'swal2-confirm-custom',
                cancelButton: 'swal2-cancel-custom'
            },
            preConfirm: () => {
                const folderName = document.getElementById('folderName').value;
                const slug = document.getElementById('slug').value;
                const visibility = document.getElementById('visibility').value;

                if (!folderName || !slug) {
                    Swal.showValidationMessage('Please fill all the fields');
                    return false;
                }

                return { folderName, slug, visibility };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                console.log('folder Name:', result.value.folderName);
                console.log('Slug:', result.value.slug);
                console.log('Visibility:', result.value.visibility);
            }
        });
    });
})