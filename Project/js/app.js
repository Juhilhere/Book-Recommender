// Initialize dark mode from localStorage
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').textContent = '☀️';
    }
});

// Add drag and drop functionality
document.querySelectorAll('.shelf-books').forEach(shelf => {
    shelf.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });

    shelf.addEventListener('drop', e => {
        e.preventDefault();
        const bookId = e.dataTransfer.getData('text/plain');
        const fromShelf = e.dataTransfer.getData('application/shelf');
        const toShelf = shelf.parentElement.id;

        if (fromShelf !== toShelf) {
            libraryStorage.moveBook(bookId, fromShelf, toShelf);
            ui.renderLibrary();
        }
    });
}); 