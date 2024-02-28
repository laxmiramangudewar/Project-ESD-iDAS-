document.addEventListener('DOMContentLoaded', function () {
    const correctPassword = '1243';
    let currentPassword = correctPassword;

    // Show Signup form
    document.getElementById('showSignup').addEventListener('click', function (e) {
        e.preventDefault();
        showChangePasswordForm();
    });

    // Show Login form
    document.getElementById('backtologin').addEventListener('click', function (e) {
        e.preventDefault();
        showLoginForm();
    });

    // Handle Change Password form submission
    document.getElementById('changepassword').addEventListener('submit', function (e) {
        e.preventDefault();
        handleChangePassword();
    });

    // Handle Login form submission
    document.getElementById('login').addEventListener('submit', function (e) {
        e.preventDefault();
        handleLogin();
    });

    // Toggle password visibility for "Password" field
    document.getElementById('toggleLoginPassword').addEventListener('click', function () {
        togglePasswordVisibility('loginPassword', 'toggleLoginPassword');
    });

    // Toggle password visibility for "New Password" field
    document.getElementById('toggleNewPassword').addEventListener('click', function () {
        togglePasswordVisibility('newPassword', 'toggleNewPassword');
    });

    // Toggle password visibility for "Current Password" field
    document.getElementById('toggleCurrentPassword').addEventListener('click', function () {
        togglePasswordVisibility('currentPassword', 'toggleCurrentPassword');
    });

    // Function to toggle password visibility
    function togglePasswordVisibility(passwordFieldId, toggleIconId) {
        const passwordInput = document.getElementById(passwordFieldId);
        const passwordFieldType = passwordInput.type;

        // Toggle between password and text type
        passwordInput.type = passwordFieldType === 'password' ? 'text' : 'password';

        // Toggle eye icon between open and closed
        document.getElementById(toggleIconId).classList.toggle('fa-eye');
        document.getElementById(toggleIconId).classList.toggle('fa-eye-slash');
    }

    // Function to show Change Password form
    function showChangePasswordForm() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('changePasswordForm').style.display = 'block';
    }

    // Function to show Login form
    function showLoginForm() {
        document.getElementById('changePasswordForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
    }

    // Function to handle Change Password form submission
    function handleChangePassword() {
        const oldPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;

        if (oldPassword === currentPassword) {
            // Update the current password
            currentPassword = newPassword;
            alert('Password changed successfully!');
            showLoginForm();
        } else {
            alert('Incorrect old password. Please try again.');
        }
    }

    // Function to handle Login form submission
    function handleLogin() {
        const enteredPassword = document.getElementById('loginPassword').value;

        if (enteredPassword === currentPassword) {
            window.location.href = 'homepage.html';
        } else {
            alert('Incorrect password. Please try again.');
        }
    }
});
