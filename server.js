const express = require('express');
const bodyParser = require('body-parser');
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

// ✅ **BOTD TEST ROUTE (DOĞRU ÇALIŞAN VERSİYON)**
app.get('/botd-test', async (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bot Detection</title>
            <script async src="https://openfpcdn.io/botd/v0"></script>
        </head>
        <body>
            <h1>Bot Detection Test</h1>
            <p id="result">Lütfen bekleyin...</p>
            <script>
                async function detectBot() {
                    try {
                        if (!window.botd) {
                            document.getElementById("result").innerText = "❌ BotD yüklenemedi!";
                            return;
                        }
                        const botd = await window.botd.load();
                        const result = await botd.detect();
                        document.getElementById("result").innerText = '✅ Bot Detected: ' + result.bot;
                    } catch (error) {
                        console.error("❌ BotD hata verdi:", error);
                        document.getElementById("result").innerText = "⚠️ BotD çalıştırılırken hata oluştu!";
                    }
                }
                detectBot();
            </script>
        </body>
        </html>
    `);
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
