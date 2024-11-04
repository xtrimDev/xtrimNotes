document.addEventListener('DOMContentLoaded', () => {
    /** folder */
    const contextmenuFolder = document.getElementById("custom-context-menu-folder");
    const openFolder = document.getElementById('folder-open');
    const renameFolder = document.getElementById('folder-rename');
    const infoFolder = document.getElementById('folder-info');

    /** file */
    const contextMenufile = document.getElementById('custom-context-menu-file');
    const openfile = document.getElementById('file-open');
    const renameFile = document.getElementById('file-rename');
    const download = document.getElementById('file-download');
    const remove = document.getElementById('file-delete');
    const infoFile = document.getElementById('file-info');

    document.querySelector('.right').addEventListener('contextmenu', function (event) {
        if (document.location.pathname == "/bookmarks") return;
        
        /** folder */
        if (event.target.closest('.folder-menu')) {
            event.preventDefault();
            const link = event.target.closest('.folder-menu');

            openFolder.setAttribute("onclick", link.getAttribute("onclick"));

            renameFolder.dataset.path = link.dataset.path;
            renameFolder.dataset.name = link.dataset.name;

            if (infoFolder) {
                infoFolder.dataset.path = link.dataset.path;
            }

            // Initial positioning
            let posX = event.pageX;
            let posY = event.pageY;

            contextMenufile.style.display = "none";
            // Calculate menu dimensions
            contextmenuFolder.style.display = 'block'; // Temporarily display to get dimensions
            const menuWidth = contextmenuFolder.offsetWidth;
            const menuHeight = contextmenuFolder.offsetHeight;

            // Check if the menu would overflow the right side
            if (posX + menuWidth > window.innerWidth) {
                posX = window.innerWidth - menuWidth - 10; // Adjust position
            }

            // Check if the menu would overflow the bottom side
            if (posY + menuHeight > window.innerHeight) {
                posY = window.innerHeight - menuHeight - 10; // Adjust position
            }

            // Apply the adjusted position
            contextmenuFolder.style.top = `${posY}px`;
            contextmenuFolder.style.left = `${posX}px`;
        }

        /** file */
        if (event.target.closest('.file-menu')) {
            event.preventDefault();
            const link = event.target.closest('.file-menu');

            // Store the clicked element's data attributes
            openfile.dataset.embed = link.dataset.embed;
            openfile.dataset.name = link.dataset.name;
            renameFile.dataset.name = link.dataset.name;
            renameFile.dataset.uniqueId = link.dataset.embed;

            if (download) {
                download.dataset.name = link.dataset.name;
                download.dataset.uniqueId = link.dataset.embed;
            }

            remove.dataset.name = link.dataset.name;

            if (infoFile) {
                infoFile.dataset.name = link.dataset.name;
                infoFile.dataset.uniqueName = link.dataset.embed;
            }

            // Initial positioning
            let posX = event.pageX;
            let posY = event.pageY;

            contextmenuFolder.style.display = "none";
            // Calculate menu dimensions
            contextMenufile.style.display = 'block'; // Temporarily display to get dimensions
            const menuWidth = contextMenufile.offsetWidth;
            const menuHeight = contextMenufile.offsetHeight;

            // Check if the menu would overflow the right side
            if (posX + menuWidth > window.innerWidth) {
                posX = window.innerWidth - menuWidth - 10; // Adjust position
            }

            // Check if the menu would overflow the bottom side
            if (posY + menuHeight > window.innerHeight) {
                posY = window.innerHeight - menuHeight - 10; // Adjust position
            }

            // Apply the adjusted position
            contextMenufile.style.top = `${posY}px`;
            contextMenufile.style.left = `${posX}px`;
        }
    });

    renameFile.addEventListener("click", async () => {
        const { value: fileName } = await Swal.fire({
            input: "text",
            title: "Enter New Name",
            inputPlaceholder: "Enter file name",
            inputValue: renameFile.dataset.name,
            customClass: {
                input: 'file-new-name'   // Custom class for the input field
            },
            reverseButtons: true,
            inputAttributes: {
                minlength: "1",
                autocapitalize: "off",
                autocorrect: "off",
                autocomplete: "off",
                required: "required"
            },
            showCancelButton: true,
            inputValidator: (value) => {
                const validFileNamePattern = /^[\w\s\-\(\)\[\]\{\}\.,]+$/;
                
                if (value.toLowerCase() === renameFile.dataset.name.toLowerCase()) {
                    return "The old name and new name are the same.";
                } else if (value === "") {
                    return "Please enter the file name.";
                } else if (!validFileNamePattern.test(value)) {
                    return 'File name can only contain letters, numbers, spaces, "-", "(", ")", "[", "]", "{", "}", ".", and ","';
                }
            }
        });
        
        if (fileName) {
            try {
                const response = await fetch(`/action/rename/file/${renameFile.dataset.uniqueId}/${fileName}`, {
                    method: "POST",
                });
    
                // Check if the response is OK (status in the range 200-299)
                if (!response.ok) {
                    const res = await response.json(); // Parse the JSON response
    
                    if (res?.msg) {
                        Toast.fire({
                            icon: "error",
                            title: res.msg
                        });
                        $(".swal2-container").attr("style", "z-index: 100000 !important;");
                        return;
                    }
    
                    Toast.fire({
                        icon: "error",
                        title: "Something went wrong"
                    });
                    $(".swal2-container").attr("style", "z-index: 100000 !important;");
                    return;
                }
    
                const res = await response.json(); // Parse the JSON response
    
                if (res?.success) {
                    Toast.fire({
                        icon: "success",
                        title: "Name changed successfully"
                    });
                    $(".swal2-container").attr("style", "z-index: 100000 !important;");
    
                    updateContent(window.location.pathname, document.title, true);
                    return;
                } else {
                    if (res?.msg) {
                        Toast.fire({
                            icon: "error",
                            title: res.msg
                        });
                        $(".swal2-container").attr("style", "z-index: 100000 !important;");
                        return;
                    }
                    Toast.fire({
                        icon: "error",
                        title: "Something went wrong"
                    });
                    $(".swal2-container").attr("style", "z-index: 100000 !important;");
                    return;
                }
            } catch (error) {
                Toast.fire({
                    icon: "error",
                    title: "Something went wrong"
                });
                $(".swal2-container").attr("style", "z-index: 100000 !important;");
                return;
            }
        }
    });
    


    renameFolder.addEventListener("click", async () => {
        const { value: folderName } = await Swal.fire({
            input: "text",
            title: "Enter New Name",
            inputPlaceholder: "Enter folder name",
            inputValue: renameFolder.dataset.name,
            customClass: {
                input: 'file-new-name'   // Custom class for the input field
            },
            reverseButtons: true,
            inputAttributes: {
                minlength: "1",
                autocapitalize: "off",
                autocorrect: "off",
                autocomplete: "off",
                required: "required"
            },
            showCancelButton: true,
            inputValidator: (value) => {
                const validFolderNamePattern = /^[\w\s\-\(\)\[\]\{\}\.,]+$/;
                
                if (value.toLowerCase() === renameFolder.dataset.name.toLowerCase()) {
                    return "The old name and new name are the same.";
                } else if (value === "") {
                    return "Please enter the folder name.";
                } else if (!validFolderNamePattern.test(value)) {
                    return 'Folder name can only contain letters, numbers, spaces, "-", "(", ")", "[", "]", "{", "}", ".", and ","';
                }
            }
        });
        
        if (folderName) {
            try {
                let url = `/action/rename/folder?path=${encodeURIComponent(renameFolder.dataset.path)}&newName=${encodeURIComponent(folderName)}`;
                const response = await fetch(url, {
                    method: "POST",
                });
    
                // Check if the response is OK (status in the range 200-299)
                if (!response.ok) {
                    const res = await response.json();
                    if (res?.msg) {
                        Toast.fire({
                            icon: "error",
                            title: res.msg
                        });
                        $(".swal2-container").attr("style", "z-index: 100000 !important;");
                        return;
                    }
                    Toast.fire({
                        icon: "error",
                        title: "Something went wrong"
                    });
                    $(".swal2-container").attr("style", "z-index: 100000 !important;");
                    return;
                }
    
                const res = await response.json(); // Parse the JSON response
    
                if (res?.success) {
                    Toast.fire({
                        icon: "success",
                        title: "Name changed successfully"
                    });
                    $(".swal2-container").attr("style", "z-index: 100000 !important;");
    
                    updateContent(window.location.pathname, document.title, true);
                    return;
                } else {
                    if (res?.msg) {
                        Toast.fire({
                            icon: "error",
                            title: res.msg
                        });
                        $(".swal2-container").attr("style", "z-index: 100000 !important;");
                        return;
                    }
                    Toast.fire({
                        icon: "error",
                        title: "Something went wrong"
                    });
                    $(".swal2-container").attr("style", "z-index: 100000 !important;");
                    return;
                }
            } catch (error) {
                Toast.fire({
                    icon: "error",
                    title: "Something went wrong"
                });
                $(".swal2-container").attr("style", "z-index: 100000 !important;");
                return;
            }
        }
    });
    

    download?.addEventListener("click", async () => {
        try {
            const response = await fetch(`/action/download/${download?.dataset?.uniqueId}`, {
                method: "POST",
            });

            if (!response.ok) {
                Toast.fire({
                    icon: "error",
                    title: "Error Downloading file"
                });
                $(".swal2-container").attr("style", "z-index: 100000 !important;");
                return;
            }

            // Create a blob from the response and trigger download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = download?.dataset?.uniqueId; // Set the filename
            document.body.appendChild(a);
            a.click();
            a.remove();
            a.setAttribute("name", download?.dataset?.name);
            window.URL.revokeObjectURL(url); // Clean up

            Toast.fire({
                icon: "success",
                title: "File started Downloading"
            });
            $(".swal2-container").attr("style", "z-index: 100000 !important;");
        } catch (error) {
            Toast.fire({
                icon: "error",
                title: "Error Downloading file"
            });
            $(".swal2-container").attr("style", "z-index: 100000 !important;");
        }
    });

    remove.addEventListener("click", async () => {
        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!",
            reverseButtons: true
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`/action/delete/file/${download?.dataset?.uniqueId}`, {
                        method: "POST",
                    });

                    if (!response.ok) {
                        Toast.fire({
                            icon: "error",
                            title: "Error Deleting file"
                        });
                        $(".swal2-container").attr("style", "z-index: 100000 !important;");
                        return;
                    }

                    Toast.fire({
                        icon: "success",
                        title: "File deleted successfully"
                    });
                    $(".swal2-container").attr("style", "z-index: 100000 !important;");

                    updateContent(window.location.pathname, document.title, true);
                    cache.delete("/bookmarks");
                    return
                } catch (err) {
                    Toast.fire({
                        icon: "error",
                        title: "Error Deleting file"
                    });
                    $(".swal2-container").attr("style", "z-index: 100000 !important;");
                    return;
                }
            }
        });
    });

    // Hide the context menu when clicking outside
    document.addEventListener('click', (event) => {
        if (!event.target.closest('#custom-context-menu-file')) {
            contextMenufile.style.display = 'none';
        }
        if (!event.target.closest('#custom-context-menu-folder')) {
            contextmenuFolder.style.display = 'none';
        }
    });


    // Function to create and display the enhanced popup
    infoFile?.addEventListener("click", infoev);

    async function infoev() {
        try {
            // Show SweetAlert loader
            Swal.fire({
                title: 'Loading...',
                text: 'Please wait while we load the information.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading(); // Display the loader
                }
            });
    
            // Send the fetch request
            const response = await fetch(`/action/getFileData/${download?.dataset?.uniqueId}`, {
                method: "POST",
            });
    
            // Close the loader once the response is received
            Swal.close();
    
            // Check if the response was successful
            if (!response.ok) {
                Toast.fire({
                    icon: "error",
                    title: "Error Loading info"
                });
                $(".swal2-container").attr("style", "z-index: 100000 !important;");
                return;
            }
    
            const res = await response.json(); // Parse the JSON response
    
            if (res?.success) {
                const popupOverlay = document.createElement('div');
                popupOverlay.className = 'popup-overlay';
    
                let updatedAt = new Date(res.data.updatedAt);
                updatedAt = updatedAt.toLocaleString('en-GB', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                });
    
                let createdAt = new Date(res.data.createdAt);
                createdAt = createdAt.toLocaleString('en-GB', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                });
    
                const popup = document.createElement('div');
                popup.className = 'popup';
                popup.innerHTML = `
                    <div class="popup-header">
                        <h2><i class="fa fa-info-circle"></i> File Information</h2>
                    </div>
                    <div class="popup-content">
                        <p><i class="fa-solid fa-i-cursor"></i> <strong>File Name:</strong> ${res.data.name}</p>
                        <p><i class="fa fa-id-badge"></i> <strong>Unique Name:</strong> ${res.data.uniqueName}</p>
                        <p><i class="fa-solid fa-user-lock"></i> <strong>Access Level:</strong> ${res.data.accessLevel}</p>
                        <p><i class="fa-solid fa-user-secret"></i> <strong>Added By:</strong> ${res.data.uploadedBy}</p>
                        <p><i class="fa-regular fa-calendar"></i> <strong>Added at:</strong> ${createdAt}</p>
                        <p><i class="fa-solid fa-clock-rotate-left"></i> <strong>Updated at:</strong> ${updatedAt}</p>
                    </div>
                    <div class="popup-footer">
                        <button onclick="closePopup()"><i class="fa fa-times"></i> Close</button>
                    </div>
                `;
                
                popupOverlay.appendChild(popup);
                document.body.appendChild(popupOverlay);
                return;
            } else {
                Toast.fire({
                    icon: "error",
                    title: "Error loading info"
                });
                $(".swal2-container").attr("style", "z-index: 100000 !important;");
                return;
            }
        } catch (err) {
            console.error(err);
            Swal.close(); // Close the loader if an error occurs
            Toast.fire({
                icon: "error",
                title: "Error Loading info"
            });
            $(".swal2-container").attr("style", "z-index: 100000 !important;");
        }
    }
    

infoFolder?.addEventListener("click", async () => {
    try {
        // Show SweetAlert loader
        Swal.fire({
            title: 'Loading...',
            text: 'Please wait while we load the information.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading(); // Display the loader
            }
        });

        // Send the fetch request
        const response = await fetch(`/action/getFolderData?path=${encodeURIComponent(infoFolder?.dataset?.path)}`, {
            method: "POST",
        });

        // Close the loader once the response is received
        Swal.close();

        // Check if the response was successful
        if (!response.ok) {
            Toast.fire({
                icon: "error",
                title: "Error Loading info"
            });
            $(".swal2-container").attr("style", "z-index: 100000 !important;");
            return;
        }

        const res = await response.json(); // Parse the JSON response

        if (res?.success) {
            const popupOverlay = document.createElement('div');
            popupOverlay.className = 'popup-overlay';

            let updatedAt = new Date(res.data.updatedAt);
            updatedAt = updatedAt.toLocaleString('en-GB', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });

            let createdAt = new Date(res.data.createdAt);
            createdAt = createdAt.toLocaleString('en-GB', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });

            const popup = document.createElement('div');
            popup.className = 'popup';
            popup.innerHTML = `
                <div class="popup-header">
                    <h2><i class="fa fa-info-circle"></i> File Information</h2>
                </div>
                <div class="popup-content">
                    <p><i class="fa-solid fa-i-cursor"></i> <strong>File Name:</strong> ${res.data.name}</p>
                    <p><i class="fa-solid fa-bezier-curve"></i> <strong>Path:</strong> ${res.data.path}</p>
                    <p><i class="fa-solid fa-user-lock"></i> <strong>Access Level:</strong> ${res.data.accessLevel}</p>
                    <p><i class="fa-solid fa-user-secret"></i> <strong>Added By:</strong> ${res.data.createdBy}</p>
                    <p><i class="fa-regular fa-calendar"></i> <strong>Added at:</strong> ${createdAt}</p>
                    <p><i class="fa-solid fa-clock-rotate-left"></i> <strong>Updated at:</strong> ${updatedAt}</p>
                </div>
                <div class="popup-footer">
                    <button onclick="closePopup()"><i class="fa fa-times"></i> Close</button>
                </div>
            `;
            
            popupOverlay.appendChild(popup);
            document.body.appendChild(popupOverlay);
            return;
        } else {
            Toast.fire({
                icon: "error",
                title: "Error loading info"
            });
            $(".swal2-container").attr("style", "z-index: 100000 !important;");
            return;
        }
    } catch (err) {
        console.error(err);
        Swal.close(); // Close the loader if an error occurs
        Toast.fire({
            icon: "error",
            title: "Error Loading info"
        });
        $(".swal2-container").attr("style", "z-index: 100000 !important;");
    }
});

});

function closePopup() {
    const popupOverlay = document.querySelector('.popup-overlay');
    if (popupOverlay) {
        popupOverlay.remove();
    }
}
