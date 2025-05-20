const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

module.exports = {
  // Ендпоінт POST /api/upload
  post: [
    upload.single('photo'),
    async function(req, res) {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      // Повертаємо шлях для фронтенду
      res.json({ url: `/uploads/${req.file.filename}` });
    }
  ]
};
