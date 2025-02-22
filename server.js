const express = require("express");
const bodyParser = require("body-parser");
const requestIp = require("request-ip");
const useragent = require("useragent");
const cors = require("cors");

const app = express();

// ✅ CORS Ayarları
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// ✅ **Ana Sayfa**
app.get("/", (req, res) => {
    res.send("✅ Server is running! Test için: <a href='/botd-test'>/botd-test</a>");
});

// ✅ **Bot Detection ve Tarayıcı Bilgisi Sayfası**
app.get("/botd-test", (req, res) => {
    const agent = useragent.parse(req.headers["user-agent"]);
    const ipAddress = requestIp.getClientIp(req);

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
            <p><strong>Tarayıcı:</strong> <span id="browser-info">${agent.toString()}</span></p>
            <p><strong>IP Adresiniz:</strong> <span id="ip-info">${ipAddress}</span></p>

            <script type="module">
                import { load } from 'https://cdn.jsdelivr.net/npm/@fingerprintjs/botd@latest/+esm';

                async function detectBot() {
                    try {
                        const botd = await load();
                        const result = await botd.detect();
                        document.getElementById("result").innerText = result.bot 
                            ? "🚨 BOT TESPİT EDİLDİ!" 
                            : "✅ İnsan Kullanıcı";
                    } catch (error) {
                        console.error("❌ BotD hata verdi:", error);
                        document.getElementById("result").innerText = "⚠️ Bot Detection Çalıştırılamadı!";
                    }
                }
                detectBot();
            </script>
        </body>
        </html>
    `);
});

// ✅ **PORT Ayarla ve Sunucuyu Başlat**
const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});
