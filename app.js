let matchups = [];

async function loadJSON() {
  const response = await fetch("data.json");
  matchups = await response.json();
  render();
}

function calcWinrate(m) {
  if (!m.attempts) return 0;
  return Math.round((m.wins / m.attempts) * 100);
}

function calcTier(winrate, attempts) {
  if (attempts >= 5 && winrate === 100) return "S";
  if (winrate >= 80) return "A";
  if (winrate >= 50) return "B";
  return "C";
}

const tableBody = document.getElementById("matchupTableBody");
const totalMatchupsEl = document.getElementById("totalMatchups");
const avgWinrateEl = document.getElementById("avgWinrate");
const sTierCountEl = document.getElementById("sTierCount");
const recommendationsEl = document.getElementById("recommendations");
const detailPanel = document.getElementById("detailPanel");

const searchInput = document.getElementById("searchInput");
const tierFilter = document.getElementById("tierFilter");
const typeFilter = document.getElementById("typeFilter");

function render() {
  const search = searchInput.value.toLowerCase();
  const tier = tierFilter.value;
  const type = typeFilter.value;

  let filtered = matchups.map((m, idx) => {
    const winrate = calcWinrate(m);
    const t = calcTier(winrate, m.attempts);
    return { ...m, id: idx, winrate, tier: t };
  });

  if (search) {
    filtered = filtered.filter(m =>
      m.enemyLead.toLowerCase().includes(search) ||
      m.myLead.toLowerCase().includes(search) ||
      (m.notes && m.notes.toLowerCase().includes(search))
    );
  }

  if (tier) {
    filtered = filtered.filter(m => m.tier === tier);
  }

  if (type) {
    filtered = filtered.filter(m => m.type === type);
  }

  tableBody.innerHTML = "";

  filtered.forEach(m => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${m.type}</td>
      <td>${m.enemyLead}</td>
      <td>${m.myLead}</td>
      <td>${m.winrate}%</td>
      <td><span class="badge badge-${m.tier}">${m.tier}</span></td>
      <td>${m.wins}/${m.attempts}</td>
    `;
    tr.addEventListener("click", () => showDetail(m));
    tableBody.appendChild(tr);
  });

  updateSummary(filtered);
}

function updateSummary(list) {
  const total = list.length;
  totalMatchupsEl.textContent = total;

  if (total === 0) {
    avgWinrateEl.textContent = "0%";
    sTierCountEl.textContent = "0";
    recommendationsEl.innerHTML = "<li>Žádná data pro aktuální filtr.</li>";
    return;
  }

  const avg = Math.round(
    list.reduce((sum, m) => sum + m.winrate, 0) / total
  );
  avgWinrateEl.textContent = `${avg}%`;

  const sCount = list.filter(m => m.tier === "S").length;
  sTierCountEl.textContent = sCount.toString();

  const best = list.filter(m => m.tier === "S").slice(0, 5);
  const risky = list.filter(m => m.tier === "C").slice(0, 5);

  recommendationsEl.innerHTML = "";

  if (best.length > 0) {
    const li = document.createElement("li");
    li.textContent = `S‑tier: ${best
      .map(m => `${m.myLead} → ${m.enemyLead} (${m.winrate}%)`)
      .join(" | ")}`;
    recommendationsEl.appendChild(li);
  }

  if (risky.length > 0) {
    const li2 = document.createElement("li");
    li2.textContent = `Rizikové: ${risky
      .map(m => `${m.myLead} → ${m.enemyLead} (${m.winrate}%)`)
      .join(" | ")}`;
    recommendationsEl.appendChild(li2);
  }
}

function showDetail(m) {
  const winrate = calcWinrate(m);
  const tier = calcTier(winrate, m.attempts);
  detailPanel.innerHTML = `
    <p><strong>Typ:</strong> ${m.type}</p>
    <p><strong>Enemy lead:</strong> ${m.enemyLead}</p>
    <p><strong>My lead:</strong> ${m.myLead}</p>
    <p><strong>Winrate:</strong> ${winrate}% (${m.wins}/${m.attempts})</p>
    <p><strong>Tier:</strong> <span class="badge badge-${tier}">${tier}</span></p>
    <p><strong>Poznámky:</strong> ${m.notes || "—"}</p>
  `;
}

searchInput.addEventListener("input", render);
tierFilter.addEventListener("change", render);
typeFilter.addEventListener("change", render);

// Přidání nového counteru
const addForm = document.getElementById("addForm");
const newType = document.getElementById("newType");
const newEnemy = document.getElementById("newEnemy");
const newMine = document.getElementById("newMine");
const newAttempts = document.getElementById("newAttempts");
const newWins = document.getElementById("newWins");
const newNotes = document.getElementById("newNotes");

addForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const attempts = parseInt(newAttempts.value, 10);
  const wins = parseInt(newWins.value, 10);

  matchups.push({
    type: newType.value,
    enemyLead: newEnemy.value.trim(),
    myLead: newMine.value.trim(),
    attempts: attempts,
    wins: wins,
    notes: newNotes.value.trim()
  });

  newEnemy.value = "";
  newMine.value = "";
  newAttempts.value = "1";
  newWins.value = "1";
  newNotes.value = "";

  render();
});

loadJSON();
