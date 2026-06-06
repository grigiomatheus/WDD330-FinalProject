const GOOGLE_BOOKS_BASE_URL = "https://www.googleapis.com/books/v1/volumes";
const GOOGLE_BOOKS_API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY?.trim() || "";
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

const buildBooksUrl = (params = {}) => {
  const url = new URL(GOOGLE_BOOKS_BASE_URL);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  if (GOOGLE_BOOKS_API_KEY) {
    url.searchParams.set("key", GOOGLE_BOOKS_API_KEY);
  }

  return url;
};

const toFriendlyErrorMessage = (status, apiMessage = "") => {
  if (status === 429) {
    if (!GOOGLE_BOOKS_API_KEY) {
      return "API key is missing. Add VITE_GOOGLE_BOOKS_API_KEY to .env and restart the dev server.";
    }
    return "Google Books daily quota reached. Try again tomorrow or request a quota increase in Google Cloud Console.";
  }

  if (status === 401 || status === 403) {
    return "Google Books rejected the API key. Check key restrictions and confirm the Books API is enabled in Google Cloud Console.";
  }

  if (status === 400) {
    return (
      apiMessage || "Invalid request to Google Books. Check your query and API key."
    );
  }

  if (status >= 500) {
    return "Google Books is temporarily unavailable. Please try again soon.";
  }

  return apiMessage || "Unable to load data from Google Books right now.";
};

const fetchJson = async (url) => {
  const response = await fetch(url.toString());

  if (response.ok) {
    return response.json();
  }

  let apiMessage = "";

  try {
    const payload = await response.json();
    apiMessage = payload?.error?.message || "";
  } catch {
    apiMessage = "";
  }

  throw new Error(toFriendlyErrorMessage(response.status, apiMessage));
};

const fetchGoogleBooks = async (params) => {
  const url = buildBooksUrl(params);
  return fetchJson(url);
};

const normalizeImageUrl = (url) => {
  if (!url) {
    return "";
  }

  return url.replace("http://", "https://");
};

const stripHtml = (value = "") =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getIdentifier = (identifiers = [], type) => {
  const match = identifiers.find((identifier) => identifier.type === type);
  return match?.identifier || "";
};

export const normalizeBook = (item) => {
  const volumeInfo = item.volumeInfo || {};
  const imageLinks = volumeInfo.imageLinks || {};

  return {
    id: item.id,
    title: volumeInfo.title || "Untitled",
    subtitle: volumeInfo.subtitle || "",
    authors: volumeInfo.authors || ["Unknown author"],
    description: stripHtml(
      volumeInfo.description || item.searchInfo?.textSnippet || ""
    ),
    publishedDate: volumeInfo.publishedDate || "",
    publisher: volumeInfo.publisher || "",
    pageCount: volumeInfo.pageCount || 0,
    categories: volumeInfo.categories || [],
    language: volumeInfo.language || "en",
    averageRating: volumeInfo.averageRating || null,
    ratingsCount: volumeInfo.ratingsCount || 0,
    isbn10: getIdentifier(volumeInfo.industryIdentifiers, "ISBN_10"),
    isbn13: getIdentifier(volumeInfo.industryIdentifiers, "ISBN_13"),
    thumbnail: normalizeImageUrl(imageLinks.thumbnail),
    smallThumbnail: normalizeImageUrl(imageLinks.smallThumbnail),
    infoLink: volumeInfo.infoLink || "",
    previewLink: volumeInfo.previewLink || "",
    readingStatus: "want",
    customCategoryIds: [],
    progress: {
      currentPage: 0,
      lastUpdated: "",
    },
  };
};

export const searchBooks = async (query, options = {}) => {
  const cacheKey = `search:${query}:${options.maxResults || 18}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const payload = await fetchGoogleBooks({
    q: query,
    maxResults: options.maxResults || 18,
    orderBy: options.orderBy || "relevance",
    printType: "books",
  });

  const result = (payload.items || []).map(normalizeBook);
  cacheSet(cacheKey, result);
  return result;
};

export const fetchBookDetails = async (bookId) => {
  const cacheKey = `book:${bookId}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const detailsUrl = new URL(`${GOOGLE_BOOKS_BASE_URL}/${bookId}`);
  if (GOOGLE_BOOKS_API_KEY) {
    detailsUrl.searchParams.set("key", GOOGLE_BOOKS_API_KEY);
  }

  const payload = await fetchJson(detailsUrl);
  const result = normalizeBook(payload);
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
  const featured = await searchBooks(FEATURED_QUERY, { maxResults: 6 });
  return featured.slice(0, 6);
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