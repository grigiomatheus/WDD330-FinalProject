import ExternalServices from "../services/api.js";
import BookList from "../models/BookList.js";
import {
  loadHeaderFooter,
  getParam,
  updateReadingListCount,
} from "../utils/helpers.js";

(async () => {
  await loadHeaderFooter();

  const query = getParam("q") || "bestsellers";

  const titleEl = document.getElementById("book-category-title");
  if (titleEl) {
    titleEl.textContent = getParam("q")
      ? `Results for: ${getParam("q")}`
      : "Featured Books";
  }

  const dataSource = new ExternalServices();
  const listElement = document.querySelector(".product-list");
  const myList = new BookList(query, dataSource, listElement);
  myList.init();
  updateReadingListCount();

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      updateReadingListCount();
    }
  });
})();