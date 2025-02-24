const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());

// 📌 Avrupa API URL'sini kullanıyoruz!
const FINGERPRINT_SECRET_KEY = process.env.FINGERPRINT_SECRET_KEY;
const BOTD_API_URL = "https://eu.api.fpjs.io/v1/botd";  // Avrupa bölgesi API

app.get("/botd-test", async (req, res) => {
    try {
        // API Key kontrolü
        if (!FINGERPRINT_SECRET_KEY) {
            throw new Error("API Key bulunamadı! Lütfen Render Environment Variables içinde 'FINGERPRINT_SECRET_KEY' değişkenini tanımlayın.");
        }

        console.log("API Key:", FINGERPRINT_SECRET_KEY); // API Key'i logla
        console.log("API URL:", BOTD_API_URL); // API URL'sini logla

        // API'ye POST isteği gönder
        const response = await axios.post(BOTD_API_URL, {}, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${FINGERPRINT_SECRET_KEY}`,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Accept": "application/json"
            }
        });

        console.log("API Response:", response.data); // API cevabını logla

        // Başarılı cevabı istemciye gönder
        res.json(response.data);
    } catch (error) {
        console.error("🚨 BotD API Hatası:", error.response ? error.response.data : error.message);

        // Hata durumunda detaylı bilgi gönder
        res.status(error.response?.status || 500).json({
            error: "BotD API çalıştırılamadı!",
            status: error.response?.status || 500,
            details: error.response ? error.response.data : error.message,
            headers: error.response?.headers || {} // Hata durumunda header'ları da göster
        });
    }
});

// Sunucuyu başlat
const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
    console.log(`✅ BotD Test Sunucusu ${PORT} portunda çalışıyor.`);
});
