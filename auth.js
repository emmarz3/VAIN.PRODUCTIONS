// ============================================================
// VAIN.PRODUCTIONS — Authentication Module
//
// STORAGE
//   vainAccounts    — [{ email, password, name, phone, createdAt }]
//   vainSession     — { email, name, loggedInAt }            (null = logged out)
//
// PUBLIC API
//   Auth.signup(data)            → { ok, error }
//   Auth.login(email, password)  → { ok, error, name }
//   Auth.logout()                 → void
//   Auth.getSession()             → { email, name } | null
//   Auth.isLoggedIn()             → boolean
//   Auth.updateNavUser()          → stamps displayName + logged-in state onto all pages
//   Auth.requireLogin(returnUrl)  → navigates to /pages/login.html?returnUrl=…
// ============================================================

(function () {
  'use strict';

  /* ==========================================================
     CONSTANTS
     ========================================================== */
  var ACCOUNTS_KEY   = 'vainAccounts';
  var SESSION_KEY    = 'vainSession';

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var PHONE_RE = /^(\+234|0)[789][01]\d{8}$/;

  function htmlEscape(s) {
    return String(s ?? '')
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  /* ==========================================================
     STORAGE HELPERS
     ========================================================== */
  function readAccounts() {
    try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]'); }
    catch { return []; }
  }
  function writeAccounts(list) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
  }
  function readSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
    catch { return null; }
  }
  function writeSession(s) {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else  localStorage.removeItem(SESSION_KEY);
  }

  /* ==========================================================
     CORE AUTH OPERATIONS
     ========================================================== */

  /**
   * signup(data)
   *   data: { name, email, phone, password }
   * Returns: { ok: true } or { ok: false, error }
   */
  function signup(data) {
    var name   = String(data.name || '').trim();
    var email  = String(data.email || '').trim().toLowerCase();
    var phone  = String(data.phone || '').trim();
    var pass   = String(data.password || '');

    if (name.length < 2) return { ok: false, error: 'Name must be at least 2 characters.' };
    if (!EMAIL_RE.test(email)) return { ok: false, error: 'Please enter a valid email address.' };
    if (phone && !PHONE_RE.test(phone.replace(/\s/g, ''))) return { ok: false, error: 'Please enter a valid Nigerian phone number (e.g. 08012345678).' };
    if (pass.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };

    var accounts = readAccounts();
    if (accounts.some(function (a) { return a.email === email; })) {
      return { ok: false, error: 'An account with this email already exists.' };
    }

    accounts.push({
      email:    email,
      password: pass,
      name:     name,
      phone:    phone,
      createdAt: Date.now()
    });
    writeAccounts(accounts);

    /* Auto-login after signup */
    writeSession({ email: email, name: name, loggedInAt: Date.now() });
    _stampNav(name);
    return { ok: true };
  }

  /**
   * login(email, password)
   * Returns: { ok: true, name } or { ok: false, error }
   */
  function login(email, password) {
    email  = String(email || '').trim().toLowerCase();
    pass   = String(password || '');

    if (!EMAIL_RE.test(email)) return { ok: false, error: 'Please enter a valid email address.' };

    var accounts = readAccounts();
    var account  = accounts.find(function (a) { return a.email === email && a.password === pass; });

    if (!account) return { ok: false, error: 'Invalid email or password. Please try again.' };

    writeSession({ email: account.email, name: account.name, loggedInAt: Date.now() });
    _stampNav(account.name);
    return { ok: true, name: account.name };
  }

  /**
   * logout() — clears session and updates all nav buttons on every page
   */
  function logout() {
    writeSession(null);
    _stampNav(null);
  }

  /**
   * getSession() → { email, name, loggedInAt } | null
   */
  function getSession() {
    return readSession();
  }

  /**
   * isLoggedIn() → boolean
   */
  function isLoggedIn() {
    return readSession() !== null;
  }

  /**
   * updateNavUser() — stamp session name onto every page's instance
   * Call after login/logout to sync the header across all open tabs.
   */
  function updateNavUser() {
    var s = readSession();
    _stampNav(s ? s.name : null);
  }

  /* ==========================================================
     NAV BAR INTEGRATION
     Updates the header on every page in the site:
       • #user-btn  →  avatar initials + aria-label "Account: <name>"
       • #user-display-name  (if element exists on the page)
     ========================================================== */
  function _stampNav(name) {
    var USER_BTN = document.getElementById('user-btn');
    if (USER_BTN) {
      if (name) {
        var initials = name.split(' ').map(function (w) { return w.charAt(0); }).slice(0, 2).join('').toUpperCase();
        USER_BTN.innerHTML =
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>' +
          '<span class="user-initials" title="' + htmlEscape(name) + '">' + htmlEscape(initials) + '</span>';
        USER_BTN.setAttribute('aria-label', 'Account: ' + name);
        USER_BTN.classList.add('logged-in');
      } else {
        USER_BTN.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
        USER_BTN.setAttribute('aria-label', 'Account');
        USER_BTN.classList.remove('logged-in');
      }
    }

    /* stamp on any explicit display-name element on the page */
    document.querySelectorAll('[data-auth-name]').forEach(function (el) {
      el.textContent = name || '';
    });
  }

  /**
   * requireLogin([returnUrl])  → redirects to /pages/login.html
   * Pass a null returnUrl to skip param; pass undefined to auto-detect.
   */
  function requireLogin(returnUrl) {
    if (isLoggedIn()) return;
    if (returnUrl === undefined) {
      var params  = new URLSearchParams(window.location.search);
      var ret     = params.get('returnUrl') || params.get('return');
      returnUrl   = ret || (window.location.pathname + window.location.search + window.location.hash);
    }
    var onPages = window.location.pathname.indexOf('/pages/') !== -1;
    var target  = onPages ? 'login.html' : 'pages/login.html';
    window.location.href = target + '?returnUrl=' + encodeURIComponent(returnUrl);
  }

  /* ==========================================================
     DOM — wire up login.html and signup.html
     ========================================================== */
  function _showError(el, msg) {
    el.textContent = msg;
    el.className    = 'auth-error error';
    el.style.display = 'block';
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function _showSuccess(el, msg) {
    el.textContent = msg;
    el.className    = 'auth-error success';
    el.style.display = 'block';
  }
  function _hideError(el) {
    el.style.display = 'none';
  }

  function _bindLoginForm() {
    var form        = document.getElementById('login-form');
    var errorEl     = document.querySelector('.auth-error');
    if (!form) return;

    var getVal = function (id) {
      var el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };

    function clearError() {
      if (errorEl) _hideError(errorEl);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (errorEl) _hideError(errorEl);

      var email    = getVal('login-email');
      var password = getVal('login-password');

      if (!email) {
        if (errorEl) _showError(errorEl, 'Please enter your email address.');
        return;
      }
      if (!password) {
        if (errorEl) _showError(errorEl, 'Please enter your password.');
        return;
      }

      var res = Auth.login(email, password);
      if (!res.ok) {
        if (errorEl) _showError(errorEl, res.error);
        return;
      }

      _showSuccess(errorEl, 'Welcome back, ' + htmlEscape(res.name) + '! Redirecting…');
      setTimeout(function () { _redirectAfterAuth(); }, 600);
    });

    form.addEventListener('input', clearError);
  }

  function _bindSignUpForm() {
    var form        = document.getElementById('signup-form');
    var errorEl     = document.querySelector('.auth-error');
    if (!form) return;

    function clearError() {
      if (errorEl) _hideError(errorEl);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (errorEl) _hideError(errorEl);

      var getVal = function (id) {
        var el = document.getElementById(id);
        return el ? el.value.trim() : '';
      };

      var data = {
        name:     getVal('signup-name'),
        email:    getVal('signup-email'),
        phone:    getVal('signup-phone'),
        password: getVal('signup-password')
      };

      var res = Auth.signup(data);
      if (!res.ok) {
        if (errorEl) _showError(errorEl, res.error);
        return;
      }

      _showSuccess(errorEl, 'Account created! Redirecting…');
      setTimeout(function () { _redirectAfterAuth(); }, 600);
    });

    form.addEventListener('input', clearError);
  }

  function _bindForgotPassword() {
    var form       = document.getElementById('forgot-form');
    var errorEl    = document.querySelector('.auth-error');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (errorEl) _hideError(errorEl);
      var getVal = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
      var email  = getVal('forgot-email');
      if (!EMAIL_RE.test(email)) {
        if (errorEl) _showError(errorEl, 'Enter a valid email address.');
        return;
      }
      if (errorEl) _showSuccess(errorEl, 'If this email is registered, a password-reset message has been sent. (Demo: Check your localStorage console.)');
    });
  }

  function _redirectAfterAuth() {
    var onPages   = window.location.pathname.indexOf('/pages/') !== -1;
    var base      = onPages ? '' : 'pages/';
    var params    = new URLSearchParams(window.location.search);
    var returnUrl = params.get('returnUrl') || '';
    if (returnUrl) window.location.href = decodeURIComponent(returnUrl);
    else            window.location.href = base + 'products.html';
  }

  /* ==========================================================
     VIEW TOGGLE
     ========================================================== */
  function _switcher() {
    var loginSection = document.getElementById('login-section');
    var signupSection = document.getElementById('signup-section');
    var forgotSection = document.getElementById('forgot-section');
    var loginToggle   = document.getElementById('show-signup');
    var signupToggle  = document.getElementById('show-login');
    var forgotToggle  = document.getElementById('show-forgot');
    var backFromForgot = document.getElementById('back-from-forgot');
    var loginSwitcher = document.getElementById('auth-switcher-login');
    var signupSwitcher = document.getElementById('auth-switcher-signup');
    if (!loginSection) return;

    function showLogin() {
      if (loginSection)  loginSection.style.display  = '';
      if (signupSection) signupSection.style.display  = 'none';
      if (forgotSection) forgotSection.style.display  = 'none';
      if (loginSwitcher)  loginSwitcher.style.cssText  = 'text-align:center;margin-top:var(--space-lg);font-size:var(--text-sm);color:var(--color-text-secondary);padding-top:var(--space-md);border-top:1px solid var(--color-border-glass);';
      if (signupSwitcher) signupSwitcher.style.display  = 'none';
    }
    function showSignup() {
      if (loginSection)  loginSection.style.display  = 'none';
      if (signupSection) signupSection.style.display  = '';
      if (forgotSection) forgotSection.style.display  = 'none';
      if (loginSwitcher)  loginSwitcher.style.display  = 'none';
      if (signupSwitcher) signupSwitcher.style.cssText = 'text-align:center;margin-top:var(--space-lg);font-size:var(--text-sm);color:var(--color-text-secondary);padding-top:var(--space-md);border-top:1px solid var(--color-border-glass);';
    }
    function showForgot() {
      if (loginSection)  loginSection.style.display  = 'none';
      if (signupSection) signupSection.style.display  = 'none';
      if (forgotSection) forgotSection.style.display  = '';
      if (loginSwitcher)  loginSwitcher.style.display  = 'none';
      if (signupSwitcher) signupSwitcher.style.display  = 'none';
    }

    if (loginToggle)  loginToggle.addEventListener('click',   function (e) { e.preventDefault(); showSignup(); });
    if (signupToggle) signupToggle.addEventListener('click',  function (e) { e.preventDefault(); showLogin();  });
    if (forgotToggle) forgotToggle.addEventListener('click',  function (e) { e.preventDefault(); showForgot(); });
    if (backFromForgot) backFromForgot.addEventListener('click', function (e) { e.preventDefault(); showLogin(); });

    /* If session already active on initial load → redirect */
    if (Auth.isLoggedIn()) {
      setTimeout(function () { _redirectAfterAuth(); }, 200);
    }
  }

  /* ==========================================================
     LOGGED-IN GREETING SECTION
     Injects a "Welcome, <name>" + Logout card when displaying
     login.html while already signed in.
     ========================================================== */
  function _renderLoggedInState() {
    var s = readSession();
    if (!s) return;
    var header = document.querySelector('.auth-layout .auth-card .auth-title-group');
    if (header) {
      var greeting = document.createElement('div');
      greeting.className = 'auth-greeting';
      greeting.setAttribute('data-auth-name', '');
      greeting.innerHTML =
        '<p class="auth-greeting-text">Signed in as <strong>' + htmlEscape(s.name) + '</strong> <small>(' + htmlEscape(s.email) + ')</small></p>' +
        '<button type="button" class="btn btn-secondary btn-full" id="auth-logout-btn" style="margin-top:0.75rem;">Sign Out</button>';
      header.appendChild(greeting);
      document.getElementById('auth-logout-btn') &&
        (document.getElementById('auth-logout-btn').addEventListener('click', Auth.logout));
    }
    _stampNav(s.name);
  }

  /* ==========================================================
     BOOTSTRAP
     ========================================================== */
  document.addEventListener('DOMContentLoaded', function () {
    _bindLoginForm();
    _bindSignUpForm();
    _bindForgotPassword();
    _switcher();
    _renderLoggedInState();
    _stampNav(readSession() ? readSession().name : null);
    Auth.updateNavUser();
  });

  /* ==========================================================
     GLOBAL EXPORT
     ========================================================== */
  window.Auth = {
    signup:           signup,
    login:            login,
    logout:           logout,
    getSession:       getSession,
    isLoggedIn:       isLoggedIn,
    updateNavUser:    updateNavUser,
    requireLogin:     requireLogin
  };
})();
