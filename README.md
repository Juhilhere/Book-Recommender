This book recommender website lets you search for books by title, author, or genre, add them to your library, and track your reading progress. It provides recommendations, library statistics, and a user-friendly light/dark mode. Built with HTML, CSS, and JavaScript, it uses LocalStorage for offline access and Chart.js for visual statistics—no login required.

**Features:**
- Search for books by title, author, or genre
- Add books to your library and track reading progress
- Get book recommendations based on your interests
- See library stats (to-read, reading, finished)
- Light and dark mode for better readability

**Technologies:**
- HTML, CSS, JavaScript
- Chart.js for graphs and stats
- LocalStorage for saving data, so no login needed

**Project Structure:**
- `css/` → Stylesheets for layout and themes
- `js/` → JavaScript files for app functions
- `index.html` → Main page to interact with the app

**JavaScript Files:**
- `api.js` → Gets book data from Google Books & Internet Archive
- `storage.js` → Saves & loads book data locally
- `ui.js` → Handles the UI and user interactions
- `utils.js` → Extra functions for efficiency

**Setup:**
1. Download the project.
2. Open `index.html` in a browser.
3. Start adding and tracking your books.

**Notes:**
- Replace API keys in `api.js` with your own for full functionality.
- The app works offline thanks to LocalStorage.
- Feel free to contribute and improve it!
