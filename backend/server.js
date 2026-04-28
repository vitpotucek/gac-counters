import express from "express";
import fs from "fs";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = "./data.json";

// GET all counters
app.get("/counters", (req, res) => {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  res.json(data);
});

// ADD new counter
app.post("/counters", (req, res) => {
  const newCounter = req.body;

  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  data.push(newCounter);

  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

  res.json({ success: true, added: newCounter });
});

// DELETE counter by index
app.delete("/counters/:id", (req, res) => {
  const id = Number(req.params.id);

  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  const updated = data.filter((_, i) => i !== id);

  fs.writeFileSync(DATA_FILE, JSON.stringify(updated, null, 2));

  res.json({ success: true });
});

app.listen(3000, () => console.log("Backend běží na http://localhost:3000"));
