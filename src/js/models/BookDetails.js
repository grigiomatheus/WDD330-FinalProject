import {
  saveBook,
  removeBook,
  setBookStatus,
  setBookProgress,
  loadLibrary,
} from "../services/storage.js";
import {
  escapeHtml,
  formatAuthors,
  getBookCover,
  getStatusMeta,
  READING_STATUSES,
} from "../utils/helpers.js";

export default class BookDetails {
  constructor(bookId, dataSource) {
    this.bookId = bookId;
    this.dataSource = dataSource;
    this.book = null;
  }

  async init() {
    this.book = await this.dataSource.findBookById(this.bookId);
    this.renderBookDetails();

    document
      .getElementById("addToList")
      ?.addEventListener("click", this.addBookToList.bind(this));

    document
      .getElementById("removeFromList")
      ?.addEventListener("click", this.removeBookFromList.bind(this));

    document
      .querySelector(".status-actions")
      ?.addEventListener("click", this.handleStatusChange.bind(this));

    document
      .getElementById("progressForm")
      ?.addEventListener("submit", this.saveProgress.bind(this));
  }

  getSavedBook() {
    const library = loadLibrary();
    return library.books.find((book) => book.id === this.bookId) || null;
  }

  addBookToList() {
    saveBook(this.book);
    this.renderBookDetails();
  }

  removeBookFromList() {
    removeBook(this.bookId);
    this.renderBookDetails();
  }

  handleStatusChange(event) {
    const btn = event.target.closest("[data-status]");
    if (!btn) return;
    setBookStatus(this.bookId, btn.dataset.status);
    this.renderBookDetails();
  }

  saveProgress(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const currentPage = Number(formData.get("currentPage") || 0);
    setBookProgress(this.bookId, currentPage);
    this.renderBookDetails();
  }

  renderBookDetails() {
    const container = document.querySelector(".book-detail");
    if (!container) return;

    const savedBook = this.getSavedBook();
    const resolvedBook = savedBook || this.book;
    const cover = getBookCover(resolvedBook);
    const statusMeta = getStatusMeta(resolvedBook.readingStatus);

    container.innerHTML = `
      <div class="detail-cover-wrap">
        ${
          cover
            ? `<img src="${cover}" alt="${escapeHtml(resolvedBook.title)}" class="cover-image cover-detail" />`
            : `<div class="cover-fallback cover-detail"><span>Book Cover</span></div>`
        }
      </div>
      <div class="detail-copy">
        <h2>${escapeHtml(resolvedBook.title)}</h2>
        <h3 class="divider">${escapeHtml(formatAuthors(resolvedBook.authors))}</h3>
        <p class="detail-description">${escapeHtml(resolvedBook.description || "No description provided.")}</p>
        <div class="meta-grid">
          <div><span>Published</span><strong>${escapeHtml(resolvedBook.publishedDate || "Unknown")}</strong></div>
          <div><span>Pages</span><strong>${resolvedBook.pageCount || "Unknown"}</strong></div>
          <div><span>Status</span><strong>${escapeHtml(statusMeta.label)}</strong></div>
        </div>
        <div class="action-row">
          ${
            savedBook
              ? `<button id="removeFromList" class="checkout-button">Remove from list</button>`
              : `<button id="addToList" class="checkout-button">Add to reading list</button>`
          }
        </div>
        <div class="status-actions">
          ${READING_STATUSES.map(
            (statusItem) => `
            <button
              class="status-button${resolvedBook.readingStatus === statusItem.value ? " is-active" : ""}"
              data-status="${statusItem.value}"
            >${statusItem.label}</button>
          `
          ).join("")}
        </div>
        ${
          savedBook
            ? `<form id="progressForm" class="progress-form">
                <label>
                  <span>Current page</span>
                  <input type="number" name="currentPage" min="0"
                    max="${resolvedBook.pageCount || ""}"
                    value="${resolvedBook.progress?.currentPage || 0}" />
                </label>
                <button class="checkout-button" type="submit">Save progress</button>
               </form>`
            : ""
        }
      </div>
    `;

    document
      .getElementById("addToList")
      ?.addEventListener("click", this.addBookToList.bind(this));

    document
      .getElementById("removeFromList")
      ?.addEventListener("click", this.removeBookFromList.bind(this));

    document
      .querySelector(".status-actions")
      ?.addEventListener("click", this.handleStatusChange.bind(this));

    document
      .getElementById("progressForm")
      ?.addEventListener("submit", this.saveProgress.bind(this));
  }
}