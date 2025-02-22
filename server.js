const express = require("express");
const bodyParser = require("body-parser");
const requestIp = require("request-ip");
const useragent = require("useragent");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(helmet({ contentSecurityPolicy: false }));

let jsEnabledUsers = new Set();

app.get("/", (req, res) => {
    res.send("✅ Server is running! Test için: <a href='/botd-test'>/botd-test</a>");
});

app.get("/botd-test", (req, res) => {
    const ipAddress = requestIp.getClientIp(req);
    const agent = useragent.parse(req.headers["user-agent"]);

    const isJSActive = jsEnabledUsers.has(ipAddress);
    const isHeadless = /HeadlessChrome|bot|crawl|spider|Baiduspider|bingbot|duckduckbot|yandexbot/i.test(req.headers["user-agent"]);
    const isProxy = req.headers["via"] || req.headers["x-forwarded-for"];
    const isLikelyBot = !isJSActive || isHeadless || isProxy;

    let botStatus = isLikelyBot ? "🚨 Bot Şüphesi!" : "✅ İnsan Kullanıcı";

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bot Detection</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; }
                #result { font-size: 20px; font-weight: bold; }
                .alert { color: red; font-weight: bold; }
            </style>
        </head>
        <body>
            <h1>Bot Detection Test</h1>
            <p id="result">Lütfen bekleyin...</p>
            <p><strong>Sunucu Analizi:</strong> <span class="${isLikelyBot ? 'alert' : ''}">${botStatus}</span></p>
            <p><strong>Tarayıcı:</strong> ${agent.toString()}</p>
            <p><strong>IP Adresiniz:</strong> ${ipAddress}</p>

            <noscript>
                <p class="alert">🚨 JavaScript devre dışı! Bot olabilir.</p>
            </noscript>

            <script type="module">
                import { load } from '/botd-client.js';

                async function detectBot() {
                    try {
                        const botd = await load();
                        const result = await botd.detect();
                        document.getElementById("result").innerText = result.bot 
                            ? "🚨 BOT TESPİT EDİLDİ!" 
                            : "✅ İnsan Kullanıcı";

                        fetch('/js-check', { method: 'POST' });
                    } catch (error) {
                        console.error("BotD hata verdi:", error);
                        document.getElementById("result").innerText = "⚠️ Bot Detection Çalıştırılamadı!";
                    }
                }
                detectBot();
            </script>
        </body>
        </html>
    `);
});

app.post("/js-check", (req, res) => {
    const ip = requestIp.getClientIp(req);
    jsEnabledUsers.add(ip);
    res.sendStatus(200);
});

// Statik dosya servisi (BotD istemci tarafı kodu için)
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});
