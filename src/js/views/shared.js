import {
  escapeHtml,
  formatAuthors,
  formatDate,
  formatProgress,
  getBookCover,
  getStatusMeta,
  truncateText,
} from "../utils/helpers.js";
import { getCategoryById } from "../services/storage.js";

export function renderSearchForm(placeholder, value = "") {
  return `
    <form class="search-form" data-form="search">
      <input
        type="search"
        name="query"
        value="${escapeHtml(value)}"
        placeholder="${escapeHtml(placeholder)}"
        aria-label="Search books"
      />
      <button class="primary-button" type="submit">Search</button>
    </form>
  `;
}

export function renderBookCover(book, variant = "card") {
  const cover = getBookCover(book);

  if (cover) {
    return `<img src="${cover}" alt="Cover of ${escapeHtml(book.title)}" class="cover-image cover-${variant}" />`;
  }

  return `
    <div class="cover-fallback cover-${variant}">
      <span>Book Cover</span>
    </div>
  `;
}

export function renderBookCard(book, savedBook) {
  const resolvedBook = savedBook || book;
  const statusMeta = getStatusMeta(resolvedBook.readingStatus);

  return `
    <article class="book-card">
      <button class="book-card-cover" data-action="view-book" data-book-id="${book.id}" aria-label="View ${escapeHtml(book.title)}">
        ${renderBookCover(resolvedBook)}
      </button>
      <div class="book-card-body">
        <span class="status-badge status-${statusMeta.value}">${escapeHtml(statusMeta.label)}</span>
        <h3>${escapeHtml(book.title)}</h3>
        <p class="book-card-authors">${escapeHtml(formatAuthors(book.authors))}</p>
        <p class="book-card-description">${escapeHtml(truncateText(book.description || "No description available.", 140))}</p>
      </div>
      <div class="card-actions">
        <button class="secondary-button" data-action="view-book" data-book-id="${book.id}">Details</button>
        ${
          savedBook
            ? `<button class="primary-button" data-action="remove-book" data-book-id="${book.id}">Remove</button>`
            : `<button class="primary-button" data-action="save-book" data-book-id="${book.id}">+ Add to List</button>`
        }
      </div>
    </article>
  `;
}

export function renderReadingListCard(book) {
  const statusMeta = getStatusMeta(book.readingStatus);

  return `
    <article class="reading-card">
      <div class="reading-card-cover">
        ${renderBookCover(book)}
      </div>
      <div class="reading-card-copy">
        <h3>${escapeHtml(book.title)}</h3>
        <p>${escapeHtml(formatAuthors(book.authors))}</p>
        <p class="meta-line">Added ${escapeHtml(formatDate(book.addedAt))}</p>
        <p class="meta-line">${escapeHtml(formatProgress(book))}</p>
        <div class="tag-row compact-tags">
          <span class="status-badge status-${statusMeta.value}">${escapeHtml(statusMeta.label)}</span>
          ${book.customCategoryIds
            .map((categoryId) => getCategoryById(categoryId))
            .filter(Boolean)
            .map(
              (category) =>
                `<span class="tag muted-tag">${escapeHtml(category.name)}</span>`,
            )
            .join("")}
        </div>
      </div>
      <div class="reading-card-actions">
        <button class="secondary-button small-button" data-action="view-book" data-book-id="${book.id}">Edit</button>
        <button class="secondary-button small-button" data-action="remove-book" data-book-id="${book.id}">Remove</button>
      </div>
    </article>
  `;
}

export function renderProgressForm(book) {
  return `
    <form class="progress-form" data-form="progress">
      <input type="hidden" name="bookId" value="${book.id}" />
      <label>
        <span>Current page</span>
        <input
          type="number"
          name="currentPage"
          min="0"
          max="${book.pageCount || ""}"
          value="${book.progress.currentPage || 0}"
        />
      </label>
      <button class="secondary-button" type="submit">Save progress</button>
    </form>
  `;
}

export function renderCategoryToggles(book, categories) {
  return `
    <section class="category-toggle-panel">
      <div class="section-heading compact-heading">
        <div>
          <p class="eyebrow">Shelves</p>
          <h3>Custom categories</h3>
        </div>
        <button class="secondary-button small-button" data-action="new-category">+ New category</button>
      </div>
      ${categories.length === 0 ? "<p class='section-subtle'>Create a category to start organizing this book.</p>" : ""}
      <div class="category-toggle-list">
        ${categories
          .map(
            (category) => `
          <label class="category-checkbox">
            <input
              type="checkbox"
              data-control="toggle-category"
              data-book-id="${book.id}"
              data-category-id="${category.id}"
              ${book.customCategoryIds.includes(category.id) ? "checked" : ""}
            />
            <span>${escapeHtml(category.name)}</span>
          </label>
        `,
          )
          .join("")}
      </div>
    </section>
  `;
}