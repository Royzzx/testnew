
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  req.userAgent = req.get('User-Agent') || "Mozilla/5.0";
  next();
});

function getCookieZee5(userAgent) {
  const hash = crypto.createHash('md5').update(userAgent).digest('hex');
  const cacheFile = path.join(__dirname, 'tmp', `cookie_z5_${hash}.tmp`);
  const cacheExpiry = 43000 * 1000;

  if (fs.existsSync(cacheFile)) {
    const stats = fs.statSync(cacheFile);
    const age = Date.now() - stats.mtimeMs;
    if (age < cacheExpiry) {
      return fs.readFileSync(cacheFile, 'utf8');
    }
  }

  const cookie = `userAgent=${userAgent}`;
  fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
  fs.writeFileSync(cacheFile, cookie);
  return cookie;
}

app.get('/', (req, res) => {
  const id = req.query.id;
  if (!id) {
    return res.status(400).send('Channel id not found in parameter.');
  }

  const jsonPath = path.join(__dirname, 'data.json');
  if (!fs.existsSync(jsonPath)) {
    return res.status(500).send('data.json file not found.');
  }

  const jsonData = JSON.parse(fs.readFileSync(jsonPath));
  const channel = jsonData.data.find(ch => ch.id == id);

  if (!channel) {
    return res.status(404).send('Channel not found.');
  }

  const cookie = getCookieZee5(req.userAgent);
  res.json({ ...channel, cookie });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
