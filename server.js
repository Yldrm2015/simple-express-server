const express = require("express");
const { load } = require("@fingerprintjs/botd");
const cors = require("cors");

const app = express();
app.use(cors());

// 📌 **BotD Test Endpoint'i**
app.get("/botd-test", async (req, res) => {
    try {
        const botd = await load();
        const result = await botd.detect();
        
        res.json(result); // 📌 SADECE BotD'nin ürettiği sonucu döndür
    } catch (error) {
        console.error("BotD hata verdi:", error);
        res.status(500).json({ error: "BotD çalıştırılamadı!" });
    }
});

// 📌 Sunucu Portu Ayarla
const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
    console.log(`✅ BotD Test Sunucusu ${PORT} portunda çalışıyor.`);
});
