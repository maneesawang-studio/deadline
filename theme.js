const themeToggle = document.getElementById('theme-toggle');
const accountThemeToggle = document.getElementById('account-theme-toggle');
const accountThemeLabel = document.getElementById('account-theme-label');
const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
let savedTheme = null;
const routeKey = 'deadline_last_page';

function rememberCurrentRoute() {
    const isLoginPage = /\/login\/?$/.test(location.pathname);
    if (isLoginPage) return;

    try {
        localStorage.setItem(routeKey, location.href);
    } catch (error) {
        console.warn('Could not remember the last page.', error);
    }
}

function restoreLastPageInInstalledApp() {
    const isAppPage = /\/app\/?$/.test(location.pathname);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        || window.matchMedia('(display-mode: fullscreen)').matches
        || window.navigator.standalone === true;

    if (!isAppPage || !isStandalone) return false;

    let savedUrl;
    try {
        savedUrl = localStorage.getItem(routeKey);
    } catch (error) {
        console.warn('Could not read the last page.', error);
        return false;
    }

    if (!savedUrl) return false;

    try {
        const url = new URL(savedUrl);
        const isSameOrigin = url.origin === location.origin;
        const isAppPage = /\/app\/?$/.test(url.pathname);
        const isLoginPage = /\/login\/?$/.test(url.pathname);
        if (isSameOrigin && !isAppPage && !isLoginPage && url.href !== location.href) {
            location.replace(url.href);
            return true;
        }
    } catch (error) {
        console.warn('Could not restore the last page.', error);
    }
    return false;
}

window.deadlineRoutes = {
    remember: rememberCurrentRoute,
    getPostLoginUrl: () => {
        try {
            const savedUrl = localStorage.getItem(routeKey);
            if (!savedUrl) return '../app/';
            const url = new URL(savedUrl);
            if (url.origin !== location.origin || /\/login\/?$/.test(url.pathname)) {
                return '../app/';
            }
            return url.href;
        } catch (error) {
            console.warn('Could not read the page to return to after login.', error);
            return '../app/';
        }
    }
};

try {
    const storedTheme = localStorage.getItem('deadline_theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
        savedTheme = storedTheme;
    }
} catch (error) {
    console.warn('Could not read the saved theme preference.', error);
}

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;


    const label = theme === 'dark' ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด';
    if (themeToggle) {
        themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
        themeToggle.setAttribute('aria-label', label);
        themeToggle.title = label;
    }
    if (accountThemeToggle) {
        accountThemeToggle.setAttribute('aria-label', label);
        accountThemeToggle.title = label;
        accountThemeLabel.textContent = theme === 'dark' ? 'มืด' : 'สว่าง';
    }

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
        themeColor.content = theme === 'dark' ? '#111213' : '#ffffff';
    }

    const appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (appleStatusBar) {
        appleStatusBar.content = theme === 'dark' ? 'black-translucent' : 'default';
    }
}

applyTheme(savedTheme || (colorScheme.matches ? 'dark' : 'light'));

const applySystemTheme = () => {
    if (!savedTheme) {
        applyTheme(colorScheme.matches ? 'dark' : 'light');
    }
};

if (typeof colorScheme.addEventListener === 'function') {
    colorScheme.addEventListener('change', applySystemTheme);
} else if (typeof colorScheme.addListener === 'function') {
    colorScheme.addListener(applySystemTheme);
}

function setThemePreference(preference) {
    if (!['system', 'light', 'dark'].includes(preference)) {
        throw new RangeError('Unsupported theme preference.');
    }

    let storageError;
    try {
        if (preference === 'system') {
            localStorage.removeItem('deadline_theme');
        } else {
            localStorage.setItem('deadline_theme', preference);
        }
    } catch (error) {
        storageError = error;
        console.warn('Could not save the theme preference.', error);
    }

    savedTheme = preference === 'system' ? null : preference;
    applyTheme(savedTheme || (colorScheme.matches ? 'dark' : 'light'));
    if (storageError) throw storageError;
}

window.deadlineTheme = {
    getPreference: () => savedTheme || 'system',
    setPreference: setThemePreference
};

function toggleTheme() {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    try {
        setThemePreference(nextTheme);
    } catch (error) {
        console.error('The theme changed, but its preference could not be saved.', error);
    }
}

if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
if (accountThemeToggle) accountThemeToggle.addEventListener('click', toggleTheme);

const isRestoringDeadlineRoute = restoreLastPageInInstalledApp();
if (!isRestoringDeadlineRoute) {
    rememberCurrentRoute();
}
