document.body.setAttribute('oncontextmenu', "return false;");
document.body.setAttribute('onload', "hideLoader()");

function hideLoader(){
    setTimeout(() => {
        $('.section-loader').fadeOut('fast');
        $(".container").css("display","flex");
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
    if (togglebtn.checked == false) {
        body.classList.remove('dark');
        body.classList.add('light');
    } else {
        body.classList.remove('light');
        body.classList.add('dark');
    }

    document.getElementById("add-file").addEventListener("click", () => {
        Swal.fire({
            title: 'Upload a File',
            html: `
                <form id="uploadForm">
                    <div class="swal2-input">
                        <label for="fileInput">Select File:</label><br>
                        <input type="file" id="fileInput" name="file">
                    </div>
                    <div class="swal2-input">
                        <label for="folderName">Folder Name:</label><br>
                        <input type="text" id="folderName" name="folderName" placeholder="Enter folder name">
                    </div>
                    <div class="swal2-input">
                        <label for="slug">Slug:</label><br>
                        <input type="text" id="slug" name="slug" placeholder="Enter slug">
                    </div>
                    <div class="swal2-input">
                        <label for="visibility">Visibility:</label><br>
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
            preConfirm: () => {
                const file = document.getElementById('fileInput').files[0];
                const folderName = document.getElementById('folderName').value;
                const slug = document.getElementById('slug').value;
                const visibility = document.getElementById('visibility').value;
    
                if (!file || !folderName || !slug) {
                    Swal.showValidationMessage('Please fill all the fields');
                    return false;
                }
    
                return { file, folderName, slug, visibility };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                console.log('File:', result.value.file);
                console.log('Folder Name:', result.value.folderName);
                console.log('Slug:', result.value.slug);
                console.log('Visibility:', result.value.visibility);
            }
        });
    });
})