const express = require('express');
const bodyParser = require('body-parser');
const requestIp = require('request-ip');
const useragent = require('useragent');

const app = express(); // Express başlatıldı

// 🚨 Sunucu Hatalarını Yakala (Crash Olursa Logları Göster)
process.on('uncaughtException', (err) => {
    console.error("🚨 Uncaught Exception:", err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error("🚨 Unhandled Rejection at:", promise, "reason:", reason);
});

// ✅ CORS Ayarları
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "POST, GET");
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// ✅ **Ana Sayfa**
app.get('/', (req, res) => {
    res.send('✅ Server is running! Test etmek için: <a href="/botd-test">/botd-test</a>');
});

// ✅ **Bot Detection ve Tarayıcı Tespiti**
app.get('/botd-test', async (req, res) => {
    try {
        console.log("✅ Bot Detection başlatıldı..."); // Sunucu loguna düşsün
        const agent = useragent.parse(req.headers['user-agent']); // Tarayıcı bilgisi
        console.log("📌 Kullanıcı Tarayıcısı:", agent.toString()); // Log'a ekle

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
                <p><strong>Tarayıcı:</strong> ${agent.family} ${agent.major}</p>

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
    } catch (error) {
        console.error("🚨 Sunucu Hatası:", error);
        res.status(500).send("🚨 Sunucu Hatası! Logları Kontrol Et.");
    }
});

// ✅ **PORT AYARLANDI**
const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});
