import express from "express";
import fs from "fs";
import cors from "cors";
import { nanoid } from "nanoid";

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = "./data.json";

function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET all counters
app.get("/counters", (req, res) => {
  res.json(readData());
});

// ADD new counter
app.post("/counters", (req, res) => {
  const newCounter = { id: nanoid(), ...req.body };
  const data = readData();
  data.push(newCounter);
  writeData(data);
  res.json({ success: true, counter: newCounter });
});

// UPDATE counter
app.put("/counters/:id", (req, res) => {
  const { id } = req.params;
  const data = readData();
  const index = data.findIndex(c => c.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: "Not found" });
  }

  data[index] = { ...data[index], ...req.body };
  writeData(data);

  res.json({ success: true, counter: data[index] });
});

// DELETE counter
app.delete("/counters/:id", (req, res) => {
  const { id } = req.params;
  const data = readData();
  const filtered = data.filter(c => c.id !== id);

  if (filtered.length === data.length) {
    return res.status(404).json({ success: false, message: "Not found" });
  }

  writeData(filtered);
  res.json({ success: true });
});

app.listen(3000, () => {
  console.log("Backend běží na http://localhost:3000");
});
