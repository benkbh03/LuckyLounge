function redirectLoggedInUser() {
    if (sessionStorage.getItem('ll_user')) {
        window.location.href = 'index.html';
    }
}

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

function togglePw(inputId, button) {
    const input = document.getElementById(inputId);
    const show = input.type === 'password';

    input.type = show ? 'text' : 'password';
    button.textContent = show ? 'Hide' : 'Show';
}

function showMsg(id, text, type) {
    const el = document.getElementById(id);
    el.textContent = text;
    el.className = 'status-msg ' + type;
}

function clearMessages() {
    ['login-msg', 'register-msg'].forEach(id => {
        const el = document.getElementById(id);
        el.className = 'status-msg';
        el.textContent = '';
    });
}

function openTerms(event) {
    event.preventDefault();
    document.getElementById('terms-modal').classList.add('open');
}

function closeTerms() {
    document.getElementById('terms-modal').classList.remove('open');
}

function closeTermsOutside(event) {
    if (event.target === document.getElementById('terms-modal')) {
        closeTerms();
    }
}

function acceptTerms() {
    document.getElementById('terms-check').checked = true;
    closeTerms();
}

function getUsers() {
    return JSON.parse(localStorage.getItem('ll_users') || '{}');
}

function saveUsers(users) {
    localStorage.setItem('ll_users', JSON.stringify(users));
}

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

document.addEventListener('DOMContentLoaded', setupLoginPage);
