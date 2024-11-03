document.addEventListener('DOMContentLoaded', () => {
    const contextMenu = document.getElementById('custom-context-menu-file');
    const open = document.getElementById('file-open');
    const rename = document.getElementById('file-rename');
    const download = document.getElementById('file-download');
    const remove = document.getElementById('file-delete');
    const info = document.getElementById('file-info');

    document.querySelector('.right').addEventListener('contextmenu', function (event) {
        if (document.location.pathname == "/bookmarks") return;
        if (event.target.closest('.file-menu')) {
            event.preventDefault();
            const link = event.target.closest('.file-menu');

            // Store the clicked element's data attributes
            open.dataset.embed = link.dataset.embed;
            open.dataset.name = link.dataset.name;
            rename.dataset.name = link.dataset.name;
            rename.dataset.uniqueId = link.dataset.embed;

            if (download) {
                download.dataset.name = link.dataset.name;
                download.dataset.uniqueId = link.dataset.embed;
            }

            remove.dataset.name = link.dataset.name;

            if (info) {
                info.dataset.name = link.dataset.name;
                info.dataset.uniqueName = link.dataset.embed;
            }

            // Initial positioning
            let posX = event.pageX;
            let posY = event.pageY;

            // Calculate menu dimensions
            contextMenu.style.display = 'block'; // Temporarily display to get dimensions
            const menuWidth = contextMenu.offsetWidth;
            const menuHeight = contextMenu.offsetHeight;

            // Check if the menu would overflow the right side
            if (posX + menuWidth > window.innerWidth) {
                posX = window.innerWidth - menuWidth - 10; // Adjust position
            }

            // Check if the menu would overflow the bottom side
            if (posY + menuHeight > window.innerHeight) {
                posY = window.innerHeight - menuHeight - 10; // Adjust position
            }

            // Apply the adjusted position
            contextMenu.style.top = `${posY}px`;
            contextMenu.style.left = `${posX}px`;
        }
    });

    rename.addEventListener("click", async () => {
        const { value: fileName } = await Swal.fire({
            input: "text",
            title: "Enter New name",
            inputPlaceholder: "Enter file name",
            inputValue: rename.dataset.name,
            customClass: {
                input: 'file-new-name'   // Custom class for the input field
            },
            inputAttributes: {
                minlength: "1",
                autocapitalize: "off",
                autocorrect: "off",
                autocomplete: "off",
                required: "required"
            },
            showCancelButton: true,
            inputValidator: (value) => {
                if (value.toLowerCase() == rename.dataset.name.toLowerCase()) {
                    return "The old name and new name are same.";
                }
            }
        });
        if (fileName) {
            try {
                const response = await fetch(`/action/rename/file/${rename.dataset.uniqueId}/${fileName}`, {
                    method: "POST",
                });

                // Check if the response is OK (status in the range 200-299)
                if (!response.ok) {
                    Toast.fire({
                        icon: "error",
                        title: "Something went wrong"
                    });
                    $(".swal2-container").attr("style", "z-index: 100000 !important;");
                    return
                }

                const res = await response.json(); // Parse the JSON response

                if (res?.success) {
                    Toast.fire({
                        icon: "success",
                        title: "Name changed successfully"
                    });
                    $(".swal2-container").attr("style", "z-index: 100000 !important;");

                    updateContent(window.location.pathname, document.title, true);
                    return
                } else {
                    Toast.fire({
                        icon: "error",
                        title: "Something went wrong"
                    });
                    $(".swal2-container").attr("style", "z-index: 100000 !important;");
                    return
                }
            } catch (error) {
                Toast.fire({
                    icon: "error",
                    title: "Something went wrong"
                });
                $(".swal2-container").attr("style", "z-index: 100000 !important;");
                return
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
        if (!event.target.closest('#custom-context-menu')) {
            contextMenu.style.display = 'none';
        }
    });


    // Function to create and display the enhanced popup
    info?.addEventListener("click", infoev);

    async function infoev() {
        try {
            const response = await fetch(`/action/getFileData/${download?.dataset?.uniqueId}`, {
                method: "POST",
            });

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

                // Format to date and time
                updatedAt = updatedAt.toLocaleString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true // Use 24-hour format
                });

                let createdAt = new Date(res.data.updatedAt);

                // Format to date and time
                createdAt = createdAt.toLocaleString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true // Use 24-hour format
                });

                // Create popup content with icons and styled information
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
                // Append popup elements to the body
                popupOverlay.appendChild(popup);
                document.body.appendChild(popupOverlay);
                return
            } else {
                Toast.fire({
                    icon: "error",
                    title: "Error loading info"
                });
                $(".swal2-container").attr("style", "z-index: 100000 !important;");
                return
            }
        } catch (err) {
            console.log(err)
            Toast.fire({
                icon: "error",
                title: "Error Loading info"
            });
            $(".swal2-container").attr("style", "z-index: 100000 !important;");
            return;
        }


    }
});

function closePopup() {
    const popupOverlay = document.querySelector('.popup-overlay');
    if (popupOverlay) {
        popupOverlay.remove();
    }
}
