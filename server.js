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
            <p id="browser-info"><strong>Tarayıcı Bilgisi:</strong> Yükleniyor...</p>
            <p id="ip-info"><strong>IP Adresi:</strong> Yükleniyor...</p>
            <p id="incognito-info"><strong>Gizli Mod:</strong> Yükleniyor...</p>
            <script type="module">
                import { load } from 'https://cdn.jsdelivr.net/npm/@fingerprintjs/botd@latest/+esm';

                async function detectBot() {
                    try {
                        const botd = await load();
                        const result = await botd.detect();
                        document.getElementById("result").innerText = '✅ Bot Detected: ' + result.bot;

                        // Tarayıcı ve sistem bilgilerini çek
                        document.getElementById("browser-info").innerText = '📌 Tarayıcı Bilgisi: ' + navigator.userAgent;
                        document.getElementById("incognito-info").innerText = '🔒 Gizli Mod: ' + (result.incognito ? 'Evet' : 'Hayır');

                        // ✅ IP adresini BotD üzerinden al
                        const ipResponse = await fetch('https://api.fpjs.io/', { method: 'GET' });
                        const ipData = await ipResponse.json();
                        document.getElementById("ip-info").innerText = '🌍 IP Adresi: ' + ipData.ip;
                    } catch (error) {
                        console.error("❌ BotD hata verdi:", error);
                        document.getElementById("result").innerText = "⚠️ BotD çalıştırılırken hata oluştu!";
                    }
                }
                detectBot();
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
