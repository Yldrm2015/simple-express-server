app.get('/botd-test', async (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bot Detection</title>
            <script src="https://cdn.jsdelivr.net/npm/@fingerprintjs/botd"></script>
        </head>
        <body>
            <h1>Bot Detection Test</h1>
            
            <!-- Eğer JavaScript kapalıysa kullanıcıya mesaj göster -->
            <noscript>
                <p style="color: red; font-weight: bold;">
                    ⚠ JavaScript devre dışı! Bot tespiti için JavaScript'i etkinleştirin.
                </p>
            </noscript>

            <p>Bot tespit süreci başladı...</p>
            <p id="result">Lütfen bekleyin...</p>

            <script>
                async function detectBot() {
                    try {
                        if (!window.botd) {
                            document.getElementById("result").innerText = "BotD yüklenemedi!";
                            return;
                        }
                        const botd = window.botd;
                        const result = await botd.detect();
                        console.log("Bot Detection Result:", result);
                        document.getElementById("result").innerText = '✅ Bot Detected: ' + result.bot;
                    } catch (error) {
                        console.error("⚠ BotD hata verdi:", error);
                        document.getElementById("result").innerText = "⚠ BotD çalıştırılırken hata oluştu!";
                    }
                }
                detectBot();
            </script>
        </body>
        </html>
    `);
});
