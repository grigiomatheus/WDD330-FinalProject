import { searchGoogleBooks, fetchGoogleBookDetails } from "./googleBooksApi.js";
import { searchOpenLibraryBooks, fetchOpenLibraryBookDetails } from "./openLibraryApi.js";

const FEATURED_QUERY = "subject:fiction";

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map();

const cacheGet = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.value;
};

const cacheSet = (key, value) => {
  cache.set(key, { value, ts: Date.now() });
};

const keyFor = (book) => {
  if (book.isbn13) return `isbn13:${book.isbn13}`;
  if (book.isbn10) return `isbn10:${book.isbn10}`;
  const title = book.title.toLowerCase().replace(/[^a-z0-9]/g, "");
  const author = (book.authors[0] || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return `title:${title}:${author}`;
};

const deduplicateBooks = (googleBooks, olBooks) => {
  const seen = new Set();
  const result = [];

  for (const book of googleBooks) {
    seen.add(keyFor(book));
    result.push(book);
  }

  for (const book of olBooks) {
    const key = keyFor(book);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(book);
    }
  }

  return result;
};

export const searchBooks = async (query, options = {}) => {
  const limit = options.maxResults || 18;
  const cacheKey = `search:${query}:${limit}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const [googleSettled, olSettled] = await Promise.allSettled([
    searchGoogleBooks(query, { maxResults: limit, orderBy: options.orderBy }),
    searchOpenLibraryBooks(query, limit),
  ]);

  const googleBooks = googleSettled.status === "fulfilled" ? googleSettled.value : [];
  const olBooks = olSettled.status === "fulfilled" ? olSettled.value : [];

  olBooks.forEach((book) => cacheSet(`book:${book.id}`, book));

  const result = deduplicateBooks(googleBooks, olBooks);
  cacheSet(cacheKey, result);
  return result;
};

const buildOlBookSkeleton = (bookId, olKey, details) => ({
  id: bookId,
  title: details.title || "Unknown",
  subtitle: "",
  authors: details.authorName ? [details.authorName] : ["Unknown author"],
  description: "",
  publishedDate: "",
  publisher: "",
  pageCount: 0,
  categories: details.categories,
  language: "en",
  averageRating: null,
  ratingsCount: 0,
  isbn10: "",
  isbn13: "",
  thumbnail: details.thumbnail,
  smallThumbnail: details.smallThumbnail,
  infoLink: `https://openlibrary.org/works/${olKey}`,
  previewLink: "",
  readingStatus: "want",
  customCategoryIds: [],
  progress: { currentPage: 0, lastUpdated: "" },
  source: "openlibrary",
});

export const fetchBookDetails = async (bookId) => {
  const cacheKey = `book:${bookId}`;
  const cached = cacheGet(cacheKey);

  if (bookId.startsWith("ol:")) {
    const olKey = bookId.replace("ol:", "");

    if (cached?.description) return cached;

    let details;
    try {
      details = await fetchOpenLibraryBookDetails(olKey);
    } catch {
      if (cached) return cached;
      throw new Error("Could not load book details from OpenLibrary.");
    }

    const base = cached ?? buildOlBookSkeleton(bookId, olKey, details);

    const enriched = {
      ...base,
      description: details.description || base.description,
      thumbnail: base.thumbnail || details.thumbnail,
      smallThumbnail: base.smallThumbnail || details.smallThumbnail,
      categories: base.categories?.length ? base.categories : details.categories,
      authors:
        base.authors[0] === "Unknown author" && details.authorName
          ? [details.authorName]
          : base.authors,
    };

    cacheSet(cacheKey, enriched);
    return enriched;
  }

  if (cached) return cached;

  const result = await fetchGoogleBookDetails(bookId);
  cacheSet(cacheKey, result);
  return result;
};

export const fetchRelatedBooks = async (book) => {
  const category = book.categories?.[0];
  const author = book.authors?.[0];
  const query = category ? `subject:${category}` : author || book.title;
  const related = await searchBooks(query, { maxResults: 6 });
  return related.filter((item) => item.id !== book.id).slice(0, 4);
};

export const fetchFeaturedBooks = async () => {
  const featured = await searchBooks(FEATURED_QUERY, { maxResults: 8 });
  return featured.slice(0, 8);
};

export default class ExternalServices {
  async searchBooks(query, options) {
    return searchBooks(query, options);
  }

  async findBookById(bookId) {
    return fetchBookDetails(bookId);
  }

  async getRelatedBooks(book) {
    return fetchRelatedBooks(book);
  }

  async getFeaturedBooks() {
    return fetchFeaturedBooks();
  }
}