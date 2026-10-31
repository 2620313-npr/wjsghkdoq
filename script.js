// State Variables
let currentNumber = '';
let currentTab = 'keypad';
let recentCalls = [
    { number: '언제나 사랑해', time: '오늘 오전 08:30', type: 'outgoing' },
    { number: '오늘도 수고했어', time: '어제 오후 03:15', type: 'outgoing' }
];
let mockContacts = [
    { name: '내 번호', number: '010-0000-0000' },
    { name: '승연 번호', number: '010-0000-0000' },
    { name: '안심 번호', number: '080-000-0000' },
    { name: '날씨 안내', number: '131' }
];

let callTimerInterval = null;
let callStartTime = 0;
let audioCtx = null;

// Initialize Live Time
function updateTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    document.getElementById('current-time').innerText = timeStr;
}
setInterval(updateTime, 1000);
updateTime();

// Web Audio API for Real DTMF Keypad Tones
function playDTMFTone(key) {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const dtmfFrequencies = {
            '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
            '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
            '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
            '*': [941, 1209], '0': [941, 1336], '#': [941, 1477]
        };

        const freqs = dtmfFrequencies[key] || [440, 440];

        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc1.frequency.value = freqs[0];
        osc2.frequency.value = freqs[1];

        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(audioCtx.currentTime + 0.1);
        osc2.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
        // Audio Context fallback
    }
}

// Zero-Delay Keypad Input Handler
function pressKey(key) {
    playDTMFTone(key);
    if (currentNumber.length < 15) {
        currentNumber += key;
        updateDisplay();
    }
}

function updateDisplay() {
    const displayEl = document.getElementById('phone-number-display');
    const backspaceBtn = document.getElementById('btn-backspace');

    displayEl.innerText = formatPhoneNumber(currentNumber);

    if (currentNumber.length > 0) {
        backspaceBtn.classList.remove('hidden');
    } else {
        backspaceBtn.classList.add('hidden');
    }
}

// 동시 터치 및 연타 시 밀림 방지를 위해 이벤트 최적화
document.querySelectorAll('.key-btn').forEach(btn => {
    const triggerPress = (e) => {
        if (e.cancelable) e.preventDefault();
        
        // 눌림 효과 클래스 동적 부여
        btn.classList.add('pressed');
        setTimeout(() => btn.classList.remove('pressed'), 80);

        const key = btn.getAttribute('data-key');
        pressKey(key);
    };

    btn.addEventListener('touchstart', triggerPress, { passive: false });
    btn.addEventListener('mousedown', (e) => {
        // 모바일 터치 이벤트 중복 방지
        if (e.detail > 0 && ('ontouchstart' in window)) return;
        triggerPress(e);
    });
});

// Backspace Handler (Instant)
const backspaceBtn = document.getElementById('btn-backspace');
const handleBackspace = (e) => {
    if (e.cancelable) e.preventDefault();
    currentNumber = currentNumber.slice(0, -1);
    updateDisplay();
};
backspaceBtn.addEventListener('touchstart', handleBackspace, { passive: false });
backspaceBtn.addEventListener('click', handleBackspace);

// Call Button Handler
const callBtn = document.getElementById('btn-call');
const handleCall = (e) => {
    if (e.cancelable) e.preventDefault();
    makeCall();
};
callBtn.addEventListener('touchstart', handleCall, { passive: false });
callBtn.addEventListener('click', handleCall);

// End Call Button Handler
const endCallBtn = document.getElementById('btn-end-call');
const handleEndCall = (e) => {
    if (e.cancelable) e.preventDefault();
    endCall();
};
endCallBtn.addEventListener('touchstart', handleEndCall, { passive: false });
endCallBtn.addEventListener('click', handleEndCall);

// Phone Number Formatter
function formatPhoneNumber(num) {
    if (!num) return '';
    if (num.includes('*') || num.includes('#')) return num;

    const cleaned = num.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    } else if (cleaned.length === 10) {
        if (cleaned.startsWith('02')) {
            return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
        }
        return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    } else if (cleaned.length === 9 && cleaned.startsWith('02')) {
        return cleaned.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3');
    } else if (cleaned.length === 8) {
        return cleaned.replace(/(\d{4})(\d{4})/, '$1-$2');
    }
    return num;
}

// Simulated Call Execution
function makeCall(targetNum) {
    const numToCall = targetNum || currentNumber;
    if (!numToCall) return;

    const modal = document.getElementById('call-modal');
    const targetEl = document.getElementById('call-target-number');
    const statusText = document.getElementById('call-status-text');
    const timerEl = document.getElementById('call-timer');

    targetEl.innerText = formatPhoneNumber(numToCall);
    statusText.innerText = '통화 연결 중...';
    timerEl.innerText = '00:00';

    modal.classList.remove('translate-y-full');

    const now = new Date();
    const timeString = `오늘 ${now.getHours() >= 12 ? '오후' : '오전'} ${(now.getHours() % 12 || 12).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    recentCalls.unshift({
        number: formatPhoneNumber(numToCall),
        time: timeString,
        type: 'outgoing'
    });
    renderRecents();

    // Exact 1-Second Precision Timer
    setTimeout(() => {
        statusText.innerText = '통화 중';
        callStartTime = Date.now();
        if (callTimerInterval) clearInterval(callTimerInterval);

        callTimerInterval = setInterval(() => {
            const elapsedSeconds = Math.floor((Date.now() - callStartTime) / 1000);
            const mins = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
            const secs = (elapsedSeconds % 60).toString().padStart(2, '0');
            timerEl.innerText = `${mins}:${secs}`;
        }, 100);
    }, 1500);
}

// End Call Logic
function endCall() {
    const modal = document.getElementById('call-modal');
    modal.classList.add('translate-y-full');

    if (callTimerInterval) {
        clearInterval(callTimerInterval);
        callTimerInterval = null;
    }
}

// Navigation / Tab Switcher
function switchTab(tabName) {
    currentTab = tabName;

    const keypadTab = document.getElementById('tab-keypad');
    const recentsTab = document.getElementById('tab-recents');
    const contactsTab = document.getElementById('tab-contacts');

    const navKeypad = document.getElementById('nav-keypad');
    const navRecents = document.getElementById('nav-recents');
    const navContacts = document.getElementById('nav-contacts');

    keypadTab.classList.add('hidden');
    recentsTab.classList.add('hidden');
    contactsTab.classList.add('hidden');

    [navKeypad, navRecents, navContacts].forEach(btn => {
        btn.className = "flex-1 py-2.5 rounded-full flex items-center justify-center gap-1.5 text-samsungSubText font-medium text-sm";
    });

    if (tabName === 'keypad') {
        keypadTab.classList.remove('hidden');
        navKeypad.className = "flex-1 py-2.5 rounded-full flex items-center justify-center gap-1.5 bg-white text-samsungTextDark shadow-sm font-semibold text-sm";
    } else if (tabName === 'recents') {
        recentsTab.classList.remove('hidden');
        recentsTab.classList.add('flex');
        navRecents.className = "flex-1 py-2.5 rounded-full flex items-center justify-center gap-1.5 bg-white text-samsungTextDark shadow-sm font-semibold text-sm";
    } else if (tabName === 'contacts') {
        contactsTab.classList.remove('hidden');
        contactsTab.classList.add('flex');
        navContacts.className = "flex-1 py-2.5 rounded-full flex items-center justify-center gap-1.5 bg-white text-samsungTextDark shadow-sm font-semibold text-sm";
    }
}

// Render Recent Calls List
function renderRecents() {
    const container = document.getElementById('recents-list');
    container.innerHTML = '';

    if (recentCalls.length === 0) {
        container.innerHTML = '<div class="text-center text-samsungSubText py-8 text-sm">최근 통화 기록이 없습니다.</div>';
        return;
    }

    recentCalls.forEach(call => {
        const item = document.createElement('div');
        item.className = 'flex justify-between items-center bg-white p-3.5 rounded-2xl shadow-sm hover:bg-gray-50 active:scale-[0.99] transition cursor-pointer';
        item.onclick = () => makeCall(call.number);

        item.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-samsungNavBg flex items-center justify-center text-samsungOrange">
                    <i class="fa-solid fa-arrow-up-right text-xs"></i>
                </div>
                <div>
                    <div class="font-semibold text-sm text-samsungTextDark">${call.number}</div>
                    <div class="text-xs text-samsungSubText mt-0.5">${call.time}</div>
                </div>
            </div>
            <button onclick="event.stopPropagation(); makeCall('${call.number}')" class="w-9 h-9 rounded-full bg-samsungOrange/10 text-samsungOrange flex items-center justify-center">
                <i class="fa-solid fa-phone text-sm"></i>
            </button>
        `;
        container.appendChild(item);
    });
}

// Render Mock Contacts List
function renderContacts() {
    const container = document.getElementById('contacts-list');
    container.innerHTML = '';

    mockContacts.forEach(contact => {
        const item = document.createElement('div');
        item.className = 'flex justify-between items-center bg-white p-3.5 rounded-2xl shadow-sm hover:bg-gray-50 active:scale-[0.99] transition cursor-pointer';
        item.onclick = () => makeCall(contact.number);

        item.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-sm">
                    ${contact.name[0]}
                </div>
                <div>
                    <div class="font-semibold text-sm text-samsungTextDark">${contact.name}</div>
                    <div class="text-xs text-samsungSubText mt-0.5">${contact.number}</div>
                </div>
            </div>
            <button onclick="event.stopPropagation(); makeCall('${contact.number}')" class="w-9 h-9 rounded-full bg-samsungOrange/10 text-samsungOrange flex items-center justify-center">
                <i class="fa-solid fa-phone text-sm"></i>
            </button>
        `;
        container.appendChild(item);
    });
}

// Keyboard Support for Desktop Browsers
window.addEventListener('keydown', (e) => {
    if (currentTab !== 'keypad') return;

    if ((e.key >= '0' && e.key <= '9') || e.key === '*' || e.key === '#') {
        pressKey(e.key);
    } else if (e.key === 'Backspace') {
        currentNumber = currentNumber.slice(0, -1);
        updateDisplay();
    } else if (e.key === 'Enter') {
        makeCall();
    }
});

// Initial Setup
renderRecents();
renderContacts();
