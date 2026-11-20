import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import {
    getAuth,
    onAuthStateChanged,
    signOut
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getFirestore,
    onSnapshot,
    updateDoc
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

let tasks = [];
let currentFilter = 'all';
let searchQuery = '';
let sortOrder = 'due-asc';
let unsubscribeTasks = null;
let currentUser = null;

const userAvatar = document.getElementById('user-avatar');
const accountMenuButton = document.getElementById('account-menu-btn');
const accountMenu = document.getElementById('account-menu');
const accountMenuWrap = document.querySelector('.account-menu-wrap');
const accountTriggerEmail = document.getElementById('account-trigger-email');
const accountEmail = document.getElementById('account-email');
const openSettingsBtn = document.getElementById('open-settings-btn');
const accountThemeToggle = document.getElementById('account-theme-toggle');
const signOutBtn = document.getElementById('sign-out-btn');
const settingsModal = document.getElementById('settings-modal');
const themePreferenceSelect = document.getElementById('theme-preference');
const settingsMessage = document.getElementById('settings-message');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const doneSettingsBtn = document.getElementById('done-settings-btn');
const taskListEl = document.getElementById('task-list');
const activeCountEl = document.getElementById('active-count');
const completedCountEl = document.getElementById('completed-count');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const tabBtns = document.querySelectorAll('.tab-btn');
const dashboardMessage = document.getElementById('dashboard-message');
const taskModal = document.getElementById('task-modal');
const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelModalBtn = document.getElementById('cancel-modal-btn');
const deleteTaskBtn = document.getElementById('delete-task-btn');
const taskForm = document.getElementById('task-form');
const taskMessage = document.getElementById('task-message');
const modalTitle = document.getElementById('modal-title');
const taskIdInput = document.getElementById('task-id');
const taskTitleInput = document.getElementById('task-title');
const taskStartInput = document.getElementById('task-start');
const taskDueInput = document.getElementById('task-due');

const THAI_MONTHS = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const configIsReady = ['apiKey', 'authDomain', 'projectId', 'appId']
    .every(key => typeof firebaseConfig[key] === 'string' && firebaseConfig[key].trim());

let auth;
let db;

if (configIsReady) {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    onAuthStateChanged(auth, handleAuthState);
} else {
    window.location.replace('./login.html');
}

function setDashboardMessage(message = '') {
    dashboardMessage.textContent = message;
    dashboardMessage.hidden = !message;
}

function setTaskMessage(message = '') {
    taskMessage.textContent = message;
}

function getErrorMessage(error, context) {
    const code = error?.code || '';
    const messages = {
        'auth/invalid-email': 'รูปแบบอีเมลไม่ถูกต้อง',
        'auth/invalid-credential': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
        'auth/email-already-in-use': 'อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบ',
        'auth/weak-password': 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
        'auth/too-many-requests': 'มีการลองเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่',
        'auth/network-request-failed': 'เชื่อมต่อไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่',
        'permission-denied': 'ไม่มีสิทธิ์เข้าถึงข้อมูล กรุณาตรวจสอบ Firestore Security Rules',
        'unavailable': 'บริการไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้ง'
    };
    return messages[code] || `${context}ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง`;
}

function handleAuthState(user) {
    currentUser = user;
    if (unsubscribeTasks) {
        unsubscribeTasks();
        unsubscribeTasks = null;
    }

    if (!user) {
        tasks = [];
        window.location.replace('./login.html');
        return;
    }

    const email = user.email || 'บัญชีผู้ใช้';
    userAvatar.textContent = email.charAt(0).toUpperCase();
    accountTriggerEmail.textContent = email;
    accountEmail.textContent = email;
    setDashboardMessage('กำลังโหลดรายการงาน...');
    renderTasks();

    const tasksRef = collection(db, 'users', user.uid, 'tasks');
    unsubscribeTasks = onSnapshot(tasksRef, snapshot => {
        tasks = snapshot.docs.map(taskDoc => ({ id: taskDoc.id, ...taskDoc.data() }));
        setDashboardMessage();
        renderTasks();
    }, error => {
        setDashboardMessage(getErrorMessage(error, 'โหลดรายการงาน'));
    });
}

function closeAccountMenu(restoreFocus = false) {
    accountMenu.hidden = true;
    accountMenuButton.setAttribute('aria-expanded', 'false');
    if (restoreFocus) accountMenuButton.focus();
}

function openSettings() {
    closeAccountMenu();
    settingsMessage.textContent = '';
    themePreferenceSelect.value = window.deadlineTheme.getPreference();
    settingsModal.classList.add('open');
    themePreferenceSelect.focus();
}

function closeSettings() {
    settingsModal.classList.remove('open');
    accountMenuButton.focus();
}

accountMenuButton.addEventListener('click', () => {
    const isOpening = accountMenu.hidden;
    accountMenu.hidden = !isOpening;
    accountMenuButton.setAttribute('aria-expanded', String(isOpening));
    if (isOpening) accountMenu.querySelector('.account-menu-item').focus();
});

document.addEventListener('click', event => {
    if (!accountMenuWrap.contains(event.target)) closeAccountMenu();
});

document.addEventListener('click', event => {
    if (!(event.target instanceof Element) || !event.target.closest('.task-actions')) {
        closeTaskMenus();
    }
});

accountMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => closeAccountMenu());
});

openSettingsBtn.addEventListener('click', openSettings);
accountThemeToggle.addEventListener('click', () => closeAccountMenu(true));
closeSettingsBtn.addEventListener('click', closeSettings);
doneSettingsBtn.addEventListener('click', closeSettings);
settingsModal.addEventListener('click', event => {
    if (event.target === settingsModal) closeSettings();
});

themePreferenceSelect.addEventListener('change', () => {
    try {
        window.deadlineTheme.setPreference(themePreferenceSelect.value);
        settingsMessage.textContent = '';
    } catch (error) {
        settingsMessage.textContent = 'เปลี่ยนธีมแล้ว แต่บันทึกการตั้งค่าไม่สำเร็จ การตั้งค่าอาจไม่คงอยู่เมื่อเปิดใหม่';
        console.error('Could not persist the theme preference.', error);
    }
});

signOutBtn.addEventListener('click', async () => {
    closeAccountMenu();
    if (!auth || !currentUser || !confirm('ต้องการออกจากระบบใช่หรือไม่?')) return;
    try {
        await signOut(auth);
    } catch (error) {
        setDashboardMessage(getErrorMessage(error, 'ออกจากระบบ'));
    }
});

function formatThaiDate(dateString) {
    const date = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(date.getTime())) return { dayMonth: 'ไม่ระบุวันที่', year: '' };
    return {
        dayMonth: `${date.getDate()} ${THAI_MONTHS[date.getMonth()]}`,
        year: String(date.getFullYear())
    };
}

function getDaysRemaining(dueDateString) {
    const today = new Date();
    const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const due = new Date(`${dueDateString}T00:00:00`);
    if (Number.isNaN(due.getTime())) return null;
    const dueUtc = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
    return Math.round((dueUtc - todayUtc) / 86400000);
}

function getDaysRemainingText(daysRemaining) {
    if (daysRemaining === null) return 'ไม่ระบุกำหนดส่ง';
    if (daysRemaining > 0) return `เหลืออีก ${daysRemaining} วัน`;
    if (daysRemaining === 0) return 'ครบกำหนดวันนี้';
    return `เลยกำหนด ${Math.abs(daysRemaining)} วัน`;
}

function getDaysRemainingClass(daysRemaining) {
    if (daysRemaining === null) return '';
    if (daysRemaining < 3) return 'days-left-pill--urgent';
    if (daysRemaining < 7) return 'days-left-pill--soon';
    return '';
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function createActionButton(label, className, path, onClick) {
    const button = createElement('button', `action-btn ${className}`.trim());
    button.type = 'button';
    button.title = label;
    button.setAttribute('aria-label', label);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    const shape = document.createElementNS('http://www.w3.org/2000/svg', path.tag);
    for (const [attribute, value] of Object.entries(path.attributes)) {
        shape.setAttribute(attribute, value);
    }
    svg.appendChild(shape);
    button.appendChild(svg);
    button.addEventListener('click', onClick);
    return button;
}

function closeTaskMenus(restoreFocus = false) {
    const openButtons = taskListEl.querySelectorAll('.task-menu-toggle[aria-expanded="true"]');
    openButtons.forEach(button => {
        button.setAttribute('aria-expanded', 'false');
        button.nextElementSibling.hidden = true;
        button.closest('.task-card').classList.remove('menu-open');
    });
    if (restoreFocus && openButtons.length > 0) openButtons[0].focus();
    return openButtons.length > 0;
}

function renderTaskCard(task) {
    const card = createElement('article', `task-card${task.completed ? ' completed' : ''}`);
    const due = createElement('div', 'due-badge-box');
    const dueDate = formatThaiDate(task.dueDate);
    due.append(
        createElement('span', 'due-label', 'กำหนดส่ง'),
        createElement('span', 'due-date', dueDate.dayMonth),
        createElement('span', 'due-year', dueDate.year)
    );

    const info = createElement('div', 'task-info');
    const meta = createElement('div', 'task-meta');
    const daysRemaining = getDaysRemaining(task.dueDate);
    const daysClass = task.completed
        ? 'days-left-pill--complete'
        : getDaysRemainingClass(daysRemaining);
    meta.append(
        createElement(
            'span',
            `days-left-pill ${daysClass}`.trim(),
            task.completed ? 'เสร็จสิ้นแล้ว' : getDaysRemainingText(daysRemaining)
        ),
        createElement('span', 'start-date-text', `เริ่มเมื่อ ${formatThaiDate(task.startDate).dayMonth}`)
    );
    info.append(createElement('div', 'task-title', task.title), meta);

    const actions = createElement('div', 'task-actions');
    const menu = createElement('div', 'task-action-menu');
    menu.hidden = true;
    const menuToggle = createActionButton(
        'ตัวเลือกเพิ่มเติม',
        'task-menu-toggle',
        { tag: 'path', attributes: { d: 'M12 5v.01M12 12v.01M12 19v.01' } },
        () => {
            const shouldOpen = menu.hidden;
            closeTaskMenus();
            menu.hidden = !shouldOpen;
            menuToggle.setAttribute('aria-expanded', String(shouldOpen));
            card.classList.toggle('menu-open', shouldOpen);
        }
    );
    menuToggle.setAttribute('aria-expanded', 'false');
    menu.setAttribute('role', 'group');
    menu.setAttribute('aria-label', 'ตัวเลือกกำหนดการ');

    const completeAction = createElement(
        'button',
        'task-menu-item',
        task.completed ? 'ทำเครื่องหมายว่ายังไม่เสร็จ' : 'ทำเครื่องหมายว่าเสร็จสิ้น'
    );
    completeAction.type = 'button';
    completeAction.addEventListener('click', () => {
        closeTaskMenus();
        toggleComplete(task.id, !task.completed);
    });

    const editAction = createElement('button', 'task-menu-item', 'แก้ไข');
    editAction.type = 'button';
    editAction.addEventListener('click', () => {
        closeTaskMenus();
        editTask(task);
    });

    menu.append(completeAction, editAction);
    actions.append(menuToggle, menu);

    card.append(due, info, actions);
    return card;
}

function renderTasks() {
    const activeCount = tasks.filter(task => !task.completed).length;
    const completedCount = tasks.filter(task => task.completed).length;
    activeCountEl.textContent = String(activeCount);
    completedCountEl.textContent = String(completedCount);

    const query = searchQuery.toLocaleLowerCase();
    const filtered = tasks.filter(task => {
        const title = typeof task.title === 'string' ? task.title : '';
        const matchesFilter = currentFilter === 'all' ||
            (currentFilter === 'active' && !task.completed) ||
            (currentFilter === 'completed' && task.completed);
        return matchesFilter && title.toLocaleLowerCase().includes(query);
    }).sort((a, b) => {
        const dateA = Date.parse(`${a.dueDate}T00:00:00`) || 0;
        const dateB = Date.parse(`${b.dueDate}T00:00:00`) || 0;
        return sortOrder === 'due-asc' ? dateA - dateB : dateB - dateA;
    });

    taskListEl.replaceChildren();
    if (filtered.length === 0) {
        const message = tasks.length === 0
            ? 'ยังไม่มีกำหนดการ กด “เพิ่มกำหนดการ” เพื่อเริ่มต้น'
            : 'ไม่พบกำหนดการที่ตรงกับการค้นหา';
        taskListEl.appendChild(createElement('p', 'empty-state', message));
        return;
    }
    filtered.forEach(task => taskListEl.appendChild(renderTaskCard(task)));
}

function getTaskRef(id) {
    if (!currentUser) throw new Error('ไม่พบผู้ใช้ที่เข้าสู่ระบบ');
    return doc(db, 'users', currentUser.uid, 'tasks', id);
}

async function toggleComplete(id, completed) {
    try {
        await updateDoc(getTaskRef(id), { completed });
        setDashboardMessage();
    } catch (error) {
        setDashboardMessage(getErrorMessage(error, 'อัปเดตสถานะงาน'));
    }
}

async function deleteTask(id, reportError = setDashboardMessage) {
    if (!confirm('ต้องการลบกำหนดการนี้ใช่หรือไม่?')) return false;
    try {
        await deleteDoc(getTaskRef(id));
        setDashboardMessage();
        return true;
    } catch (error) {
        reportError(getErrorMessage(error, 'ลบกำหนดการ'));
        return false;
    }
}

function editTask(task) {
    taskIdInput.value = task.id;
    deleteTaskBtn.hidden = false;
    taskTitleInput.value = task.title;
    taskStartInput.value = task.startDate;
    taskDueInput.value = task.dueDate;
    modalTitle.textContent = 'แก้ไขกำหนดการ';
    setTaskMessage();
    openModal();
}

function openModal() {
    taskModal.classList.add('open');
    taskTitleInput.focus();
}

function resetTaskForm() {
    taskForm.reset();
    taskIdInput.value = '';
    deleteTaskBtn.hidden = true;
    taskStartInput.value = getLocalDateString(new Date());
    taskDueInput.value = getLocalDateString(new Date());
    modalTitle.textContent = 'เพิ่มกำหนดการใหม่';
    setTaskMessage();
}

function closeModal() {
    taskModal.classList.remove('open');
    resetTaskForm();
    openModalBtn.focus();
}

function getLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

openModalBtn.addEventListener('click', () => {
    resetTaskForm();
    openModal();
});
closeModalBtn.addEventListener('click', closeModal);
cancelModalBtn.addEventListener('click', closeModal);
deleteTaskBtn.addEventListener('click', async () => {
    const id = taskIdInput.value;
    if (!id) {
        setTaskMessage('ไม่พบรายการที่ต้องการลบ');
        return;
    }

    deleteTaskBtn.disabled = true;
    try {
        if (await deleteTask(id, setTaskMessage)) closeModal();
    } finally {
        deleteTaskBtn.disabled = false;
    }
});
taskModal.addEventListener('click', event => {
    if (event.target === taskModal) closeModal();
});
document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (settingsModal.classList.contains('open')) {
        closeSettings();
    } else if (!accountMenu.hidden) {
        closeAccountMenu(true);
    } else if (closeTaskMenus(true)) {
        return;
    } else if (taskModal.classList.contains('open')) {
        closeModal();
    }
});

taskForm.addEventListener('submit', async event => {
    event.preventDefault();
    setTaskMessage();
    const title = taskTitleInput.value.trim();
    const startDate = taskStartInput.value;
    const dueDate = taskDueInput.value;

    if (!title || !startDate || !dueDate || dueDate < startDate) {
        setTaskMessage('กรุณากรอกข้อมูลงานให้ครบ และกำหนดส่งต้องไม่อยู่ก่อนวันเริ่มต้น');
        return;
    }

    const task = { title, startDate, dueDate, completed: false };
    const submitButton = taskForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    try {
        if (taskIdInput.value) {
            const existing = tasks.find(item => item.id === taskIdInput.value);
            await updateDoc(getTaskRef(taskIdInput.value), {
                ...task,
                completed: existing ? existing.completed : false
            });
        } else {
            await addDoc(collection(db, 'users', currentUser.uid, 'tasks'), task);
        }
        closeModal();
        setDashboardMessage();
    } catch (error) {
        setTaskMessage(getErrorMessage(error, 'บันทึกกำหนดการ'));
    } finally {
        submitButton.disabled = false;
    }
});

tabBtns.forEach(button => {
    button.addEventListener('click', () => {
        tabBtns.forEach(tab => {
            tab.classList.remove('active');
            tab.setAttribute('aria-pressed', 'false');
        });
        button.classList.add('active');
        button.setAttribute('aria-pressed', 'true');
        currentFilter = button.dataset.filter;
        renderTasks();
    });
});

searchInput.addEventListener('input', event => {
    searchQuery = event.target.value.trim();
    renderTasks();
});

sortSelect.addEventListener('change', event => {
    sortOrder = event.target.value;
    renderTasks();
});
