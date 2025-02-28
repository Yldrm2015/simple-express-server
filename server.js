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

// **🛡️ Sunucu Tarafından Bot Tespiti**
app.get("/", async (req, res) => {
    try {
        const ip = requestIp.getClientIp(req) || req.socket.remoteAddress;
        const userAgent = req.headers["user-agent"] || "Unknown";

        console.log("🔍 [SERVER-SIDE DETECTION] Request received:");
        console.log("   - IP:", ip);
        console.log("   - User-Agent:", userAgent);

        let isBot = false;
        let reason = "✅ Not a bot.";

        if (BOT_USER_AGENTS.some(botStr => userAgent.toLowerCase().includes(botStr))) {
            isBot = true;
            reason = "🚨 BOT DETECTED: Suspicious User-Agent!";
        }

        console.log("✅ [SERVER-SIDE DETECTION RESULT]:", reason);

        // **HTML Yanıtı**
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
                <p id="request-id">Request ID: Waiting...</p>
                <p id="visitor-id">Visitor ID: Waiting...</p>
                <p id="js-detection">JavaScript Detection: Checking...</p>

                <noscript>
                    <p style="color: yellow; font-weight: bold;">⚠️ JavaScript is disabled! Only server-side detection is active.</p>
                </noscript>

                <script>
                    setTimeout(() => {
                        function detectHeadless() {
                            try {
                                let isHeadless = false;
                                let reason = "✅ Not a bot.";

                                // **navigator.webdriver ile botları yakala**
                                if (navigator.webdriver) {
                                    isHeadless = true;
                                    reason = "🚨 BOT DETECTED: Webdriver active!";
                                }

                                // **navigator.plugins (Eklenti yoksa bot olabilir)**
                                if (navigator.plugins.length === 0) {
                                    isHeadless = true;
                                    reason = "🚨 BOT DETECTED: No browser plugins found!";
                                }

                                // **navigator.languages (Dil listesi boşsa bot olabilir)**
                                if (!navigator.languages || navigator.languages.length === 0) {
                                    isHeadless = true;
                                    reason = "🚨 BOT DETECTED: No browser languages found!";
                                }

                                // **navigator.permissions (Headless tarayıcı burada hata verir)**
                                navigator.permissions.query({ name: 'notifications' })
                                    .then(permissionStatus => {
                                        if (permissionStatus.state === 'denied') {
                                            isHeadless = true;
                                            reason = "🚨 BOT DETECTED: Notification permission blocked!";
                                        }
                                    }).catch(() => {
                                        isHeadless = true;
                                        reason = "🚨 BOT DETECTED: Notifications API error!";
                                    });

                                // **WebGL tespiti (Headless tarayıcılar genelde bozuk değer döndürür)**
                                const canvas = document.createElement("canvas");
                                const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
                                if (!gl) {
                                    isHeadless = true;
                                    reason = "🚨 BOT DETECTED: WebGL not available!";
                                }

                                // **console.debug() (Headless Chrome'da undefined döner)**
                                let debugCheck = false;
                                console.debug = function () { debugCheck = true; };
                                console.debug();
                                if (!debugCheck) {
                                    isHeadless = true;
                                    reason = "🚨 BOT DETECTED: console.debug blocked!";
                                }

                                // **Final Sonucu Yazdır**
                                document.getElementById("js-detection").innerText = "JavaScript Detection: " + reason;

                            } catch (error) {
                                document.getElementById("js-detection").innerText = "⚠️ Error in detection: " + error.message;
                            }
                        }

                        detectHeadless();
                    }, 500);
                </script>
            </body>
            </html>
        `);

    } catch (error) {
        console.error("❌ [SERVER-SIDE ERROR]:", error);
        res.status(500).send("Server error in bot detection!");
    }
});

// **Sunucu Başlat**
const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
