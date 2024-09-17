$(document).ready(function () {
    $("#regForm").submit(function (e) {
        e.preventDefault();

        const regBtn = $("#regBtn");

        regBtn.prop("disabled", true);
        regBtn.val("Registering...");

        let formData = $(this).serializeArray();

        const formDataJson = {};

        formData.forEach(item => {
            formDataJson[item.name] = item.value;
        });

        const name = formDataJson.name;
        const email = formDataJson.email;
        const tel = formDataJson.tel;
        const password = formDataJson.password;

        let isError = false;
        let errorData = {
            msg: "Something went wrong!"
        };

        /** Validating the name field */
        if (!name && !isError || name.trim() === '' && !isError) {
            isError = true;
            errorData = {
                msg: "Name is required"
            }
        }
        if (name.length < 3 && !isError || name.length > 30 && !isError) {
            isError = true;
            errorData = {
                msg: "Name length must be between 3 and 30 characters"
            }
        }

        /** Validating the email field */
        if (!email && !isError || email.trim() === '' && !isError) {
            isError = true;
            errorData = {
                msg: "Email is required"
            }
        }
        if (!isEmail(email) && !isError) {
            isError = true;
            errorData = {
                msg: "Enter a valid email address"
            }
        }

        /** Validating the mobile field */
        if (!tel && !isError || tel.trim() === '' && !isError) {
            isError = true;
            errorData = {
                msg: "Mobile number is required"
            }
        }
        if (tel.length != 10 && !isError || !isNumeric(tel) && !isError) {
            isError = true;
            errorData = {
                msg: "Enter a valid mobile number"
            }
        }

        /** Validating the password field */
        if (!password && !isError || password.trim() === '' && !isError) {
            isError = true;
            errorData = {
                msg: "Password is required"
            }
        }
        if (password.length < 8 && !isError) {
            isError = true;
            errorData = {
                msg: "Password must be at least 8 characters long"
            }
        }

        /** If known error found return it */
        if (isError) {
            Swal.fire({
                icon: "warning",
                title: "Oops...",
                text: errorData.msg
            });

            regBtn.prop("disabled", false);
            regBtn.val("Register");

            return;
        }

        /** if no error found response further */
        formData = $(this).serialize();

        $.ajax({
            type: 'POST',
            url: '/auth/register',
            data: formData,
            success: (response) => {
                if (response.success == 1) {
                    Swal.fire({
                        icon: "info",
                        title: "Success",
                        text: "Check your inbox, a mail sent to you"
                    });

                    $('#regForm').trigger('reset');

                    regBtn.prop("disabled", false);
                    regBtn.val("Register");
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: "Something went wrong!"
                    });

                    regBtn.prop("disabled", false);
                    regBtn.val("Register");
                }
            },
            error: (xhr, status, error) => {
                if (xhr.status == 400) {
                    const response = JSON.parse(xhr.responseText);

                    Swal.fire({
                        icon: "warning",
                        title: "Oops...",
                        text: response.msg
                    });
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Error 500",
                        text: "Internal server error!"
                    });
                }

                regBtn.prop("disabled", false);
                regBtn.val("Register");
            }
        })
    });

    /** Login */
    $("#logForm").submit(function (e) {
        e.preventDefault();

        const logBtn = $("#logBtn");

        logBtn.prop("disabled", true);
        logBtn.val("Logging in...");

        let formData = $(this).serializeArray();

        const formDataJson = {};

        formData.forEach(item => {
            formDataJson[item.name] = item.value;
        });

        const email = formDataJson.email;
        const password = formDataJson.password;

        let isError = false;
        let errorData = {
            msg: "Something went wrong!"
        };

        /** Validating the email field */
        if (!email && !isError || email.trim() === '' && !isError) {
            isError = true;
            errorData = {
                msg: "Email is required"
            }
        }
        if (!isEmail(email) && !isError) {
            isError = true;
            errorData = {
                msg: "Enter a valid email address"
            }
        }

        /** If known error found return it */
        if (isError) {
            Swal.fire({
                icon: "warning",
                title: "Oops...",
                text: errorData.msg
            });

            logBtn.prop("disabled", false);
            logBtn.val("Login");

            return;
        }

        /** if no error found response further */
        formData = $(this).serialize();

        $.ajax({
            type: 'POST',
            url: '/auth/login',
            data: formData,
            success: (response) => {
                if (response.success == 1 && response.verified == true) {
                    Swal.fire({
                        icon: "success",
                        title: "Success",
                        text: "Redirecting to the home page...",
                        timer: 1500,
                        showConfirmButton: false,
                    }).then(() => {
                        window.location.reload();
                    })

                    $('#logForm').trigger('reset');
                } else if (response.success == 0 && response.verified == false) {
                    Swal.fire({
                        icon: "info",
                        title: "Not Verified",
                        text: "Check your inbox, a mail sent to you",
                        confirmButtonText: 'Close'
                    })

                    $('#logForm').trigger('reset');

                    logBtn.prop("disabled", false);
                    logBtn.val("Login");
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: "Something went wrong!"
                    });

                    logBtn.prop("disabled", false);
                    logBtn.val("Login");
                }
            },
            error: (xhr, status, error) => {
                if (xhr.status == 400) {
                    const response = JSON.parse(xhr.responseText);

                    Swal.fire({
                        icon: "warning",
                        title: "Oops...",
                        text: response.msg
                    });
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Error 500",
                        text: "Internal server error!"
                    });
                }

                logBtn.prop("disabled", false);
                logBtn.val("Register");
            }
        })
    });

    $("#forgotForm").submit(function (e) {
        e.preventDefault();

        const forgotBtn = $("#forgotBtn");

        forgotBtn.prop("disabled", true);
        forgotBtn.val("Resetting...");

        let formData = $(this).serializeArray();

        const formDataJson = {};

        formData.forEach(item => {
            formDataJson[item.name] = item.value;
        });

        const email = formDataJson.email;

        let isError = false;
        let errorData = {
            msg: "Something went wrong!"
        };

        /** Validating the email field */
        if (!email && !isError || email.trim() === '' && !isError) {
            isError = true;
            errorData = {
                msg: "Email is required"
            }
        }
        if (!isEmail(email) && !isError) {
            isError = true;
            errorData = {
                msg: "Enter a valid email address"
            }
        }

        /** If known error found return it */
        if (isError) {
            Swal.fire({
                icon: "warning",
                title: "Oops...",
                text: errorData.msg
            });

            forgotBtn.prop("disabled", false);
            forgotBtn.val("Reset");

            return;
        }

        /** if no error found response further */
        formData = $(this).serialize();

        $.ajax({
            type: 'POST',
            url: '/auth/forgotPassword',
            data: formData,
            success: (response) => {
                if (response.success == 1) {
                    Swal.fire({
                        icon: "info",
                        title: "Success",
                        text: "Check your inbox, a mail sent to you",
                         confirmButtonText: 'Close'
                    })

                    $('#forgotForm').trigger('reset');

                    forgotBtn.prop("disabled", false);
                    forgotBtn.val("Reset");
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: "Something went wrong!"
                    });

                    forgotBtn.prop("disabled", false);
                    forgotBtn.val("Reset");
                }
            },
            error: (xhr, status, error) => {
                if (xhr.status == 400) {
                    const response = JSON.parse(xhr.responseText);

                    Swal.fire({
                        icon: "warning",
                        title: "Oops...",
                        text: response.msg
                    });
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Error 500",
                        text: "Internal server error!"
                    });
                }

                forgotBtn.prop("disabled", false);
                forgotBtn.val("Reset");
            }
        })
    });

    $("#setPassForm").submit(function (e) {
        e.preventDefault();

        const resetBtn = $("#resetBtn");

        resetBtn.prop("disabled", true);
        resetBtn.val("Changing...");

        let formData = $(this).serializeArray();

        const formDataJson = {};

        formData.forEach(item => {
            formDataJson[item.name] = item.value;
        });

        const password = formDataJson.password;
        const confirmPassword = formDataJson.confirmPassword;
        const userId = formDataJson.userId;
        const uniqueString = formDataJson.uniqueString;

        let isError = false;
        let errorData = {
            msg: "Something went wrong!"
        };

        /** Validating the password field */
        if (!password && !isError || password.trim() === '' && !isError) {
            isError = true;
            errorData = {
                msg: "Password is required"
            }
        }
        if (password.length < 8 && !isError) {
            isError = true;
            errorData = {
                msg: "Password must be at least 8 characters long"
            }
        }

        /** Validating the confirmPassword field */
        if (!confirmPassword && !isError || confirmPassword.trim() === '' && !isError) {
            isError = true;
            errorData = {
                msg: "Confirm Password is required"
            }
        }

        /** Check if the passwords are equal or not  */
        if (confirmPassword != password && !isError) {
            isError = true;
            errorData = {
                msg: "Both password do not match"
            }
        }

        /** check for the authorization */
        if (uniqueString.length != 32 && userId.length != 24) {
            isError = true;
        }

        /** If known error found return it */
        if (isError) {
            Swal.fire({
                icon: "warning",
                title: "Oops...",
                text: errorData.msg
            });

            resetBtn.prop("disabled", false);
            resetBtn.val("Change");

            return;
        }

        /** if no error found response further */
        formData = $(this).serialize();

        $.ajax({
            type: 'POST',
            url: '/auth/resetPassword',
            data: formData,
            success: (response) => {
                if (response.success == 1 && !response?.expired) {
                    Swal.fire({
                        icon: "success",
                        title: "Success",
                        text: "Password changed successfully",
                        timer: 1500,
                        showConfirmButton: false,
                    }).then(() => {
                        window.location.href = "/auth/login";
                    })

                    $('#forgotForm').trigger('reset');
                } else if (response.success == 0 && response?.expired) {
                    Swal.fire({
                        icon: "info",
                        title: "Error",
                        text: "The link is invalid or expired",
                        timer: 1500,
                        showConfirmButton: false,
                    }).then(() => {
                        window.location.reload();
                    })

                    $('#forgotForm').trigger('reset');
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: "Something went wrong!"
                    });

                    resetBtn.prop("disabled", false);
                    resetBtn.val("Change");
                }
            },
            error: (xhr, status, error) => {
                if (xhr.status == 400) {
                    const response = JSON.parse(xhr.responseText);

                    Swal.fire({
                        icon: "warning",
                        title: "Oops...",
                        text: response.msg
                    });
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Error 500",
                        text: "Internal server error!"
                    });
                }

                resetBtn.prop("disabled", false);
                resetBtn.val("Change");
            }
        })
    });
});