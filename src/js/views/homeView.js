import { buildHash, escapeHtml, formatBookCount } from "../utils/helpers.js";
import { renderSearchForm, renderBookCard } from "./shared.js";

const HOME_TOPICS = ["Modern Classics", "Fantasy", "History", "Productivity"];

export function renderHomeView(state, library, getSavedBook) {
  return `
    <section class="hero-panel">
      <div class="hero-copy">
        <p class="eyebrow">Personal Reading Dashboard</p>
        <h1>Find your next book and keep every reading plan in one place.</h1>
        <p class="hero-text">
          Search Google Books by title, author, or ISBN, then organize everything with reading statuses and custom shelves.
        </p>
        ${renderSearchForm("Search books by title, author, or ISBN")}
        <div class="topic-row">
          ${HOME_TOPICS.map(
            (topic) => `
            <button class="topic-chip" data-action="topic-search" data-topic="${escapeHtml(topic)}">${escapeHtml(topic)}</button>
          `,
          ).join("")}
        </div>
      </div>
      <aside class="hero-aside">
        <div class="metric-card">
          <span>Total Saved</span>
          <strong>${library.books.length}</strong>
          <small>${formatBookCount(library.books.length)} in your library</small>
        </div>
        <div class="metric-card">
          <span>Currently Reading</span>
          <strong>${library.books.filter((b) => b.readingStatus === "reading").length}</strong>
          <small>Keep progress updated as you go</small>
        </div>
        <div class="metric-card accent-card">
          <span>Custom Categories</span>
          <strong>${library.categories.length}</strong>
          <small>Build shelves for classes, moods, or genres</small>
        </div>
      </aside>
    </section>

    <section class="section-block">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Featured</p>
          <h2>Browse popular books to kick-start your list</h2>
        </div>
        <a class="inline-link" href="${buildHash("reading-list")}">Open my reading list</a>
      </div>
      <div class="book-grid">
        ${state.homeBooks.map((book) => renderBookCard(book, getSavedBook(book.id))).join("")}
      </div>
    </section>
  `;
}