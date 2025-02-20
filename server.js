const express = require('express');
const bodyParser = require('body-parser');
const requestIp = require('request-ip');
const useragent = require('useragent');

const app = express(); // Express sunucusunu başlat

// CORS izinleri
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
    res.send('✅ Server is running! You can test Browser Detection at <a href="/browser-test">/browser-test</a>');
});

// ✅ **Tarayıcı Tespiti Route**
app.get('/browser-test', (req, res) => {
    const agent = useragent.parse(req.headers['user-agent']); // Kullanıcı tarayıcı bilgisi
    const ip = requestIp.getClientIp(req) || "IP tespit edilemedi"; // IP adresini al

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Tarayıcı Tespiti</title>
        </head>
        <body>
            <h1>Tarayıcı Tespiti</h1>
            <p><strong>Tarayıcı:</strong> ${agent.family} ${agent.major}</p>
            <p><strong>Detaylı Tarayıcı Bilgisi:</strong> ${req.headers['user-agent']}</p>
            <p><strong>IP Adresi:</strong> ${ip}</p>
        </body>
        </html>
    `);
});

// ✅ **BOTD TEST ROUTE**
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

// Sunucuyu başlat
const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});
