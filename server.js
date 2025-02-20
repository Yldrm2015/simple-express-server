const express = require('express');
const bodyParser = require('body-parser');

const app = express(); // ✅ Express uygulaması başlatıldı

// 🌍 **CORS İzinleri (Güvenlik Ayarı)**
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "POST, GET");
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// ✅ **ANA SAYFA ROUTE**
app.get('/', (req, res) => {
    res.send('✅ Server is running! You can test BotD at <a href="/botd-test">/botd-test</a>');
});

// ✅ **BOTD TEST ROUTE (Senin IP, Tarayıcı ve Gizli Mod Bilgilerini Gösterir)**
app.get('/botd-test', async (req, res) => {
    // **IP Adresi Çekme (Gerçek Kullanıcı IP'sini Alır)**
    const ipList = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const ipAddress = Array.isArray(ipList) ? ipList[0] : ipList; // Gerçek IP Adresini Seç

    // **Tarayıcı Bilgisini Çekme**
    const userAgent = req.headers['user-agent'];

    res.send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bot Detection</title>
        </head>
        <body>
            <h1>🌍 Bot Detection Test</h1>
            <p><strong>✅ Senin IP Adresin:</strong> ${ipAddress}</p>
            <p><strong>✅ Tarayıcı Bilgin:</strong> ${userAgent}</p>
            <p id="incognito-status"><strong>✅ Gizli Mod:</strong> Kontrol ediliyor...</p>
            <p id="headless-status"><strong>✅ Headless Mode:</strong> Kontrol ediliyor...</p>

            <script type="module">
                import { load } from 'https://cdn.jsdelivr.net/npm/@fingerprintjs/botd@latest/+esm';

                async function detectBot() {
                    try {
                        const botd = await load();
                        const result = await botd.detect();
                        document.getElementById("result").innerText = '✅ Bot Detected: ' + result.bot;
                    } catch (error) {
                        console.error("❌ BotD hata verdi:", error);
                        document.getElementById("result").innerText = "⚠️ BotD çalıştırılırken hata oluştu!";
                    }
                }
                detectBot();

                // 🔍 **Gizli Mod (Incognito) Kontrolü**
                function checkIncognitoMode() {
                    const fs = window.RequestFileSystem || window.webkitRequestFileSystem;
                    if (!fs) {
                        document.getElementById("incognito-status").innerText = "✅ Gizli Mod: Algılanamadı";
                    } else {
                        fs(window.TEMPORARY, 100, 
                            function() { document.getElementById("incognito-status").innerText = "✅ Gizli Mod: Hayır"; },
                            function() { document.getElementById("incognito-status").innerText = "✅ Gizli Mod: Evet"; }
                        );
                    }

                    // **Ekstra Gizli Mod Algılama**
                    const isPrivate = (function() {
                        try {
                            localStorage.setItem("test", "1");
                            localStorage.removeItem("test");
                            return false;
                        } catch (e) {
                            return true;
                        }
                    })();
                    if (isPrivate) {
                        document.getElementById("incognito-status").innerText = "✅ Gizli Mod: Evet";
                    }
                }
                checkIncognitoMode();

                // 🔍 **Headless Tarayıcı Kontrolü**
                function checkHeadlessMode() {
                    const isHeadless = /HeadlessChrome/.test(window.navigator.userAgent) || 
                                      (navigator.webdriver === true);
                    document.getElementById("headless-status").innerText = "✅ Headless Mode: " + (isHeadless ? "Evet" : "Hayır");
                }
                checkHeadlessMode();
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
