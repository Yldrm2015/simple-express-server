const express = require('express');
const bodyParser = require('body-parser');
const requestIp = require('request-ip');

const app = express(); // ✅ Eksik app tanımlaması düzeltildi

// 🌍 **CORS (Tüm istekleri kabul et)**
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "POST, GET");
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// ✅ **Ana Sayfa Route**
app.get('/', (req, res) => {
    res.send('✅ Server is running! You can test BotD at <a href="/botd-test">/botd-test</a>');
});

// ✅ **BOTD TEST SAYFASI (DÜZELTİLMİŞ HALİ)**
app.get('/botd-test', async (req, res) => {
    const ip = requestIp.getClientIp(req) || "Bilinmiyor";
    const userAgent = req.headers['user-agent'] || "Bilinmiyor";

    res.send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bot Detection</title>
        </head>
        <body>
            <h1>Bot Detection Test</h1>
            <p id="result">Lütfen bekleyin...</p>
            <p><strong>Tarayıcı Bilgisi:</strong> ${userAgent}</p>
            <p><strong>IP Adresi:</strong> ${ip}</p>
            <p><strong>Gizli Mod:</strong> <span id="incognito">Tespit ediliyor...</span></p>
            <p><strong>Headless Mode:</strong> <span id="headless">Tespit ediliyor...</span></p>

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

                // ✅ **Gizli Mod Tespiti**
                function detectIncognitoMode() {
                    const fs = window.RequestFileSystem || window.webkitRequestFileSystem;
                    if (!fs) {
                        document.getElementById("incognito").innerText = "Bilinmiyor";
                        return;
                    }
                    fs(window.TEMPORARY, 100, () => {
                        document.getElementById("incognito").innerText = "Hayır";
                    }, () => {
                        document.getElementById("incognito").innerText = "Evet";
                    });
                }
                detectIncognitoMode();

                // ✅ **Headless Mode Tespiti**
                function detectHeadlessMode() {
                    if (navigator.webdriver) {
                        document.getElementById("headless").innerText = "Evet";
                    } else {
                        document.getElementById("headless").innerText = "Hayır";
                    }
                }
                detectHeadlessMode();
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
