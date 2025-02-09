class UI {
  constructor() {
    this.initializeElements();
    this.bindEventListeners();
    this.renderLibrary();
    this.currentBookId = null;
    this.initializeSmartSearch();
    this.initializeAnimations();
    this.initializeCharts();
  }

  initializeElements() {
    // Search elements
    this.searchInput = document.getElementById("searchInput");
    this.searchFilter = document.getElementById("searchFilter");
    this.searchButton = document.getElementById("searchButton");
    this.searchResults = document.getElementById("searchResults");

    // Library elements
    this.shelves = {
      toRead: document.querySelector("#toRead .shelf-books"),
      reading: document.querySelector("#reading .shelf-books"),
      finished: document.querySelector("#finished .shelf-books"),
    };

    // Modal elements
    this.modal = document.getElementById("bookModal");
    this.modalClose = document.querySelector(".close");
    this.bookDetails = document.getElementById("bookDetails");
    this.progressInput = document.getElementById("readingProgress");
    this.progressValue = document.getElementById("progressValue");
    this.bookNotes = document.getElementById("bookNotes");
    this.saveProgress = document.getElementById("saveProgress");
    this.moveBook = document.getElementById("moveBook");

    // Dark mode
    this.darkModeToggle = document.getElementById("darkModeToggle");

    // Smart Search elements
    this.regularSearchBtn = document.getElementById("regularSearchBtn");
    this.smartSearchBtn = document.getElementById("smartSearchBtn");
    this.searchInfo = document.getElementById("searchInfo");

    // Add chart element
    this.genreChart = document.getElementById("genreChart");
    this.libraryChart = document.getElementById("libraryChart");
  }

  bindEventListeners() {
    this.searchButton.addEventListener("click", () => this.handleSearch());
    this.searchInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") this.handleSearch();
    });

    this.modalClose.addEventListener("click", () => this.closeModal());
    this.progressInput.addEventListener("input", (e) => {
      this.progressValue.textContent = `${e.target.value}%`;
    });

    this.darkModeToggle.addEventListener("click", () => this.toggleDarkMode());

    // Add global event delegation for all book-related buttons
    document.addEventListener("click", (e) => {
      const target = e.target;

      // Handle Add to Library button
      if (target.classList.contains("add-book-btn")) {
        const bookId = target.dataset.bookId;
        this.addToLibrary(bookId, "toRead");
      }

      // Handle Details button
      if (target.classList.contains("details-btn")) {
        const bookId = target.dataset.bookId;
        this.openBookDetails(bookId);
      }

      // Handle Move buttons
      if (target.classList.contains("move-btn")) {
        const bookId = target.dataset.bookId;
        const targetShelf = target.dataset.target;
        this.moveToShelf(bookId, targetShelf);
      }
    });

    // Modal event listeners
    this.modalClose.addEventListener("click", () => this.closeModal());
    this.saveProgress.addEventListener("click", () => {
      if (this.currentBookId) {
        const progress = parseInt(this.progressInput.value);
        const notes = this.bookNotes.value;
        libraryStorage.updateBookProgress(this.currentBookId, progress, notes);
        this.renderLibrary();
        this.closeModal();
      }
    });

    this.moveBook.addEventListener("click", () => {
      if (this.currentBookId) {
        const select = document.createElement("select");
        select.innerHTML = `
                    <option value="">Select Shelf...</option>
                    <option value="toRead">To Read</option>
                    <option value="reading">Currently Reading</option>
                    <option value="finished">Finished</option>
                `;

        select.addEventListener("change", (e) => {
          const targetShelf = e.target.value;
          if (targetShelf) {
            this.moveToShelf(this.currentBookId, targetShelf);
            this.closeModal();
          }
        });

        this.moveBook.replaceWith(select);
      }
    });
  }

  initializeSmartSearch() {
    this.regularSearchBtn.addEventListener("click", () =>
      this.toggleSearchMode("regular")
    );
    this.smartSearchBtn.addEventListener("click", () =>
      this.toggleSearchMode("smart")
    );
  }

  toggleSearchMode(mode) {
    const isSmartMode = mode === "smart";
    this.smartSearchBtn.classList.toggle("active", isSmartMode);
    this.regularSearchBtn.classList.toggle("active", !isSmartMode);
    this.searchFilter.style.display = isSmartMode ? "none" : "block";
    this.searchInfo.style.display = isSmartMode ? "block" : "none";
    this.searchInput.placeholder =
      this.searchInput.dataset[`${mode}Placeholder`];
    this.searchInput.value = "";
    this.searchResults.innerHTML = "";
  }

  async handleSearch() {
    const query = this.searchInput.value.trim();
    if (!query) return;

    // Show loading animation
    this.searchResults.innerHTML = `
        <div class="loading-shimmer" style="height: 200px; margin: 20px 0; border-radius: 8px;"></div>
        <div class="loading-shimmer" style="height: 200px; margin: 20px 0; border-radius: 8px;"></div>
        <div class="loading-shimmer" style="height: 200px; margin: 20px 0; border-radius: 8px;"></div>
    `;

    const isSmartMode = this.smartSearchBtn.classList.contains("active");

    if (isSmartMode) {
      await this.handleSmartSearch(query);
    } else {
      const filter = this.searchFilter.value;
      const books = await bookAPI.searchBooks(query, filter);
      this.renderSearchResults(books);
    }
  }

  async handleSmartSearch(genre) {
    try {
      // Show loading state
      this.searchResults.innerHTML =
        '<div class="no-results"><p>Searching for recommendations...</p></div>';

      // Get books in the specified genre
      const genreBooks = await bookAPI.searchByGenre(genre);

      if (!genreBooks || genreBooks.length === 0) {
        this.searchResults.innerHTML = `
                    <div class="no-results">
                        <p>No results found for genre: "${genre}"</p>
                        <p>Try another genre or check your spelling</p>
                        <p>Popular genres: fantasy, science fiction, mystery, romance, horror</p>
                    </div>
                `;
        return;
      }

      // Get user's reading history for better recommendations
      const library = libraryStorage.getLibrary();
      const finishedBooks = library.finished || [];

      // Enhanced recommendation logic
      const recommendations = genreBooks
        .map((book) => ({
          ...book,
          recommendationScore: this.calculateEnhancedScore(
            book,
            finishedBooks,
            genre
          ),
          recommendationReason: this.getEnhancedRecommendationReason(
            book,
            genre
          ),
        }))
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, 10);

      // Render results with recommendation badges
      this.renderSearchResults(recommendations, true);
    } catch (error) {
      console.error("Error in smart search:", error);
      this.searchResults.innerHTML = `
                <div class="no-results">
                    <p>An error occurred while searching</p>
                    <p>Please try again later</p>
                </div>
            `;
    }
  }

  calculateEnhancedScore(book, finishedBooks, searchedGenre) {
    let score = 0;

    // Genre match
    if (
      book.categories &&
      book.categories.some((cat) =>
        cat.toLowerCase().includes(searchedGenre.toLowerCase())
      )
    ) {
      score += 5;
    }

    // Description quality
    if (book.description && book.description.length > 200) score += 2;

    // Page count (prefer books similar to what user has read)
    const avgReadPageCount = this.getAveragePageCount(finishedBooks);
    if (book.pageCount && Math.abs(book.pageCount - avgReadPageCount) < 100)
      score += 2;

    // Author recognition
    if (
      finishedBooks.some((fb) =>
        fb.authors.some((author) => book.authors.includes(author))
      )
    ) {
      score += 3;
    }

    return score;
  }

  getAveragePageCount(finishedBooks) {
    if (!finishedBooks.length) return 300; // default
    const totalPages = finishedBooks.reduce(
      (sum, book) => sum + (book.pageCount || 0),
      0
    );
    return Math.round(totalPages / finishedBooks.length);
  }

  getEnhancedRecommendationReason(book, genre) {
    const reasons = [];

    if (
      book.categories &&
      book.categories.some((cat) =>
        cat.toLowerCase().includes(genre.toLowerCase())
      )
    ) {
      reasons.push(`Matches ${genre} genre`);
    }

    if (book.pageCount > 400) {
      reasons.push("Epic read");
    } else if (book.pageCount < 200) {
      reasons.push("Quick read");
    }

    if (book.description && book.description.length > 200) {
      reasons.push("Detailed story");
    }

    return reasons.join(" • ") || `Recommended ${genre} book`;
  }

  renderSearchResults(books, isRecommendation = false) {
    this.searchResults.innerHTML = "";

    books.forEach((book, index) => {
      const bookCard = document.createElement("div");
      bookCard.innerHTML = this.createBookCard(book, true, isRecommendation);
      bookCard.firstElementChild.style.animationDelay = `${index * 0.1}s`;
      this.searchResults.appendChild(bookCard.firstElementChild);
    });
  }

  renderLibrary() {
    const library = libraryStorage.getLibrary();

    for (const shelf in this.shelves) {
      this.shelves[shelf].innerHTML = library[shelf]
        .map((book) => this.createBookCard(book, false))
        .join("");
    }
  }

  createBookCard(book, isSearchResult, isRecommendation = false) {
    const library = libraryStorage.getLibrary();
    let currentShelf;
    let isInLibrary = false;

    // Find if book is in any shelf
    for (const shelf in library) {
      if (library[shelf].find((b) => b.id === book.id)) {
        currentShelf = shelf;
        isInLibrary = true;
        break;
      }
    }

    // Debug log
    console.log("Creating card for book:", book.title, "IA URL:", book.iaUrl);

    return `
        <div class="book-card" data-id="${book.id}" draggable="true">
            <img src="${book.thumbnail}" alt="${book.title}">
            ${
              isRecommendation
                ? `
                <div class="recommendation-badge">
                    <span>📚 ${book.recommendationReason}</span>
                </div>
            `
                : ""
            }
            <h3>${book.title}</h3>
            <p>${book.authors.join(", ")}</p>
            ${
              book.iaUrl
                ? `
                <a href="${book.iaUrl}" target="_blank" rel="noopener noreferrer" class="ia-link">
                    <button class="ia-button" onclick="event.stopPropagation()">
                        📚 Read PDF on Internet Archive
                    </button>
                </a>
            `
                : '<p class="ia-unavailable">PDF not available</p>'
            }
            ${
              isSearchResult
                ? isInLibrary
                  ? '<p class="in-library-badge">✓ In Your Library</p>'
                  : `<button class="add-book-btn" data-book-id="${book.id}">Add to Library</button>`
                : `
                    <div class="progress-bar" style="width: 100%; background: #eee;">
                        <div style="width: ${
                          book.progress || 0
                        }%; background: var(--primary-color); height: 10px;"></div>
                    </div>
                    ${
                      currentShelf !== "finished"
                        ? `
                        <button class="details-btn" data-book-id="${
                          book.id
                        }">Details</button>
                        <div class="book-actions">
                            ${
                              currentShelf !== "reading"
                                ? `<button class="move-btn" data-book-id="${book.id}" data-target="reading">Move to Reading</button>`
                                : ""
                            }
                            <button class="move-btn" data-book-id="${
                              book.id
                            }" data-target="finished">Move to Finished</button>
                        </div>
                    `
                        : ""
                    }
                `
            }
        </div>
    `;
  }

  addToLibrary(bookId, shelf) {
    const bookElement = document.querySelector(`[data-id="${bookId}"]`);
    const bookData = {
      id: bookId,
      title: bookElement.querySelector("h3").textContent,
      authors: [bookElement.querySelector("p").textContent],
      thumbnail: bookElement.querySelector("img").src,
    };

    libraryStorage.addBook(bookData, shelf);
    this.renderLibrary();
    this.updateCharts();

    // Update the search results to show "In Library" badge
    const addButton = bookElement.querySelector(".add-book-btn");
    if (addButton) {
      addButton.replaceWith(
        Object.assign(document.createElement("p"), {
          className: "in-library-badge",
          textContent: "✓ In Your Library",
        })
      );
    }

    // Add fade-in animation to the new badge
    bookElement
      .querySelector(".in-library-badge")
      .classList.add("animate-fade-in");
  }

  openBookDetails(bookId) {
    this.currentBookId = bookId;
    const library = libraryStorage.getLibrary();
    let book;
    let currentShelf;

    for (const shelf in library) {
      book = library[shelf].find((b) => b.id === bookId);
      if (book) {
        currentShelf = shelf;
        break;
      }
    }

    if (!book) return;

    this.bookDetails.innerHTML = `
            <h2>${book.title}</h2>
            <p>${book.authors.join(", ")}</p>
        `;

    this.progressInput.value = book.progress || 0;
    this.progressValue.textContent = `${book.progress || 0}%`;
    this.bookNotes.value = book.notes || "";
    this.modal.classList.add("active");
    this.modal.style.display = "block";

    // Add entrance animation
    requestAnimationFrame(() => {
      this.modal.querySelector(".modal-content").style.transform = "scale(1)";
      this.modal.querySelector(".modal-content").style.opacity = "1";
    });

    // Reset the move button
    this.moveBook.textContent = "Move to Shelf";
  }

  closeModal() {
    const modalContent = this.modal.querySelector(".modal-content");
    modalContent.style.transform = "scale(0.7)";
    modalContent.style.opacity = "0";

    setTimeout(() => {
      this.modal.style.display = "none";
      this.modal.classList.remove("active");
    }, 300);
  }

  moveToShelf(bookId, targetShelf) {
    const bookCard = document.querySelector(`[data-id="${bookId}"]`);
    if (bookCard) {
      bookCard.style.transform = "scale(0.8)";
      bookCard.style.opacity = "0";

      setTimeout(() => {
        const library = libraryStorage.getLibrary();
        let sourceShelf;

        for (const shelf in library) {
          if (library[shelf].find((book) => book.id === bookId)) {
            sourceShelf = shelf;
            break;
          }
        }

        if (sourceShelf && sourceShelf !== targetShelf) {
          libraryStorage.moveBook(bookId, sourceShelf, targetShelf);
          this.renderLibrary();
          this.updateCharts();
        }
      }, 300);
    }
  }

  toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    this.darkModeToggle.textContent = isDark ? "☀️" : "🌙";
    localStorage.setItem("darkMode", isDark);
  }

  initializeAnimations() {
    // Add intersection observer for fade-in animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    // Observe all book cards
    document.querySelectorAll(".book-card").forEach((card) => {
      observer.observe(card);
    });
  }

  initializeCharts() {
    // Initialize the library stats chart
    this.libraryStatsChart = new Chart(this.libraryChart, {
      type: "doughnut",
      data: {
        labels: ["To Read", "Currently Reading", "Finished"],
        datasets: [
          {
            data: [0, 0, 0],
            backgroundColor: [
              "#4a90e2", // Blue for To Read
              "#f39c12", // Orange for Reading
              "#2ecc71", // Green for Finished
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
          },
          title: {
            display: true,
            text: "Reading Progress Overview",
          },
        },
      },
    });

    // Update charts with initial data
    this.updateCharts();
  }

  updateCharts() {
    const library = libraryStorage.getLibrary();

    // Update library stats chart
    this.libraryStatsChart.data.datasets[0].data = [
      library.toRead.length,
      library.reading.length,
      library.finished.length,
    ];
    this.libraryStatsChart.update();

    // Calculate and display additional stats
    const totalBooks =
      library.toRead.length + library.reading.length + library.finished.length;
    const completionRate = totalBooks
      ? ((library.finished.length / totalBooks) * 100).toFixed(1)
      : 0;

    // Update stats display
    document.getElementById("statsDetails").innerHTML = `
      <div class="stats-grid">
        <div class="stat-item">
          <h3>${totalBooks}</h3>
          <p>Total Books</p>
        </div>
        <div class="stat-item">
          <h3>${library.reading.length}</h3>
          <p>Currently Reading</p>
        </div>
        <div class="stat-item">
          <h3>${completionRate}%</h3>
          <p>Completion Rate</p>
        </div>
      </div>
    `;
  }
}

const ui = new UI();
