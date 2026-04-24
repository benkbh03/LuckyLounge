// Sends already signed-in users away from the auth page.
function redirectLoggedInUser() {
    if (sessionStorage.getItem('ll_user')) {
        window.location.href = 'index.html';
    }
}

// Switches between the login and register panels.
function switchTab(tab) {
    document.getElementById('panel-login').classList.toggle('is-hidden', tab !== 'login');
    document.getElementById('panel-register').classList.toggle('is-hidden', tab !== 'register');
    document.getElementById('tab-login').classList.toggle('active', tab === 'login');
    document.getElementById('tab-register').classList.toggle('active', tab === 'register');

    const panel = document.getElementById('panel-' + tab);
    panel.classList.remove('panel');
    void panel.offsetWidth;
    panel.classList.add('panel');

    clearMessages();
}

// Toggles password visibility for a chosen password field.
function togglePw(inputId, button) {
    const input = document.getElementById(inputId);
    const show = input.type === 'password';

    input.type = show ? 'text' : 'password';
    button.textContent = show ? 'Hide' : 'Show';
}

// Shows a short success or error message under a form.
function showMsg(id, text, type) {
    const el = document.getElementById(id);
    el.textContent = text;
    el.className = 'status-msg ' + type;
}

// Resets both auth form status messages.
function clearMessages() {
    ['login-msg', 'register-msg'].forEach(id => {
        const el = document.getElementById(id);
        el.className = 'status-msg';
        el.textContent = '';
    });
}

// Opens the terms and conditions modal.
function openTerms(event) {
    event.preventDefault();
    document.getElementById('terms-modal').classList.add('open');
}

// Closes the terms and conditions modal.
function closeTerms() {
    document.getElementById('terms-modal').classList.remove('open');
}

// Closes the modal when the user clicks the overlay outside the box.
function closeTermsOutside(event) {
    if (event.target === document.getElementById('terms-modal')) {
        closeTerms();
    }
}

// Accepts the terms checkbox from inside the modal and closes it.
function acceptTerms() {
    document.getElementById('terms-check').checked = true;
    closeTerms();
}

// Reads the locally stored user database.
function getUsers() {
    return JSON.parse(localStorage.getItem('ll_users') || '{}');
}

// Saves the locally stored user database.
function saveUsers(users) {
    localStorage.setItem('ll_users', JSON.stringify(users));
}

// Validates login credentials and creates a session for the matching user.
function handleLogin() {
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        showMsg('login-msg', 'Please fill in all fields.', 'error');
        return;
    }

    const users = getUsers();

    if (!users[email]) {
        showMsg('login-msg', 'No account found with that email.', 'error');
        return;
    }

    if (users[email].password !== password) {
        showMsg('login-msg', 'Incorrect password.', 'error');
        return;
    }

    showMsg('login-msg', `Welcome back, ${users[email].username}! Redirecting...`, 'success');
    sessionStorage.setItem('ll_user', JSON.stringify({ email, username: users[email].username }));

    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1200);
}

// Validates registration fields and stores a new local account.
function handleRegister() {
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const password = document.getElementById('reg-password').value;
    const password2 = document.getElementById('reg-password2').value;
    const terms = document.getElementById('terms-check').checked;

    if (!username || !email || !password || !password2) {
        showMsg('register-msg', 'Please fill in all fields.', 'error');
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showMsg('register-msg', 'Please enter a valid email address.', 'error');
        return;
    }

    if (password.length < 8) {
        showMsg('register-msg', 'Password must be at least 8 characters.', 'error');
        return;
    }

    if (password !== password2) {
        showMsg('register-msg', 'Passwords do not match.', 'error');
        return;
    }

    if (!terms) {
        showMsg('register-msg', 'You must accept the Terms & Conditions.', 'error');
        return;
    }

    const users = getUsers();

    if (users[email]) {
        showMsg('register-msg', 'An account with that email already exists.', 'error');
        return;
    }

    users[email] = { username, password };
    saveUsers(users);
    showMsg('register-msg', 'Account created! Switching to login...', 'success');

    setTimeout(() => {
        switchTab('login');
        document.getElementById('login-email').value = email;
    }, 1100);
}

// Connects all login, register, and modal interactions on the auth page.
function setupLoginPage() {
    redirectLoggedInUser();

    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });

    document.querySelectorAll('.toggle-pw').forEach(button => {
        button.addEventListener('click', () => togglePw(button.dataset.passwordTarget, button));
    });

    document.getElementById('login-submit').addEventListener('click', handleLogin);
    document.getElementById('register-submit').addEventListener('click', handleRegister);
    document.getElementById('terms-link').addEventListener('click', openTerms);
    document.getElementById('terms-close').addEventListener('click', closeTerms);
    document.getElementById('terms-modal').addEventListener('click', closeTermsOutside);
    document.getElementById('terms-accept').addEventListener('click', acceptTerms);
}

// Starts the login page behavior once the page markup is ready.
document.addEventListener('DOMContentLoaded', setupLoginPage);
