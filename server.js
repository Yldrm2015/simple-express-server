const express = require("express");
const cors = require("cors");
const axios = require("axios");

// **dotenv modülünü güvenli şekilde yükle**
try {
    require("dotenv").config();
} catch (error) {
    console.log("dotenv modülü yüklenemedi, ancak Render Environment Variables kullanılabilir.");
}

const app = express();
app.use(cors());

// **Secret Key artık Render Environment Variables'dan okunuyor**
const FINGERPRINT_SECRET_KEY = process.env.FINGERPRINT_SECRET_KEY;
const BOTD_API_URL = "https://api.fpjs.io/v1/botd";

app.get("/botd-test", async (req, res) => {
    try {
        const response = await axios.post(BOTD_API_URL, {}, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${FINGERPRINT_SECRET_KEY}`, // ✅ API Key Render'dan okunuyor
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" // ✅ Daha güvenilir olması için User-Agent eklendi
            }
        });

        res.json(response.data);
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
