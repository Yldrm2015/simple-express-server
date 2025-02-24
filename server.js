const express = require("express");
const { load } = require("@fingerprintjs/botd");
const cors = require("cors");

const app = express();
app.use(cors());

// 📌 Root Endpoint (Ana Sayfa)
app.get("/", (req, res) => {
    res.send("✅ Server is running! Test için: <a href='/botd-test'>BotD Testine Git</a>");
});

// 📌 BotD Test Endpoint’i
app.get("/botd-test", async (req, res) => {
    try {
        const botd = await load();
        const result = await botd.detect();
        
        res.json(result); // 📌 SADECE BotD'nin ürettiği sonucu döndür
    } catch (error) {
        console.error("BotD hata verdi:", error);  // 📌 Hata mesajını konsola yaz
        res.status(500).json({ error: "BotD çalıştırılamadı!", details: error.message });
    }
});

// 📌 Sunucu Portu Ayarla
const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
    console.log(`✅ BotD Test Sunucusu ${PORT} portunda çalışıyor.`);
});
