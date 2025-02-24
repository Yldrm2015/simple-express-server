const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());

// 📌 **Public Key tarayıcı tarafında, Secret Key sunucu tarafında kullanılır.**
const FINGERPRINT_SECRET_KEY = "pSHFS5NqRvfU3tw3hLp3"; // Senin gerçek Secret Key'in buraya yazılmalı.
const BOTD_API_URL = "https://api.fpjs.io/v1/botd";

app.get("/botd-test", async (req, res) => {
    try {
        // **Sunucu tarafında API çağrısını yapıyoruz**
        const response = await axios.post(BOTD_API_URL, {}, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${FINGERPRINT_SECRET_KEY}`, // ✅ Sunucu için Secret Key kullanılıyor.
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            }
        });

        res.json(response.data); // 📌 API'nin döndürdüğü sonucu istemciye gönderiyoruz.
    } catch (error) {
        console.error("🚨 BotD API Hatası:", error.response ? error.response.data : error.message);

        res.status(error.response?.status || 500).json({
            error: "BotD API çalıştırılamadı!",
            status: error.response?.status || 500,
            details: error.response ? error.response.data : error.message
        });
    }
});

const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
    console.log(`✅ BotD Test Sunucusu ${PORT} portunda çalışıyor.`);
});
