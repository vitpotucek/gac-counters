/* ============================================================
   GAC COUNTERS – CLEAN STATIC VERSION (REVISED)
   ============================================================ */

/* ---------- GLOBAL STATE ---------- */

let matchups = [];
let filterEnemyOnly = false;
let currentPage = 1;

const ROWS_PER_PAGE = 10;

/* ---------- DOM ELEMENTS ---------- */

const tableBody = document.getElementById("matchupTableBody");
const detailPanel = document.getElementById("detailPanel");

const searchInput = document.getElementById("searchInput");
const tierFilter = document.getElementById("tierFilter");
const typeFilter = document.getElementById("typeFilter");

const autocompleteList = document.getElementById("autocompleteList");

/* ---------- INITIALIZATION ---------- */

document.addEventListener("DOMContentLoaded", () => {
  setupCollapsible();
  loadJSON();
});

/* ---------- LOAD DATA ---------- */

async function loadJSON() {
  const response = await fetch("data.json");
  matchups = await response.json();
  currentPage = 1;
  render();
}

/* ---------- COLLAPSIBLE GL SECTION ---------- */

function setupCollapsible() {
  const card = document.querySelector(".collapsible-card");
  const header = document.querySelector(".collapsible-header");

  card.classList.remove("open");
  header.addEventListener("click", () => card.classList.toggle("open"));
}

/* ---------- CALCULATIONS ---------- */

function calcWinrate(m) {
  return m.attempts ? Math.round((m.wins / m.attempts) * 100) : 0;
}

function calcTier(winrate, attempts) {
  if (attempts >= 5 && winrate === 100) return "S";
  if (winrate >= 80) return "A";
  if (winrate >= 50) return "B";
  return "C";
}

function enrichMatchups(list) {
  return list.map((m, idx) => {
    const winrate = calcWinrate(m);
    return {
      ...m,
      id: idx,
      winrate,
      tier: calcTier(winrate, m.attempts)
    };
  });
}

/* ---------- RENDER MAIN TABLE ---------- */

function render() {
  const search = searchInput.value.toLowerCase();
  const tier = tierFilter.value;
  const type = typeFilter.value;

  let filtered = enrichMatchups(matchups);

  // SEARCH
  if (search) {
    filtered = filtered.filter(m =>
      filterEnemyOnly
        ? m.enemyLead.toLowerCase().includes(search)
        : (
            m.enemyLead.toLowerCase().includes(search) ||
            m.myLead.toLowerCase().includes(search) ||
            (m.notes && m.notes.toLowerCase().includes(search))
          )
    );
  }

  // FILTERS
  if (tier) filtered = filtered.filter(m => m.tier === tier);
  if (type) filtered = filtered.filter(m => m.type === type);

  // PAGINATION
  const start = (currentPage - 1) * ROWS_PER_PAGE;
  const pageItems = filtered.slice(start, start + ROWS_PER_PAGE);

  // RENDER TABLE
  tableBody.innerHTML = pageItems
    .map(
      m => `
      <tr>
        <td>${m.type}</td>
        <td>${m.enemyLead}</td>
        <td>${m.myLead}</td>
        <td>${m.winrate}%</td>
        <td><span class="badge badge-${m.tier}">${m.tier}</span></td>
        <td>${m.wins}/${m.attempts}</td>
      </tr>
    `
    )
    .join("");

  // CLICK HANDLERS
  tableBody.querySelectorAll("tr").forEach((tr, i) => {
    tr.addEventListener("click", () => showDetail(pageItems[i]));
  });

  updateSummary();
  renderPagination(filtered.length);
}

/* ---------- PAGINATION ---------- */

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

/* ---------- SUMMARY (GL COUNTERS) ---------- */

function updateSummary() {
  const fullList = enrichMatchups(matchups);

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

  const glHTML = glList
    .map(gl => {
      const counters = fullList.filter(m => m.enemyLead === gl);
      if (!counters.length) return "";

      const best = counters.reduce((a, b) => (b.winrate > a.winrate ? b : a));

      return `
        <div class="gl-tile gl-${gl.replace(/ /g, "-")}" onclick="filterForGL('${gl}')">
          <div class="gl-title">${gl}</div>
        </div>
      `;
    })
    .join("");

  document.getElementById("glCounters").innerHTML = glHTML;
}

/* ---------- DETAIL PANEL ---------- */

function showDetail(m) {
  detailPanel.innerHTML = `
    <p><strong>Type:</strong> ${m.type}</p>
    <p><strong>Enemy lead:</strong> ${m.enemyLead}</p>
    <p><strong>My lead:</strong> ${m.myLead}</p>
    <p><strong>Winrate:</strong> ${m.winrate}% (${m.wins}/${m.attempts})</p>
    <p><strong>Tier:</strong> <span class="badge badge-${m.tier}">${m.tier}</span></p>
    <p><strong>Notes:</strong> ${m.notes || "—"}</p>
  `;
}

/* ---------- FILTERING ---------- */

function filterForGL(glName) {
  filterEnemyOnly = true;
  searchInput.value = glName;
  typeFilter.value = "";
  currentPage = 1;
  render();

  try {
    document.querySelector(".table-section").scrollIntoView({ behavior: "smooth" });
  } catch {}
}

function resetFilters() {
  searchInput.value = "";
  tierFilter.value = "";
  typeFilter.value = "";
  filterEnemyOnly = false;
  currentPage = 1;
  render();
}

/* ---------- AUTOCOMPLETE ---------- */

function updateAutocomplete() {
  const text = searchInput.value.toLowerCase();

  if (!text) return (autocompleteList.style.display = "none");

  const suggestions = [...new Set(
    matchups
      .flatMap(m =>
        filterEnemyOnly ? [m.enemyLead] : [m.enemyLead, m.myLead]
      )
      .filter(name => name.toLowerCase().includes(text))
  )].slice(0, 10);

  if (!suggestions.length) return (autocompleteList.style.display = "none");

  autocompleteList.innerHTML = suggestions
    .map(s => `<div class="autocomplete-item" data-value="${s}">${s}</div>`)
    .join("");

  autocompleteList.style.display = "block";
}

/* ---------- EVENT LISTENERS ---------- */

searchInput.addEventListener("input", () => {
  filterEnemyOnly = false;
  currentPage = 1;
  updateAutocomplete();
  render();
});

autocompleteList.addEventListener("click", e => {
  if (e.target.classList.contains("autocomplete-item")) {
    searchInput.value = e.target.dataset.value;
    filterEnemyOnly = false;
    currentPage = 1;
    render();
    autocompleteList.style.display = "none";
  }
});

tierFilter.addEventListener("change", () => {
  autocompleteList.style.display = "none";
  currentPage = 1;
  render();
});

typeFilter.addEventListener("change", () => {
  autocompleteList.style.display = "none";
  currentPage = 1;
  render();
});

document.getElementById("resetFilterBtn").addEventListener("click", resetFilters);

document.addEventListener("click", e => {
  if (!e.target.closest(".search-wrapper") &&
      !e.target.closest("#autocompleteList")) {
    autocompleteList.style.display = "none";
  }
});
