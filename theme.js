const themeToggle = document.getElementById('theme-toggle');
const accountThemeToggle = document.getElementById('account-theme-toggle');
const accountThemeLabel = document.getElementById('account-theme-label');
const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
let savedTheme = null;

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

    const favicon = document.getElementById('favicon-icon');
    const appleTouchIcon = document.getElementById('apple-touch-icon');
    if (favicon) {
        favicon.href = theme === 'dark' ? 'assets/Deadline-white.png' : 'assets/Deadline.png';
    }
    if (appleTouchIcon) {
        appleTouchIcon.href = theme === 'dark'
            ? 'assets/Deadline-white-180.png'
            : 'assets/Deadline-180.png';
    }

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

colorScheme.addEventListener('change', event => {
    if (!savedTheme) {
        applyTheme(event.matches ? 'dark' : 'light');
    }
});
