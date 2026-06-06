import ReadingList from "../models/ReadingList.js";
import { updateReadingListCount, loadHeaderFooter } from "../utils/helpers.js";

(async () => {
  await loadHeaderFooter();

  const list = new ReadingList(
    "books-manager-library-v1",
    document.querySelector(".product-list"),
  );

  list.init();
  updateReadingListCount();
})();