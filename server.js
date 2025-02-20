const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios'); // ✅ **Gerçek IP almak için eklendi!**
const requestIp = require('request-ip');
const useragent = require('useragent');

const app = express(); 

// 🌍 **CORS Ayarı (Tüm istekleri kabul et)**
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

// ✅ **BOTD TEST SAYFASI (DÜZELTİLDİ)**
app.get('/botd-test', async (req, res) => {
    let ip = requestIp.getClientIp(req) || "Bilinmiyor";

    try {
        const ipResponse = await axios.get("https://api64.ipify.org?format=json");
        ip = ipResponse.data.ip; // ✅ **Gerçek IP Adresi**
    } catch (error) {
        console.error("Gerçek IP alınamadı:", error);
    }

    const userAgent = req.headers['user-agent'] || "Bilinmiyor";
    const agent = useragent.parse(userAgent);

    let browser = "Bilinmiyor";
    if (agent.family === "Chrome" && userAgent.includes("Brave")) {
        browser = "Brave " + agent.major;
    } else {
        browser = agent.family + " " + agent.major;
    }

    res.send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bot Detection</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #2c3e50; }
                .info { margin: 10px 0; font-size: 18px; }
                .success { color: green; font-weight: bold; }
                .error { color: red; font-weight: bold; }
            </style>
        </head>
        <body>
            <h1>Bot Detection Test</h1>
            <p class="info"><strong>Bot Tespit Sonucu:</strong> <span id="result">Lütfen bekleyin...</span></p>
            <p class="info"><strong>Tarayıcı:</strong> ${browser}</p>
            <p class="info"><strong>IP Adresi:</strong> ${ip}</p>
            <p class="info"><strong>Gizli Mod:</strong> <span id="incognito">Tespit ediliyor...</span></p>
            <p class="info"><strong>Headless Mode:</strong> <span id="headless">Tespit ediliyor...</span></p>

            <script type="module">
                import { load } from 'https://cdn.jsdelivr.net/npm/@fingerprintjs/botd@latest/+esm';
                
                async function detectBot() {
                    try {
                        const botd = await load();
                        const result = await botd.detect();
                        document.getElementById("result").innerText = result.bot ? "✅ Evet, bot tespit edildi!" : "❌ Hayır, bot tespit edilmedi!";
                        document.getElementById("result").className = result.bot ? "error" : "success";
                    } catch (error) {
                        console.error("❌ BotD hata verdi:", error);
                        document.getElementById("result").innerText = "⚠️ BotD çalıştırılırken hata oluştu!";
                    }
                }
                detectBot();

                // ✅ **Gizli Mod Tespiti (Garantili Çalışan Yöntem)**
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

                // ✅ **Headless Mode Tespiti (Güvenilir Yöntem)**
                function detectHeadlessMode() {
                    if (navigator.webdriver || !window.chrome) {
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
