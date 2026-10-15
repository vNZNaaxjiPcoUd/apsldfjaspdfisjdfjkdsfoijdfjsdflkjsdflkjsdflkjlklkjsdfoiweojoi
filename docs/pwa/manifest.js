
        window.updateWebManifest = function(customName) {
            window.title = "PWAXXXXXXXX";
            const surl  = window.location.origin + "/";
            const currentUrl = window.location.href;

            const myManifest = {
                "id": currentUrl,
                "name": customName || "PWAXXXXXXXX",
                "short_name": customName || "PWAXXXXXXXX",
                "description": "PWAXXXXXXXX",
                "display": "standalone",
                "theme_color": "#2196F3",
                "background_color": "#F0F0F0",
                "start_url": currentUrl, 
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
            const paramsFromURL = new URLSearchParams(window.location.search);
            const bParam = paramsFromURL.get('book');
            window.updateWebManifest(bParam);
        })();