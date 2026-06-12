const SEARCH_BASE_URL = "https://openlibrary.org/search.json";
const WORKS_BASE_URL = "https://openlibrary.org/works";
const AUTHORS_BASE_URL = "https://openlibrary.org/authors";
const COVERS_BASE_URL = "https://covers.openlibrary.org/b";
const SEARCH_FIELDS = [
  "key", "title", "subtitle", "author_name", "author_key",
  "cover_i", "isbn", "subject", "first_publish_year", "publisher",
  "language", "number_of_pages_median", "ratings_average", "ratings_count",
].join(",");

const stripHtml = (value = "") =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const fetchJson = async (url) => {
  const response = await fetch(url.toString());
  if (response.ok) return response.json();
  throw new Error(`OpenLibrary error: ${response.status}`);
};

const isIsbnQuery = (query) => /^[\d-]{9,17}$/.test(query.replace(/\s/g, ""));
const normalizeIsbn = (query) => query.replace(/[-\s]/g, "");

export const normalizeOpenLibraryBook = (doc) => {
  const isbn13 = doc.isbn?.find((i) => i.length === 13) || "";
  const isbn10 = doc.isbn?.find((i) => i.length === 10) || "";
  const coverId = doc.cover_i;
  const olKey = (doc.key || "").replace("/works/", "");

  return {
    id: `ol:${olKey}`,
    title: doc.title || "Untitled",
    subtitle: doc.subtitle || "",
    authors: doc.author_name || ["Unknown author"],
    description: "",
    publishedDate: doc.first_publish_year?.toString() || "",
    publisher: Array.isArray(doc.publisher) ? doc.publisher[0] : doc.publisher || "",
    pageCount: doc.number_of_pages_median || 0,
    categories: Array.isArray(doc.subject) ? doc.subject.slice(0, 5) : [],
    language: Array.isArray(doc.language) ? doc.language[0] : doc.language || "en",
    averageRating: doc.ratings_average ? parseFloat(doc.ratings_average.toFixed(1)) : null,
    ratingsCount: doc.ratings_count || 0,
    isbn10,
    isbn13,
    thumbnail: coverId ? `${COVERS_BASE_URL}/id/${coverId}-M.jpg` : "",
    smallThumbnail: coverId ? `${COVERS_BASE_URL}/id/${coverId}-S.jpg` : "",
    infoLink: olKey ? `https://openlibrary.org/works/${olKey}` : "",
    previewLink: "",
    readingStatus: "want",
    customCategoryIds: [],
    progress: { currentPage: 0, lastUpdated: "" },
    source: "openlibrary",
  };
};

export const searchOpenLibraryBooks = async (query, limit = 18) => {
  const url = new URL(SEARCH_BASE_URL);

  if (isIsbnQuery(query)) {
    url.searchParams.set("isbn", normalizeIsbn(query));
  } else if (query.startsWith("author:")) {
    url.searchParams.set("author", query.replace(/^author:/, "").trim());
  } else if (query.startsWith("subject:")) {
    url.searchParams.set("subject", query.replace(/^subject:/, "").trim());
  } else {
    url.searchParams.set("q", query);
  }

  url.searchParams.set("fields", SEARCH_FIELDS);
  url.searchParams.set("limit", limit);

  const payload = await fetchJson(url);
  return (payload.docs || []).map(normalizeOpenLibraryBook);
};

export const fetchOpenLibraryBookDetails = async (olKey) => {
  const worksUrl = new URL(`${WORKS_BASE_URL}/${olKey}.json`);
  const data = await fetchJson(worksUrl);

  const raw = data.description;
  const description = stripHtml(typeof raw === "string" ? raw : raw?.value || "");

  let authorName = "";
  const firstAuthorKey = data.authors?.[0]?.author?.key;
  if (firstAuthorKey) {
    try {
      const authorKey = firstAuthorKey.split("/").pop();
      const authorData = await fetchJson(new URL(`${AUTHORS_BASE_URL}/${authorKey}.json`));
      authorName = authorData.name || "";
    } catch {
      // wip: ignore
    }
  }

  const coverId = data.covers?.[0];
  return {
    description,
    authorName,
    thumbnail: coverId ? `${COVERS_BASE_URL}/id/${coverId}-M.jpg` : "",
    smallThumbnail: coverId ? `${COVERS_BASE_URL}/id/${coverId}-S.jpg` : "",
    categories: (data.subjects || []).slice(0, 5),
    title: data.title || "",
  };
};
