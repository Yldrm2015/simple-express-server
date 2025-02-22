const express = require("express");
const requestIp = require("request-ip");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ **Ana Sayfa (Bilgilendirme İçin)**
app.get("/", (req, res) => {
    res.send(`
        <h1>✅ Server is running!</h1>
        <p>Bot Detection API: <a href="/server-botd">/server-botd</a></p>
    `);
});

// ✅ **Sunucu Tarafında Bot Detection API**
app.post("/server-botd", async (req, res) => {
    const clientIp = requestIp.getClientIp(req) || "IP Bulunamadı"; // IP adresini al
    const userAgent = req.headers["user-agent"] || "Bilinmiyor"; // Kullanıcının tarayıcı bilgilerini al

    // 🚨 **Basit Bot Analizi (IP ve User-Agent ile)**
    let isBot = false;

    // 🚨 **Şüpheli IP Aralıkları (Bot Olabilir)**
    const botIPPatterns = ["66.249", "74.125", "207.46", "17.57", "40.77"]; // Google, Bing, Apple botları
    if (botIPPatterns.some(pattern => clientIp.startsWith(pattern))) {
        isBot = true;
    }

    // 🚨 **Şüpheli User-Agent Analizi**
    const botUserAgents = ["bot", "crawl", "spider", "slurp", "mediapartners"];
    if (botUserAgents.some(bot => userAgent.toLowerCase().includes(bot))) {
        isBot = true;
    }

    // ✅ **Yanıt Döndür**
    res.json({
        success: true,
        ip: clientIp,
        userAgent: userAgent,
        botDetection: isBot ? "🚨 BOT TESPİT EDİLDİ!" : "✅ İnsan Kullanıcı"
    });
});

// ✅ **Sunucu Başlat**
const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});
