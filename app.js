let filterEnemyOnly = false;

let currentPage = 1;
const ROWS_PER_PAGE = 10;



let matchups = [];

async function loadJSON() {
  const response = await fetch("data.json");
  matchups = await response.json();
  currentPage = 1;
  render();
}

document.addEventListener("DOMContentLoaded", () => {
  const card = document.querySelector(".collapsible-card");
  const header = document.querySelector(".collapsible-header");

  // defaultně zavřené
  card.classList.remove("open");

  header.addEventListener("click", () => {
    card.classList.toggle("open");
  });
});


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

const autocompleteList = document.getElementById("autocompleteList");
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
  if (filterEnemyOnly) {
    // filtrujeme jen podle enemyLead
    filtered = filtered.filter(m =>
      m.enemyLead.toLowerCase().includes(search)
    );
  } else {
    // původní chování
    filtered = filtered.filter(m =>
      m.enemyLead.toLowerCase().includes(search) ||
      m.myLead.toLowerCase().includes(search) ||
      (m.notes && m.notes.toLowerCase().includes(search))
    );
  }
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
  const fullList = matchups.map((m, idx) => {
    const winrate = calcWinrate(m);
    const t = calcTier(winrate, m.attempts);
    return { ...m, id: idx, winrate, tier: t };
  });

  // GL doporučení

  const glList = [
    "Ahsoka Tano",
    "Rey",
    "Supreme Leader Kylo Ren",
    "Jedi Master Luke Skywalker",
    "Jedi Master Kenobi",
    "Jabba",
    "Leia Organa",
    "Lord Vader",
    "Pirate King Hondo Ohnaka",
    "Sith Eternal Emperor"
  ];

  const glHTML = glList.map(gl => {
    const counters = fullList.filter(m => m.enemyLead.includes(gl));
    if (counters.length === 0) return "";

    const best = counters.sort((a, b) => b.winrate - a.winrate)[0];

    return `
  <div class="gl-tile gl-${gl.replace(/ /g, "-")}" onclick="filterForGL('${gl}')">
    <div class="gl-title">${gl}</div>
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


function filterForGL(glName) {
  // zapneme režim "filtruj jen enemyLead"
  filterEnemyOnly = true;

  // nastavíme vyhledávání
  searchInput.value = glName;

  // necháme všechny typy
  typeFilter.value = "";

  currentPage = 1;
  render();

  document.querySelector(".table-section").scrollIntoView({
    behavior: "smooth"
  });
}

function resetFilters() {
  searchInput.value = "";
  tierFilter.value = "";
  typeFilter.value = "";
  filterEnemyOnly = false;
  currentPage = 1;
  render();
}

function updateAutocomplete() {
  const text = searchInput.value.toLowerCase();
  if (!text) {
    autocompleteList.style.display = "none";
    return;
  }

  // unikátní návrhy z enemyLead + myLead
  const suggestions = [...new Set(
    matchups
      .flatMap(m => [m.enemyLead, m.myLead])
      .filter(name => name.toLowerCase().includes(text))
  )].slice(0, 10); // max 10 návrhů

  if (suggestions.length === 0) {
    autocompleteList.style.display = "none";
    return;
  }

  autocompleteList.innerHTML = suggestions
    .map(s => `<div class="autocomplete-item" data-value="${s}">${s}</div>`)
    .join("");

  autocompleteList.style.display = "block";
}



// reset stránky při změně filtrů
searchInput.addEventListener("input", () => { 
  filterEnemyOnly = false; 
  currentPage = 1; 
  updateAutocomplete();
  render(); 
});
autocompleteList.addEventListener("click", (e) => {
  if (e.target.classList.contains("autocomplete-item")) {
    const value = e.target.getAttribute("data-value");
    searchInput.value = value;
    filterEnemyOnly = false;
    currentPage = 1;
    render();
    autocompleteList.style.display = "none";
  }
});

tierFilter.addEventListener("change", () => { currentPage = 1; render(); });
typeFilter.addEventListener("change", () => { currentPage = 1; render(); });
document.getElementById("resetFilterBtn").addEventListener("click", resetFilters);
document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-wrapper") && !e.target.closest("#autocompleteList")) {
    autocompleteList.style.display = "none";
  }
});



loadJSON();
