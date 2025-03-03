const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const requestIp = require("request-ip");
const useragent = require("useragent"); // User-Agent'ı detaylı parse etmek için

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

// **🔍 Tarayıcı Adı ve Simge Belirleme (Daha Doğru Tespit)**
function getBrowserInfo(userAgent) {
    const agent = useragent.parse(userAgent); // User-Agent analiz kütüphanesi ile detaylı tespit

    const browserName = agent.family || "Unknown Browser";
    const lowerUserAgent = userAgent.toLowerCase();

    if (lowerUserAgent.includes("edg")) return { name: "Microsoft Edge", emoji: "🔵" };
    if (lowerUserAgent.includes("brave")) return { name: "Brave", emoji: "🦁" };
    if (lowerUserAgent.includes("yabrowser")) return { name: "Yandex Browser", emoji: "🟡" };
    if (lowerUserAgent.includes("opr") || lowerUserAgent.includes("opera")) return { name: "Opera", emoji: "🟥" };
    if (lowerUserAgent.includes("firefox")) return { name: "Mozilla Firefox", emoji: "🦊" };
    if (lowerUserAgent.includes("safari") && !lowerUserAgent.includes("chrome")) return { name: "Safari", emoji: "🍏" };
    if (lowerUserAgent.includes("chrome") && !lowerUserAgent.includes("edg") && !lowerUserAgent.includes("yabrowser") && !lowerUserAgent.includes("opr")) {
        return { name: "Google Chrome", emoji: "🌍" };
    }

    return { name: browserName, emoji: "❓" }; // Bilinmeyen tarayıcılar için
}

// **🛡️ Sunucu Tarafında Bot Tespiti**
app.get("/", async (req, res) => {
    const ip = requestIp.getClientIp(req) || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"] || "Unknown";
    const webdriver = req.headers["webdriver"] !== undefined;

    console.log("🔍 [SERVER-SIDE DETECTION] Request received:");
    console.log("   - IP:", ip);
    console.log("   - User-Agent:", userAgent);
    console.log("   - WebDriver Detected:", webdriver);

    let isBot = false;
    let reason = "✅ Not a bot.";

    if (BOT_USER_AGENTS.some(botStr => userAgent.toLowerCase().includes(botStr))) {
        isBot = true;
        reason = "🚨 BOT DETECTED: Suspicious User-Agent!";
        console.warn("🚨 [BOT DETECTED] IP:", ip, "User-Agent:", userAgent);
    }

    if (webdriver) {
        isBot = true;
        reason = "🚨 BOT DETECTED: WebDriver aktif!";
        console.warn("🚨 [BOT DETECTED] WebDriver kullanıyor!");
    }

    console.log("✅ [SERVER-SIDE DETECTION RESULT]:", reason);

    // **Doğru Tarayıcı Bilgisi Al**
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
                <strong>Browser Info:</strong> ${browserInfo.emoji} ${browserInfo.name}
            </p>
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

                        console.log("📡 [BOTD] Sending Request ID to server:", result.requestId);

                        fetch('/botd-test', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ requestId: result.requestId, visitorId: result.visitorId })
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

// **🛡️ BotD API ile Tarayıcı Üzerinden Tespit**
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

        return res.json({ 
            status: "✅ Not a bot (BotD OK)", 
            requestId, 
            visitorId 
        });

    } catch (error) {
        console.error("❌ [BOTD API ERROR]:", error.response ? error.response.data : error.message);
        return res.status(500).json({ error: "BotD API request failed." });
    }
});

const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
