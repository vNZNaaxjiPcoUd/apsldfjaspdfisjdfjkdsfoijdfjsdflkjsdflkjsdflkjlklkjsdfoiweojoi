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
let currentFileHandle = null; // 新增：用於記錄當前開啟檔案的控制代碼

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

// 新增：透過 File System Access API 開啟檔案，取得寫回權限
async function openDoc() {
    if ('showOpenFilePicker' in window) {
        try {
            const [handle] = await window.showOpenFilePicker({
                types: [{
                    description: 'Markdown 檔案',
                    accept: { 'text/markdown': ['.md', '.txt'] }
                }]
            });
            currentFileHandle = handle;
            const file = await handle.getFile();
            filenameInput.value = file.name;
            const text = await file.text();
            editor.value = text;
            menuDropdown.classList.remove('show');
            if(isPreviewMode) renderMarkdown();
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('開啟檔案失敗:', err);
            }
        }
    } else {
        // 不支援時降級，觸發隱藏的檔案上傳按鈕
        fileInput.click();
    }
}

// 新增：抽出檔案讀取邏輯以供重複使用
async function processFile(file) {
    filenameInput.value = file.name;
    const text = await file.text();
    editor.value = text;
    if (isPreviewMode) renderMarkdown();
}

// 變更：優化原本的 loadDoc 以共用 processFile
function loadDoc(e){
    const file = e.target.files[0];
    if (!file) return;
    
    currentFileHandle = null; 
    processFile(file).then(() => {
        menuDropdown.classList.remove('show');
    });
    fileInput.value = '';
}

// 新增：拖曳相關事件監聽
document.addEventListener('dragover', (e) => {
    // 必須阻止預設行為才能允許檔案被放置在網頁上
    e.preventDefault(); 
});

document.addEventListener('drop', async (e) => {
    // 阻止瀏覽器預設直接開啟檔案而離開網頁的行為
    e.preventDefault(); 
    menuDropdown.classList.remove('show');

    const items = e.dataTransfer.items;
    if (items && items.length > 0) {
        // 只處理拖曳進來的第一個檔案
        const item = items[0];
        if (item.kind === 'file') {
            try {
                // 嘗試獲取檔案系統控制代碼，確保拖曳載入後依然可以按儲存直接覆寫
                if (item.getAsFileSystemHandle) {
                    const handle = await item.getAsFileSystemHandle();
                    if (handle && handle.kind === 'file') {
                        currentFileHandle = handle;
                        const file = await handle.getFile();
                        await processFile(file);
                        return;
                    }
                }
                // 降級處理：無法取得控制代碼時，以一般檔案形式讀取
                const file = item.getAsFile();
                if (file) {
                    currentFileHandle = null; 
                    await processFile(file);
                }
            } catch (err) {
                console.error('讀取拖曳檔案失敗:', err);
            }
        }
    } else if (e.dataTransfer.files.length > 0) {
        // 舊版瀏覽器相容寫法
        const file = e.dataTransfer.files[0];
        currentFileHandle = null;
        await processFile(file);
    }
});

function old_loadDoc(e){
    const file = e.target.files[0];
    if (!file) return;
    
    currentFileHandle = null; // 透過傳統方式開啟無法直接覆寫，清空控制代碼
    filenameInput.value = file.name;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        editor.value = event.target.result;
        menuDropdown.classList.remove('show');
        if(isPreviewMode) renderMarkdown();
    };
    reader.readAsText(file);
    fileInput.value = '';
}
fileInput.addEventListener('change', loadDoc);

// 變更：整合 File System Access API 儲存邏輯
async function saveDoc() {
    const text = editor.value;
    let currentFilename = filenameInput.value.trim() || generateDefaultFilename();
    if (!currentFilename.toLowerCase().endsWith('.md') && !currentFilename.toLowerCase().endsWith('.txt')) {
        currentFilename += '.md';
    }
    filenameInput.value = currentFilename;

    if ('showSaveFilePicker' in window) {
        try {
            if (!currentFileHandle) {
                currentFileHandle = await window.showSaveFilePicker({
                    suggestedName: currentFilename,
                    types: [{
                        description: 'Markdown 檔案',
                        accept: { 'text/markdown': ['.md'] },
                    }]
                });
            }
            const writable = await currentFileHandle.createWritable();
            await writable.write(text);
            await writable.close();
            menuDropdown.classList.remove('show');
            return;
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('寫入檔案失敗，轉為傳統下載:', err);
                fallbackSave(text, currentFilename);
            }
            return;
        }
    }
    
    fallbackSave(text, currentFilename);
}

// 新增：抽出原本的下載儲存邏輯作為 Fallback
function fallbackSave(text, filename) {
    const blob = new Blob([text], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    menuDropdown.classList.remove('show');
}

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

previewBtn.addEventListener('click', markdownPreview);

document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey && e.code === 'KeyM') || (e.metaKey && e.code === 'KeyM') || (e.ctrlKey && e.code === 'KeyE') || (e.metaKey && e.code === 'KeyE')) {
        e.preventDefault();
        markdownPreview();
    } else if ((e.ctrlKey && e.code === 'KeyS') || (e.metaKey && e.code === 'KeyS')) {
        e.preventDefault();
        saveDoc();
    } else if ((e.ctrlKey && e.code === 'KeyO') || (e.metaKey && e.code === 'KeyO')) {
        e.preventDefault();
        openDoc(); // 替換成直接呼叫新 API 開啟檔案
    }
});

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