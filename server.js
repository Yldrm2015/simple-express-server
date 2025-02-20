const express = require('express');
const bodyParser = require('body-parser');

const app = express();

// Allow all requests from all domains & localhost
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "POST, GET");
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// ✅ **ANA SAYFA ROUTE (BOTD TEST LİNKİ EKLENDİ)**
app.get('/', (req, res) => {
    res.send('✅ Server is running! You can test BotD at <a href="/botd-test">/botd-test</a>');
});

// ✅ **BOTD TEST ROUTE (IP, Tarayıcı ve Gizli Mod Bilgileriyle)**
app.get('/botd-test', async (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bot Detection</title>
        </head>
        <body>
            <h1>Bot Detection Test</h1>
            <p id="result">Lütfen bekleyin...</p>
            <p id="browser-info"><strong>📌 Tarayıcı Bilgisi:</strong> Yükleniyor...</p>
            <p id="ip-info"><strong>🌍 IP Adresi:</strong> Yükleniyor...</p>
            <p id="incognito-info"><strong>🔒 Gizli Mod:</strong> Yükleniyor...</p>

            <script type="module">
                async function detectInfo() {
                    try {
                        // ✅ Tarayıcı bilgilerini alalım
                        let browserInfo = navigator.userAgent;
                        if (navigator.userAgentData) {
                            const uaData = await navigator.userAgentData.getHighEntropyValues(["platform", "platformVersion", "architecture", "model"]);
                            browserInfo = \`${navigator.userAgentData.platform} - ${uaData.platformVersion} (${uaData.architecture || "Unknown"})\`;
                        }
                        document.getElementById("browser-info").innerText = '📌 Tarayıcı Bilgisi: ' + browserInfo;

                        // ✅ IP adresini almak için alternatif API kullanalım
                        try {
                            const ipResponse = await fetch('https://api64.ipify.org?format=json');
                            const ipData = await ipResponse.json();
                            document.getElementById("ip-info").innerText = '🌍 IP Adresi: ' + ipData.ip;
                        } catch (ipError) {
                            document.getElementById("ip-info").innerText = '⚠️ IP Adresi Alınamadı!';
                        }

                        // ✅ **Gizli mod kontrolü (Farklı yöntemlerle)**
                        async function isIncognito() {
                            return new Promise(resolve => {
                                let fs = window.RequestFileSystem || window.webkitRequestFileSystem;
                                if (!fs) {
                                    resolve(false);  // Tarayıcı desteklemiyorsa normal modda sayarız
                                } else {
                                    fs(window.TEMPORARY, 100, () => resolve(false), () => resolve(true));
                                }
                            });
                        }

                        async function detectIncognito() {
                            let incognito = false;

                            // Yöntem 1: Storage kontrolü
                            if (navigator.storage && navigator.storage.estimate) {
                                const { quota } = await navigator.storage.estimate();
                                if (quota < 120000000) { // 120MB'tan az ise gizli mod olabilir
                                    incognito = true;
                                }
                            }

                            // Yöntem 2: IndexedDB Kontrolü
                            try {
                                let db = indexedDB.open("test");
                                db.onerror = () => { incognito = true; };
                                db.onsuccess = () => { incognito = false; };
                            } catch (e) {
                                incognito = true;
                            }

                            // Yöntem 3: FileSystem API ile kontrol
                            const fsCheck = await isIncognito();
                            if (fsCheck) incognito = true;

                            document.getElementById("incognito-info").innerText = '🔒 Gizli Mod: ' + (incognito ? 'Evet' : 'Hayır');
                        }

                        await detectIncognito();

                        // ✅ **BotD ile bot tespiti**
                        try {
                            const { load } = await import('https://cdn.jsdelivr.net/npm/@fingerprintjs/botd@latest/+esm');
                            const botd = await load();
                            const result = await botd.detect();
                            document.getElementById("result").innerText = '✅ Bot Detected: ' + result.bot;
                        } catch (botdError) {
                            document.getElementById("result").innerText = "⚠️ BotD çalıştırılırken hata oluştu!";
                        }
                    } catch (error) {
                        console.error("❌ Genel hata:", error);
                    }
                }
                detectInfo();
            </script>
        </body>
        </html>
    `);
});

// ✅ **PORT AYARI GÜNCELLENDİ**
const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});
