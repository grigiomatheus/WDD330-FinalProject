import {
  loadLibrary,
  removeBook,
} from "../services/storage.js";

import {
  renderListWithTemplate,
  escapeHtml,
  formatAuthors,
  formatDate,
  formatProgress,
  getBookCover,
  getStatusMeta,
  updateReadingListCount,
} from "../utils/helpers.js";

function readingListCardTemplate(book) {
  const statusMeta = getStatusMeta(book.readingStatus);
  const cover = getBookCover(book);

  return `<li class="cart-card divider">
    <a href="/pages/book/?book=${book.id}" class="cart-card__image">
      ${
        cover
          ? `<img src="${cover}" alt="${escapeHtml(book.title)}" />`
          : `<div class="cover-fallback"><span>No Cover</span></div>`
      }
    </a>
    <a href="/pages/book/?book=${book.id}">
      <h2 class="card__name">${escapeHtml(book.title)}</h2>
    </a>
    <p class="cart-card__color">${escapeHtml(formatAuthors(book.authors))}</p>
    <p class="cart-card__color">${escapeHtml(formatDate(book.addedAt))}</p>
    <p class="cart-card__color">${escapeHtml(formatProgress(book))}</p>
    <p class="cart-card__color">
      <span class="status-badge status-${statusMeta.value}">${escapeHtml(statusMeta.label)}</span>
    </p>
    <span class="cart-card__remove" data-id="${book.id}">&#x2715;</span>
  </li>`;
}

export default class ReadingList {
  constructor(key, parentElement) {
    this.key = key;
    this.parentElement = parentElement;
  }

  init() {
    const library = loadLibrary();
    this.renderList(library.books);
    updateReadingListCount();
  }

  renderList(books) {
    const footer = document.querySelector(".cart-footer");

    if (books.length === 0) {
      this.parentElement.innerHTML = `<li class="cart-card divider">Your reading list is empty.</li>`;
      if (footer) footer.classList.add("hide");
      return;
    }

    renderListWithTemplate(
      readingListCardTemplate,
      this.parentElement,
      books,
      "afterbegin",
      true
    );

    this.parentElement
      .querySelectorAll(".cart-card__remove")
      .forEach((btn) => {
        btn.addEventListener("click", this.removeFromList.bind(this));
      });

    if (footer) {
      footer.classList.remove("hide");
      const total = books.length;
      footer.querySelector(".cart-total").textContent = `${total} book${total === 1 ? "" : "s"} saved`;
    }
  }

  removeFromList(event) {
    const id = event.target.dataset.id;
    removeBook(id);
    const library = loadLibrary();
    this.renderList(library.books);
    updateReadingListCount();
  }
}