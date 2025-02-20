const express = require('express');
const bodyParser = require('body-parser');
const requestIp = require('request-ip'); // ✅ Eksik modül eklendi

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
    const clientIp = requestIp.getClientIp(req); // ✅ Gerçek IP adresini al
    const userAgent = req.headers['user-agent'] || 'Bilinmiyor'; // ✅ Kullanıcı Tarayıcı Bilgisi
    const isIncognito = req.headers['sec-ch-ua'] ? 'Hayır' : 'Evet'; // ✅ Gizli Mod Tespiti

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
            <p><strong>Tarayıcı Bilgisi:</strong> ${userAgent}</p>
            <p><strong>IP Adresi:</strong> ${clientIp}</p>
            <p><strong>Gizli Mod:</strong> ${isIncognito}</p>
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
