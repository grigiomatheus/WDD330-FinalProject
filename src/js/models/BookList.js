import {
  renderListWithTemplate,
  escapeHtml,
  formatAuthors,
  truncateText,
  getBookCover,
} from "../utils/helpers.js";

export function bookCardTemplate(book) {
  const cover = getBookCover(book);

  return `<li class="book-card">
    <a href="/pages/book/?book=${book.id}">
      ${
        cover
          ? `<img src="${cover}" alt="${escapeHtml(book.title)}" class="cover-image" />`
          : `<div class="cover-fallback"><span>Book Cover</span></div>`
      }
      <h3 class="card__brand">${escapeHtml(formatAuthors(book.authors))}</h3>
      <h2 class="card__name">${escapeHtml(book.title)}</h2>
      <p class="book-card__description">${escapeHtml(truncateText(book.description || "", 120))}</p>
    </a>
  </li>`;
}

export default class BookList {
  constructor(query, dataSource, listElement) {
    this.query = query;
    this.dataSource = dataSource;
    this.listElement = listElement;
  }

  async init() {
    const list = await this.dataSource.searchBooks(this.query);
    this.renderList(list);
  }

  renderList(bookList, template = bookCardTemplate) {
    if (!this.listElement) return;
    renderListWithTemplate(template, this.listElement, bookList, "afterbegin", true);
  }
}