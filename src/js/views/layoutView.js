import { buildHash, escapeHtml } from "../utils/helpers.js";

import { renderHomeView } from "./homeView.js";
import { renderSearchView } from "./searchView.js";
import { renderBookView } from "./bookView.js";
import { renderReadingListView } from "./readingListView.js";
import { renderCategoriesView } from "./categoriesView.js";
import {
  renderCategoryNewView,
  renderCategoryRenameView,
  renderCategoryDeleteView,
} from "./categoryFormViews.js";

const NAV_ITEMS = [
  { label: "Home", href: buildHash("home"), key: "home" },
  { label: "Search", href: buildHash("search"), key: "search" },
  { label: "My Reading List", href: buildHash("reading-list"), key: "reading-list" },
  { label: "Categories", href: buildHash("categories"), key: "categories" },
];

function renderCurrentView(state, library, callbacks) {
  if (state.isLoading) {
    return `
      <section class="loading-state">
        <div class="loading-orb"></div>
        <p>Loading your library...</p>
      </section>
    `;
  }

  const { getSavedBook, getReadingListBooks, getCategoryBooks } = callbacks;

  switch (state.route.view) {
    case "search":
      return renderSearchView(state, getSavedBook);
    case "book":
      return renderBookView(state, library, getSavedBook);
    case "reading-list":
      return renderReadingListView(state, library, getReadingListBooks);
    case "categories":
      return renderCategoriesView(state, library, getCategoryBooks);
    case "category-new":
      return renderCategoryNewView();
    case "category-rename":
      return renderCategoryRenameView(state.route.params);
    case "category-delete":
      return renderCategoryDeleteView(state.route.params, getCategoryBooks);
    case "home":
    default:
      return renderHomeView(state, library, getSavedBook);
  }
}

export function renderLayout(state, library, callbacks) {
  const { route, activeMobileNav, error } = state;

  return {
    header: `
      <a class="brand" href="${buildHash("home")}">
        <span class="brand-mark" aria-hidden="true"></span>
        <span>
          <strong>Books Manager</strong>
          <small>Search, save, and organize your next read</small>
        </span>
      </a>
      <button class="menu-toggle" data-action="toggle-nav" aria-label="Toggle navigation">
        <span></span><span></span><span></span>
      </button>
      <nav class="topnav ${activeMobileNav ? "is-open" : ""}">
        ${NAV_ITEMS.map((item) => `<a class="${route.view === item.key ? "is-active" : ""}" href="${item.href}">${item.label}</a>`).join("")}
      </nav>
    `,
    content: `
      <div class="app-shell">
        <main class="page-shell">
          ${error ? `<div class="notice error">${escapeHtml(error)}</div>` : ""}
          ${renderCurrentView(state, library, callbacks)}
        </main>
      </div>
    `,
  };
}
