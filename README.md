This book recommender website allows you to search for books by title, author, or genre, add them to your personal library, and track your reading progress with ease. It offers smart recommendations based on your searches, detailed library statistics, and a user-friendly interface with both light and dark modes for better readability. Built using HTML, CSS, and JavaScript, the website ensures seamless functionality without requiring a login, thanks to LocalStorage for data persistence. Additionally, it leverages Chart.js to provide clear visual representations of your reading, making it a convenient and efficient tool for book lovers of all kinds.

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
