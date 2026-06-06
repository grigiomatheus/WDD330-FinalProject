import { READING_STATUSES } from "../utils/helpers.js";

const STORAGE_KEY = "books-manager-library-v1";

const DEFAULT_CATEGORIES = [
  { id: "fiction", name: "Fiction", createdAt: new Date().toISOString() },
  { id: "non-fiction", name: "Non-Fiction", createdAt: new Date().toISOString() },
  { id: "school", name: "School", createdAt: new Date().toISOString() },
];

const DEFAULT_LIBRARY = {
  books: [],
  categories: DEFAULT_CATEGORIES,
  updatedAt: new Date().toISOString(),
};

const cloneLibrary = (library) => ({
  books: library.books.map((book) => ({
    ...book,
    customCategoryIds: [...(book.customCategoryIds || [])],
    progress: {
      currentPage: Number(book.progress?.currentPage || 0),
      lastUpdated: book.progress?.lastUpdated || "",
    },
  })),
  categories: library.categories.map((category) => ({ ...category })),
  updatedAt: library.updatedAt,
});

const isValidStatus = (status) =>
  READING_STATUSES.some((item) => item.value === status);

const cleanBook = (book) => ({
  ...book,
  title: String(book.title || "Untitled").trim(),
  authors:
    Array.isArray(book.authors) && book.authors.length > 0
      ? book.authors
      : ["Unknown author"],
  readingStatus: isValidStatus(book.readingStatus) ? book.readingStatus : "want",
  customCategoryIds: Array.isArray(book.customCategoryIds)
    ? [
        ...new Set(
          book.customCategoryIds.filter(
            (value) => typeof value === "string" && value.trim()
          )
        ),
      ]
    : [],
  progress: {
    currentPage: Number(book.progress?.currentPage || 0),
    lastUpdated: book.progress?.lastUpdated || "",
  },
  addedAt: book.addedAt || new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const cleanCategory = (category) => ({
  id: String(category.id || "").trim(),
  name: String(category.name || "").trim(),
  createdAt: category.createdAt || new Date().toISOString(),
});

const parseLibrary = (rawData) => {
  if (!rawData) {
    return cloneLibrary(DEFAULT_LIBRARY);
  }

  try {
    const parsed = JSON.parse(rawData);
    const books = Array.isArray(parsed.books)
      ? parsed.books.map(cleanBook)
      : [];
    const categories = Array.isArray(parsed.categories)
      ? parsed.categories
          .map(cleanCategory)
          .filter((category) => category.id && category.name)
      : [...DEFAULT_CATEGORIES];

    return {
      books,
      categories,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return cloneLibrary(DEFAULT_LIBRARY);
  }
};

const persistLibrary = (library) => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...library,
      updatedAt: new Date().toISOString(),
    })
  );
};

export const loadLibrary = () =>
  parseLibrary(localStorage.getItem(STORAGE_KEY));

export const saveLibrary = (library) => {
  persistLibrary(library);
  return loadLibrary();
};

const updateLibrary = (updater) => {
  const library = loadLibrary();
  updater(library);
  return saveLibrary(library);
};

export const saveBook = (book) =>
  updateLibrary((library) => {
    const resolvedBook = cleanBook(book);
    const existingIndex = library.books.findIndex(
      (item) => item.id === resolvedBook.id
    );

    if (existingIndex >= 0) {
      const currentBook = library.books[existingIndex];
      library.books[existingIndex] = {
        ...resolvedBook,
        readingStatus: currentBook.readingStatus,
        customCategoryIds: currentBook.customCategoryIds,
        progress: currentBook.progress,
        addedAt: currentBook.addedAt,
      };
      return;
    }

    library.books.unshift({
      ...resolvedBook,
      readingStatus: "want",
      customCategoryIds: [],
      progress: {
        currentPage: 0,
        lastUpdated: "",
      },
      addedAt: new Date().toISOString(),
    });
  });

export const removeBook = (bookId) =>
  updateLibrary((library) => {
    library.books = library.books.filter((book) => book.id !== bookId);
  });

export const setBookStatus = (bookId, status) =>
  updateLibrary((library) => {
    if (!isValidStatus(status)) {
      return;
    }

    const book = library.books.find((item) => item.id === bookId);

    if (!book) {
      return;
    }

    book.readingStatus = status;
    book.updatedAt = new Date().toISOString();
  });

export const setBookProgress = (bookId, currentPage) =>
  updateLibrary((library) => {
    const book = library.books.find((item) => item.id === bookId);

    if (!book) {
      return;
    }

    const safePageCount = Number(book.pageCount || 0);
    const page = Number.isFinite(currentPage) ? Math.max(0, currentPage) : 0;

    book.progress = {
      currentPage:
        safePageCount > 0 ? Math.min(page, safePageCount) : page,
      lastUpdated: new Date().toISOString(),
    };
    book.updatedAt = new Date().toISOString();
  });

export const makeCategoryId = (name) =>
  String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export const addCategory = (name) =>
  updateLibrary((library) => {
    const trimmedName = String(name || "").trim();

    if (!trimmedName) {
      return;
    }

    const baseId =
      makeCategoryId(trimmedName) || `category-${Date.now()}`;
    let categoryId = baseId;
    let suffix = 2;

    while (library.categories.some((category) => category.id === categoryId)) {
      categoryId = `${baseId}-${suffix}`;
      suffix += 1;
    }

    library.categories.push({
      id: categoryId,
      name: trimmedName,
      createdAt: new Date().toISOString(),
    });
  });

export const renameCategory = (categoryId, newName) =>
  updateLibrary((library) => {
    const category = library.categories.find(
      (item) => item.id === categoryId
    );

    if (!category) {
      return;
    }

    const trimmedName = String(newName || "").trim();

    if (!trimmedName) {
      return;
    }

    category.name = trimmedName;
  });

export const deleteCategory = (categoryId) =>
  updateLibrary((library) => {
    library.categories = library.categories.filter(
      (category) => category.id !== categoryId
    );
    library.books = library.books.map((book) => ({
      ...book,
      customCategoryIds: (book.customCategoryIds || []).filter(
        (id) => id !== categoryId
      ),
    }));
  });

export const toggleBookCategory = (bookId, categoryId, isSelected) =>
  updateLibrary((library) => {
    const book = library.books.find((item) => item.id === bookId);

    if (!book) {
      return;
    }

    const categories = new Set(book.customCategoryIds || []);

    if (isSelected) {
      categories.add(categoryId);
    } else {
      categories.delete(categoryId);
    }

    book.customCategoryIds = [...categories];
    book.updatedAt = new Date().toISOString();
  });

export const getCategoryById = (categoryId) => {
  const library = loadLibrary();
  return (
    library.categories.find((category) => category.id === categoryId) || null
  );
};