const express = require("express");
const requestIp = require("request-ip");

const app = express();

app.use(express.json());

// ✅ **Ana Sayfa**
app.get("/", (req, res) => {
    res.send("✅ Server is running! Bot Detection API: <a href='/server-botd'>/server-botd</a>");
});

// ✅ **Sunucu Tarafında Basit Bot Detection API'si**
app.post("/server-botd", async (req, res) => {
    const clientIp = requestIp.getClientIp(req);  // Kullanıcının IP adresini al
    const userAgent = req.headers["user-agent"] || "Bilinmiyor";  // Kullanıcının tarayıcı bilgilerini al

    // Bot olup olmadığını anlamak için basit bir analiz yapalım
    let isBot = false;

    // 🚨 **Şüpheli IP Aralıkları (Bot Olabilir)**
    const botIPPatterns = ["66.249", "74.125", "207.46", "17.57", "40.77"]; // Google, Bing, Apple, vb. botlar
    if (botIPPatterns.some(pattern => clientIp.startsWith(pattern))) {
        isBot = true;
    }

    // 🚨 **Şüpheli User-Agent Tespit (Bot Olabilir)**
    const botUserAgents = ["bot", "crawl", "spider", "slurp", "mediapartners"];
    if (botUserAgents.some(bot => userAgent.toLowerCase().includes(bot))) {
        isBot = true;
    }

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
