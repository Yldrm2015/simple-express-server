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
    res.send('✅ Server is running! You can test Bot & Browser Detection at <a href="/botd-test">/botd-test</a>');
});

// ✅ **BOTD TEST + Tarayıcı Tespiti**
app.get('/botd-test', async (req, res) => {
    const agent = useragent.parse(req.headers['user-agent']); // Kullanıcı tarayıcı bilgisi
    const browserName = agent.family; // Tarayıcı ismi (Chrome, Firefox, Edge vb.)
    const browserVersion = agent.major; // Tarayıcı sürümü (133, 114 vb.)

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bot Detection & Browser Info</title>
        </head>
        <body>
            <h1>Bot Detection Test</h1>
            <p id="result">Lütfen bekleyin...</p>
            <p><strong>Tarayıcı:</strong> <span id="browser"></span></p>

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

                // Tarayıcı Bilgilerini Güncelle
                document.getElementById("browser").innerText = '${browserName} ${browserVersion}';
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
