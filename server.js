const express = require('express');
const bodyParser = require('body-parser');
const requestIp = require('request-ip');
const useragent = require('useragent');

const app = express(); // Express sunucusu başlatılıyor

// CORS (Diğer sitelerden erişime izin ver)
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "POST, GET");
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Ana Sayfa Route
app.get('/', (req, res) => {
    res.send('✅ Server is running! You can test BotD at <a href="/botd-test">/botd-test</a>');
});

// **BotD Test Sayfası**
app.get('/botd-test', async (req, res) => {
    const clientIp = requestIp.getClientIp(req); // IP adresini al
    const agent = useragent.parse(req.headers['user-agent']); // Tarayıcı bilgilerini al

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
            <p><strong>Tarayıcı:</strong> ${agent.family} ${agent.major}</p>
            <p><strong>IP Adresi:</strong> ${clientIp || "Bilinmiyor"}</p>
            <p><strong>Gizli Mod:</strong> <span id="incognito">Yükleniyor...</span></p>
            <p><strong>Headless Mode:</strong> <span id="headless">Yükleniyor...</span></p>

            <script type="module">
                import { load } from 'https://cdn.jsdelivr.net/npm/@fingerprintjs/botd@latest/+esm';
                
                async function detectBot() {
                    try {
                        const botd = await load();
                        const result = await botd.detect();
                        document.getElementById("result").innerText = '✅ Bot Detected: ' + result.bot;
                        
                        // Headless Mode Kontrolü
                        const isHeadless = navigator.webdriver;
                        document.getElementById("headless").innerText = isHeadless ? "Evet" : "Hayır";

                        // Gizli Mod Tespiti
                        let fs = window.RequestFileSystem || window.webkitRequestFileSystem;
                        if (!fs) {
                            document.getElementById("incognito").innerText = "Hayır";
                        } else {
                            fs(window.TEMPORARY, 100, function () {
                                document.getElementById("incognito").innerText = "Hayır";
                            }, function () {
                                document.getElementById("incognito").innerText = "Evet";
                            });
                        }
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
