import { buildHash, escapeHtml, formatBookCount } from "../utils/helpers.js";
import { getCategoryById } from "../services/storage.js";
import { renderReadingListCard } from "./shared.js";

const CATEGORY_ALL = "all";

export function renderCategoriesView(state, library, getCategoryBooks) {
  const selectedCategoryId = state.selectedCategoryId;
  const selectedCategory =
    selectedCategoryId === CATEGORY_ALL
      ? null
      : getCategoryById(selectedCategoryId);
  const books = getCategoryBooks(selectedCategoryId);

  return `
    <section class="categories-layout">
      <aside class="category-sidebar">
        <div class="section-heading compact-heading">
          <div>
            <p class="eyebrow">Shelves</p>
            <h1>Categories</h1>
          </div>
          <button class="primary-button small-button" data-action="new-category">+ New</button>
        </div>
        <button class="category-link ${selectedCategoryId === CATEGORY_ALL ? "is-active" : ""}" data-action="select-category" data-category-id="all">
          <span>All Categories</span>
          <strong>${library.categories.length}</strong>
        </button>
        ${library.categories
          .map(
            (category) => `
          <button class="category-link ${selectedCategoryId === category.id ? "is-active" : ""}" data-action="select-category" data-category-id="${category.id}">
            <span>${escapeHtml(category.name)}</span>
            <strong>${getCategoryBooks(category.id).length}</strong>
          </button>
        `,
          )
          .join("")}
      </aside>

      <section class="category-panel">
        <div class="section-heading compact-heading">
          <div>
            <p class="eyebrow">Collection</p>
            <h2>${selectedCategory ? escapeHtml(selectedCategory.name) : "All categorized books"}</h2>
            <p class="section-subtle">${formatBookCount(books.length)} in this view</p>
          </div>
          ${
            selectedCategory
              ? `
            <div class="inline-actions">
              <button class="secondary-button small-button" data-action="rename-category" data-category-id="${selectedCategory.id}">Rename</button>
              <button class="secondary-button small-button" data-action="delete-category" data-category-id="${selectedCategory.id}">Delete</button>
            </div>
          `
              : ""
          }
        </div>

        ${
          library.categories.length === 0
            ? `
          <div class="empty-state">
            <h2>Create your first category</h2>
            <p>Add custom shelves like School, Favorites, or Summer Reads.</p>
            <button class="primary-button inline-flex" data-action="new-category">Create category</button>
          </div>
        `
            : ""
        }

        <div class="list-stack category-stack">
          ${books.map((book) => renderReadingListCard(book)).join("")}
        </div>
      </section>
    </section>
  `;
}