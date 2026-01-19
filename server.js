const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");
const { ethers } = require("ethers");

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// --- База данных ---
const db = new sqlite3.Database("./database.sqlite", (err) => {
  if (err) console.error(err);
  else console.log("Connected to SQLite database");
});

// Создаём таблицу, если нет
db.run(`
  CREATE TABLE IF NOT EXISTS scores (
    wallet TEXT PRIMARY KEY,
    score INTEGER
  )
`);

// --- API для сохранения счета ---
app.post("/save-score", async (req, res) => {
  const { wallet, score, signature, message } = req.body;
  if (!wallet || !score || !signature || !message) {
    return res.status(400).json({ error: "Missing data" });
  }

  try {
    // Проверяем подпись
    const recovered = ethers.verifyMessage(message, signature);
    if (recovered.toLowerCase() !== wallet.toLowerCase()) {
      return res.status(400).json({ error: "Signature invalid" });
    }

    // Сохраняем счет: если уже есть - обновляем если больше
    db.run(
      `INSERT INTO scores (wallet, score) VALUES (?, ?)
       ON CONFLICT(wallet) DO UPDATE SET score = MAX(score, excluded.score)`,
      [wallet, score],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        return res.json({ success: true });
      }
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// --- API для leaderboard с пагинацией ---
app.get("/leaderboard", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  db.all(
    `SELECT wallet, score FROM scores ORDER BY score DESC LIMIT ? OFFSET ?`,
    [pageSize, offset],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ data: rows, page });
    }
  );
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});


const path = require("path");

// Делаем папку с фронтендом статической
app.use(express.static(path.join(__dirname)));

// Теперь, если зайти на http://localhost:3000/index.html, откроется игра
