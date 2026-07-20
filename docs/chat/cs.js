// ================= 多國語系設定 (i18n) =================
const i18n = {
    'zh': {
        'page_title': '聊天 🌿',
        'setup_title': '🌱 歡迎聊天室',
        'setup_room_ph': '房間名稱',
        'setup_name_ph': '暱稱 例如: ฅ^•ﻌ•^ฅ',
        'setup_btn': '開始聊天 🚀',
        'online_label': '在線: ',
        'chat_input_ph': '輸入訊息...',
        'chat_send_btn': '發送',
        'alert_no_room': '請填寫或確認房間名稱',
        'alert_no_name': '請填寫暱稱',
        'room_prefix': '房間: '
    },
    'en': {
        'page_title': 'Chat 🌿',
        'setup_title': '🌱 Welcome to Chat',
        'setup_room_ph': 'Room Name',
        'setup_name_ph': 'Nickname e.g. ฅ^•ﻌ•^ฅ',
        'setup_btn': 'Start Chat 🚀',
        'online_label': 'Online: ',
        'chat_input_ph': 'Type a message...',
        'chat_send_btn': 'Send',
        'alert_no_room': 'Please enter or confirm the room name',
        'alert_no_name': 'Please enter a nickname',
        'room_prefix': 'Room: '
    }
};

let currentLang = 'zh'; // 預設語言

function toggleLanguage() {
    currentLang = currentLang === 'zh' ? 'en' : 'zh';
    updateLanguage();
}

function updateLanguage() {
    const dict = i18n[currentLang];
    
    // 更新網頁標題
    document.title = dict['page_title'];

    // 更新具有 data-i18n 的文字內容
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) el.innerText = dict[key];
    });

    // 更新具有 data-i18n-placeholder 的輸入框提示文字
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (dict[key]) el.placeholder = dict[key];
    });

    // 如果已經進入聊天室，動態更新頂部的房間名稱
    if (document.getElementById('chat-screen').style.display === 'flex') {
        document.getElementById('room-title').innerText = `${dict['room_prefix']}${roomName} | ${userName}`;
    }
}

// ================= 全域變數設定 =================
const GAS_URL = "https://script.google.com/macros/s/AKfycbz8YavltMeAlpL2ySexOpCjZ5aJybsIT-4PGo-EpvYzLWdoZqjqljk0SzhWpvT7fIF3/exec"; // ★請替換為您部署的 GAS Web App URL★

let roomName = "";
let userName = "";
let lastTime = Date.now(); // 只抓取上線後的訊息
let pollTimer; // 使用 setTimeout 的計時器
const renderedMsgIds = new Set(); // 記錄畫面上已經顯示過的訊息 ID，防止重複渲染

// ================= 手機版視窗高度修正 =================
// 處理手機 Safari/Chrome 虛擬鍵盤彈出時的高度變化，防止畫面被推擠閃爍
if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", () => {
        document.documentElement.style.setProperty('--app-height', `${window.visualViewport.height}px`);
        scrollToBottom();
    });
}

// ================= 核心邏輯 =================

// 產生唯一識別碼 (UUID 替代方案)，用於防重複
function generateMsgId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// 1. 初始化：解析 URL 參數 (例如 ?roomA)
function init() {
    // 預設更新一次畫面語系
    updateLanguage();

    const urlParams = new URLSearchParams(window.location.search);
    // 抓取第一個參數的 key，例如 ?roomA 會抓到 "roomA"
    const roomParam = Array.from(urlParams.keys())[0]; 
    
    if (roomParam) {
        const roomInput = document.getElementById('setup-room');
        roomInput.value = roomParam;
        roomInput.classList.add('hidden'); // URL 有帶參數則隱藏輸入框
    }
}

// 2. 加入聊天室
function joinChat() {
    roomName = document.getElementById('setup-room').value.trim();
    userName = document.getElementById('setup-name').value.trim();
    const dict = i18n[currentLang]; // 取得當前語言字典
    
    if (!roomName) return alert(dict['alert_no_room']);

    if (!userName){
        return alert(dict['alert_no_name']);
    }

    // 切換畫面
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('chat-screen').style.display = 'flex';
    document.getElementById('msg-input').focus();
    
    // 使用當前語言字典的 prefix
    document.getElementById('room-title').innerText = `${dict['room_prefix']}${roomName} | ${userName}`;
    
    // 啟動安全輪詢
    pollMessages(); 
}

// 將訊息區滾動到底部
function scrollToBottom() {
    const msgContainer = document.getElementById('messages');
    msgContainer.scrollTop = msgContainer.scrollHeight;
}

// 3. 發送訊息
async function sendMsg() {
    const input = document.getElementById('msg-input');
    const text = input.value.trim();
    if (!text) return;
    
    const msgId = generateMsgId(); // 產生此則訊息的專屬 ID
    renderedMsgIds.add(msgId);     // 記錄 ID，表示已在本地渲染過
    
    input.value = ''; // 立即清空輸入框，提升使用者體驗
    renderMessage(userName, text, true); // 樂觀渲染 (先顯示在自己畫面上)

    // 背景非同步發送給 GAS
    fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ 
            action: 'send', 
            room: roomName, 
            user: userName, 
            text: text, 
            msgId: msgId 
        })
    }).catch(e => console.error("Send error:", e));
}

// 4. 安全輪詢接收訊息 (Short Polling)
async function pollMessages() {
    try {
        const res = await fetch(GAS_URL, {
            method: 'POST',
            // ★ 這裡加上 user: userName，當作心跳傳給後端
            body: JSON.stringify({ action: 'poll', room: roomName, lastTime: lastTime, user: userName })
        });
        const data = await res.json();
        
        // ★ 更新畫面上的在線人數
        if (data.userCount !== undefined) {
            document.getElementById('online-count').innerText = data.userCount;
        }

        if (data.messages && data.messages.length > 0) {
            data.messages.forEach(m => {
                if (!renderedMsgIds.has(m.msgId)) {
                    renderedMsgIds.add(m.msgId); 
                    const isSelf = (m.user === userName);
                    renderMessage(m.user, m.text, isSelf);
                }
                lastTime = Math.max(lastTime, m.time); 
            });
        }
    } catch (e) {
        console.error("Poll error:", e);
    } finally {
        pollTimer = setTimeout(pollMessages, 2500);
    }
}        

// 5. 渲染單筆訊息到畫面上
function renderMessage(sender, text, isSelf) {
    const container = document.getElementById('messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `msg ${isSelf ? 'self' : 'other'}`;
    // 避免 XSS 攻擊，這裡簡單使用 textContent 處理文字 (不解析 HTML)
    const nameDiv = document.createElement('div');
    nameDiv.className = 'msg-name';
    nameDiv.textContent = sender;
    
    const textDiv = document.createElement('div');
    textDiv.textContent = text;

    msgDiv.appendChild(nameDiv);
    msgDiv.appendChild(textDiv);
    
    container.appendChild(msgDiv);
    scrollToBottom();
}

// ================= 事件綁定與啟動 =================

// 綁定 Enter 鍵發送
document.getElementById('msg-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') sendMsg();
});

// 執行初始化
init();

// 註冊 Service Worker 啟用 PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker 註冊成功:', reg.scope))
            .catch(err => console.error('Service Worker 註冊失敗:', err));
    });
}

// 將需要全域呼叫的 function 綁定到 window
window['sendMsg'] = sendMsg;
window['joinChat'] = joinChat;
window['toggleLanguage'] = toggleLanguage;