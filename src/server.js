const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 10000;

const rootDir = __dirname;

// إعداد التخزين
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folderName = uuidv4();
    const dir = path.join(rootDir, "uploads", folderName);
    fs.mkdirSync(dir, { recursive: true });
    req.folderPath = dir;
    req.folderName = folderName;
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

// مجلدات ثابتة
app.use("/sites", express.static(path.join(rootDir, "uploads")));
app.use(express.urlencoded({ extended: true }));

// الصفحة الرئيسية (رفع)
app.get("/", (req, res) => {
  res.sendFile(path.join(rootDir, "views", "index.html"));
});

// عند الرفع
app.post("/upload", upload.array("files"), (req, res) => {
  const siteUrl = req.protocol + "://" + req.get("host") + "/sites/" + req.folderName;
  const time = new Date().toISOString();

  const recordFile = path.join(rootDir, "sites.json");
  let data = [];
  if (fs.existsSync(recordFile)) {
    data = JSON.parse(fs.readFileSync(recordFile));
  }
  data.push({ url: siteUrl, time });
  fs.writeFileSync(recordFile, JSON.stringify(data, null, 2));

  fs.readFile(path.join(rootDir, "views", "uploaded.html"), "utf8", (err, html) => {
    if (err) return res.send("حدث خطأ أثناء عرض النتيجة.");
    const resultPage = html.replace(/__SITE_URL__/g, siteUrl);
    res.send(resultPage);
  });
});

// عرض المواقع المرفوعة
app.get("/all-sites", (req, res) => {
  const recordFile = path.join(rootDir, "sites.json");
  if (!fs.existsSync(recordFile)) return res.send("لا توجد مواقع بعد.");

  const data = JSON.parse(fs.readFileSync(recordFile));
  let html = `<html><head><title>📂 المواقع المرفوعة</title><meta charset="UTF-8" /><style>
    body{background:#111;color:#0cf;font-family:sans-serif;text-align:center;padding:20px}
    .site{margin:15px;padding:10px;background:#222;border-radius:10px}
    a{color:#0ff;font-weight:bold}
  </style></head><body><h1>📁 قائمة المواقع المرفوعة</h1>`;
  data.reverse().forEach(site => {
    html += `<div class="site"><a href="${site.url}" target="_blank">${site.url}</a><br><small>📅 ${site.time}</small></div>`;
  });
  html += `</body></html>`;
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
