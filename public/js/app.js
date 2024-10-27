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
            e.target.innerText = ' +';
        } else {
            e.target.innerText = ' - ';
        }

        if (change) {
            change.classList.toggle('hidden');
        }
    });
}

const line = document.getElementsByClassName("line");
const close = document.getElementsByClassName("close");
const left = document.getElementsByClassName("left");

line[0].addEventListener("click", (e) => {
    left[0].classList.toggle('collapse');
});

close[0].addEventListener("click", (e) => {
    left[0].classList.toggle('collapse');
});

const body = document.body;
$(document).ready(function () {
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme) {
        if (savedTheme === "dark") {
            body.classList.remove('light');
            body.classList.add('dark');
        } else {
            body.classList.remove('dark');
            body.classList.add('light');
        }
    } else {
        body.classList.remove('light');
        body.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }

    document?.getElementById("add-file")?.addEventListener("click", () => {
        Swal.fire({
            title: 'Upload a File',
            html: `
                <form id="uploadForm" enctype="multipart/form-data" class="file-upload" autocomplete="off">
                    <div class="swal2-input">
                        <label for="fileInput">Select File:</label>
                        <input type="file" id="fileInput" name="file">
                    </div>
                    <div class="swal2-input">
                        <label for="fileName">File Name:</label>
                        <input type="text" id="fileName" name="fileName" placeholder="Enter file name" required>
                    </div>
                    <div>
                        <input type="text" id="currentUrl" name="currentUrl" value="${window.location.pathname}" style="display: none; opacity: 0">
                    </div>
                    <div class="swal2-input">
                        <label for="visibility-file">Visibility:</label>
                        <select id="visibility-file" name="visibility">
                            <option value="Public">Public</option>
                            <option value="Admin">Admin</option>
                            <option value="Owner">Owner</option>
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
                const fileName = document.getElementById('fileName').value;

                if (!fileName) {
                    Swal.showValidationMessage('Please fill all the fields');
                    return false;
                }

                let uploadForm = document.querySelector(".file-upload");
                let formData = new FormData(uploadForm);

                $.ajax({
                    type: 'POST',
                    url: '/dict/addFile',
                    data: formData,
                    processData: false,   
                    contentType: false,
                    success: (response) => {
                        if (response?.success && response?.permission) {
                            Swal.fire({
                                icon: 'success',
                                text: 'File uploaded Successfully',
                                showConfirmButton: false,
                                timer: 1500,
                            }).then(() => {
                                updateContent(window.location.pathname, document.title, true);
                            });
                        } else {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: 'Something went wrong',
                                showConfirmButton: false,
                                timer: 1500,
                            }).then(() => {
                                updateContent(window.location.pathname, document.title);
                            });
                        }
                    },
                    error: (xhr, status, error) => {
                        if (xhr.status == 400) {
                            const response = JSON.parse(xhr.responseText);

                            if (!response.permission) {
                                Swal.fire({
                                    icon: 'info',
                                    title: `Not authorized`,
                                    text: "Your are not authorized to upload a file",
                                    showConfirmButton: false,
                                    timer: 1500,
                                }).then(() => {
                                    updateContent(window.location.pathname, document.title);
                                });

                                return
                            }

                            Swal.fire({
                                icon: 'info',
                                title: `Error`,
                                text: response.msg,
                                showConfirmButton: false,
                                timer: 1500,
                            }).then(() => {
                                updateContent(window.location.pathname, document.title);
                            });

                            return;
                        } else {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error 500',
                                text: "Internal server error!",
                                showConfirmButton: false,
                                timer: 1500,
                            }).then(() => {
                                updateContent(window.location.pathname, document.title);
                            });
                        }
                    }
                })
            }
        });
    });

    document?.getElementById("add-folder")?.addEventListener("click", () => {
        Swal.fire({
            title: 'Create a Folder',
            html: `
                <form id="uploadForm" autocomplete="off">
                    <div class="swal2-input">
                        <label for="folderName">Folder Name:</label>
                        <input type="text" id="folderName" name="folderName" placeholder="Enter folder name" oninput="folderSlug()" autocomplete="off" required>
                    </div>
                    <div class="swal2-input">
                        <label for="slug-folder">Slug:</label>
                        <input type="text" id="slug-folder" name="slug" placeholder="Enter slug" autocomplete="off" disabled required>
                    </div>
                    <div class="swal2-input">
                        <label for="visibility-folder">Visibility:</label>
                        <select id="visibility-folder" name="visibility">
                            <option value="Public" selected>Public</option>
                            <option value="Admin">Admin</option>
                            <option value="Owner">Owner</option>
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
                const slug = document.getElementById('slug-folder').value;
                const visibility = document.getElementById('visibility-folder').value;

                if (!folderName || !slug) {
                    Swal.showValidationMessage('Please fill all the fields');
                    return false;
                }

                const currentUrl = window.location.pathname;

                $.ajax({
                    type: 'POST',
                    url: '/dict/addFolder',
                    data: `folderName=${encodeURIComponent(folderName)}&slug=${encodeURIComponent(slug)}&visibility=${encodeURIComponent(visibility)}&atFolder=${encodeURIComponent(currentUrl)}`,
                    success: (response) => {
                        if (response?.success && response?.permission) {
                            Swal.fire({
                                icon: 'success',
                                text: 'Folder created Successfully',
                                showConfirmButton: false,
                                timer: 1500,
                            }).then(() => {
                                updateContent(window.location.pathname, document.title, true);
                            });
                        } else {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: 'Something went wrong',
                                showConfirmButton: false,
                                timer: 1500,
                            }).then(() => {
                                updateContent(window.location.pathname, document.title);
                            });
                        }
                    },
                    error: (xhr, status, error) => {
                        if (xhr.status == 400) {
                            const response = JSON.parse(xhr.responseText);

                            if (!response.permission) {
                                Swal.fire({
                                    icon: 'info',
                                    title: `Not authorized`,
                                    text: "Your are not authorized to create a folder",
                                    showConfirmButton: false,
                                    timer: 1500,
                                }).then(() => {
                                    updateContent(window.location.pathname, document.title);
                                });

                                return
                            }

                            Swal.fire({
                                icon: 'info',
                                title: `Error`,
                                text: response.msg,
                                showConfirmButton: false,
                                timer: 1500,
                            }).then(() => {
                                updateContent(window.location.pathname, document.title);
                            });

                            return;
                        } else {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error 500',
                                text: "Internal server error!",
                                showConfirmButton: false,
                                timer: 1500,
                            }).then(() => {
                                updateContent(window.location.pathname, document.title);
                            });
                        }
                    }
                })
            }
        });
    });
})