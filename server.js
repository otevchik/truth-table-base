

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");
const { ethers } = require("ethers");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json()); // ВАЖНО


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
app.post("/save-score", (req, res) => {
  try {
    const { wallet, score, message, signature } = req.body;

    console.log("SAVE SCORE REQUEST:", req.body);

    if (!wallet || score === undefined || !message || !signature) {
      return res.status(400).json({
        success: false,
        error: "Missing fields"
      });
    }

    // временно НЕ проверяем подпись
    db.run(
      "INSERT INTO scores (wallet, score) VALUES (?, ?)",
      [wallet, score],
      (err) => {
        if (err) {
          console.error("DB ERROR:", err);
          return res.status(500).json({
            success: false,
            error: "Database error"
          });
        }

        res.json({ success: true });
      }
    );
  } catch (e) {
    console.error("SERVER CRASH:", e);
    res.status(500).json({
      success: false,
      error: "Server crashed"
    });
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
