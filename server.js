const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch'); // Eksik modülü ekledik
const app = express();

// Allow all requests from all domains & localhost
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "POST, GET");
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// ✅ **ANA SAYFA ROUTE (BOTD TEST LİNKİ EKLENDİ)**
app.get('/', (req, res) => {
    res.send('✅ Server is running! You can test BotD at <a href="/botd-test">/botd-test</a>');
});

// ✅ **BOTD TEST ROUTE (API KEY İLE ÇALIŞAN)**
app.get('/botd-test', async (req, res) => {
    try {
        console.log("🔄 BotD API çağrılıyor...");

        // 👉 **BURAYA KENDİ API KEY'İNİ YAZ**
        const API_KEY = "YOUR_API_KEY_HERE"; 

        const response = await fetch("https://api.fpjs.io/botd", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Auth-Token": API_KEY 
            },
            body: JSON.stringify({})
        });

        if (!response.ok) {
            console.error("❌ API yanıtı başarısız! HTTP Status:", response.status);
            throw new Error(`BotD API'ye bağlanırken hata oluştu. HTTP Status: ${response.status}`);
        }

        const result = await response.json();
        console.log("✅ Bot Detection Result:", result);

        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Bot Detection</title>
            </head>
            <body>
                <h1>Bot Detection Test</h1>
                <p>Bot Detected: ${result.bot.result}</p>
                <p>Details: ${JSON.stringify(result, null, 2)}</p>
            </body>
            </html>
        `);
    } catch (error) {
        console.error("❌ BotD hata verdi:", error);
        res.send(`⚠️ BotD çalıştırılırken hata oluştu! <br> Hata Detayı: ${error.message}`);
    }
});

// **Mevcut API endpointleri**
app.get('/ingredients', (req, res) => {
    console.log("GET From SERVER");
    res.send([
        { "id": "234kjw", "text": "Eggs" },
        { "id": "as82w", "text": "Milk" },
        { "id": "234sk1", "text": "Bacon" },
        { "id": "ppo3j3", "text": "Frog Legs" }
    ]);
});

app.post('/ingredients', (req, res) => {
    console.log(req.body);
    res.status(200).send("Successfully posted ingredient");
});

// ✅ **PORT AYARI GÜNCELLENDİ**
const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});
