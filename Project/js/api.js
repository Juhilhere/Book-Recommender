class BookAPI {
  constructor() {
    this.GOOGLE_API_KEY = "AIzaSyA0u9CVKQnpc7kQZVPxdZY92B8wg-1wiXw";
    this.GOOGLE_BASE_URL = "https://www.googleapis.com/books/v1/volumes";
    this.IA_BASE_URL = "https://archive.org/advancedsearch.php";
    this.IA_DETAILS_URL = "https://archive.org/details/";
    this.IA_DOWNLOAD_URL = "https://archive.org/download/";
    this.IA_API_KEY = "arZvPrEbMXvVfCFb";
  }

  async searchBooks(query, filter = "all") {
    try {
      // First search Internet Archive for available PDFs
      const iaBooks = await this.searchInternetArchive(query);

      if (iaBooks.length > 0) {
        // If we found books in IA, return those
        return iaBooks;
      }

      // If no IA books found, fall back to Google Books
      let searchQuery = query;
      if (filter !== "all") {
        searchQuery = `in${filter}:${query}`;
      }

      const googleResponse = await fetch(
        `${this.GOOGLE_BASE_URL}?q=${encodeURIComponent(searchQuery)}&key=${
          this.GOOGLE_API_KEY
        }`
      );
      const googleData = await googleResponse.json();
      return this.formatGoogleResults(googleData.items || []);
    } catch (error) {
      console.error("Error searching books:", error);
      return [];
    }
  }

  async searchInternetArchive(query) {
    try {
      const cleanQuery = encodeURIComponent(query.trim());

      const searchQuery = {
        q: `title:(${cleanQuery}) AND format:pdf AND mediatype:texts AND _exists_:pdf AND collection:(opensource OR additional_collections)`,
        fl: [
          "identifier",
          "title",
          "creator",
          "description",
          "downloads",
          "imagecount",
          "format",
        ],
        rows: 20,
        output: "json",
        sort: ["downloads desc"],
        filters: "downloadable:true",
      };

      const searchUrl = `${this.IA_BASE_URL}?${new URLSearchParams(
        searchQuery
      ).toString()}`;
      console.log("Searching IA with URL:", searchUrl);

      const response = await fetch(searchUrl);
      const data = await response.json();
      console.log("IA Response:", data);

      if (data.response?.docs?.length > 0) {
        return Promise.all(
          data.response.docs.map(async (doc) => {
            // Get the direct PDF URL
            const pdfUrl = await this.getPdfUrl(doc.identifier);
            if (!pdfUrl) return null;

            return {
              id: doc.identifier,
              title: doc.title || "Unknown Title",
              authors: doc.creator ? [doc.creator] : ["Unknown Author"],
              thumbnail: `https://archive.org/services/img/${doc.identifier}`,
              description: doc.description || "No description available",
              categories: ["Internet Archive"],
              pageCount: doc.imagecount || 0,
              iaUrl: pdfUrl,
              downloads: doc.downloads || 0,
            };
          })
        ).then((results) => results.filter((book) => book !== null));
      }

      return [];
    } catch (error) {
      console.error("Error searching Internet Archive:", error);
      return [];
    }
  }

  async getPdfUrl(identifier) {
    try {
      const filesUrl = `${this.IA_DOWNLOAD_URL}${identifier}/${identifier}_files.xml`;
      const response = await fetch(filesUrl);
      const text = await response.text();

      // Look for PDF file in the response
      const pdfMatch = text.match(new RegExp(`${identifier}.*?\\.pdf`));
      if (pdfMatch) {
        return `${this.IA_DOWNLOAD_URL}${identifier}/${pdfMatch[0]}`;
      }
      return null;
    } catch (error) {
      console.error("Error getting PDF URL:", error);
      return null;
    }
  }

  formatGoogleResults(items) {
    return items.map((item) => ({
      id: item.id,
      title: item.volumeInfo.title,
      authors: item.volumeInfo.authors || ["Unknown Author"],
      thumbnail:
        item.volumeInfo.imageLinks?.thumbnail || "placeholder-image.jpg",
      description: item.volumeInfo.description || "No description available",
      categories: item.volumeInfo.categories || ["Uncategorized"],
      pageCount: item.volumeInfo.pageCount || 0,
      iaUrl: null,
    }));
  }

  async searchByGenre(genre) {
    try {
      // First try Internet Archive
      const iaBooks = await this.searchInternetArchive(`subject:"${genre}"`);

      // Then try Google Books
      const googleResponse = await fetch(
        `${this.GOOGLE_BASE_URL}?q=subject:${encodeURIComponent(
          genre
        )}&maxResults=20&key=${this.GOOGLE_API_KEY}`
      );
      const googleData = await googleResponse.json();
      const googleBooks = this.formatGoogleResults(googleData.items || []);

      // Combine and deduplicate results
      return [...iaBooks, ...googleBooks];
    } catch (error) {
      console.error("Error searching by genre:", error);
      return [];
    }
  }
}

const bookAPI = new BookAPI();
