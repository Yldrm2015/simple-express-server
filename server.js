app.get('/botd-test', async (req, res) => {
    const agent = useragent.parse(req.headers['user-agent']); // Kullanıcı tarayıcı bilgisi
    const browserName = agent.family; // Tarayıcı ismi (Chrome, Firefox, Edge vb.)
    const browserVersion = agent.major; // Tarayıcı sürümü

    // ✅ **Brave Tarayıcısını Tespit Et**
    let isBrave = false;
    if (req.headers['user-agent'].includes("Brave") || browserName === "Chrome" && !("google" in window)) {
        isBrave = true;
    }

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bot Detection & Browser Info</title>
        </head>
        <body>
            <h1>Bot Detection Test</h1>
            <p id="result">Lütfen bekleyin...</p>
            <p><strong>Tarayıcı:</strong> <span id="browser">${isBrave ? "Brave" : browserName} ${browserVersion}</span></p>

            <script type="module">
                import { load } from 'https://cdn.jsdelivr.net/npm/@fingerprintjs/botd@latest/+esm';

                async function detectBot() {
                    try {
                        const botd = await load();
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
