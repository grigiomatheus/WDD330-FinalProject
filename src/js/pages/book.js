import { getParam, loadHeaderFooter } from "../utils/helpers.js";
import ExternalServices from "../services/api.js";
import BookDetails from "../models/BookDetails.js";

(async () => {
  await loadHeaderFooter();

  const dataSource = new ExternalServices();
  const bookId = getParam("book");

  const bookDetail = new BookDetails(bookId, dataSource);
  bookDetail.init();
})();