
const menuBtn = document.getElementById('menuBtn');
const menuDropdown = document.getElementById('menuDropdown');
const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const fileInput = document.getElementById('file-input');
const saveBtn = document.getElementById('saveBtn');
const fontUpBtn = document.getElementById('fontUpBtn');
const fontDownBtn = document.getElementById('fontDownBtn');
const previewBtn = document.getElementById('previewBtn');
const filenameInput = document.getElementById('filenameInput');
const newWin = document.getElementById('newWin');

let currentFontSize = 16;
let isPreviewMode = false;

function generateDefaultFilename() {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `Note_${yy}${mm}${dd}${hh}${min}${ss}.md`;
}

filenameInput.value = generateDefaultFilename();

menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menuDropdown.classList.toggle('show');
});

document.addEventListener('click', (e) => {
    if (!menuDropdown.contains(e.target) && e.target !== menuBtn) {
        menuDropdown.classList.remove('show');
    }
});

function loadDoc(e){
    const file = e.target.files[0];
    if (!file) return;
    
    // 取得檔案名稱，並將其賦值給頂部的檔名輸入框
    filenameInput.value = file.name;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        editor.value = event.target.result;
        menuDropdown.classList.remove('show');
        if(isPreviewMode) renderMarkdown();
    };
    reader.readAsText(file);
    
    // 清空 input 值，確保下次選取同一個檔案時依然能觸發 change 事件
    fileInput.value = '';
}

// 修正：移除括號與未定義變數 e
fileInput.addEventListener('change', loadDoc);

function saveDoc(){
    const text = editor.value;
    const blob = new Blob([text], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    
    let currentFilename = filenameInput.value.trim();
    if (!currentFilename) {
        currentFilename = generateDefaultFilename();
    }
    if (!currentFilename.toLowerCase().endsWith('.md') && !currentFilename.toLowerCase().endsWith('.txt')) {
        currentFilename += '.md';
    }
    
    filenameInput.value = currentFilename;
    a.download = currentFilename;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    menuDropdown.classList.remove('show');
}

// 修正：移除括號
saveBtn.addEventListener('click', saveDoc);

newWin.addEventListener('click', () => {
    window.open('./index.html', '_blank', 'noopener,noreferrer');
});

fontUpBtn.addEventListener('click', () => {
    currentFontSize += 2;
    updateFontSize();
});

fontDownBtn.addEventListener('click', () => {
    if (currentFontSize > 12) {
        currentFontSize -= 2;
        updateFontSize();
    }
});

function updateFontSize() {
    editor.style.fontSize = currentFontSize + 'px';
    preview.style.fontSize = currentFontSize + 'px';
    menuDropdown.classList.remove('show');
}

function renderMarkdown() {
    if (typeof marked !== 'undefined') {
        preview.innerHTML = marked.parse(editor.value);
    } else {
        preview.innerHTML = '<p style="color:red;">無法載入 Markdown 解析器，請檢查網路連線。</p>';
    }
}


function markdownPreview(){
    isPreviewMode = !isPreviewMode;
    if (isPreviewMode) {
        renderMarkdown();
        editor.style.display = 'none';
        preview.style.display = 'block';
        previewBtn.innerText = '📝 切換回編輯模式';
    } else {
        editor.style.display = 'block';
        preview.style.display = 'none';
        previewBtn.innerText = '👁️ 預覽 Markdown';
    }
    menuDropdown.classList.remove('show');
}

// 修正：移除括號
previewBtn.addEventListener('click', markdownPreview);

document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey && e.code === 'KeyM') || (e.metaKey && e.code === 'KeyM') || (e.ctrlKey && e.code === 'KeyE') || (e.metaKey && e.code === 'KeyE')) {
        e.preventDefault();
        markdownPreview();
        
    } else if ((e.ctrlKey && e.code === 'KeyS') || (e.metaKey && e.code === 'KeyS')) {
        e.preventDefault();
        saveDoc();
    }else if ((e.ctrlKey && e.code === 'KeyO') || (e.metaKey && e.code === 'KeyO')) {
        e.preventDefault();
        // 觸發隱藏的檔案上傳按鈕
        fileInput.click();
    }
});
// Service Worker 保留原邏輯，但需注意 PWA 實務上的作用域限制
/*if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        const swCode = `
            const CACHE_NAME = 'markdown-pwa-v1';
            const urlsToCache = [
                location.href,
                'https://cdn.jsdelivr.net/npm/marked/marked.min.js'
            ];
            self.addEventListener('install', event => {
                event.waitUntil(
                    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
                );
            });
            self.addEventListener('fetch', event => {
                event.respondWith(
                    caches.match(event.request).then(response => {
                        return response || fetch(event.request);
                    })
                );
            });
        `;
        const blob = new Blob([swCode], { type: 'application/javascript' });
        navigator.serviceWorker.register(URL.createObjectURL(blob)).catch(err => {
            console.log('Service Worker blob 註冊失敗:', err);
        });
    });
}*/

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('ServiceWorker 註冊成功，範圍為: ', registration.scope);
            })
            .catch(err => {
                console.log('ServiceWorker 註冊失敗: ', err);
            });
    });
}