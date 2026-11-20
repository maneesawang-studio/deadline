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
const taskForm = document.getElementById('task-form');
const taskMessage = document.getElementById('task-message');
const modalTitle = document.getElementById('modal-title');
const taskIdInput = document.getElementById('task-id');
const taskTitleInput = document.getElementById('task-title');
const taskStartInput = document.getElementById('task-start');
const taskDueInput = document.getElementById('task-due');
const taskTagInput = document.getElementById('task-tag');

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

function getDaysRemainingText(dueDateString) {
    const today = new Date();
    const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const due = new Date(`${dueDateString}T00:00:00`);
    if (Number.isNaN(due.getTime())) return 'ไม่ระบุกำหนดส่ง';
    const dueUtc = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
    const difference = Math.round((dueUtc - todayUtc) / 86400000);
    if (difference > 0) return `เหลืออีก ${difference} วัน`;
    if (difference === 0) return 'ครบกำหนดวันนี้';
    return `เลยกำหนด ${Math.abs(difference)} วัน`;
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
    svg.setAttribute('width', '15');
    svg.setAttribute('height', '15');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    const shape = document.createElementNS('http://www.w3.org/2000/svg', path.tag);
    for (const [attribute, value] of Object.entries(path.attributes)) {
        shape.setAttribute(attribute, value);
    }
    svg.appendChild(shape);
    button.appendChild(svg);
    button.addEventListener('click', onClick);
    return button;
}

function renderTaskCard(task) {
    const card = createElement('article', `task-card${task.completed ? ' completed' : ''}`);
    const left = createElement('div', 'task-left');
    const due = createElement('div', 'due-badge-box');
    const dueDate = formatThaiDate(task.dueDate);
    due.append(
        createElement('span', 'due-label', 'กำหนดส่ง'),
        createElement('span', 'due-date', dueDate.dayMonth),
        createElement('span', 'due-year', dueDate.year)
    );

    const info = createElement('div', 'task-info');
    const meta = createElement('div', 'task-meta');
    meta.append(
        createElement('span', 'days-left-pill', task.completed ? 'เสร็จสิ้นแล้ว' : getDaysRemainingText(task.dueDate)),
        createElement('span', 'start-date-text', `เริ่มเมื่อ ${formatThaiDate(task.startDate).dayMonth}`)
    );
    if (task.tag) meta.appendChild(createElement('span', 'tag-pill', `#${task.tag}`));
    info.append(meta, createElement('div', 'task-title', task.title));
    left.append(due, info);

    const actions = createElement('div', 'task-actions');
    actions.append(
        createActionButton(
            task.completed ? 'ทำเครื่องหมายว่ายังไม่เสร็จ' : 'ทำเครื่องหมายว่าเสร็จสิ้น',
            'check-circle',
            { tag: 'polyline', attributes: { points: '20 6 9 17 4 12' } },
            () => toggleComplete(task.id, !task.completed)
        ),
        createActionButton(
            'แก้ไข',
            '',
            { tag: 'path', attributes: { d: 'M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z' } },
            () => editTask(task)
        ),
        createActionButton(
            'ลบ',
            '',
            { tag: 'line', attributes: { x1: '18', y1: '6', x2: '6', y2: '18' } },
            () => deleteTask(task.id)
        )
    );
    const deleteShape = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    deleteShape.setAttribute('x1', '6');
    deleteShape.setAttribute('y1', '6');
    deleteShape.setAttribute('x2', '18');
    deleteShape.setAttribute('y2', '18');
    actions.lastChild.querySelector('svg').appendChild(deleteShape);

    card.append(left, actions);
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
        const tag = typeof task.tag === 'string' ? task.tag : '';
        const matchesFilter = currentFilter === 'all' ||
            (currentFilter === 'active' && !task.completed) ||
            (currentFilter === 'completed' && task.completed);
        return matchesFilter && `${title} ${tag}`.toLocaleLowerCase().includes(query);
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

async function deleteTask(id) {
    if (!confirm('ต้องการลบกำหนดการนี้ใช่หรือไม่?')) return;
    try {
        await deleteDoc(getTaskRef(id));
        setDashboardMessage();
    } catch (error) {
        setDashboardMessage(getErrorMessage(error, 'ลบกำหนดการ'));
    }
}

function editTask(task) {
    taskIdInput.value = task.id;
    taskTitleInput.value = task.title;
    taskStartInput.value = task.startDate;
    taskDueInput.value = task.dueDate;
    taskTagInput.value = task.tag || '';
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
    taskStartInput.value = getLocalDateString(new Date());
    taskDueInput.value = '';
    taskTagInput.value = 'งาน';
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
taskModal.addEventListener('click', event => {
    if (event.target === taskModal) closeModal();
});
document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (settingsModal.classList.contains('open')) {
        closeSettings();
    } else if (!accountMenu.hidden) {
        closeAccountMenu(true);
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
    const tag = taskTagInput.value.trim().replace(/^#/, '');

    if (!title || !startDate || !dueDate || dueDate < startDate) {
        setTaskMessage('กรุณากรอกข้อมูลงานให้ครบ และกำหนดส่งต้องไม่อยู่ก่อนวันเริ่มต้น');
        return;
    }

    const task = { title, startDate, dueDate, tag, completed: false };
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
