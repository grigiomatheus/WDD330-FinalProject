import { escapeHtml } from "../utils/helpers.js";
import { renderSearchForm, renderBookCard } from "./shared.js";

export function renderSearchView(state, getSavedBook) {
  const { searchQuery, searchResults, searchPerformed } = state;

  return `
    <section class="section-block compact-gap">
      <div class="section-heading search-heading">
        <div>
          <p class="eyebrow">Search</p>
          <h1>Look up books by title, author, or ISBN</h1>
        </div>
        <div class="caption-pill">Google Books API</div>
      </div>
      ${renderSearchForm("Try The Great Gatsby, Toni Morrison, or 9780141182636", searchQuery)}
    </section>

    <section class="section-block compact-gap">
      <div class="section-heading">
        <div>
          <h2>${searchPerformed ? `Results for "${escapeHtml(searchQuery)}"` : "Start a search to see results"}</h2>
          <p class="section-subtle">
            ${
              searchPerformed
                ? `${searchResults.length} books found`
                : "Your results will appear here once you search."
            }
          </p>
        </div>
      </div>
      ${
        searchPerformed && searchResults.length === 0
          ? `
        <div class="empty-state">
          <h3>No matches yet</h3>
          <p>Try a different title, author name, or ISBN.</p>
        </div>
      `
          : ""
      }
      <div class="book-grid">
        ${searchResults.map((book) => renderBookCard(book, getSavedBook(book.id))).join("")}
      </div>
    </section>
  `;
}