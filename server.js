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

// 📌 Statik dosya servisini doğru ayarla
app.use(express.static(path.join(__dirname, "public")));

// 📌 Cache Kontrolü (Tarayıcı Bilgisini Güncellemek İçin)
app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
});

let jsEnabledUsers = new Set();

app.get("/", (req, res) => {
    res.send("✅ Server is running! Test için: <a href='/botd-test'>/botd-test</a>");
});

app.get("/botd-test", (req, res) => {
    const agent = useragent.parse(req.headers["user-agent"]);
    const ipAddress = requestIp.getClientIp(req);
    const isJSActive = jsEnabledUsers.has(ipAddress);
    const isLikelyBot = !isJSActive;

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

            <script type="module" src="/botd-client.js"></script>
        </body>
        </html>
    `);
});

app.post("/js-check", (req, res) => {
    const ip = requestIp.getClientIp(req);
    jsEnabledUsers.add(ip);
    res.sendStatus(200);
});

app.get("/browser-info", (req, res) => {
    const userAgent = req.headers["user-agent"];
    res.json({ userAgent });
});

const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});
