const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 10000;

// إعداد التخزين
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folderName = uuidv4();
    const dir = path.join(__dirname, "uploads", folderName);
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

// إعداد المجلدات الثابتة
app.use("/sites", express.static(path.join(__dirname, "uploads")));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// عرض صفحة الرفع
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// رفع الملفات
app.post("/upload", upload.array("files"), (req, res) => {
  const fullUrl = req.protocol + "://" + req.get("host") + "/sites/" + req.folderName;
  const time = new Date().toISOString();

  let data = [];
  const filePath = path.join(__dirname, "sites.json");
  if (fs.existsSync(filePath)) {
    data = JSON.parse(fs.readFileSync(filePath));
  }
  data.push({ url: fullUrl, time });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  fs.readFile(path.join(__dirname, "views", "uploaded.html"), "utf8", (err, html) => {
    if (err) return res.send("حدث خطأ!");
    const updated = html.replace(/__SITE_URL__/g, fullUrl);
    res.send(updated);
  });
});

// عرض جميع المواقع المرفوعة
app.get("/all-sites", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "all-sites.html"));
});

// عرض البيانات بصيغة JSON
app.get("/sites.json", (req, res) => {
  const filePath = path.join(__dirname, "sites.json");
  if (!fs.existsSync(filePath)) return res.json([]);
  const data = JSON.parse(fs.readFileSync(filePath));
  res.json(data);
});

// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
