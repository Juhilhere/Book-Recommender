class LibraryStorage {
    constructor() {
        this.STORAGE_KEY = 'bookshelf_library';
    }

    getLibrary() {
        const library = localStorage.getItem(this.STORAGE_KEY);
        return library ? JSON.parse(library) : {
            toRead: [],
            reading: [],
            finished: []
        };
    }

    saveLibrary(library) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(library));
    }

    addBook(book, shelf) {
        const library = this.getLibrary();
        book.progress = 0;
        book.notes = '';
        book.addedAt = new Date().toISOString();
        
        library[shelf].push(book);
        this.saveLibrary(library);
    }

    moveBook(bookId, fromShelf, toShelf) {
        const library = this.getLibrary();
        const bookIndex = library[fromShelf].findIndex(book => book.id === bookId);
        
        if (bookIndex !== -1) {
            const book = library[fromShelf].splice(bookIndex, 1)[0];
            
            // Update progress when moving to finished
            if (toShelf === 'finished') {
                book.progress = 100;
            }
            
            library[toShelf].push(book);
            this.saveLibrary(library);
        }
    }

    updateBookProgress(bookId, progress, notes) {
        const library = this.getLibrary();
        
        for (const shelf in library) {
            const book = library[shelf].find(book => book.id === bookId);
            if (book) {
                book.progress = progress;
                book.notes = notes;
                
                // Automatically move to finished if progress is 100%
                if (progress === 100 && shelf !== 'finished') {
                    this.moveBook(bookId, shelf, 'finished');
                }
                else {
                    this.saveLibrary(library);
                }
                break;
            }
        }
    }
}

const libraryStorage = new LibraryStorage(); 