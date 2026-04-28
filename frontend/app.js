/* ============================================================
   GAC COUNTERS – FRONTEND S BACKENDEM + CRUD
   ============================================================ */

const API_BASE = "http://localhost:3000";

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
const addCounterForm = document.getElementById("addCounterForm");

/* ---------- INIT ---------- */

document.addEventListener("DOMContentLoaded", () => {
  setupCollapsible();
  loadCounters();
});

/* ---------- BACKEND CALLS ---------- */

async function loadCounters() {
  const response = await fetch(`${API_BASE}/counters`);
  matchups = await response.json();
  currentPage = 1;
  render();
}

async function addCounter(counter) {
  await fetch(`${API_BASE}/counters`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(counter)
  });
  await loadCounters();
}

async function updateCounter(id, updates) {
  await fetch(`${API_BASE}/counters/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates)
  });
  await loadCounters();
}

async function deleteCounter(id) {
  await fetch(`${API_BASE}/counters/${id}`, {
    method: "DELETE"
  });
  await loadCounters();
}

/* ---------- COLLAPSIBLE ---------- */

function setupCollapsible() {
  const card = document.querySelector(".collapsible-card");
  const header = document.querySelector(".collapsible-header");

  card.classList.remove("open");

  header.addEventListener("click", () => {
    card.classList.toggle("open");
  });
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
  return list.map(m => {
    const winrate = calcWinrate(m);
    return {
      ...m,
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

  if (search) {
    filtered = filtered.filter(m => {
      if (filterEnemyOnly) {
        return m.enemyLead.toLowerCase().includes(search);
      }
      return (
        m.enemyLead.toLowerCase().includes(search) ||
        m.myLead.toLowerCase().includes(search) ||
        (m.notes && m.notes.toLowerCase().includes(search))
      );
    });
  }

  if (tier) filtered = filtered.filter(m => m.tier === tier);
  if (type) filtered = filtered.filter(m => m.type === type);

  const start = (currentPage - 1) * ROWS_PER_PAGE;
  const pageItems = filtered.slice(start, start + ROWS_PER_PAGE);

  tableBody.innerHTML = pageItems
    .map(
      m => `
      <tr data-id="${m.id}">
        <td>${m.type}</td>
        <td>${m.enemyLead}</td>
        <td>${m.myLead}</td>
        <td>${m.winrate}%</td>
        <td><span class="badge badge-${m.tier}">${m.tier}</span></td>
        <td>${m.wins}/${m.attempts}</td>
        <td>
          <button class="page-btn btn-small edit-btn">Edit</button>
          <button class="page-btn btn-small delete-btn">X</button>
        </td>
      </tr>
    `
    )
    .join("");

  tableBody.querySelectorAll("tr").forEach((tr, i) => {
    const rowData = pageItems[i];

    tr.addEventListener("click", e => {
      // aby klik na tlačítka nespouštěl detail
      if (e.target.classList.contains("edit-btn") ||
          e.target.classList.contains("delete-btn")) {
        return;
      }
      showDetail(rowData);
    });

    const editBtn = tr.querySelector(".edit-btn");
    const deleteBtn = tr.querySelector(".delete-btn");

    editBtn.addEventListener("click", e => {
      e.stopPropagation();
      openEditPrompt(rowData);
    });

    deleteBtn.addEventListener("click", async e => {
      e.stopPropagation();
      if (confirm("Opravdu smazat tento counter?")) {
        await deleteCounter(rowData.id);
      }
    });
  });

  updateSummary(filtered);
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

/* ---------- SUMMARY (GL) ---------- */

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
      const counters = fullList.filter(m => m.enemyLead.includes(gl));
      if (!counters.length) return "";

      const best = counters.sort((a, b) => b.winrate - a.winrate)[0];

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

/* ---------- AUTOCOMPLETE ---------- */

function updateAutocomplete() {
  const text = searchInput.value.toLowerCase();

  if (!text) {
    autocompleteList.style.display = "none";
    return;
  }

  const suggestions = [...new Set(
    matchups
      .flatMap(m =>
        filterEnemyOnly ? [m.enemyLead] : [m.enemyLead, m.myLead]
      )
      .filter(name => name.toLowerCase().includes(text))
  )].slice(0, 10);

  if (!suggestions.length) {
    autocompleteList.style.display = "none";
    return;
  }

  autocompleteList.innerHTML = suggestions
    .map(s => `<div class="autocomplete-item" data-value="${s}">${s}</div>`)
    .join("");

  autocompleteList.style.display = "block";
}

/* ---------- EDIT PROMPT (JEDNODUCHÁ VARIANTA) ---------- */

function openEditPrompt(m) {
  const wins = prompt("Výhry:", m.wins);
  if (wins === null) return;

  const attempts = prompt("Pokusy:", m.attempts);
  if (attempts === null) return;

  const notes = prompt("Poznámky:", m.notes || "");

  updateCounter(m.id, {
    wins: Number(wins),
    attempts: Number(attempts),
    notes
  });
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

addCounterForm.addEventListener("submit", async e => {
