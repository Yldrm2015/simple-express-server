const express = require("express");
const bodyParser = require("body-parser");
const requestIp = require("request-ip");
const useragent = require("useragent");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();

// ✅ CORS Ayarları
app.use(cors());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "POST, GET");
    next();
});

// 🚨 Hata Yönetimi
process.on("uncaughtException", (err) => {
    console.error("🚨 Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason, promise) => {
    console.error("🚨 Unhandled Rejection at:", promise, "reason:", reason);
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// ✅ **Ana Sayfa**
app.get("/", (req, res) => {
    res.send("✅ Server is running! Test için: <a href='/botd-test'>/botd-test</a>");
});

// ✅ **Gerçek IP Adresini Alma**
app.get("/get-ip", async (req, res) => {
    let localIP = req.headers["x-forwarded-for"] || requestIp.getClientIp(req);

    if (localIP && localIP.includes(",")) {
        localIP = localIP.split(",")[0]; // Eğer birden fazla IP varsa, ilkini al
    }

    // **Harici API ile Gerçek IP Al**
    const externalIP = await getExternalIP();

    res.json({ localIP, externalIP });
});

// **Harici API ile Gerçek IP Alma**
async function getExternalIP() {
    try {
        const response = await fetch("https://api64.ipify.org?format=json");
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error("❌ Harici IP alınamadı:", error);
        return "IP alınamadı!";
    }
}

// ✅ **Bot Tespiti, Tarayıcı Tespiti ve IP Adresi Alma**
app.get("/botd-test", async (req, res) => {
    try {
        console.log("✅ Bot Detection başlatıldı...");
        const agent = useragent.parse(req.headers["user-agent"]);
        console.log("📌 Kullanıcı Tarayıcısı:", agent.toString());

        // Kullanıcının IP adreslerini al
        const localIP = req.headers["x-forwarded-for"] || requestIp.getClientIp(req);
        const externalIP = await getExternalIP();

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
                <p><strong>Tarayıcı:</strong> <span id="browser-info">Tespit ediliyor...</span></p>
                <p><strong>Yerel IP:</strong> <span id="local-ip">${localIP}</span></p>
                <p><strong>Gerçek IP:</strong> <span id="external-ip">${externalIP}</span></p>

                <script type="module">
                    // ✅ Tarayıcı Tespiti (Chrome, Brave, Yandex, Edge vs.)
                    async function detectBrowser() {
                        if (navigator.brave) {
                            const isBrave = await navigator.brave.isBrave();
                            if (isBrave) {
                                document.getElementById("browser-info").innerText = "Brave 🦁";
                                return;
                            }
                        }

                        const userAgent = navigator.userAgent;
                        if (userAgent.includes("Firefox")) {
                            document.getElementById("browser-info").innerText = "Firefox 🦊";
                        } else if (userAgent.includes("SamsungBrowser")) {
                            document.getElementById("browser-info").innerText = "Samsung Internet 📱";
                        } else if (userAgent.includes("Edg")) {
                            document.getElementById("browser-info").innerText = "Microsoft Edge 🟦";
                        } else if (userAgent.includes("Opera") || userAgent.includes("OPR")) {
                            document.getElementById("browser-info").innerText = "Opera 🎭";
                        } else if (userAgent.includes("YaBrowser")) {
                            document.getElementById("browser-info").innerText = "Yandex Browser 🚀";
                        } else if (userAgent.includes("Vivaldi")) {
                            document.getElementById("browser-info").innerText = "Vivaldi 🎼";
                        } else if (userAgent.includes("Chrome")) {
                            document.getElementById("browser-info").innerText = "Google Chrome 🌍";
                        } else if (userAgent.includes("Safari")) {
                            document.getElementById("browser-info").innerText = "Safari 🍏";
                        } else {
                            document.getElementById("browser-info").innerText = "Bilinmeyen Tarayıcı ❓";
                        }
                    }
                    detectBrowser();

                    // ✅ BOT TESPİTİ
                    async function detectBot() {
                        try {
                            const botdModule = await import('https://cdn.jsdelivr.net/npm/@fingerprintjs/botd@latest/+esm');
                            const botd = await botdModule.load();
                            const result = await botd.detect();

                            document.getElementById("result").innerText = result.bot ? "🚨 BOT TESPİT EDİLDİ!" : "✅ İnsan Kullanıcı";
                        } catch (error) {
                            console.error("❌ Bot Detection Hatası:", error);
                            document.getElementById("result").innerText = "⚠️ Bot Detection Çalıştırılamadı!";
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
