const themeToggle = document.getElementById('theme-toggle');
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
    themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));

    const label = theme === 'dark' ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด';
    themeToggle.setAttribute('aria-label', label);
    themeToggle.title = label;

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
        themeColor.content = theme === 'dark' ? '#111111' : '#ffffff';
    }
}

applyTheme(savedTheme || (colorScheme.matches ? 'dark' : 'light'));

themeToggle.addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    savedTheme = nextTheme;
    applyTheme(nextTheme);

    try {
        localStorage.setItem('deadline_theme', nextTheme);
    } catch (error) {
        console.warn('Could not save the theme preference.', error);
    }
});

colorScheme.addEventListener('change', event => {
    if (!savedTheme) {
        applyTheme(event.matches ? 'dark' : 'light');
    }
});
