import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

const authLink = document.getElementById('about-auth-link');
const callToAction = document.getElementById('about-cta');
const configIsReady = ['apiKey', 'authDomain', 'projectId', 'appId']
    .every(key => typeof firebaseConfig[key] === 'string' && firebaseConfig[key].trim());

function updateAuthLinks(user) {
    const destination = user ? 'app/' : 'login/';
    authLink.href = new URL(destination, document.baseURI).href;
    authLink.textContent = user ? 'ไปที่งาน' : 'เข้าสู่ระบบ';
    callToAction.href = new URL(destination, document.baseURI).href;
    callToAction.firstChild.textContent = user ? 'เปิดงานของฉัน ' : 'เริ่มจัดการงาน ';
}

if (configIsReady) {
    const auth = getAuth(initializeApp(firebaseConfig));
    onAuthStateChanged(auth, updateAuthLinks, error => {
        console.error('Could not read the authentication state on the public page.', error);
    });
} else {
    console.error('Firebase configuration is incomplete; public page authentication links are unavailable.');
}
