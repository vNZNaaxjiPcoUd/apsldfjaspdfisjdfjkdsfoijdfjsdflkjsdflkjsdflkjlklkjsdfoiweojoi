window.updateWebManifest = function(inP) {

    const appName = "PWAXXXXXXX";
    const param = inP ? inP: appName;
    // 修正：更新網頁標題應使用 document.title
    const customName = param.split("=")[0]?param.split("=")[0]:param;
    document.title = customName; 
    //const surl  = window.location.origin + "/";
    const surl = new URL('./', window.location.href).href;
    //const currentUrl = window.location.hash.substring(1)?window.location.href+"#"+window.location.hash.substring(1):window.location.href;
    const currentUrl = window.location.href;
    //const myID = customName === appName? appName: appName+"-"+customName;
    const myID = appName;
    const baseUrl = currentUrl;
    


    const myManifest = {
        "id": myID,
        "name": customName,
        "short_name": customName,
        "description": appName+" "+customName,
        "display": "standalone",
        "theme_color": "#2196F3",
        "background_color": "#049706",
        "start_url": currentUrl, 
        "scope": surl,
        "icons": [
            { 
              "src": new URL('icon-192.png', baseUrl).href, 
              "sizes": "192x192", 
              "type": "image/png" 
            },
            { 
              "src": new URL('icon-512.png', baseUrl).href, 
              "sizes": "512x512", 
              "type": "image/png" 
            }
        ],
        "orientation": "portrait"
    };

    const stringManifest = JSON.stringify(myManifest);
    const manifestDataURI = 'data:application/json;charset=utf-8,' + encodeURIComponent(stringManifest);
    
    // 關鍵修改：尋找原有的靜態 manifest 標籤
    let link = document.querySelector('link[rel="manifest"]');
    
    if (!link) {
        // 只有在防禦性狀況下（找不到靜態標籤）才建立新的
        link = document.createElement('link');
        link.rel = 'manifest';
        document.head.appendChild(link);
    }
    
    // 替換為動態生成的 Data URI
    link.href = manifestDataURI;
};

(function() {
    // 取得？或#後的字元當名字。
    const bParam = window.location.search.substring(1);
    if(bParam)
        window.updateWebManifest(bParam);
    else{
        const bParam = window.location.hash.substring(1);
        if(bParam)
            window.updateWebManifest(bParam);
        else
            window.updateWebManifest("");
    }
})();