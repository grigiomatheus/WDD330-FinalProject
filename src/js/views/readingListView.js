import { buildHash, formatBookCount } from "../utils/helpers.js";
import { renderReadingListCard } from "./shared.js";

export function renderReadingListView(state, library, getReadingListBooks) {
  const books = getReadingListBooks();
  const counts = {
    all: library.books.length,
    want: library.books.filter((b) => b.readingStatus === "want").length,
    reading: library.books.filter((b) => b.readingStatus === "reading").length,
    completed: library.books.filter((b) => b.readingStatus === "completed").length,
  };

  return `
    <section class="section-block compact-gap">
      <div class="section-heading reading-heading">
        <div>
          <p class="eyebrow">My Library</p>
          <h1>My reading list</h1>
          <p class="section-subtle">${formatBookCount(library.books.length)} saved in your collection</p>
        </div>
        <label class="sort-control">
          <span>Sort</span>
          <select data-control="sort-reading-list">
            <option value="recent" ${state.listSort === "recent" ? "selected" : ""}>Recently added</option>
            <option value="title" ${state.listSort === "title" ? "selected" : ""}>Title</option>
            <option value="status" ${state.listSort === "status" ? "selected" : ""}>Status</option>
          </select>
        </label>
      </div>

      <div class="filter-row">
        <button class="filter-chip ${state.listFilter === "all" ? "is-active" : ""}" data-action="set-filter" data-status="all">All (${counts.all})</button>
        <button class="filter-chip ${state.listFilter === "want" ? "is-active" : ""}" data-action="set-filter" data-status="want">Want to Read (${counts.want})</button>
        <button class="filter-chip ${state.listFilter === "reading" ? "is-active" : ""}" data-action="set-filter" data-status="reading">Currently Reading (${counts.reading})</button>
        <button class="filter-chip ${state.listFilter === "completed" ? "is-active" : ""}" data-action="set-filter" data-status="completed">Completed (${counts.completed})</button>
      </div>
    </section>

    <section class="list-stack">
      ${
        books.length === 0
          ? `
        <div class="empty-state">
          <h2>No books in this view yet</h2>
          <p>Search for a title and save it to start building your reading list.</p>
          <a class="primary-button inline-flex" href="${buildHash("search")}">Search books</a>
        </div>
      `
          : books.map((book) => renderReadingListCard(book)).join("")
      }
    </section>
  `;
}