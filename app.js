/* ============================================================
   GAC COUNTERS – COUNTERS VIEW + ANALYTICS VIEW
   ============================================================ */

/* ---------- GLOBAL STATE ---------- */

let matchups = [];
let filterEnemyOnly = false;
let currentPage = 1;

/* ---------- ELEMENTS ---------- */

const countersSection = document.getElementById("countersSection");
const analyticsSection = document.getElementById("analyticsSection");

const navCounters = document.getElementById("navCounters");
const navAnalytics = document.getElementById("navAnalytics");

const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");

/* ============================================================
   SIDEBAR TOGGLE
   ============================================================ */

menuToggle.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

/* ============================================================
   PAGE SWITCHING (NEW LAYOUT)
   ============================================================ */

function showCounters() {
  countersSection.classList.add("visible");
  analyticsSection.classList.remove("visible");

  navCounters.classList.add("active");
  navAnalytics.classList.remove("active");
}

function showAnalytics() {
  analyticsSection.classList.add("visible");
  countersSection.classList.remove("visible");

  navAnalytics.classList.add("active");
  navCounters.classList.remove("active");
}

navCounters.addEventListener("click", showCounters);
navAnalytics.addEventListener("click", showAnalytics);

/* ============================================================
   COLLAPSIBLE CARDS
   ============================================================ */

document.addEventListener("click", (e) => {
  const header = e.target.closest(".collapsible-header");
  if (!header) return;

  const card = header.closest(".collapsible-card");
  card.classList.toggle("open");
});

/* ============================================================
   AUTOCOMPLETE
   ============================================================ */

const searchInput = document.getElementById("searchInput");
const autocompleteList = document.getElementById("autocompleteList");

searchInput.addEventListener("input", () => {
  const value = searchInput.value.trim().toLowerCase();
  if (!value) {
    autocompleteList.style.display = "none";
    return;
  }

  const suggestions = [...new Set(matchups.map(m => m.enemy.toLowerCase()))]
    .filter(name => name.includes(value))
    .slice(0, 10);

  autocompleteList.innerHTML = suggestions
    .map(s => `<div class="autocomplete-item">${s}</div>`)
    .join("");

  autocompleteList.style.display = suggestions.length ? "block" : "none";
});

autocompleteList.addEventListener("click", (e) => {
  if (!e.target.classList.contains("autocomplete-item")) return;

  searchInput.value = e.target.textContent;
  autocompleteList.style.display = "none";
  applyFilters();
});

/* ============================================================
   FILTERS
   ============================================================ */

document.getElementById("resetFilterBtn").addEventListener("click", () => {
  searchInput.value = "";
  document.getElementById("tierFilter").value = "";
  document.getElementById("typeFilter").value = "";
  applyFilters();
});

/* ============================================================
   MATCHUP TABLE RENDERING
   ============================================================ */

function renderTable(data) {
  const tbody = document.getElementById("matchupTableBody");
  tbody.innerHTML = data
    .map(m => `
      <tr data-id="${m.id}">
        <td>${m.type}</td>
        <td>${m.enemy}</td>
        <td>${m.my}</td>
        <td>${m.winrate}%</td>
        <td><span class="badge badge-${m.tier}">${m.tier}</span></td>
        <td>${m.attempts}</td>
      </tr>
    `)
    .join("");
}

/* ============================================================
   PAGINATION
   ============================================================ */

function renderPagination(totalPages) {
  const container = document.getElementById("pagination");
  container.innerHTML = "";

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = "page-btn" + (i === currentPage ? " active" : "");
    btn.addEventListener("click", () => {
      currentPage = i;
      applyFilters();
    });
    container.appendChild(btn);
  }
}

/* ============================================================
   FILTER LOGIC
   ============================================================ */

function applyFilters() {
  const search = searchInput.value.trim().toLowerCase();
  const tier = document.getElementById("tierFilter").value;
  const type = document.getElementById("typeFilter").value;

  let filtered = matchups;

  if (search) {
    filtered = filtered.filter(m =>
      m.enemy.toLowerCase().includes(search)
    );
  }

  if (tier) {
    filtered = filtered.filter(m => m.tier === tier);
  }

  if (type) {
    filtered = filtered.filter(m => m.type === type);
  }

  const pageSize = 20;
  const totalPages = Math.ceil(filtered.length / pageSize);

  const pageData = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  renderTable(pageData);
  renderPagination(totalPages);
}

/* ============================================================
   DETAIL PANEL
   ============================================================ */

document.addEventListener("click", (e) => {
  const row = e.target.closest("tr[data-id]");
  if (!row) return;

  const id = row.getAttribute("data-id");
  const item = matchups.find(m => m.id == id);

  const panel = document.getElementById("detailPanel");
  panel.innerHTML = `
    <h3>${item.enemy} → ${item.my}</h3>
    <p>Winrate: ${item.winrate}%</p>
    <p>Attempts: ${item.attempts}</p>
    <p>Tier: ${item.tier}</p>
  `;
});

/* ============================================================
   INITIAL LOAD
   ============================================================ */

fetch("data.json")
  .then(res => res.json())
  .then(data => {
    matchups = data;
    applyFilters();
  });
