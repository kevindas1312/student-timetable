# Project Rules & Futuristic Frontend Standards

## 1. Tech Stack & Zero-Build Architecture
- Build a zero-backend static web application using semantic HTML5, Tailwind CSS (via CDN), Lucide Icons (via CDN), and modular vanilla JavaScript (ES6+).
- Include Google Fonts (`Space Grotesk` for display headings, `Plus Jakarta Sans` for UI body text, and `JetBrains Mono` for countdowns, clocks, and course codes).
- Keep everything self-contained so it deploys cleanly to GitHub Pages with zero build step.

## 2. Futuristic Aesthetic & Visual Design System
- **Theme:** Deep-space obsidian dark mode (`#050810` base canvas) paired with translucent frosted glass Bento-grid panels (`bg-slate-900/50 backdrop-blur-xl`).
- **Borders & Depth:** Use subtle luminous 1px borders (`border-white/10`) with inner top-edge specular highlights and ambient radial background glow blobs (`amber-400/15`, `indigo-500/15`, `violet-500/15`) behind key cards.
- **Accents & Telemetry:** High-contrast electric gold-yellow (`#facc15`), warm amber (`#f59e0b`), and emerald (`#10b981`) accents for active states, live indicators, and progress rings.
- **Dynamic Live Indicators:** Highlight the current day column and draw a glowing horizontal "current time" laser indicator line across the active timetable slot.

## 3. Motion, Physics & Smooth Transitions
- **GPU-Accelerated Transitions:** Apply `transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]` across interactive cards, buttons, tabs, and modals.
- **Staggered Entrance:** Animate dashboard Bento cards on initial load using subtle upward fade-ins (`translateY(12px)` to `0`) with staggered CSS animation delays (`50ms` increments).
- **Interactive Hover & Tactile Feedback:** Cards subtly lift (`hover:-translate-y-0.5`) and brighten their border glow on hover; buttons compress slightly on click (`active:scale-[0.98]`).
- **Fluid Modals & Drawers:** Modals and slide-over drawers must fade and scale smoothly (`opacity-0 scale-95` to `opacity-100 scale-100`) with a blurred backdrop (`backdrop-blur-md`)—never snap abruptly.
- **View & Tab Transitions:** Switching between views (Timetable, Tasks, Focus Timer) or mobile day-tabs must use smooth opacity/transform crossfades.
- **Accessibility:** Respect `@media (prefers-reduced-motion: reduce)` by disabling non-essential movement animations.

## 4. Core Features & Data Persistence
- **Interactive Weekly Timetable:** CSS Grid schedule (Monday–Sunday) supporting custom color-coded blocks (cyan, violet, emerald, amber, rose), click-to-edit/delete, and a live current-time line.
- **Study Task & Assignment Tracker:** Priority badges, due dates, progress bar, and smooth strike-through/completion animations.
- **Exam Countdown Telemetry:** Live ticking days/hours/minutes/seconds counters in `JetBrains Mono` with radial or linear urgency bars.
- **Pomodoro Focus Engine:** Circular SVG progress ring with smooth stroke-dashoffset transitions and a synthesized Web Audio API chime on completion.
- **Persistence & Backup:** Auto-save all state to `localStorage` with JSON Export/Import buttons so data can be backed up or transferred anytime.

## 5. Code Quality & File Structure
- Separate markup (`index.html`), custom keyframes/glass utilities (`styles.css`), and state/DOM logic (`app.js`) cleanly.
- Every button, filter, modal, and toggle must be 100% functional with zero placeholder stubs.

## Custom Color & Time Rules
- **Session Types & Colors:** 
  - Lectures: Yellow (`#facc15`)
  - Labs: Purple (`#a855f7`)
  - Tutorials: Red (`#ef4444`)
  - Study: Blue (`#3b82f6`)
  - Clubs: Green (`#10b981`)
  - Competitions: Turquoise (`#06b6d4`)
  - Other: Brown (`#b45309`)
- **Task Priority Icons:** Low = Green, Medium = Yellow, High = Red.
- **Timetable Hours:** Scrollable grid spanning 12:00 AM (00:00) to 12:00 PM (12:00) with sticky hour labels and vertical time slots.
