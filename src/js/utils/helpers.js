export const READING_STATUSES = [
  { value: "want", label: "Want to Read" },
  { value: "reading", label: "Reading" },
  { value: "completed", label: "Completed" },
];

export const formatDate = (date) => {
  const resolvedDate = typeof date === "string" ? new Date(date) : date;

  if (
    !(resolvedDate instanceof Date) ||
    Number.isNaN(resolvedDate.getTime())
  ) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(resolvedDate);
};

export const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");

export const truncateText = (value = "", maxLength = 160) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trim()}...`;
};

export const formatAuthors = (authors = []) => {
  if (!authors.length) {
    return "Unknown author";
  }

  return authors.join(", ");
};

export const formatBookCount = (count) =>
  `${count} book${count === 1 ? "" : "s"}`;

export const getBookCover = (book) =>
  book.thumbnail || book.smallThumbnail || "";

export const getStatusMeta = (status = "want") => {
  const match = READING_STATUSES.find((item) => item.value === status);
  return match || READING_STATUSES[0];
};

export const formatProgress = (book) => {
  if (!book.pageCount) {
    return "Page count unavailable";
  }

  const currentPage = Math.min(
    book.progress?.currentPage || 0,
    book.pageCount
  );

  if (currentPage <= 0) {
    return `0 / ${book.pageCount} pages tracked`;
  }

  return `${currentPage} / ${book.pageCount} pages`;
};

export const buildHash = (view, params = {}, segments = []) => {
  const path = ["#", view === "home" ? "/" : `/${view}`];

  if (segments.length > 0) {
    path.push(
      `/${segments.map((segment) => encodeURIComponent(segment)).join("/")}`
    );
  }

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return `${path.join("")}${query ? `?${query}` : ""}`;
};

export const getRouteState = (hash = window.location.hash) => {
  const normalizedHash = hash.replace(/^#/, "") || "/";
  const [pathName, queryString = ""] = normalizedHash.split("?");
  const segments = pathName
    .split("/")
    .filter(Boolean)
    .map(decodeURIComponent);
  const view = segments[0] || "home";

  return {
    view,
    segments,
    params: Object.fromEntries(new URLSearchParams(queryString).entries()),
  };
};