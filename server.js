const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const path = require("path");
const requestIp = require("request-ip");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const FINGERPRINT_SECRET_KEY = process.env.FINGERPRINT_SECRET_KEY;
const API_ENDPOINT = "https://eu.api.fpjs.io/events/";
const NODE_ENV = process.env.NODE_ENV || "development";

const BOT_USER_AGENTS = [
    "curl", "wget", "bot", "crawler", "spider", "httpclient",
    "python-requests", "java", "scrapy", "selenium", "headless"
];

console.log("✅ Server started in", NODE_ENV, "mode");

// **🛡️ Sunucu Tarafından Bot Tespiti (JS Kapalıyken de Çalışır)**
app.get("/", async (req, res) => {
    try {
        const ip = requestIp.getClientIp(req) || req.socket.remoteAddress;
        const userAgent = req.headers["user-agent"] || "Unknown";

        console.log("🔍 [SERVER-SIDE DETECTION] Request received:");
        console.log("   - IP:", ip);
        console.log("   - User-Agent:", userAgent);

        let isBot = false;
        let reason = "✅ Not a bot.";

        // **User-Agent bazlı bot tespiti**
        if (BOT_USER_AGENTS.some(botStr => userAgent.toLowerCase().includes(botStr))) {
            isBot = true;
            reason = "🚨 BOT DETECTED: Suspicious User-Agent!";
            console.warn("🚨 [BOT DETECTED] IP:", ip, "User-Agent:", userAgent);
        }

        console.log("✅ [SERVER-SIDE DETECTION RESULT]:", reason);

        // **HTML Sayfasını Server-Side Render Ederek Gönder**
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
                <p id="server-side-status"><strong>Server-Side Bot Detection:</strong> ${reason}</p>
                <p id="request-id">Request ID: Waiting...</p>
                <p id="visitor-id">Visitor ID: Waiting...</p>
                <p id="botd-status">Detecting...</p>

                <noscript>
                    <p style="color: red;">⚠️ JavaScript is disabled! Only server-side detection is active.</p>
                </noscript>

                <script>
                    document.addEventListener("DOMContentLoaded", async () => {
                        try {
                            // **BotD FingerprintJS ile tespit**
                            const fpPromise = import('https://fpjscdn.net/v3/YOUR_PUBLIC_API_KEY')
                                .then(FingerprintJS => FingerprintJS.load());

                            const fp = await fpPromise;
                            const result = await fp.get();

                            const requestId = result.requestId;
                            const visitorId = result.visitorId;

                            document.getElementById("request-id").innerText = "Request ID: " + requestId;
                            document.getElementById("visitor-id").innerText = "Visitor ID: " + visitorId;

                            // **BotD verisini sunucuya gönder**
                            fetch('/botd-test', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ requestId, visitorId })
                            })
                            .then(response => response.json())
                            .then(data => {
                                document.getElementById("botd-status").innerText = "BotD Status: " + JSON.stringify(data, null, 2);
                            })
                            .catch(error => {
                                document.getElementById("botd-status").innerText = "BotD Error: " + error.message;
                            });
                        } catch (error) {
                            document.getElementById("botd-status").innerText = "FingerprintJS Error: " + error.message;
                        }
                    });
                </script>
            </body>
            </html>
        `);
    } catch (error) {
        console.error("❌ [SERVER-SIDE ERROR]:", error);
        res.status(500).json({ error: "Server error in bot detection!", details: error.message });
    }
});

// **🛡️ BotD API ile Tarayıcı Üzerinden Tespit (JS Açıkken Ekstra Kontrol)**
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

// **Sunucu Başlat**
const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
