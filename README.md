# Smart Campus Complaint Management System

A responsive multi-section front-end project built with HTML, CSS, and vanilla JavaScript.

## Pages included
1. **Home** — project introduction, how-it-works cards, quick statistics, and shortcuts.
2. **Submit Complaint** — form for student details, category, location, title, description, priority, and optional email.
3. **My Complaints** — search, filter, update status, delete reports, and export CSV.
4. **Dashboard** — total/pending/in-progress/resolved counts, status donut chart, category breakdown, and recent complaints.

## Run locally
1. Extract the ZIP archive.
2. Open `index.html` in your browser.
3. Use the navigation at the top to switch between pages.
4. Submit a complaint to populate the tracker and dashboard.

You can also open this folder in Visual Studio Code and use the Live Server extension.

## Storage and limitations
This is a client-side student project. Records are saved in the browser's `localStorage` on the current device. It does not include authentication, a backend API, a shared database, email notifications, or role-based access control. The status dropdown is included for demonstration.

For a production campus deployment, add a secure backend (such as Node.js/Express), a database, login, authorization for status updates, server-side validation, and secure hosting.
