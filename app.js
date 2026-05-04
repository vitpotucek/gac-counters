/* ============================================================
   GAC COUNTERS – COUNTERS VIEW + ANALYTICS VIEW
   ============================================================ */

let matchups = [];
let filterEnemyOnly = false;
let currentPage = 1;

let sortColumn = null;
let sortDirection = 1;

const ROWS_PER_PAGE = 10;

/* DOM ELEMENTS */

const tableBody = document.getElementById("matchupTableBody");
const detailPanel = document.getElementById("detailPanel");

const searchInput = document.getElementById("searchInput");
const tierFilter = document.getElementById("tierFilter");
const typeFilter = document.getElementById("typeFilter");

const autocompleteList = document.getElementById("autocompleteList");
const tooltip = document.getElementById("tooltip");

const countersSection = document.getElementById("countersSection");
const analyticsSection = document.getElementById("analyticsSection");

const navCounters = document.getElementById("navCounters");
const navAnalytics = document.getElementById("navAnalytics");

const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");

/* INIT */

document.addEventListener("DOMContentLoaded", () => {
  setupCollapsible();
  setupNav();
  setupSidebarToggle();
  loadJSON();
  setupSortingIcons();
});

/* ============================================================
   SIDEBAR
   ============================================================ */

function setupSidebarToggle() {
  if (!menuToggle || !sidebar) return;

  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });
}

/* ============================================================
   NAVIGATION
   ============================================================ */

function setupNav() {
  navCounters.addEventListener("click", () => {
    navCounters.classList.add("active");
    navAnalytics.classList.remove("active");

    countersSection.classList.add("visible");
    analyticsSection.classList.remove("visible");

    sidebar.classList.remove("open");
  });

  navAnalytics.addEventListener("click", () => {
    navAnalytics.classList.add("active");
    navCounters.classList.remove("active");

    analyticsSection.classList.add("visible");
    countersSection.classList.remove("visible");

    sidebar.classList.remove("open");
    renderAnalytics();
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
