const previewList = document.querySelector('.preview-task-list');
const previewActiveCount = document.getElementById('preview-active-count');
const previewCompletedCount = document.getElementById('preview-completed-count');
const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];
const today = new Date();
today.setHours(0, 0, 0, 0);

function getPreviewDate(offset) {
    const date = new Date(today);
    date.setDate(date.getDate() + offset);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const previewTasks = [
    { title: 'วางแผนงานสัปดาห์ใหม่', startDate: getPreviewDate(0), dueDate: getPreviewDate(2), completed: false },
    { title: 'ตรวจทานเอกสารโครงการ', startDate: getPreviewDate(1), dueDate: getPreviewDate(5), completed: false },
    { title: 'เตรียมสรุปความคืบหน้า', startDate: getPreviewDate(2), dueDate: getPreviewDate(8), completed: false },
    { title: 'จัดทำบันทึกประชุมทีม', startDate: getPreviewDate(-5), dueDate: getPreviewDate(-2), completed: true },
    { title: 'ทบทวนรายการงานเดือนนี้', startDate: getPreviewDate(-8), dueDate: getPreviewDate(-4), completed: true }
];

function parsePreviewDate(dateString) {
    return new Date(`${dateString}T00:00:00`);
}

function formatPreviewDate(dateString) {
    const date = parsePreviewDate(dateString);
    return `${date.getDate()} ${thaiMonths[date.getMonth()]}`;
}

function getPreviewDaysRemaining(dateString) {
    const due = parsePreviewDate(dateString);
    const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const dueUtc = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
    return Math.round((dueUtc - todayUtc) / 86400000);
}

function renderPreviewTasks() {
    if (!previewList || !previewActiveCount || !previewCompletedCount) return;

    const activeCount = previewTasks.filter(task => !task.completed).length;
    const completedCount = previewTasks.length - activeCount;
    previewActiveCount.textContent = `${activeCount} งาน`;
    previewCompletedCount.textContent = `${completedCount} งาน`;
    previewList.replaceChildren();

    previewTasks.forEach(task => {
        const dueDate = parsePreviewDate(task.dueDate);
        const daysRemaining = getPreviewDaysRemaining(task.dueDate);
        const dueText = task.completed
            ? 'เสร็จสิ้นแล้ว'
            : daysRemaining > 0
                ? `เหลืออีก ${daysRemaining} วัน`
                : daysRemaining === 0
                    ? 'ครบกำหนดวันนี้'
                    : `เลยกำหนด ${Math.abs(daysRemaining)} วัน`;
        const item = document.createElement('li');
        item.className = 'preview-task';

        const date = document.createElement('span');
        date.className = 'preview-date';
        const day = document.createElement('strong');
        day.textContent = String(dueDate.getDate());
        const month = document.createElement('small');
        month.textContent = thaiMonths[dueDate.getMonth()];
        date.append(day, month);

        const info = document.createElement('span');
        info.className = 'preview-task-info';
        const title = document.createElement('strong');
        title.textContent = task.title;
        const start = document.createElement('small');
        start.textContent = `เริ่ม ${formatPreviewDate(task.startDate)}`;
        info.append(title, start);

        const due = document.createElement('span');
        due.className = 'preview-due';
        due.textContent = dueText;
        item.append(date, info, due);
        previewList.appendChild(item);
    });
}

renderPreviewTasks();
