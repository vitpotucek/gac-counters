let currentPage = 1;
const ROWS_PER_PAGE = 10;

let matchups = [];

async function loadJSON() {
  const response = await fetch("data.json");
  matchups = await response.json();
  currentPage = 1;
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

  if (tier) filtered = filtered.filter(m => m.tier === tier);
  if (type) filtered = filtered.filter(m => m.type === type);

  // stránkování
  const start = (currentPage - 1) * ROWS_PER_PAGE;
  const end = start + ROWS_PER_PAGE;
  const pageItems = filtered.slice(start, end);

  tableBody.innerHTML = "";

  pageItems.forEach(m => {
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
  renderPagination(filtered.length);
}

function renderPagination(totalItems) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  const totalPages = Math.ceil(totalItems / ROWS_PER_PAGE);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.classList.add("page-btn");
    if (i === currentPage) btn.classList.add("active");

    btn.addEventListener("click", () => {
      currentPage = i;
      render();
    });

    pagination.appendChild(btn);
  }
}

function updateSummary(list) {
  const total = list.length;
  totalMatchupsEl.textContent = total;

  if (total === 0) {
    avgWinrateEl.textContent = "0%";
    sTierCountEl.textContent = "0";
    document.getElementById("topCounters").innerHTML = "<p>Žádná data.</p>";
    document.getElementById("glCounters").innerHTML = "<p>Žádná data.</p>";
    return;
  }

  const avg = Math.round(list.reduce((sum, m) => sum + m.winrate, 0) / total);
  avgWinrateEl.textContent = `${avg}%`;

  const sCount = list.filter(m => m.tier === "S").length;
  sTierCountEl.textContent = sCount.toString();

  // TOP 5 COUNTERŮ
  const top = [...list]
    .sort((a, b) => b.winrate - a.winrate)
    .slice(0, 5);

  const topHTML = top.map(m => `
    <div class="recommend-card">
      <div class="recommend-title">${m.myLead} → ${m.enemyLead}</div>
      <div class="recommend-sub">Winrate: ${m.winrate}% (${m.wins}/${m.attempts})</div>
      <div class="recommend-sub">Tier: ${m.tier}</div>
    </div>
  `).join("");

  document.getElementById("topCounters").innerHTML = topHTML;

  // GL COUNTERS
  const glList = ["Rey", "Supreme Leader Kylo Ren", "Jedi Master Luke Skywalker", "Jedi Master Kenobi", "Jabba", "Leia Organa", "Lord Vader"];

  const glHTML = glList.map(gl => {
    const counters = list.filter(m => m.enemyLead.includes(gl));
    if (counters.length === 0) return "";

    const best = counters.sort((a, b) => b.winrate - a.winrate)[0];

    return `
      <div class="recommend-card">
        <div class="recommend-title">${gl}</div>
        <div class="recommend-sub">${best.myLead} → ${best.enemyLead}</div>
        <div class="recommend-sub">Winrate: ${best.winrate}% (${best.wins}/${best.attempts})</div>
      </div>
    `;
  }).join("");

  document.getElementById("glCounters").innerHTML = glHTML;
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

// reset stránky při změně filtrů
searchInput.addEventListener("input", () => { currentPage = 1; render(); });
tierFilter.addEventListener("change", () => { currentPage = 1; render(); });
typeFilter.addEventListener("change", () => { currentPage = 1; render(); });

loadJSON();
