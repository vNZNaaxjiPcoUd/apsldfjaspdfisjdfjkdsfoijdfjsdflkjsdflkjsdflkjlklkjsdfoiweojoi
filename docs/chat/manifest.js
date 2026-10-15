
        window.updateWebManifest = function(customName) {
            window.title = "聊天🌿";
            const surl  = window.location.origin + "/";
            const currentUrl = window.location.href;
            const startURL = new URL(`./${customName ? '?' + customName : ''}`, currentUrl).href;

            const myManifest = {
                "id": currentUrl,
                "name": customName || "聊天🌿",
                "short_name": customName || "聊天🌿",
                "description": "聊天🌿",
                "display": "standalone",
                "theme_color": "#2196F3",
                "background_color": "#F0F0F0",
                "start_url": startURL, 
                "scope": surl,
                "icons": [
                    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
                    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png" }
                ],
                "orientation": "portrait"
            };

            const stringManifest = JSON.stringify(myManifest);
            const manifestDataURI = 'data:application/json;charset=utf-8,' + encodeURIComponent(stringManifest);
            
            let link = document.getElementById('dynamic-manifest');
            if (!link) {
                link = document.createElement('link');
                link.id = 'dynamic-manifest';
                link.rel = 'manifest';
                document.head.appendChild(link);
            }
            link.href = manifestDataURI;
        };

        (function() {
            const currentUrl = window.location.href;
            let dbId = "";
            if (currentUrl.includes('id=')) dbId = currentUrl.split('id=')[1].split('&')[0];
            else if (currentUrl.includes('?')) dbId = currentUrl.split('?')[1].split('&')[0];
            const manifestName = dbId ? dbId : "聊天🌿";

            window.updateWebManifest(manifestName);
        })();