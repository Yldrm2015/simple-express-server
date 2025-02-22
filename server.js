const express = require("express");
const requestIp = require("request-ip");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

// ✅ **Ana Sayfa**
app.get("/", (req, res) => {
    res.send(`
        <h1>✅ Server is running!</h1>
        <p>Bot Detection API: <a href="/server-botd">/server-botd</a></p>
    `);
});

// ✅ **Sunucu Tarafında Bot Detection API**
app.post("/server-botd", async (req, res) => {
    const clientIp = requestIp.getClientIp(req) || "IP Bulunamadı"; // Kullanıcının IP adresini al
    const userAgent = req.headers["user-agent"] || "Bilinmiyor"; // Kullanıcının tarayıcı bilgilerini al

    let isBot = false;

    // 🚨 **Bot Tespiti İçin API'yi Kullan**
    try {
        const response = await fetch("https://botd.fpapi.io/api/v1/detect", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": userAgent,
                "X-Forwarded-For": clientIp
            }
        });

        const botDetection = await response.json();
        isBot = botDetection.bot;

        res.json({
            success: true,
            ip: clientIp,
            userAgent: userAgent,
            botDetection: isBot ? "🚨 BOT TESPİT EDİLDİ!" : "✅ İnsan Kullanıcı",
            botKind: botDetection.bot ? botDetection.botKind : "Normal Kullanıcı"
        });
    } catch (error) {
        console.error("🚨 Bot Detection API Hatası:", error);
        res.status(500).json({ success: false, message: "Bot detection hatası oluştu!" });
    }
});

// ✅ **Sunucu Başlat**
const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});
