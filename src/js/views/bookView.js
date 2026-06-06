import {
  buildHash,
  escapeHtml,
  formatAuthors,
  getStatusMeta,
  READING_STATUSES,
} from "../utils/helpers.js";
import {
  renderBookCard,
  renderBookCover,
  renderProgressForm,
  renderCategoryToggles,
} from "./shared.js";

export function renderBookView(state, library, getSavedBook) {
  const book = state.selectedBook;

  if (!book) {
    return `
      <section class="empty-state">
        <h2>Select a book</h2>
        <p>Choose any result to see details, related books, and reading actions.</p>
      </section>
    `;
  }

  const savedBook = getSavedBook(book.id);
  const resolvedBook = savedBook || book;
  const currentStatus = getStatusMeta(resolvedBook.readingStatus);

  return `
    <section class="book-detail-layout">
      <article class="detail-panel">
        <div class="detail-cover-wrap">
          ${renderBookCover(resolvedBook, "detail")}
        </div>
        <div class="detail-copy">
          <p class="eyebrow">Book details</p>
          <h1>${escapeHtml(resolvedBook.title)}</h1>
          <p class="detail-authors">${escapeHtml(formatAuthors(resolvedBook.authors))}</p>
          <div class="meta-grid">
            <div><span>Published</span><strong>${escapeHtml(resolvedBook.publishedDate || "Unknown")}</strong></div>
            <div><span>Pages</span><strong>${resolvedBook.pageCount || "Unknown"}</strong></div>
            <div><span>ISBN</span><strong>${escapeHtml(resolvedBook.isbn13 || resolvedBook.isbn10 || "Unavailable")}</strong></div>
            <div><span>Status</span><strong>${escapeHtml(currentStatus.label)}</strong></div>
          </div>

          <div class="tag-row">
            ${(resolvedBook.categories || [])
              .slice(0, 4)
              .map(
                (category) => `<span class="tag">${escapeHtml(category)}</span>`,
              )
              .join("")}
          </div>

          <p class="detail-description">${escapeHtml(resolvedBook.description || "No description was provided for this title.")}</p>

          <div class="action-row">
            ${
              savedBook
                ? `<button class="primary-button" data-action="remove-book" data-book-id="${resolvedBook.id}">Remove from list</button>`
                : `<button class="primary-button" data-action="save-book" data-book-id="${resolvedBook.id}">Add to reading list</button>`
            }
            <a class="secondary-button" href="${escapeHtml(resolvedBook.infoLink || buildHash("search"))}" target="_blank" rel="noreferrer">Open in Google Books</a>
          </div>

          <div class="status-actions">
            ${READING_STATUSES.map(
              (statusItem) => `
              <button
                class="status-button ${resolvedBook.readingStatus === statusItem.value ? "is-active" : ""}"
                data-action="set-status"
                data-book-id="${resolvedBook.id}"
                data-status="${statusItem.value}"
              >${statusItem.label}</button>
            `,
            ).join("")}
          </div>

          ${savedBook ? renderProgressForm(savedBook) : ""}
          ${savedBook ? renderCategoryToggles(savedBook, library.categories) : ""}
        </div>
      </article>

      <section class="section-block compact-gap">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Related</p>
            <h2>Similar books to explore next</h2>
          </div>
        </div>
        <div class="book-grid compact-grid">
          ${state.similarBooks.map((b) => renderBookCard(b, getSavedBook(b.id))).join("")}
        </div>
      </section>
    </section>
  `;
}