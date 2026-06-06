import { buildHash, escapeHtml } from "../utils/helpers.js";
import { getCategoryById } from "../services/storage.js";

export function renderCategoryNewView() {
  return `
    <section class="section-block category-form-page">
      <a class="back-link" href="${buildHash("categories")}">&#8592; Back to Categories</a>
      <div class="category-form-header">
        <p class="eyebrow">Shelves</p>
        <h1>New category</h1>
        <p class="section-subtle">Create a custom shelf to organize your books.</p>
      </div>
      <form class="category-form" data-form="category-new">
        <label class="category-form-label">
          <span>Category name</span>
          <input
            class="category-form-input"
            type="text"
            name="categoryName"
            placeholder="e.g. Favorites, Summer Reads\u2026"
            maxlength="48"
            autocomplete="off"
            required
          />
        </label>
        <div class="category-form-actions">
          <a class="secondary-button" href="${buildHash("categories")}">Cancel</a>
          <button class="primary-button" type="submit">Create category</button>
        </div>
      </form>
    </section>
  `;
}

export function renderCategoryRenameView(routeParams) {
  const id = routeParams.id || "";
  const category = getCategoryById(id);

  if (!category) {
    window.location.hash = buildHash("categories");
    return "";
  }

  return `
    <section class="section-block category-form-page">
      <a class="back-link" href="${buildHash("categories", { id })}">&#8592; Back to Categories</a>
      <div class="category-form-header">
        <p class="eyebrow">Shelves</p>
        <h1>Rename category</h1>
        <p class="section-subtle">Update the name for <strong>${escapeHtml(category.name)}</strong>.</p>
      </div>
      <form class="category-form" data-form="category-rename">
        <input type="hidden" name="categoryId" value="${escapeHtml(id)}" />
        <label class="category-form-label">
          <span>Category name</span>
          <input
            class="category-form-input"
            type="text"
            name="categoryName"
            value="${escapeHtml(category.name)}"
            maxlength="48"
            autocomplete="off"
            required
          />
        </label>
        <div class="category-form-actions">
          <a class="secondary-button" href="${buildHash("categories", { id })}">Cancel</a>
          <button class="primary-button" type="submit">Save changes</button>
        </div>
      </form>
    </section>
  `;
}

export function renderCategoryDeleteView(routeParams, getCategoryBooks) {
  const id = routeParams.id || "";
  const category = getCategoryById(id);

  if (!category) {
    window.location.hash = buildHash("categories");
    return "";
  }

  const bookCount = getCategoryBooks(id).length;

  return `
    <section class="section-block category-form-page">
      <a class="back-link" href="${buildHash("categories", { id })}">&#8592; Back to Categories</a>
      <div class="category-form-header">
        <p class="eyebrow">Shelves</p>
        <h1>Delete category</h1>
      </div>
      <div class="category-delete-info">
        <p>You are about to delete <strong>${escapeHtml(category.name)}</strong>.</p>
        ${
          bookCount > 0
            ? `<p class="delete-warning">This category is assigned to <strong>${bookCount} book${bookCount === 1 ? "" : "s"}</strong>. They will remain in your library but the category will be removed from them.</p>`
            : ""
        }
      </div>
      <form class="category-form" data-form="category-delete">
        <input type="hidden" name="categoryId" value="${escapeHtml(id)}" />
        <div class="category-form-actions">
          <a class="secondary-button" href="${buildHash("categories", { id })}">Cancel</a>
          <button class="primary-button danger-button" type="submit">Delete category</button>
        </div>
      </form>
    </section>
  `;
}