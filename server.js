const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());

// 📌 **FingerprintJS PRO Server API ile BotD'yi Sunucuda Çalıştırma**
const FINGERPRINT_API_KEY = "b80bbum6BTT6MT2eIb5B"; // Buraya kendi API key'ini ekledik
const BOTD_API_URL = "https://api.fpjs.io/botd/v1/detect";

app.get("/botd-test", async (req, res) => {
    try {
        // **Sunucu tarafında BotD API'yi çağırıyoruz**
        const response = await axios.post(BOTD_API_URL, {}, {
            headers: {
                "Content-Type": "application/json",
                "Auth-Token": FINGERPRINT_API_KEY
            }
        });

        res.json(response.data); // 📌 BotD'nin döndürdüğü sonucu direkt olarak istemciye gönderiyoruz
    } catch (error) {
        console.error("BotD Sunucu API Hatası:", error);
        res.status(500).json({ error: "BotD API Çalıştırılamadı!", details: error.message });
    }
});

// 📌 Sunucu Portu Ayarla
const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
    console.log(`✅ BotD Test Sunucusu ${PORT} portunda çalışıyor.`);
});
