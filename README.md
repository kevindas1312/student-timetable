# Kevin's Timetable

**A personal study dashboard for planning your week, keeping assignments on track, and protecting time for focused work.**

[Open the live demo](https://kevindas1312.github.io/student-timetable/) · Runs in your browser · No account or build step required

Kevin's Timetable brings a weekly schedule, study tasks, exam dates, and a Pomodoro timer into one responsive workspace. Your data is saved locally in your browser, with JSON backup and restore when you need to move it.

## Features

- **24-hour weekly timetable** — Plan Monday through Sunday from `00:00` to `23:00`. Sessions are color-coded by type, editable from the calendar, and shown alongside the current day and live time indicator. The calendar opens at 07:00 for a quick view of the morning.
- **Priority task tracker** — Add due dates, set low, medium, or high priority, filter tasks by status, and track completion progress.
- **Exam countdown telemetry** — See live day, hour, minute, and second countdowns for upcoming exams and other milestones.
- **Pomodoro focus engine** — Run focus sessions and short or long breaks with a circular progress display, session count, and optional completion chime.
- **JSON backup and restore** — Export your workspace to a JSON file or import a backup to restore it on this device.
- **Private local storage** — Timetable, tasks, exams, and timer settings are stored in the browser's `localStorage`; there is no application server or account.

### Session colors

| Type | Color |
| --- | --- |
| Lecture | Yellow |
| Lab | Purple |
| Tutorial | Red |
| Study | Blue |
| Club | Green |
| Competition | Turquoise |
| Other | Brown |

## Tech stack

- **HTML5** for semantic page structure and accessible controls
- **CSS** for the responsive dark interface, timetable grid, and animations
- **Vanilla JavaScript (ES6+)** for application state, rendering, timers, and interactions
- **Tailwind CSS CDN** and **Lucide Icons CDN** for utility styling and interface icons
- **Google Fonts:** Space Grotesk, Plus Jakarta Sans, and JetBrains Mono
- **Web APIs:** `localStorage`, Web Audio API, and the browser File API

The app is static and has no runtime dependencies to install, backend, or build pipeline.

## Run locally

1. Clone or download this repository.
2. Open `index.html` in a browser, or serve the folder locally:

   ```bash
   python3 -m http.server 8000
   ```

3. Visit [http://localhost:8000](http://localhost:8000).

Tailwind, Lucide, and the selected fonts are loaded from their CDNs, so an internet connection is needed for those assets. The application itself runs locally in the browser.

## Project architecture

```text
.
├── index.html   # Page structure, dashboard sections, and modal forms
├── styles.css   # Theme, responsive layout, timetable grid, and animations
├── app.js       # State, local persistence, rendering, and event handlers
└── README.md    # Project overview and setup guide
```

`app.js` loads and validates saved workspace data, updates the interface, and writes changes to `localStorage`. The timetable, task tracker, exam countdowns, focus timer, and JSON import/export all run entirely on the client. `index.html`, `styles.css`, and `app.js` can be published directly to GitHub Pages without a build step.

## Deploy

Publish the repository's root directory with GitHub Pages. No compilation or server configuration is required. On first visit, the app initializes a sample workspace; use **Export** to save it or **Import** to restore a JSON backup.
