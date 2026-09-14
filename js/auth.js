// Default admin credentials (In production, use a backend server)
const ADMIN_CREDENTIALS = {
    email: 'admin@streamhub.com',
    password: 'admin123' // In production, use hashed passwords
};

// Session management
function login(email, password, remember = false) {
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        const sessionData = {
            email: email,
            loginTime: new Date().getTime(),
            remember: remember
        };
        
        if (remember) {
            localStorage.setItem('adminSession', JSON.stringify(sessionData));
        } else {
            sessionStorage.setItem('adminSession', JSON.stringify(sessionData));
        }
        
        return true;
    }
    return false;
}

// Check if user is authenticated
function isAuthenticated() {
    const session = localStorage.getItem('adminSession') || sessionStorage.getItem('adminSession');
    
    if (!session) return false;
    
    try {
        const sessionData = JSON.parse(session);
        const currentTime = new Date().getTime();
        const sessionAge = currentTime - sessionData.loginTime;
        
        // Session expires after 24 hours
        if (sessionAge > 24 * 60 * 60 * 1000) {
            logout();
            return false;
        }
        
        return true;
    } catch (e) {
        return false;
    }
}

// Get admin email
function getAdminEmail() {
    const session = localStorage.getItem('adminSession') || sessionStorage.getItem('adminSession');
    if (session) {
        try {
            const sessionData = JSON.parse(session);
            return sessionData.email;
        } catch (e) {
            return null;
        }
    }
    return null;
}

// Logout
function logout() {
    localStorage.removeItem('adminSession');
    sessionStorage.removeItem('adminSession');
    window.location.href = 'login.html';
}

// Check authentication and redirect
function checkAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
    } else {
        const emailElement = document.getElementById('adminEmail');
        if (emailElement) {
            emailElement.textContent = getAdminEmail();
        }
    }
}

// Change password
function changePassword(currentPassword, newPassword) {
    if (currentPassword === ADMIN_CREDENTIALS.password) {
        ADMIN_CREDENTIALS.password = newPassword;
        // In production, this should update the backend
        alert('Password changed successfully! Please login again.');
        logout();
        return true;
    }
    return false;
}

// Login page functionality
if (document.getElementById('loginForm')) {
    // Redirect if already logged in
    if (isAuthenticated()) {
        window.location.href = 'admin.html';
    }

    // Toggle password visibility
    document.getElementById('togglePassword')?.addEventListener('click', function() {
        const passwordInput = document.getElementById('loginPassword');
        const icon = this.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });

    // Login form submission
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const remember = document.getElementById('rememberMe').checked;
        
        const errorDiv = document.getElementById('loginError');
        const errorText = document.getElementById('errorText');
        
        if (login(email, password, remember)) {
            window.location.href = 'admin.html';
        } else {
            errorText.textContent = 'Invalid email or password';
            errorDiv.style.display = 'flex';
            
            // Shake animation
            errorDiv.classList.add('shake');
            setTimeout(() => {
                errorDiv.classList.remove('shake');
            }, 500);
        }
    });
}

// Admin page logout
document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    if (confirm('Are you sure you want to logout?')) {
        logout();
    }
});
