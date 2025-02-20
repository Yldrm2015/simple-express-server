const express = require("express");
const bodyParser = require("body-parser");
const requestIp = require("request-ip");
const useragent = require("useragent");

const app = express();

// 🚨 Sunucu Hata Yönetimi
process.on("uncaughtException", (err) => {
  console.error("🚨 Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("🚨 Unhandled Rejection at:", promise, "reason:", reason);
});

// ✅ CORS Ayarları
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "POST, GET");
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// ✅ **Ana Sayfa**
app.get("/", (req, res) => {
  res.send("✅ Server is running! Test için: <a href='/botd-test'>/botd-test</a>");
});

// ✅ **Bot Detection ve Tarayıcı Tespiti**
app.get("/botd-test", async (req, res) => {
  try {
    console.log("✅ Bot Detection başlatıldı...");
    const agent = useragent.parse(req.headers["user-agent"]);
    console.log("📌 Kullanıcı Tarayıcısı:", agent.toString());

    // Kullanıcının IP adresini al
    const ipAddress = requestIp.getClientIp(req);

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
          <p><strong>Tarayıcı:</strong> <span id="browser-info">Tespit ediliyor...</span></p>
          <p><strong>IP Adresiniz:</strong> <span id="ip-info">${ipAddress}</span></p>
          <p><strong>Gizli Modda mı?</strong> <span id="incognito">Kontrol ediliyor...</span></p>

          <script>
              async function detectBot() {
                  try {
                      const response = await fetch("https://api64.ipify.org?format=json");
                      const data = await response.json();
                      document.getElementById("ip-info").innerText = data.ip;
                  } catch (error) {
                      document.getElementById("ip-info").innerText = "❌ IP tespit edilemedi!";
                  }
              }
              detectBot();

              // **📌 Tarayıcı Tespiti**
              function getBrowserInfo() {
                  const userAgent = navigator.userAgent;
                  const vendor = navigator.vendor;
                  let browserName = "Bilinmiyor";

                  if (userAgent.includes("Firefox")) {
                      browserName = "Firefox";
                  } else if (userAgent.includes("SamsungBrowser")) {
                      browserName = "Samsung Internet";
                  } else if (userAgent.includes("Opera") || userAgent.includes("OPR")) {
                      browserName = "Opera";
                  } else if (userAgent.includes("Edg")) {
                      browserName = "Microsoft Edge";
                  } else if (userAgent.includes("Chrome")) {
                      if (vendor.includes("Google")) {
                          browserName = "Google Chrome";
                      } else if (vendor.includes("Brave")) {
                          browserName = "Brave";
                      } else {
                          browserName = "Chromium Tabanlı Tarayıcı";
                      }
                  } else if (userAgent.includes("Safari")) {
                      browserName = "Safari";
                  }

                  document.getElementById("browser-info").innerText = browserName;
              }
              getBrowserInfo();

              // **🕵️‍♂️ Gizli Mod Tespiti**
              async function isIncognito() {
                  return new Promise((resolve) => {
                      const fs = window.RequestFileSystem || window.webkitRequestFileSystem;
                      if (!fs) {
                          resolve(false);
                          return;
                      }
                      fs(window.TEMPORARY, 100, () => resolve(false), () => resolve(true));
                  });
              }

              isIncognito().then(result => {
                  document.getElementById("incognito").innerText = result ? "✅ Evet (Gizli Mod)" : "❌ Hayır (Normal Mod)";
              });

          </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("🚨 Sunucu Hatası:", error);
    res.status(500).send("🚨 Sunucu Hatası! Logları Kontrol Et.");
  }
});

// ✅ **PORT AYARLANDI**
const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
