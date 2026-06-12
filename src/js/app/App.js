import {
  fetchBookDetails,
  fetchFeaturedBooks,
  fetchRelatedBooks,
  searchBooks,
} from "../services/api.js";

import {
  addCategory,
  deleteCategory,
  loadLibrary,
  removeBook,
  renameCategory,
  saveBook,
  setBookProgress,
  setBookStatus,
  toggleBookCategory,
} from "../services/storage.js";

import { buildHash, escapeHtml, getRouteState } from "../utils/helpers.js";

import { renderHomeView } from "../views/homeView.js";
import { renderSearchView } from "../views/searchView.js";
import { renderBookView } from "../views/bookView.js";
import { renderReadingListView } from "../views/readingListView.js";
import { renderCategoriesView } from "../views/categoriesView.js";

import {
  renderCategoryNewView,
  renderCategoryRenameView,
  renderCategoryDeleteView,
} from "../views/categoryFormViews.js";

import "../../css/index.css";

const CATEGORY_ALL = "all";

export class App {
  constructor(rootElement) {
    this.root = rootElement;
    this.headerRoot = document.getElementById("app-header");
    this.library = loadLibrary();
    this.state = {
      isLoading: true,
      error: "",
      route: getRouteState(),
      homeBooks: [],
      searchQuery: "",
      searchResults: [],
      selectedBook: null,
      similarBooks: [],
      listFilter: "all",
      listSort: "recent",
      selectedCategoryId: CATEGORY_ALL,
      searchPerformed: false,
      activeMobileNav: false,
    };
  }

  async init() {
    this.bindEvents();

    if (!window.location.hash) {
      window.location.hash = buildHash("home");
      return;
    }

    await this.handleRouteChange();
  }

  bindEvents() {
    window.addEventListener("hashchange", this.handleRouteChange);
    window.addEventListener("resize", this.handleResize);
    this.root.addEventListener("click", this.handleClick);
    this.root.addEventListener("submit", this.handleSubmit);
    this.root.addEventListener("change", this.handleChange);
    this.headerRoot.addEventListener("click", this.handleClick);
  }

  destroy() {
    window.removeEventListener("hashchange", this.handleRouteChange);
    window.removeEventListener("resize", this.handleResize);
    this.root.removeEventListener("click", this.handleClick);
    this.root.removeEventListener("submit", this.handleSubmit);
    this.root.removeEventListener("change", this.handleChange);
    this.headerRoot.removeEventListener("click", this.handleClick);
  }

  syncLibrary() {
    this.library = loadLibrary();
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.render();
  }

  setViewState(newState = {}) {
    this.setState({ error: "", isLoading: false, ...newState });
  }

  showToast(message) {
    const existing = document.getElementById("app-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "app-toast";
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("app-toast--visible"));
    setTimeout(() => {
      toast.classList.remove("app-toast--visible");
      toast.addEventListener("transitionend", () => toast.remove(), { once: true });
    }, 2200);
  }

  getFeaturedCount() {
    const width = window.innerWidth;
    if (width >= 1024) return 8;
    if (width >= 720) return 4;
    return 2;
  }

  handleResize = () => {
    if (this.state.route?.view !== "home" || !this.allFeaturedBooks?.length) return;
    const homeBooks = this.allFeaturedBooks.slice(0, this.getFeaturedCount());
    this.setState({ homeBooks });
  };

  handleRouteChange = async () => {
    const route = getRouteState();
    this.setState({ route, isLoading: true, error: "", activeMobileNav: false });

    try {
      if (route.view === "home") { await this.loadHomeView(); return; }
      if (route.view === "search") { await this.loadSearchView(route.params.q || ""); return; }
      if (route.view === "book" && route.segments[1]) { await this.loadBookView(route.segments[1]); return; }
      if (route.view === "reading-list") { this.setViewState({ selectedBook: null, similarBooks: [] }); return; }
      if (route.view === "categories") {
        const categoryId = route.params.id || this.state.selectedCategoryId;
        this.setViewState({ selectedCategoryId: categoryId });
        return;
      }
      if (
        route.view === "category-new" ||
        route.view === "category-rename" ||
        route.view === "category-delete"
      ) {
        this.setViewState({});
        return;
      }
      window.location.hash = buildHash("home");
    } catch (error) {
      this.setViewState({ error: error.message || "Something went wrong while loading data." });
    }
  };

  async loadHomeView() {
    const allBooks = this.allFeaturedBooks?.length > 0 ? this.allFeaturedBooks : await fetchFeaturedBooks();
    this.allFeaturedBooks = allBooks;

    const homeBooks = allBooks.slice(0, this.getFeaturedCount());

    this.setViewState({ homeBooks, selectedBook: null, similarBooks: [], searchQuery: "", searchPerformed: false });
  }

  async loadSearchView(rawQuery) {
    const query = rawQuery.trim();
    if (!query) {
      this.setViewState({ searchQuery: "", searchResults: [], searchPerformed: false, selectedBook: null, similarBooks: [] });
      return;
    }
    const searchResults = await searchBooks(query);
    this.setViewState({ searchQuery: query, searchResults, searchPerformed: true, selectedBook: null, similarBooks: [] });
  }

  async loadBookView(bookId) {
    const selectedBook = await fetchBookDetails(bookId);
    const similarBooks = await fetchRelatedBooks(selectedBook);
    this.setViewState({ selectedBook, similarBooks, searchPerformed: false });
  }

  handleClick = async (event) => {
    const actionTarget = event.target.closest("[data-action]");
    if (!actionTarget) return;

    const { action, bookId, categoryId, status, topic } = actionTarget.dataset;

    try {
      if (action === "toggle-nav") { this.setState({ activeMobileNav: !this.state.activeMobileNav }); return; }
      if (action === "navigate") { window.location.hash = actionTarget.dataset.href; return; }
      if (action === "topic-search" && topic) { window.location.hash = buildHash("search", { q: topic }); return; }
      if (action === "view-book" && bookId) { window.location.hash = buildHash("book", {}, [bookId]); return; }
      if (action === "save-book" && bookId) { await this.persistBook(bookId); return; }
      if (action === "remove-book" && bookId) { removeBook(bookId); this.afterLibraryMutation(); return; }
      if (action === "set-status" && bookId && status) { setBookStatus(bookId, status); this.afterLibraryMutation(); return; }
      if (action === "set-filter" && status) { this.setState({ listFilter: status }); return; }
      if (action === "new-category") { window.location.hash = buildHash("category-new"); return; }
      if (action === "rename-category" && categoryId) { window.location.hash = buildHash("category-rename", { id: categoryId }); return; }
      if (action === "delete-category" && categoryId) { window.location.hash = buildHash("category-delete", { id: categoryId }); return; }
      if (action === "select-category" && categoryId) {
        this.setState({ selectedCategoryId: categoryId });
        if (this.state.route.view === "categories") {
          window.location.hash = buildHash("categories", categoryId === CATEGORY_ALL ? {} : { id: categoryId });
        }
        return;
      }
    } catch (error) {
      this.setState({ error: error.message || "Unable to complete that action." });
    }
  };

  handleSubmit = async (event) => {
    const form = event.target;

    if (form.matches("[data-form='search']")) {
      event.preventDefault();
      const query = String(new FormData(form).get("query") || "").trim();
      if (!query) { this.setState({ error: "Enter a title, author, or ISBN to search." }); return; }
      window.location.hash = buildHash("search", { q: query });
      return;
    }

    if (form.matches("[data-form='progress']")) {
      event.preventDefault();
      const formData = new FormData(form);
      const bookId = String(formData.get("bookId") || "");
      const currentPage = Number(formData.get("currentPage") || 0);
      if (!bookId) return;
      setBookProgress(bookId, currentPage);
      this.afterLibraryMutation();
      this.showToast("Progress saved!");
      return;
    }

    if (form.matches("[data-form='category-new']")) {
      event.preventDefault();
      const name = String(new FormData(form).get("categoryName") || "").trim();
      if (!name) return;
      addCategory(name);
      this.syncLibrary();
      window.location.hash = buildHash("categories");
      return;
    }

    if (form.matches("[data-form='category-rename']")) {
      event.preventDefault();
      const formData = new FormData(form);
      const id = String(formData.get("categoryId") || "");
      const name = String(formData.get("categoryName") || "").trim();
      if (!id || !name) return;
      renameCategory(id, name);
      this.syncLibrary();
      window.location.hash = buildHash("categories", { id });
      return;
    }

    if (form.matches("[data-form='category-delete']")) {
      event.preventDefault();
      const id = String(new FormData(form).get("categoryId") || "");
      if (!id) return;
      deleteCategory(id);
      this.syncLibrary();
      window.location.hash = buildHash("categories");
      return;
    }
  };

  handleChange = (event) => {
    const target = event.target;
    if (target.matches("[data-control='sort-reading-list']")) { this.setState({ listSort: target.value }); return; }
    if (target.matches("[data-control='toggle-category']")) {
      const { bookId, categoryId } = target.dataset;
      if (!bookId || !categoryId) return;
      toggleBookCategory(bookId, categoryId, target.checked);
      this.afterLibraryMutation();
    }
  };

  async persistBook(bookId) {
    let book = this.getSavedBook(bookId);
    if (!book) book = await fetchBookDetails(bookId);
    saveBook(book);
    this.afterLibraryMutation();
  }

  afterLibraryMutation() {
    this.syncLibrary();
    this.render();
  }

  getSavedBook(bookId) {
    return this.library.books.find((book) => book.id === bookId) || null;
  }

  getReadingListBooks() {
    const { listFilter, listSort } = this.state;
    const books = [...this.library.books];
    const filtered = listFilter === "all" ? books : books.filter((b) => b.readingStatus === listFilter);
    filtered.sort((a, b) => {
      if (listSort === "title") return a.title.localeCompare(b.title);
      if (listSort === "status") return a.readingStatus.localeCompare(b.readingStatus);
      return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    });
    return filtered;
  }

  getCategoryBooks(categoryId) {
    if (categoryId === CATEGORY_ALL) return this.library.books;
    return this.library.books.filter((b) => b.customCategoryIds.includes(categoryId));
  }

  render() {
    this.syncLibrary();
    const { header, content } = this.renderLayout();
    this.headerRoot.innerHTML = header;
    this.root.innerHTML = content;
  }

  renderLayout() {
    const { route, activeMobileNav, error } = this.state;
    const navItems = [
      { label: "Home", href: buildHash("home"), key: "home" },
      { label: "Search", href: buildHash("search"), key: "search" },
      { label: "My Reading List", href: buildHash("reading-list"), key: "reading-list" },
      { label: "Categories", href: buildHash("categories"), key: "categories" },
    ];

    return {
      header: `
        <a class="brand" href="${buildHash("home")}">
          <span class="brand-mark" aria-hidden="true"></span>
          <span>
            <strong>Books Manager</strong>
            <small>Search, save, and organize your next read</small>
          </span>
        </a>
        <button class="menu-toggle" data-action="toggle-nav" aria-label="Toggle navigation">
          <span></span><span></span><span></span>
        </button>
        <nav class="topnav ${activeMobileNav ? "is-open" : ""}">
          ${navItems.map((item) => `<a class="${route.view === item.key ? "is-active" : ""}" href="${item.href}">${item.label}</a>`).join("")}
        </nav>
      `,
      content: `
        <div class="app-shell">
          <main class="page-shell">
            ${error ? `<div class="notice error">${escapeHtml(error)}</div>` : ""}
            ${this.renderCurrentView()}
          </main>
        </div>
      `,
    };
  }

  renderCurrentView() {
    if (this.state.isLoading) {
      return `
        <section class="loading-state">
          <div class="loading-orb"></div>
          <p>Loading your library...</p>
        </section>
      `;
    }

    switch (this.state.route.view) {
      case "search":
        return renderSearchView(this.state, (id) => this.getSavedBook(id));
      case "book":
        return renderBookView(this.state, this.library, (id) => this.getSavedBook(id));
      case "reading-list":
        return renderReadingListView(this.state, this.library, () => this.getReadingListBooks());
      case "categories":
        return renderCategoriesView(this.state, this.library, (id) => this.getCategoryBooks(id));
      case "category-new":
        return renderCategoryNewView();
      case "category-rename":
        return renderCategoryRenameView(this.state.route.params);
      case "category-delete":
        return renderCategoryDeleteView(this.state.route.params, (id) => this.getCategoryBooks(id));
      case "home":
      default:
        return renderHomeView(this.state, this.library, (id) => this.getSavedBook(id));
    }
  }
}