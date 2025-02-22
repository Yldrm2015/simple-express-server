const express = require("express");
const bodyParser = require("body-parser");
const requestIp = require("request-ip");
const useragent = require("useragent");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// ✅ **Ana Sayfa**
app.get("/", (req, res) => {
    res.send("✅ Server is running! Test için: <a href='/botd-test'>/botd-test</a>");
});

// ✅ **Bot Detection Sayfası**
app.get("/botd-test", (req, res) => {
    const agent = useragent.parse(req.headers["user-agent"]);
    const ipAddress = requestIp.getClientIp(req);
    const userAgentString = req.headers["user-agent"];

    // ✅ **Sunucu Tarafından Bot Analizi**
    const isHeadless = /HeadlessChrome|bot|crawl|spider|Baiduspider|bingbot|duckduckbot|yandexbot/i.test(userAgentString);
    const isProxy = req.headers["via"] || req.headers["x-forwarded-for"];

    let serverSideBotCheck = isHeadless || isProxy ? "🚨 Sunucu Tarafında Bot Şüphesi!" : "✅ Sunucu Analizi: İnsan Kullanıcı";

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bot Detection & Browser Info</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; }
                #result { font-size: 20px; font-weight: bold; }
                .alert { color: red; font-weight: bold; }
            </style>
        </head>
        <body>
            <h1>Bot Detection Test</h1>
            <p id="result">Lütfen bekleyin...</p>
            <p><strong>Sunucu Analizi:</strong> <span class="${isHeadless ? 'alert' : ''}">${serverSideBotCheck}</span></p>
            <p><strong>Tarayıcı:</strong> ${agent.toString()}</p>
            <p><strong>IP Adresiniz:</strong> ${ipAddress}</p>
            <p><strong>Fare Hareketi:</strong> <span id="mouse-movement">Henüz Yok</span></p>
            <p><strong>Kaydırma:</strong> <span id="scroll-info">Henüz Yok</span></p>
            <p><strong>Tıklama:</strong> <span id="click-info">Henüz Yok</span></p>

            <noscript>
                <p class="alert">🚨 JavaScript devre dışı! Bu bir bot olabilir.</p>
            </noscript>

            <script type="module">
                import { load } from 'https://cdn.jsdelivr.net/npm/@fingerprintjs/botd@latest/+esm';

                async function detectBot() {
                    try {
                        const botd = await load();
                        const result = await botd.detect();
                        document.getElementById("result").innerText = result.bot 
                            ? "🚨 BOT TESPİT EDİLDİ!" 
                            : "✅ İnsan Kullanıcı";

                        // Sunucuya JavaScript çalıştığını bildir
                        fetch('/js-check', { method: 'POST' });
                    } catch (error) {
                        console.error("❌ BotD hata verdi:", error);
                        document.getElementById("result").innerText = "⚠️ Bot Detection Çalıştırılamadı!";
                    }
                }
                detectBot();

                document.addEventListener("mousemove", () => {
                    document.getElementById("mouse-movement").innerText = "✅ Fare Hareketi Algılandı!";
                });

                document.addEventListener("scroll", () => {
                    document.getElementById("scroll-info").innerText = "✅ Sayfa Kaydırıldı!";
                });

                document.addEventListener("click", () => {
                    document.getElementById("click-info").innerText = "✅ Sayfaya Tıklama Yapıldı!";
                });
            </script>
        </body>
        </html>
    `);
});

// ✅ **Sunucu Tarafında JavaScript Kontrolü**
let jsEnabledUsers = new Set();
app.post("/js-check", (req, res) => {
    const ip = requestIp.getClientIp(req);
    jsEnabledUsers.add(ip);
    res.sendStatus(200);
});

// ✅ **PORT Ayarla ve Sunucuyu Başlat**
const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});
