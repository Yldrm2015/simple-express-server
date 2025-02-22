const express = require("express");
const requestIp = require("request-ip");
const { Botd } = require("@fingerprintjs/botd-node");

const app = express();
const botd = new Botd();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ **Ana Sayfa**
app.get("/", (req, res) => {
    res.send("✅ Server is running! Bot Detection API: <a href='/server-botd'>/server-botd</a>");
});

// ✅ **Sunucu Tarafında Bot Tespit API'si**
app.post("/server-botd", async (req, res) => {
    const clientIp = requestIp.getClientIp(req);  // Kullanıcının IP adresini al
    const userAgent = req.headers["user-agent"];  // Kullanıcının tarayıcı bilgilerini al

    try {
        // Bot detection işlemini çalıştır
        const botResult = await botd.detect({
            ip: clientIp,
            headers: req.headers
        });

        res.json({
            success: true,
            ip: clientIp,
            userAgent: userAgent,
            botDetection: botResult
        });
    } catch (error) {
        console.error("🚨 Bot Detection Hatası:", error);
        res.status(500).json({ success: false, message: "Bot detection hatası oluştu!" });
    }
});

// ✅ **Sunucu Başlat**
const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});
