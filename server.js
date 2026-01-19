const express = require("express");
const cors = require("cors");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { ethers } = require("ethers"); // переместил сюда, один раз

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- Supabase client ---
const supabaseUrl = "https://lmplzgjrpfpzjzcmdbkh.supabase.co"; // твой URL
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtcGx6Z2pycGZwemp6Y21kYmtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MTk3MzMsImV4cCI6MjA4NDM5NTczM30.cQ1GFMoow3yfExBKWE7wAclYP5b7tl_PZAcFZ5bAYlU"; // твой anon ключ
const supabase = createClient(supabaseUrl, supabaseKey);

// --- API для сохранения счета ---
app.post("/save-score", async (req, res) => {
  try {
    const { wallet, score, message, signature } = req.body;

    if (!wallet || score === undefined || !message || !signature) {
      return res.status(400).json({ success: false, error: "Missing fields" });
    }

    // Проверка подписи через ethers.js
    try {
      const recovered = ethers.verifyMessage(message, signature);
      if (recovered.toLowerCase() !== wallet.toLowerCase()) {
        return res.status(400).json({ success: false, error: "Invalid signature" });
      }
    } catch (err) {
      return res.status(400).json({ success: false, error: "Signature verification failed" });
    }

    // Сохраняем или обновляем счёт в Supabase
    const { data, error } = await supabase
      .from("scores")
      .upsert({ wallet, score }, { onConflict: ["wallet"] }); // onConflict = wallet, потому что wallet уникален

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    console.error("SAVE SCORE ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- API для leaderboard с пагинацией ---
app.get("/leaderboard", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    const { data, error } = await supabase
      .from("scores")
      .select("wallet, score")
      .order("score", { ascending: false })
      .range(from, to);

    if (error) throw error;

    res.json({ data, page });
  } catch (err) {
    console.error("LEADERBOARD ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Статические файлы фронтенда ---
app.use(express.static(path.join(__dirname)));

// --- Запуск сервера ---
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
