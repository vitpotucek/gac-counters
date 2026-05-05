/* ============================================================
   GAC COUNTERS – COUNTERS VIEW + ANALYTICS VIEW + MY TEAMS
   ============================================================ */

/* ---------- GLOBAL STATE ---------- */

let matchups = [];
let filterEnemyOnly = false;
let currentPage = 1;

let sortColumn = null;
let sortDirection = 1;

const ROWS_PER_PAGE = 10;

/* ---------- DOM ELEMENTS ---------- */

const tableBody = document.getElementById("matchupTableBody");
const detailPanel = document.getElementById("detailPanel");

const searchInput = document.getElementById("searchInput");
const tierFilter = document.getElementById("tierFilter");
const typeFilter = document.getElementById("typeFilter");

const autocompleteList = document.getElementById("autocompleteList");
const tooltip = document.getElementById("tooltip");

const countersSection = document.getElementById("countersSection");
const analyticsSection = document.getElementById("analyticsSection");
const myTeamsSection = document.getElementById("myTeamsSection");

const navCounters = document.getElementById("navCounters");
const navAnalytics = document.getElementById("navAnalytics");
const navMyTeams = document.getElementById("navMyTeams");

const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");

/* ---------- INITIALIZATION ---------- */

document.addEventListener("DOMContentLoaded", () => {
  setupCollapsible();
  setupNav();
  setupSidebarToggle();
  loadJSON();
  setupSortingIcons();
});

/* ============================================================
   SIDEBAR + NAVIGATION
   ============================================================ */

function setupSidebarToggle() {
  if (!menuToggle || !sidebar) return;

  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });
}

function setupNav() {
  navCounters.addEventListener("click", () => {
    navCounters.classList.add("active");
    navAnalytics.classList.remove("active");
    navMyTeams.classList.remove("active");

    countersSection.classList.add("visible");
    analyticsSection.classList.remove("visible");
    myTeamsSection.classList.remove("visible");

    sidebar.classList.remove("open");
  });

  navAnalytics.addEventListener("click", () => {
    navAnalytics.classList.add("active");
    navCounters.classList.remove("active");
    navMyTeams.classList.remove("active");

    analyticsSection.classList.add("visible");
    countersSection.classList.remove("visible");
    myTeamsSection.classList.remove("visible");

    sidebar.classList.remove("open");
    renderAnalytics();
  });

  navMyTeams.addEventListener("click", () => {
    navMyTeams.classList.add("active");
    navCounters.classList.remove("active");
    navAnalytics.classList.remove("active");

    myTeamsSection.classList.add("visible");
    countersSection.classList.remove("visible");
    analyticsSection.classList.remove("visible");

    sidebar.classList.remove("open");
    renderMyTeams();
  });
}

/* ============================================================
   LOAD DATA
   ============================================================ */

async function loadJSON() {
  const response = await fetch("data.json");
  matchups = await response.json();
  currentPage = 1;
  render();
}

/* ============================================================
   COLLAPSIBLE GL SECTION
   ============================================================ */

function setupCollapsible() {
  const card = document.querySelector(".collapsible-card");
  const header = document.querySelector(".collapsible-header");

  if (!card || !header) return;

  card.classList.add("open");
  header.addEventListener("click", () => card.classList.toggle("open"));
}

/* ============================================================
   HELPERS
   ============================================================ */

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

function groupByEnemyLead(list) {
  const groups = {};
  list.forEach(m => {
    if (!groups[m.enemyLead]) groups[m.enemyLead] = [];
    groups[m.enemyLead].push(m);
  });
  return groups;
}

function safeClassName(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function colorClassForWinrate(w) {
  if (w === 100) return "green";
  if (w >= 80) return "blue";
  if (w >= 50) return "yellow";
  return "red";
}

/* ============================================================
   TEAM IMAGE HELPER
   ============================================================ */

function teamImageFor(lead) {
  let slug = lead.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  slug = slug.replace(/^-+|-+$/g, ""); // odstraní pomlčky na začátku i na konci
  return `img/teams/${slug}.png`;
}

/* ============================================================
   RENDER MAIN TABLE (GROUPED BY ENEMY LEAD)
   ============================================================ */

function render() {
  const search = searchInput.value.toLowerCase();
  const tier = tierFilter.value;
  const type = typeFilter.value;

  let filtered = enrichMatchups(matchups);

  /* ----- SORTING ----- */
  if (sortColumn) {
    filtered.sort((a, b) => {
      const valA = a[sortColumn];
      const valB = b[sortColumn];

      if (typeof valA === "number" && typeof valB === "number") {
        return (valA - valB) * sortDirection;
      }
      return valA.toString().localeCompare(valB.toString()) * sortDirection;
    });
  }

  /* ----- SEARCH (ONLY ENEMY LEAD) ----- */
  if (search) {
    filtered = filtered.filter(m =>
      m.enemyLead.toLowerCase().includes(search)
    );
  }

  /* ----- FILTERS ----- */
  if (tier) filtered = filtered.filter(m => m.tier === tier);
  if (type) filtered = filtered.filter(m => m.type === type);

  /* ----- PAGINATION ----- */
  const start = (currentPage - 1) * ROWS_PER_PAGE;
  const pageItems = filtered.slice(start, start + ROWS_PER_PAGE);

  /* ----- GROUPING ----- */
  const groups = groupByEnemyLead(pageItems);

  let html = "";

  Object.keys(groups).forEach(enemy => {
    const group = groups[enemy];
    const bestWinrate = Math.max(...group.map(g => g.winrate));
    const count = group.length;
    const safe = safeClassName(enemy);
    const colorClass = colorClassForWinrate(bestWinrate);

    html += `
      <tr class="group-header group-color-${colorClass}" data-group="${enemy}">
        <td colspan="6">
          <span class="group-arrow">▶</span>
          <strong>${enemy}</strong>
          <span class="group-info">(${count} counters, best ${bestWinrate}%)</span>
        </td>
      </tr>
    `;

    group.forEach(m => {
      html += `
        <tr class="group-row group-${safe}" style="display:none;">
          <td>${m.type}</td>
          <td>${m.enemyLead}</td>
          <td class="my-lead-cell" data-mylead="${m.myLead}">${m.myLead}</td>
          <td>${m.winrate}%</td>
          <td><span class="badge badge-${m.tier}">${m.tier}</span></td>
          <td>${m.wins}/${m.attempts}</td>
        </tr>
      `;
    });
  });

  tableBody.innerHTML = html;

  /* ----- CLICK EVENTS FOR GROUP HEADERS ----- */
  document.querySelectorAll(".group-header").forEach(header => {
    header.addEventListener("click", () => {
      const enemy = header.dataset.group;
      const safe = safeClassName(enemy);
      const rows = document.querySelectorAll(`.group-${safe}`);
      const arrow = header.querySelector(".group-arrow");

      const isOpen = arrow.textContent === "▼";

      rows.forEach(r => r.style.display = isOpen ? "none" : "table-row");
      arrow.textContent = isOpen ? "▶" : "▼";
    });
  });

  /* ----- AUTO-EXPAND WHEN FILTERED TO SINGLE GROUP ----- */
  const headers = document.querySelectorAll(".group-header");

  if (headers.length === 1) {
    const header = headers[0];
    const enemy = header.dataset.group;
    const safe = safeClassName(enemy);
    const rows = document.querySelectorAll(`.group-${safe}`);
    const arrow = header.querySelector(".group-arrow");

    rows.forEach(r => r.style.display = "table-row");
    arrow.textContent = "▼";
  }

  /* ----- CLICK + TOOLTIP EVENTS FOR GROUP ROWS ----- */
  document.querySelectorAll(".group-row").forEach(row => {
    const enemy = row.querySelector("td:nth-child(2)").textContent;
    const myLead = row.querySelector("td:nth-child(3)").textContent;

    const rowData = filtered.find(
      m => m.enemyLead === enemy && m.myLead === myLead
    );

    if (!rowData) return;

    row.addEventListener("click", () => showDetail(rowData));

    row.addEventListener("mousemove", e => {
      showTooltip(rowData, e.pageX, e.pageY);
    });

    row.addEventListener("mouseleave", hideTooltip);
  });

  updateSummary();
  renderPagination(filtered.length);
}

/* ============================================================
   PAGINATION
   ============================================================ */

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

/* ============================================================
   SUMMARY (GL COUNTERS)
   ============================================================ */

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
    "Sith Eternal Emperor"
  ];

  const glHTML = glList
    .map(gl => {
      const counters = fullList.filter(m => m.enemyLead === gl);
      if (!counters.length) return "";

      return `
        <div class="gl-tile gl-${gl.replace(/ /g, "-")}" onclick="filterForGL('${gl}')">
          <div class="gl-title">${gl}</div>
        </div>
      `;
    })
    .join("");

  const glContainer = document.getElementById("glCounters");
  if (glContainer) glContainer.innerHTML = glHTML;
}

/* ============================================================
   DETAIL PANEL
   ============================================================ */

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

/* ============================================================
   TOOLTIP — UPDATED TO SHOW TEAM IMAGE
   ============================================================ */

function showTooltip(m, x, y) {
  const notes = m.notes && m.notes.trim() !== "" ? m.notes : "(no notes)";
  const img = teamImageFor(m.myLead);

  tooltip.innerHTML = `
    <strong>${m.enemyLead}</strong> vs <strong>${m.myLead}</strong><br>
    <img src="${img}" style="width:420px; border-radius:6px; margin-top:6px;"><br>
    <em>Notes:</em><br>
    ${notes}
  `;

  tooltip.style.left = x + 12 + "px";
  tooltip.style.top = y + 12 + "px";
  tooltip.style.opacity = 1;
  tooltip.style.transform = "translateY(0)";
}

function hideTooltip() {
  tooltip.style.opacity = 0;
  tooltip.style.transform = "translateY(-6px)";
}
/* ============================================================
   FILTERING
   ============================================================ */

function filterForGL(glName) {
  if (searchInput.value === glName && filterEnemyOnly) {
    resetFilters();
    return;
  }

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

/* ============================================================
   AUTOCOMPLETE
   ============================================================ */

function updateAutocomplete() {
  const text = searchInput.value.toLowerCase();

  if (!text) {
    autocompleteList.style.display = "none";
    return;
  }

  const suggestions = [...new Set(
    matchups
      .flatMap(m =>
        filterEnemyOnly ? [m.enemyLead] : [m.enemyLead]
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

/* ============================================================
   EVENT LISTENERS – FILTERS, AUTOCOMPLETE
   ============================================================ */

searchInput.addEventListener("input", () => {
  filterEnemyOnly = false;
  currentPage = 1;
  updateAutocomplete();
  render();
});

autocompleteList.addEventListener("click", e => {
  if (e.target.classList.contains("autocomplete-item")) {
    searchInput.value = e.target.dataset.value;
    filterEnemyOnly = true;
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

/* ============================================================
   SORTING ICONS
   ============================================================ */

function setupSortingIcons() {
  const headers = document.querySelectorAll("th");
  const columns = ["type", "enemyLead", "myLead", "winrate", "tier", "attempts"];

  headers.forEach(th => {
    const icon = document.createElement("span");
    icon.classList.add("sort-icon");
    icon.textContent = "↕";
    th.appendChild(icon);
  });

  headers.forEach((th, index) => {
    th.addEventListener("click", () => {
      const col = columns[index];

      if (sortColumn === col) {
        sortDirection *= -1;
      } else {
        sortColumn = col;
        sortDirection = 1;
      }

      updateSortIcons();
      currentPage = 1;
      render();
    });
  });
}

function updateSortIcons() {
  const icons = document.querySelectorAll(".sort-icon");
  const columns = ["type", "enemyLead", "myLead", "winrate", "tier", "attempts"];

  icons.forEach((icon, i) => {
    const col = columns[i];

    if (col === sortColumn) {
      icon.classList.add("sort-active");
      icon.textContent = sortDirection === 1 ? "↑" : "↓";
    } else {
      icon.classList.remove("sort-active");
      icon.textContent = "↕";
    }
  });
}
/* ============================================================
   MY TEAMS SECTION
   ============================================================ */

function renderMyTeams() {
  const grid = document.getElementById("myTeamsGrid");
  if (!grid) return;

  const fullList = enrichMatchups(matchups);

  // unikátní My Lead postavy
  const myLeads = [...new Set(
    fullList
      .map(m => m.myLead)
      .filter(Boolean)
  )].sort();

  const html = myLeads.map(lead => {
    const img = teamImageFor(lead);
    const safeLead = lead.replace(/'/g, "\\'");
    return `
      <div class="team-card" onclick="openTeam('${safeLead}')">
        <h3>${lead}</h3>
        <img src="${img}" alt="${lead} team">
      </div>
    `;
  }).join("");

  grid.innerHTML = html;
}

function openTeam(lead) {
  const img = teamImageFor(lead);

  const overlay = document.getElementById("teamOverlay");
  const overlayImg = document.getElementById("teamOverlayImg");
  const closeBtn = document.querySelector(".team-overlay-close");

  overlayImg.src = img;
  overlay.style.display = "flex";

  // zavření kliknutím na X
  closeBtn.onclick = () => {
    overlay.style.display = "none";
  };

  // zavření kliknutím mimo obrázek
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      overlay.style.display = "none";
    }
  };
}


/* ============================================================
   ANALYTICS PLACEHOLDER (aby nenastala chyba)
   ============================================================ */

function renderAnalytics() {
  // zatím prázdné — přidáme později
}
