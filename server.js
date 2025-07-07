// 🚀 سيرفر استضافة مواقع HTML بواسطة طرزان الواقدي
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3000;

// إعداد التخزين
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const siteID = uuidv4();
    const sitePath = path.join(__dirname, "uploads", siteID);
    fs.mkdirSync(sitePath, { recursive: true });
    req.siteID = siteID;
    cb(null, sitePath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

// ملفات ثابتة
app.use("/sites", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "views")));
app.use(express.urlencoded({ extended: true }));

// ⬅️ صفحة البداية
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// 🔼 رفع الملفات
app.post("/upload", upload.array("files"), (req, res) => {
  const siteID = req.siteID;
  const link = `/sites/${siteID}/index.html`;
  const fullURL = req.protocol + "://" + req.get("host") + link;

  // حفظ في سجل JSON
  const logPath = path.join(__dirname, "sites.json");
  let sites = [];
  if (fs.existsSync(logPath)) {
    sites = JSON.parse(fs.readFileSync(logPath));
  }
  sites.unshift({ id: siteID, url: fullURL, time: new Date().toISOString() });
  fs.writeFileSync(logPath, JSON.stringify(sites, null, 2));

  // عرض صفحة النجاح
  fs.readFile(path.join(__dirname, "views", "uploaded.html"), "utf8", (err, data) => {
    const html = data.replace(/__SITE_URL__/g, fullURL);
    res.send(html);
  });
});

// 📂 عرض كل المواقع المرفوعة
app.get("/all-sites", (req, res) => {
  const logPath = path.join(__dirname, "sites.json");
  let sites = [];
  if (fs.existsSync(logPath)) {
    sites = JSON.parse(fs.readFileSync(logPath));
  }

  let items = sites.map(site => `
    <div class="site-card">
      <p><strong>📎</strong> ${site.url}</p>
      <button onclick="copyLink('${site.url}')">📋 نسخ</button>
      <a href="${site.url}" target="_blank">🌐 زيارة</a>
      <span class="time">⏱️ ${new Date(site.time).toLocaleString()}</span>
    </div>
  `).join("");

  const page = `
    <html lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>📂 المواقع المرفوعة</title>
      <style>
        body { background:#111; color:#fff; font-family:sans-serif; padding:20px; text-align:center; }
        .site-card { background:#222; border-radius:10px; padding:15px; margin:10px auto; width:90%; max-width:500px; box-shadow:0 0 10px #0ff; }
        .site-card button, .site-card a { margin:5px; padding:10px 15px; background:#0cf; color:white; border:none; border-radius:8px; cursor:pointer; text-decoration:none; display:inline-block; }
        .site-card a:hover, .site-card button:hover { background:#09a; }
        .time { display:block; margin-top:10px; font-size:0.8rem; color:#aaa; }
      </style>
    </head>
    <body>
      <h1>📂 المواقع التي تم رفعها</h1>
      ${items}
      <script>
        function copyLink(link) {
          navigator.clipboard.writeText(link).then(() => alert('✅ تم نسخ الرابط!'));
        }
      </script>
    </body>
    </html>
  `;

  res.send(page);
});

// 🚀 بدء السيرفر
app.listen(PORT, () => {
  console.log(`✅ يعمل على http://localhost:${PORT}`);
});
