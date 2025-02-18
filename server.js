var express = require('express');
var bodyParser = require('body-parser');
var app = express();

// Allow all requests from all domains & localhost
app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "POST, GET");
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// Default ingredients array
var ingredients = [
    { "id": "234kjw", "text": "Eggs" },
    { "id": "as82w", "text": "Milk" },
    { "id": "234sk1", "text": "Bacon" },
    { "id": "ppo3j3", "text": "Frog Legs" }
];

// ✅ **ANA ROUTE EKLENDİ**
app.get('/', function(req, res) {
    res.send('✅ Server is running! You can test BotD at <a href="/botd-test">/botd-test</a>');
});

// ✅ **BOTD TEST ROUTE EKLENDİ**
app.get('/botd-test', async (req, res) => {
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
            <script>
                async function detectBot() {
                    const { Botd } = await import('https://cdn.jsdelivr.net/npm/@fingerprintjs/botd');
                    const botd = await Botd.load();
                    const result = await botd.detect();
                    console.log(result);
                    alert('Bot Detected: ' + result.bot);
                }
                detectBot();
            </script>
        </body>
        </html>
    `);
});

// **Mevcut API endpointleri**
app.get('/ingredients', function(req, res) {
    console.log("GET From SERVER");
    res.send(ingredients);
});

app.post('/ingredients', function(req, res) {
    var ingredient = req.body;
    console.log(req.body);
    ingredients.push(ingredient);
    res.status(200).send("Successfully posted ingredient");
});

// ✅ **PORT AYARI GÜNCELLENDİ**
const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
