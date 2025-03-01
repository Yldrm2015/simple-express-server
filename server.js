const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const requestIp = require("request-ip");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const FINGERPRINT_SECRET_KEY = process.env.FINGERPRINT_SECRET_KEY;
const API_ENDPOINT = "https://eu.api.fpjs.io/events/";
const NODE_ENV = process.env.NODE_ENV || "development";

const BOT_USER_AGENTS = [
    "curl", "wget", "bot", "crawler", "spider", "httpclient",
    "python-requests", "java", "scrapy", "selenium", "headless"
];

console.log("✅ Server started in", NODE_ENV, "mode");

// **Browser Adı ve İkon Belirleme**
function getBrowserInfo(userAgent) {
    const browsers = [
        { name: "Google Chrome", keyword: "chrome", icon: "chrome.png" },
        { name: "Mozilla Firefox", keyword: "firefox", icon: "firefox.png" },
        { name: "Microsoft Edge", keyword: "edg", icon: "edge.png" },
        { name: "Opera", keyword: "opr", icon: "opera.png" },
        { name: "Brave", keyword: "brave", icon: "brave.png" },
        { name: "Safari", keyword: "safari", icon: "safari.png" },
        { name: "Yandex", keyword: "yabrowser", icon: "yandex.png" }
    ];

    const lowerUserAgent = userAgent.toLowerCase();
    for (const browser of browsers) {
        if (lowerUserAgent.includes(browser.keyword)) {
            return { name: browser.name, icon: browser.icon };
        }
    }
    return { name: "Unknown", icon: "unknown.png" };
}

// **🛡️ Sunucu Tarafında Bot Tespiti (JS Kapalıyken de Çalışır)**
app.get("/", async (req, res) => {
    const ip = requestIp.getClientIp(req) || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"] || "Unknown";
    const webdriver = req.headers["webdriver"] !== undefined; // WebDriver var mı?

    console.log("🔍 [SERVER-SIDE DETECTION] Request received:");
    console.log("   - IP:", ip);
    console.log("   - User-Agent:", userAgent);
    console.log("   - WebDriver Detected:", webdriver);

    let isBot = false;
    let reason = "✅ Not a bot.";

    // **User-Agent bazlı bot tespiti**
    if (BOT_USER_AGENTS.some(botStr => userAgent.toLowerCase().includes(botStr))) {
        isBot = true;
        reason = "🚨 BOT DETECTED: Suspicious User-Agent!";
        console.warn("🚨 [BOT DETECTED] IP:", ip, "User-Agent:", userAgent);
    }

    // **WebDriver tespiti**
    if (webdriver) {
        isBot = true;
        reason = "🚨 BOT DETECTED: WebDriver aktif!";
        console.warn("🚨 [BOT DETECTED] WebDriver kullanıyor!");
    }

    console.log("✅ [SERVER-SIDE DETECTION RESULT]:", reason);

    // **Tarayıcı Bilgisini Al**
    const browserInfo = getBrowserInfo(userAgent);

    // **HTML'yi Dinamik Olarak Sunucu Tarafında Üret**
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bot Detection Test</title>
        </head>
        <body>
            <h1>Bot Detection Test</h1>

            <p><strong>Sunucu Tespiti:</strong> ${reason}</p>
            <p id="browser-info">
                <strong>Browser Info:</strong> ${browserInfo.name}
                <img src="/images/${browserInfo.icon}" alt="${browserInfo.name}" width="32px">
            </p>
            <p id="request-id">Request ID: Waiting...</p>
            <p id="visitor-id">Visitor ID: Waiting...</p>
            <p id="js-detection">JavaScript Detection: Checking...</p>

            <noscript>
                <p style="color: yellow; font-weight: bold;">⚠️ JavaScript is disabled! Only server-side detection is active.</p>
            </noscript>

            <script>
                document.addEventListener("DOMContentLoaded", async () => {
                    try {
                        console.log("🔄 [INFO] Fetching BotD fingerprint...");

                        const fpPromise = import('https://fpjscdn.net/v3/b80bbum6BTT6MT2eIb5B')
                            .then(FingerprintJS => FingerprintJS.load());

                        const fp = await fpPromise;
                        const result = await fp.get();

                        const requestId = result.requestId;
                        const visitorId = result.visitorId;

                        document.getElementById("request-id").innerText = "Request ID: " + requestId;
                        document.getElementById("visitor-id").innerText = "Visitor ID: " + visitorId;

                        console.log("📡 [BOTD] Sending Request ID to server:", requestId);

                        fetch('/botd-test', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ requestId, visitorId })
                        })
                        .then(response => response.json())
                        .then(data => {
                            console.log("✅ [BOTD SUCCESS]:", data);
                            document.getElementById("js-detection").innerText = "JavaScript Detection: " + JSON.stringify(data, null, 2);
                        })
                        .catch(error => {
                            console.error("❌ [BOTD ERROR]:", error);
                            document.getElementById("js-detection").innerText = "BotD Error: " + error.message;
                        });

                    } catch (error) {
                        console.error("❌ [ERROR] FingerprintJS Error:", error);
                        document.getElementById("js-detection").innerText = "FingerprintJS Error: " + error.message;
                    }
                });
            </script>

        </body></html>
    `);
});

// **🛡️ BotD API ile Tarayıcı Üzerinden Tespit (JSON Formatında Çalışır)**
app.post("/botd-test", async (req, res) => {
    try {
        const { requestId, visitorId } = req.body;

        if (!requestId || !visitorId) {
            return res.status(400).json({ error: "Request ID veya Visitor ID eksik!" });
        }

        const response = await axios.get(`${API_ENDPOINT}${requestId}`, {
            headers: { "Auth-API-Key": FINGERPRINT_SECRET_KEY, Accept: "application/json" },
        });

        const identificationEvent = response.data;

        if (identificationEvent.products?.botd?.data?.bot?.result === "bad") {
            return res.status(403).json({ error: "🚨 Malicious bot detected (BotD)." });
        }

        return res.json({ status: "✅ Not a bot (BotD OK)", requestId, visitorId });

    } catch (error) {
        console.error("❌ [BOTD API ERROR]:", error.response ? error.response.data : error.message);
        return res.status(500).json({ error: "BotD API request failed." });
    }
});

const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
