import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import {
    createUserWithEmailAndPassword,
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authSwitchBtn = document.getElementById('auth-switch-btn');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const authMessage = document.getElementById('auth-message');
let authMode = 'login';
let auth;

const configIsReady = ['apiKey', 'authDomain', 'projectId', 'appId']
    .every(key => typeof firebaseConfig[key] === 'string' && firebaseConfig[key].trim());

function setAuthMessage(message = '') {
    authMessage.textContent = message;
}

function getErrorMessage(error) {
    const messages = {
        'auth/invalid-email': 'รูปแบบอีเมลไม่ถูกต้อง',
        'auth/invalid-credential': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
        'auth/email-already-in-use': 'อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบ',
        'auth/weak-password': 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
        'auth/too-many-requests': 'มีการลองเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่',
        'auth/network-request-failed': 'เชื่อมต่อไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่'
    };
    return messages[error?.code] || 'ดำเนินการไม่สำเร็จ กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง';
}

if (configIsReady) {
    auth = getAuth(initializeApp(firebaseConfig));
    onAuthStateChanged(auth, user => {
        if (user) window.location.replace('./index.html');
    });
} else {
    authSubmitBtn.disabled = true;
    setAuthMessage('ยังไม่ได้ตั้งค่า Firebase กรุณากรอกค่าจาก Firebase Console ในไฟล์ firebase-config.js');
}

loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    setAuthMessage();
    authSubmitBtn.disabled = true;

    try {
        if (authMode === 'signup') {
            await createUserWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
        } else {
            await signInWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
        }
    } catch (error) {
        setAuthMessage(getErrorMessage(error));
    } finally {
        authSubmitBtn.disabled = false;
    }
});

authSwitchBtn.addEventListener('click', () => {
    authMode = authMode === 'login' ? 'signup' : 'login';
    const isSignup = authMode === 'signup';
    authSubmitBtn.innerHTML = isSignup
        ? 'สมัครใช้งาน <span class="arrow">→</span>'
        : 'เข้าสู่ระบบ <span class="arrow">→</span>';
    authSwitchBtn.textContent = isSignup
        ? 'มีบัญชีแล้ว? เข้าสู่ระบบ'
        : 'ยังไม่มีบัญชี? สมัครใช้งาน';
    authTitle.textContent = isSignup ? 'สมัครใช้งาน' : 'เข้าสู่ระบบ';
    authSubtitle.textContent = isSignup
        ? 'สร้างบัญชีเพื่อบันทึกและซิงก์งานของคุณ'
        : 'ลงชื่อเข้าใช้เพื่อบันทึกและซิงก์งานของคุณ';
    passwordInput.autocomplete = isSignup ? 'new-password' : 'current-password';
    setAuthMessage();
});
