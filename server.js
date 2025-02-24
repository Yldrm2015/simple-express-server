const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());

// 📌 **FingerprintJS Server API için Secret Key**
const FINGERPRINT_SECRET_KEY = "pSHFS5NqRvfU3tw3hLp3"; // Secret Key buraya eklendi!
const BOTD_API_URL = "https://api.fpjs.io/v1/botd"; // **Doğru API URL kullanılıyor!**

app.get("/botd-test", async (req, res) => {
    try {
        // **Sunucu tarafında BotD API'yi çağırıyoruz**
        const response = await axios.post(BOTD_API_URL, {}, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${FINGERPRINT_SECRET_KEY}` // **DOĞRU HEADER!**
            }
        });

        res.json(response.data); // 📌 BotD'nin döndürdüğü sonucu direkt olarak istemciye gönderiyoruz
    } catch (error) {
        console.error("🚨 BotD Sunucu API Hatası:", error.response ? error.response.data : error.message);
        res.status(500).json({
            error: "BotD API Çalıştırılamadı!",
            details: error.response ? error.response.data : error.message
        });
    }
});

// 📌 Sunucu Portu Ayarla
const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
    console.log(`✅ BotD Test Sunucusu ${PORT} portunda çalışıyor.`);
});
