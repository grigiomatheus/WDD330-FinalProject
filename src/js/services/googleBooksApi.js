const BASE_URL = "https://www.googleapis.com/books/v1/volumes";
const API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY?.trim() || "";

const stripHtml = (value = "") =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeImageUrl = (url) => (url ? url.replace("http://", "https://") : "");

const buildUrl = (params = {}) => {
  const url = new URL(BASE_URL);
  for (const [key, val] of Object.entries(params)) {
    if (val != null && val !== "") url.searchParams.set(key, val);
  }
  if (API_KEY) url.searchParams.set("key", API_KEY);
  return url;
};

const toFriendlyError = (status, apiMessage = "") => {
  switch (status) {
    case 429:
      return "Too many requests. Try again in a moment.";
    case 401:
    case 403:
      return "API key error. Check your .env file.";
    case 400:
      return apiMessage || "Bad request. Try a different search.";
    default:
      if (status >= 500) return "Google Books is down. Try again later.";
      return apiMessage || "Something went wrong loading books.";
  }
};

const fetchJson = async (url) => {
  const response = await fetch(url.toString());
  if (response.ok) return response.json();

  let apiMessage = "";
  try {
    const body = await response.json();
    apiMessage = body?.error?.message || "";
  } catch {
    // response body was not JSON
  }

  throw new Error(toFriendlyError(response.status, apiMessage));
};

export const normalizeGoogleBook = (item) => {
  const info = item.volumeInfo || {};
  const images = info.imageLinks || {};
  const identifiers = info.industryIdentifiers || [];

  return {
    id: item.id,
    title: info.title || "Untitled",
    subtitle: info.subtitle || "",
    authors: info.authors || ["Unknown author"],
    description: stripHtml(info.description || item.searchInfo?.textSnippet || ""),
    publishedDate: info.publishedDate || "",
    publisher: info.publisher || "",
    pageCount: info.pageCount || 0,
    categories: info.categories || [],
    language: info.language || "en",
    averageRating: info.averageRating || null,
    ratingsCount: info.ratingsCount || 0,
    isbn10: identifiers.find((i) => i.type === "ISBN_10")?.identifier || "",
    isbn13: identifiers.find((i) => i.type === "ISBN_13")?.identifier || "",
    thumbnail: normalizeImageUrl(images.thumbnail),
    smallThumbnail: normalizeImageUrl(images.smallThumbnail),
    infoLink: info.infoLink || "",
    previewLink: info.previewLink || "",
    readingStatus: "want",
    customCategoryIds: [],
    progress: { currentPage: 0, lastUpdated: "" },
  };
};

export const searchGoogleBooks = async (query, options = {}) => {
  const url = buildUrl({
    q: query,
    maxResults: options.maxResults || 18,
    orderBy: options.orderBy || "relevance",
    printType: "books",
  });
  const payload = await fetchJson(url);
  return (payload.items || []).map(normalizeGoogleBook);
};

export const fetchGoogleBookDetails = async (bookId) => {
  const url = new URL(`${BASE_URL}/${bookId}`);
  if (API_KEY) url.searchParams.set("key", API_KEY);
  const payload = await fetchJson(url);
  return normalizeGoogleBook(payload);
};
