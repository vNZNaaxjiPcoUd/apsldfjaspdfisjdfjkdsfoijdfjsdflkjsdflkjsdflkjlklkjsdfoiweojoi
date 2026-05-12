

// need <script src="https://h.jwint.net/static/crypto-js.min.js"></script>
// usage:
// setDbName(dbId);
// setDbKey(pwd);
//
// let res = await getFromAPI();
// let rawData = getContent(); 
// if (res && res.status === "success" 
// if (res && res.message === "Key not found") 
// if (res && res.status === "error") 
// 
// setContent(jsonStr); 
// const res = await saveToAPI(); 
// if (res && res.message && res.message.includes("不匹配")) 
// if (res && res.status === "success")


// 加密

function encData(content, key){
    if (!key || key.trim() === "") { console.log("無密鑰", 'error'); return false; }
    if (!content || content.trim() === "") { console.log("無內容", 'error'); return false; }
    let encryptedContent;
    try {
        const keyHash = key;
        const encrypted = CryptoJS.AES.encrypt(content, keyHash).toString();
        encryptedContent = encrypted;
        return encryptedContent;
    } catch (e) { 
        console.log("加密失敗: " + e.message, 'error'); 
        return "";
    }
    return encryptedContent;
}



// 按鈕事件 - 解密
function decData(key, encryptedText){
        let ret = { 
            status:"error",
            message:"",
            value:""
        }
        if (!key || key.trim() === "") { alert("請輸入密鑰", 'error'); return false; }
        //console.log("開始解密...",encryptedText);
        if (!encryptedText) { console.log("無密文內容", 'error'); return false; }

        try {
            const keyHash = key;
            const bytes = CryptoJS.AES.decrypt(encryptedText, keyHash);
            const originalText = bytes.toString(CryptoJS.enc.Utf8);
            ret.value = originalText;
            ret.status = "success";
        } catch (e) {
            ret.message = e.message;
            ret.status = "error";
        
            console.log("解密失敗: " + e.message, 'error');
        }
        return ret;
}

// Handle API
// --- 設定區 ---
const API_URL = "https://script.google.com/macros/s/AKfycbzIAuTrBD3eI7uusVneoYF6P-f2RtqVLT2yrpHbWpghCTsfhGh6JdcMgKx2b6a3K7HX/exec"; 
const SALT = "Nxk98ahIR50AtZBiLxowpmhaWXQCg8E";

function generateToken() {
    const kNow = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    let name = getDbName();
    let APIKey = getAPIKey();
    const rawString = APIKey + SALT + kNow + name;
    return CryptoJS.SHA512(rawString).toString();
} 

// API 
let dbName = "";

function setDbName(name){
    dbName = name;
}

function getDbName(){
    if(dbName === "") {
        dbName = "IR50AtZBiLxowpmhaW" ;
        console.log("no dbName, initialize to:.....");
    }
    return "toDo-"+dbName;  
}

let dbKey = "";

function hashKey(rawKey){
    return CryptoJS.SHA512(rawKey+"Sy8ai12PJ4EEX9DmHWabqZRCMJEInt1pQh").toString();
}

function setDbKey(key){
    dbKey = key;
}

function getDbKey(){
    if(dbKey === "") {
        dbKey = "EEX9DmHWabqZRCMJEInt1pQ";
        console.log("no dbKey, initialize to:.....");
    }
    return hashKey(dbKey);  
}
 
async function callApi(params) {
    //console.log("準備呼叫 API，參數:", params);
    const token = generateToken();

    // 組合 URL 參數
    const queryString = new URLSearchParams({
        ...params,
        token: token
    }).toString();
    //console.log("生成的 URL 參數:", queryString);
    const finalUrl = `${API_URL}?${queryString}`;
    //console.log("最終 API URL:", finalUrl);
    try {
        const response = await fetch(finalUrl);
        //console.log("API 請求結果:",response);
        const result = await response.json();
        //console.log("API 回應解析後的結果:", result);
        return result;
    } catch (error) {
        console.error("API 請求失敗:");
        console.log(error);
        confirm("網路請求失敗，是否重試？");
        return { status: "error", message: "網路請求失敗" };
    }
}

async function callApiPost(params) {
    const token = generateToken();
    var ret = null;
      await fetch(API_URL, {
          method: "POST", 
          redirect: 'follow', 
          body: JSON.stringify({ ...params, token })
      })
      .then(res => res.json())
      .then(data => {
            //console.log(data);
            ret = data;
          if(data.status === "success") {
            //console.log(`上傳成功！`);
          } else {
            console.log( "上傳失敗: ");
            console.log(data);
          }
      })
      .catch(error => {
          console.log("錯誤: ");
          console.log(error);
          ret = { status: "error", message: "網路請求失敗" };
      });
      //console.log("API POST 請求已發出，等待回應...");
      //console.log(ret);
      //console.log("API POST 請求已發出，等待回應...",ret);
      return ret;

}

// 1. 儲存資料 (Save)
async function doSave(key, inV, tag ) {
    const newV = {
        action: "save",
        key: key,
        value: inV,
        tag: tag
    };
    const res = await callApiPost(newV);
    let newRes = null;
    if(res.status === "success"){
        //console.log(`File "${res.key}" doSave successfully!`, res);
        newRes = { status: res.status, message: res.message, key: res.key, value: res.value, tag: res.tag };
    } else {
        console.log(`Error saving file: ${res.message}`);
        newRes = { status: res.status, message: res.message, key: null, value: null, tag: null };
    }   
    return newRes;
}

// 2. 讀取單一資料 (Get)
async function doGet(key) {
    const res = await callApi({
        action: "get",
        key: key,
        value: "123456",
        tag:"AAAAAA"
    });
    //console.log("doGet 結果:", res);
    let newRes = null;
    if(res.status === "success"){
        //console.log(`File "${res.key}" doGet successfully!`, res);
        newRes = { status: res.status, message: res.message, key: res.key, value: res.value, tag: res.tag };
    } else {
        console.log("讀取資料失敗:", res.message);
        newRes = { status: res.status, message: res.message, key: null, value: null, tag: null };
    }

    return newRes;
}


async function TestAllApi() {
    await doSave("user_001", "這是我的測試內容" + new Date().toLocaleString());
    await doGet("user_001");
}

let tagNow;
function setTag(T){
    tagNow = T;
    //console.log("Tag updated to:", bookData.tag);
}
function getTag(){
    //console.log("Current tag:", bookData.tag);
    return tagNow;
}

function updateStatus(msg,type){
    console.log(type,":",msg);
}

let nowContent = "";
function setContent(content){
    nowContent = content;
}
function getContent(){
    return nowContent;
}


async function saveToAPI() {
    let key = getDbKey();
    let res;
    let content = getContent();
    let dbName = getDbName();

    if (!content.trim()) { 
        console.log("筆記無內容可上傳", 'error'); 
        res = { status: "error", message: "沒有內容" }; 
    } else {
        // 1. 取得加密後的結果，並存入 encContent 變數
        let encContent = encData(content, key); 
        
        if(!encContent) {
            updateStatus(`加密失敗，請確認 AES 密鑰是否正確`, 'error');
            res = { status: "error", message: "加密失敗" };
        } else {
            //updateStatus("加密成功");

            // 2. 這裡必須上傳 encContent (密文) ！！！
            res = await doSave(dbName, encContent, getTag());
            
            if (res.status === "success") {
                //updateStatus(`已上傳 ${dbName}`, 'success');
                setTag(res.tag);
            } else {
                const regex = new RegExp(`Tag mismatch!`, 's');
                const match = res.message.match(regex);
                if(match) {
                    updateStatus(`上傳失敗: 目前資料不匹配，可能是因為在其他裝置或分頁修改了內容。請重新載入後再試一次。`, 'error');
                    res = { status: "error", message: "目前資料和雲端不匹配，可能是因為在其他裝置或分頁修改了內容。請保存當前資料，重新載入後再試一次。" };
                } else {
                    updateStatus(`上傳失敗: ${res.message}`, 'error');
                }
            }
        }
    }
    return res;
}

function fakeGet(){

    let originalText = `<<<<BLOCK_START_v2>>>>
RGVtbw==
<<<<TITLE_END>>>>
W3RvIGxpbmtdKCNoaSkKCgojIGxpc3QKKioqVG9vbCoqKsKgW0NhbGN1bGF0ZV0oaHR0cHM6Ly9jYWwuandpbnQubmV0LynCoFtDYWxlbmRhcl0oaHR0cHM6Ly9jYWxlbmRhci5nb29nbGUuY29tL2NhbGVuZGFyL3UvMC9yKcKgW0NoYXRdKGh0dHBzOi8vbWFpbC5nb29nbGUuY29tL2NoYXQvdS8wLyNjaGF0L3NwYWNlL0FBQUF4SUxpT1dzKcKgW0Ruc10oaHR0cHM6Ly9hY2NvdW50LnNxdWFyZXNwYWNlLmNvbS9kb21haW5zL21hbmFnZWQvandpbnQubmV0KcKgW0RvY10oaHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20vZG9jdW1lbnQvZC8xQzBPMjE2bFJFTG9tdmRDVlJGRjZwaXJqSGs0bks0NkFEZE14bmI3b0NsSS8pwqBbaW1lXShodHRwczovL3d3dy5nb29nbGUuY29tL2lucHV0dG9vbHMvdHJ5LynCoAoK
<<<<BLOCK_END>>>>
<<<<BLOCK_START_v2>>>>
NGNjY2N4eHh4
<<<<TITLE_END>>>>
MTbnqK7kurrmoLzoqqrmmI4gTUJUSQo9PT09PT09PT09PQpb5ris6Kmm57ay56uZXShodHRwczovL3d3dy4xNnBlcnNvbmFsaXRpZXMuY29tL3R3KQoKW1Byb2ZpbGVdKGh0dHBzOi8vd3d3LjE2cGVyc29uYWxpdGllcy5jb20vY291bnRyeS1wcm9maWxlcy90YWl3YW4pCgpbRElTQyDlgIvmgKddKGh0dHBzOi8vaC5qd2ludC5uZXQvRElTQ+WAi+aAp+WIhuaekCkKCiMjIDE25Z6L5Lq65qC855qE5Zub5YCL57at5bqmOgoKMS4gKirog73ph4/kvobmupAoRS9JKToqKgogICAqICoq5aSW5ZCRKEUgLSBFeHRyYXZlcnNpb24pOioqwqDlgr7lkJHmlrzlvp7lpJbpg6jkuJbnlYzvvIzlpoLnpL7kuqTmtLvli5XjgIHkurrpmpvkupLli5XkuK3njbLlvpfog73ph4/jgIIKICAgKiAqKuWFp+WQkShJIC0gSW50cm92ZXJzaW9uKToqKsKg5YK+5ZCR5pa85b6e542o6JmV44CB5Y+N5oCd44CB5YWn6YOo5LiW55WM5Lit542y5b6X6IO96YeP44CCCjIuICoq6KqN55+l5pa55byPKFMvTik6KioKICAgKiAqKuWvpuaEnyhTIC0gU2Vuc2luZyk6KirCoOWCvuWQkeaWvOmXnOazqOWFt+mrlOOAgeWvpumam+eahOS6i+eJqe+8jOazqOmHjee0sOevgOWSjOe2k+mpl+OAggogICAqICoq55u06Ka6KE4gLSBJbnR1aXRpb24pOioqwqDlgr7lkJHmlrzpl5zms6jmir3osaHmpoLlv7XjgIHlj6/og73mgKfjgIHmnKrkvobotqjli6LlkozmlbTpq5TjgIIKMy4gKirmsbrnrZbmlrnlvI8oVC9GKToqKgogICAqICoq5oCd6ICDKFQgLSBUaGlua2luZyk6KirCoOWCvuWQkeaWvOS9v+eUqOmCj+i8r+OAgeWuouingOWIhuaekOWSjOWIpOaWt+S+huWBmuaxuuWumuOAggogICAqICoq5oOF5oSfKEYgLSBGZWVsaW5nKToqKsKg5YK+5ZCR5pa86ICD5oWu5YCL5Lq65YO55YC86KeA44CB5oOF5oSf5ZKM5Lq66Zqb6Zec5L+C5L6G5YGa5rG65a6a44CCCjQuICoq55Sf5rS75oWL5bqmKEovUCk6KioKICAgKiAqKuWIpOaWtyhKIC0gSnVkZ2luZyk6KirCoOWCvuWQkeaWvOacieioiOWKg+OAgeacieaineeQhuOAgeWWnOatoeaOp+WItuWSjOe1hOe5lOeUn+a0u+OAggogICAqICoq5oSf55+lKFAgLSBQZXJjZWl2aW5nKToqKsKg5YK+5ZCR5pa86Zqo5oCn44CB5b2I5oCn44CB5Zac5q2h5L+d5oyB6ZaL5pS+5ZKM5o6i57Si5paw5LqL54mp44CCCgoxNueoruS6uuagvOmhnuWeizoKCuWwh+S7peS4iuWbm+WAi+e2reW6pue1hOWQiOi1t+S+hu+8jOWwseacg+eUoueUnzE256iu5LiN5ZCM55qETUJUSeS6uuagvOmhnuWei++8jOavj+eorumhnuWei+mDveacieWFtueNqOeJueeahOaAp+agvOeJueizquOAgeWEquWLouWSjOWKo+WLouOAggoKfCDkurrmoLzpoZ7lnosgfCDnuK7lr6sgICB8IOS4u+imgeeJueizqiAgICAgICAgICAgICAgICAgICAgICAgICAgICB8CnwgLS0tLSB8IC0tLS0gfCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHwKfCBJU1RKIHwg54mpICAgIHwg5YuZ5a+m44CB5pyJ5qKd55CG44CB5rOo6YeN57Sw56+A44CB55uu5qiZ5bCO5ZCR44CB5Zac5q2h6KiI55Wr5ZKM57WE57mUICAgICAgICB8CnwgSVNGSiB8IOWuiOihm+iAhSAgfCDmuqvlkozjgIHmnInlkIznkIblv4PjgIHmnInosqzku7vmhJ/jgIHms6jph43ntLDnr4DjgIHllpzmraHluavliqnku5bkurogICAgICAgIHwKfCBJTkZKIHwg5o+Q5YCh6ICFICB8IOeQhuaDs+S4u+e+qeOAgeacieWQjOeQhuW/g+OAgeaciea0nuWvn+WKm+OAgeazqOmHjeWDueWAvOingOOAgeWWnOatoei/veaxguaEj+e+qeWSjOebruaomSAgfAp8IElOVEogfCDlu7rnr4nluKsgIHwg542o56uL44CB5pyJ6YKP6Lyv44CB5pyJ6YGg6KaL44CB5rOo6YeN5pWI546H44CB5Zac5q2h5YiG5p6Q5ZKM6Kej5rG65ZWP6aGMICAgICAgIHwKfCBJU1RQIHwg5aSn5birICAgfCDlr6bpmpvjgIHlhrfpnZzjgIHllpzmraHop6PmsbrllY/poYzjgIHms6jph43ntLDnr4DjgIHllpzmraHli5XmiYvmk43kvZwgICAgICAgIHwKfCBJU0ZQIHwg5o6i6Zqq5a62ICB8IOmaqOWSjOOAgeacieWJtemAoOWKm+OAgeazqOmHjeaEn+WPl+OAgeWWnOatoeS6q+WPl+eVtuS4i+OAgei/veaxguiHqueUsSAgICAgICAgfAp8IElORlAgfCDoqr/lgZzogIUgIHwg55CG5oOz5Li7576p44CB5pyJ5ZCM55CG5b+D44CB5pyJ5Ym15oSP44CB5rOo6YeN5YO55YC86KeA44CB5Zac5q2h6L+95rGC5YCL5Lq65oiQ6ZW35ZKM5oSP576pIHwKfCBJTlRQIHwg6YKP6Lyv5a245a62IHwg542o56uL44CB5pyJ6YKP6Lyv44CB5pyJ5Ym16YCg5Yqb44CB5rOo6YeN5oCd6ICD44CB5Zac5q2h5o6i57Si5paw5oOz5rOVICAgICAgICB8CnwgRVNUUCB8IOS8gealreWutiAgfCDlr6bpmpvjgIHmnInooYzli5XlipvjgIHllpzmraHlhpLpmqrjgIHms6jph43ntZDmnpzjgIHllpzmraHop6PmsbrllY/poYwgICAgICAgIHwKfCBFU0ZQIHwg6KGo5ryU6ICFICB8IOa0u+a9keOAgeWkluWQkeOAgeWWnOatoeekvuS6pOOAgeazqOmHjeaEn+WPl+OAgeWWnOatoeS6q+WPl+eUn+a0uyAgICAgICAgICB8CnwgRU5GUCB8IOertumBuOiAhSAgfCDnhrHmg4XjgIHmnInlibXpgKDlipvjgIHmnInlkIznkIblv4PjgIHllpzmraHnpL7kuqTjgIHov73msYLmlrDpq5TpqZcgICAgICAgICB8CnwgRU5USiB8IOaMh+aPruWumCAgfCDpoJjlsI7lipvlvLfjgIHmnInnrZbnlaXjgIHms6jph43mlYjnjofjgIHllpzmraHopo/lioPlkozntYTnuZTjgIHov73msYLmiJDlip8gICAgICB8CnwgRVNUSiB8IOWft+ihjOWumCAgfCDli5nlr6bjgIHmnInmop3nkIbjgIHms6jph43ntLDnr4DjgIHllpzmraHoqIjnlavlkozntYTnuZTjgIHov73msYLmlYjnjocgICAgICAgIHwKfCBFU0ZKIHwg5Z+35pS/5a6YICB8IOeGseaDheOAgeWkluWQkeOAgeWWnOatoeekvuS6pOOAgeazqOmHjeS6uumam+mXnOS/guOAgeWWnOatoeW5q+WKqeS7luS6uiAgICAgICAgfAp8IEVORkogfCDmlZnlsI7ogIUgIHwg6a2F5Yqb44CB5pyJ5ZCM55CG5b+D44CB5pyJ5rSe5a+f5Yqb44CB5rOo6YeN5Lq66Zqb6Zec5L+C44CB5Zac5q2h5r+A5Yu15ZKM5byV5bCO5LuW5Lq6ICAgfAp8IEVOVFAgfCDovq/oq5blrrYgIHwg6IGw5piO44CB5pyJ5Ym15oSP44CB5Zac5q2h6L6v6KuW44CB5rOo6YeN5oCd6ICD44CB5Zac5q2h5o6i57Si5paw5oOz5rOVICAgICAgICB8CgoK
<<<<BLOCK_END>>>>
<<<<BLOCK_START_v2>>>>
Mw==
<<<<TITLE_END>>>>
IyBIaSAKYWFhYWFhYWFhCiMjIFRoaXMgaXMgdHQKYWFhYWFhYWFhCiMjIyBUVCBmb3IgdGVzdAphYWFhYWFhYWEKIyMjIyBUZXN0IHRoZSBtYXJrZG93bgphYWFhYWFhYWEKCipBbHNvKiAqKmhlcmUqKiAqKipzaG93KioqIHNwZWNpYWwgY2hhci4KCiMjIyMgbGluawpbbm90ZV0oaHR0cHM6Ly9oLmp3aW50Lm5ldC92cF9ub3RlKQoKIyMjI2hlcmUgaXMgc2VxdWVuY2UuCjEuIGEKMi4gYgozLiBbIF0gYwo0LiBbeF0gZAoKIyMjIyBoZXJlIGlzIHRhYmxlCnwgQSB8IEFBIHwgQUFBIHwKfC18LXwtfAp8IGEgfCBhIHwgYSB8CnxifGJ8YnwKCgp8IOW3puWwjem9iiB8IOe9ruS4reWwjem9iiB8IOWPs+Wwjem9iiB8CnwgOi0tLSB8IDotLS06IHwgLS0tOiB8Cnwg6Z2g5bemIHwg5Zyo5Lit6ZaTIHwg6Z2g5Y+zIHwKfCDlhaflrrnovIPplbfmmYLmmI7poa8gfCDkuK0gfCAkMTAwIHwKCgojIyMjIFBpY3R1cmUKIVtwaWNdKGh0dHBzOi8vc2hhcmUuandpbnQubmV0L2RvYy9kaXNjMS5qcGVnKQ==
<<<<BLOCK_END>>>>`;
    if (originalText) {
            setContent(originalText);
    }
    let res = { status: "success", message:"Fake read",value:originalText};
    return res;
}


async function getFromAPI() {
    //return fakeGet();
    let dbName=getDbName();
    let res = await doGet(dbName);
    let encryptedContentValue="";
    if (res.status === "success" && res.value) {
        setTag(res.tag);

        encryptedContentValue = res.value;
        //updateStatus("已將 API 讀取的內容放入密文區:", encryptedContentValue);

        let key = getDbKey();
        res = await decData(key, encryptedContentValue);
        if (res.status !== "success") { // 改成 res
            alert("解密失敗！密碼錯誤或雲端資料非加密格式。"); // 加上 alert 讓提示更明顯
            updateStatus(`解密失敗，請確認 AES 密鑰是否正確`, 'error');
        }else{
            //updateStatus(`解密成功，內容已載入`, 'success');
            setContent(res.value);
        }
    } else {
        updateStatus(`API 讀取失敗: ${res.message}`, 'error');
    }
    return res;
}

// Get API Key,  define in API server, for token generator
function getAPIKey() {
    return "3d46431496b772599fcf959885ccdea155508431ed67819db3e41079fa2d8a3cd547f596ec7c9d0b5621d6c39549297ae90ba14c663d738ec07194ad9ddeab82";
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function getAESLocalKey(){
    localEncryptedKey = "U2FsdGVkX1/lGcDQ36P9KIOD8BcgdElZEuiOcAF2TWq32DYnLlAIAYtSIRDjRzT5t3L6MqEfBXRaKoz6R8zOTnkQM/kET6l/Q0btRp1dzi4=";
    const localKey = CryptoJS.AES.decrypt(localEncryptedKey, "QB1xLBSkU3GqjKBtq8a7sQh2Zt").toString(CryptoJS.enc.Utf8);
    return localKey;
}

async function testGetSave(){
    setContent("abcdefg");
    setDbKey("hello");
    setDbName("myt1");
    let res;
    res = await saveToAPI();
    await sleep(1000);
    res = await getFromAPI();
    updateStatus(getContent(),"success");
}

