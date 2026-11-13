(() => {
  'use strict';

  const STORAGE_KEY = 'orbit-study-dashboard-v1';
  const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const SHORT_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const SESSION_TYPES = ['lecture', 'lab', 'tutorial', 'study', 'club', 'competition', 'other'];
  const CALENDAR_START_MINUTE = 0;
  const CALENDAR_END_MINUTE = 24 * 60;
  const CALENDAR_HOUR_HEIGHT = 60;
  const CALENDAR_INITIAL_SCROLL_MINUTE = 7 * CALENDAR_HOUR_HEIGHT;
  const TIMER_MODES = { focus: { label: 'FOCUS SESSION', minutes: 25 }, short: { label: 'SHORT BREAK', minutes: 5 }, long: { label: 'LONG BREAK', minutes: 15 } };
  const validTime = value => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  const validDate = value => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T12:00:00`); return !Number.isNaN(date.getTime()) && isoDate(date) === value;
  };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const pad = value => String(value).padStart(2, '0');
  const isoDate = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const addDays = (date, amount) => { const result = new Date(date); result.setDate(result.getDate() + amount); return result; };
  const localMonday = date => { const day = (date.getDay() + 6) % 7; const monday = new Date(date); monday.setDate(date.getDate() - day); monday.setHours(0, 0, 0, 0); return monday; };
  const formatClock = date => date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const dayOf = iso => { const date = new Date(`${iso}T12:00:00`); return (date.getDay() + 6) % 7; };

  function starterData() {
    const today = new Date();
    const due = n => isoDate(addDays(today, n));
    return {
      schemaVersion: 1,
      sessions: [
        { id: makeId(), title: 'Data Structures', day: 0, start: '09:00', end: '10:30', type: 'lecture', location: 'Science 204' },
        { id: makeId(), title: 'Calculus II', day: 0, start: '13:00', end: '14:00', type: 'lecture', location: 'Hall B' },
        { id: makeId(), title: 'Physics Lab', day: 1, start: '10:00', end: '12:00', type: 'lab', location: 'Lab 3' },
        { id: makeId(), title: 'Reading & review', day: 1, start: '15:00', end: '16:00', type: 'study', location: 'Library' },
        { id: makeId(), title: 'Academic Writing', day: 2, start: '08:00', end: '09:30', type: 'lecture', location: 'Arts 110' },
        { id: makeId(), title: 'Database Systems', day: 3, start: '11:00', end: '12:30', type: 'lecture', location: 'Tech 301' },
        { id: makeId(), title: 'Statistics', day: 4, start: '10:00', end: '11:30', type: 'lecture', location: 'Science 208' },
        { id: makeId(), title: 'Weekly study block', day: 5, start: '11:00', end: '13:00', type: 'study', location: 'Library' }
      ],
      tasks: [
        { id: makeId(), title: 'Review data structures lecture notes', due: due(2), priority: 'high', completed: false },
        { id: makeId(), title: 'Finish calculus problem set', due: due(4), priority: 'med', completed: false },
        { id: makeId(), title: 'Read chapter 6 for physics', due: due(6), priority: 'low', completed: false },
        { id: makeId(), title: 'Outline writing assignment', due: due(1), priority: 'med', completed: true }
      ],
      exams: [
        { id: makeId(), title: 'Statistics Midterm', type: 'Midterm', date: due(14), time: '09:00', note: 'Statistics · Hall B' },
        { id: makeId(), title: 'Semester Final Exams', type: 'Final', date: due(39), time: '09:00', note: 'End of term' }
      ],
      timer: { mode: 'focus', remaining: 25 * 60, endAt: null, running: false, sound: true, sessions: 0 }
    };
  }

  function normalizeData(raw) {
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.sessions) || !Array.isArray(raw.tasks) || !Array.isArray(raw.exams)) throw new Error("This file does not contain a valid Kevin's Timetable workspace.");
    const sessions = raw.sessions.map(item => {
      if (!item || typeof item.title !== 'string' || !item.title.trim() || !Number.isInteger(Number(item.day)) || Number(item.day) < 0 || Number(item.day) > 6 || !validTime(item.start) || !validTime(item.end) || item.end <= item.start) throw new Error('One or more timetable sessions are invalid.');
      return { id: String(item.id || makeId()), title: item.title.slice(0, 70), day: Number(item.day), start: item.start, end: item.end, type: SESSION_TYPES.includes(item.type) ? item.type : 'other', location: typeof item.location === 'string' ? item.location.slice(0, 60) : '' };
    });
    const tasks = raw.tasks.map(item => {
      if (!item || typeof item.title !== 'string' || !item.title.trim() || !validDate(item.due)) throw new Error('One or more study tasks are invalid.');
      return { id: String(item.id || makeId()), title: item.title.slice(0, 100), due: item.due, priority: ['low', 'med', 'high'].includes(item.priority) ? item.priority : 'med', completed: Boolean(item.completed) };
    });
    const exams = raw.exams.map(item => {
      if (!item || typeof item.title !== 'string' || !item.title.trim() || !validDate(item.date)) throw new Error('One or more exam countdowns are invalid.');
      return { id: String(item.id || makeId()), title: item.title.slice(0, 70), type: ['Midterm', 'Final', 'Quiz', 'Other'].includes(item.type) ? item.type : 'Exam', date: item.date, time: validTime(item.time) ? item.time : '09:00', note: typeof item.note === 'string' ? item.note.slice(0, 60) : '' };
    });
    const rawTimer = raw.timer && typeof raw.timer === 'object' ? raw.timer : {};
    const mode = Object.hasOwn(TIMER_MODES, rawTimer.mode) ? rawTimer.mode : 'focus';
    const maxTime = TIMER_MODES[mode].minutes * 60;
    const timer = {
      mode,
      remaining: Math.max(0, Math.min(maxTime, Number.isFinite(Number(rawTimer.remaining)) ? Number(rawTimer.remaining) : maxTime)),
      endAt: Number.isFinite(Number(rawTimer.endAt)) && Number(rawTimer.endAt) > 0 ? Number(rawTimer.endAt) : null,
      running: Boolean(rawTimer.running), sound: rawTimer.sound !== false, sessions: Math.max(0, Math.floor(Number(rawTimer.sessions) || 0))
    };
    if (timer.running && !timer.endAt) timer.running = false;
    if (timer.running) timer.remaining = Math.max(0, Math.min(maxTime, Math.ceil((timer.endAt - Date.now()) / 1000)));
    return { schemaVersion: 1, sessions, tasks, exams, timer };
  }

  function loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return normalizeData(JSON.parse(saved));
    } catch (error) { console.warn('Could not load saved workspace:', error); }
    return starterData();
  }

  let state = loadData();
  let weekOffset = 0;
  let taskFilter = 'all';
  const activeSessionTypes = new Set(SESSION_TYPES);
  let examExpanded = false;
  let editingSessionId = null;
  let editingTaskId = null;
  let editingExamId = null;
  let lastFocus = null;
  let saveTimeout;
  let audioContext;

  function saveState() {
    clearTimeout(saveTimeout);
    $('#save-indicator').textContent = 'SAVING…';
    saveTimeout = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); $('#save-indicator').textContent = 'LOCAL STORAGE'; }
      catch (error) { $('#save-indicator').textContent = 'SAVE UNAVAILABLE'; console.warn('Could not save workspace:', error); toast('Browser storage is full or unavailable.', 'error'); }
    }, 90);
  }

  function toast(message, type = 'success') {
    const node = document.createElement('div');
    node.className = `toast ${type === 'error' ? 'error' : ''}`;
    node.innerHTML = `<i data-lucide="${type === 'error' ? 'circle-alert' : 'circle-check'}"></i><span>${escapeHTML(message)}</span>`;
    $('#toast-region').append(node); if (window.lucide) lucide.createIcons({ nodes: [node] });
    setTimeout(() => node.remove(), 3400);
  }

  function formatShortDate(dateStr, options = {}) {
    const date = new Date(`${dateStr}T12:00:00`);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', ...options });
  }
  function dateDifference(dateStr) {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const target = new Date(`${dateStr}T00:00:00`);
    return Math.round((target - now) / 86400000);
  }
  function weekRange() {
    const start = localMonday(new Date()); start.setDate(start.getDate() + weekOffset * 7);
    const end = addDays(start, 6);
    const sameMonth = start.getMonth() === end.getMonth();
    return `${start.toLocaleDateString(undefined, { month: 'short' })} ${start.getDate()} – ${sameMonth ? '' : `${end.toLocaleDateString(undefined, { month: 'short' })} `}${end.getDate()}, ${end.getFullYear()}`;
  }

  function updateDateHeader() {
    const now = new Date();
    $('#top-date').textContent = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    $('#today-label').textContent = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function renderCalendar() {
    const root = $('#calendar-grid');
    const monday = localMonday(new Date()); monday.setDate(monday.getDate() + weekOffset * 7);
    const todayIndex = (new Date().getDay() + 6) % 7;
    const headSpacer = document.createElement('div'); headSpacer.className = 'calendar-head-spacer';
    headSpacer.style.gridRow = '1'; headSpacer.style.gridColumn = '1'; root.replaceChildren(headSpacer);
    for (let day = 0; day < 7; day++) {
      const date = addDays(monday, day); const isToday = weekOffset === 0 && day === todayIndex;
      const head = document.createElement('div'); head.className = `day-head ${isToday ? 'today' : ''}`;
      head.style.gridRow = '1'; head.style.gridColumn = String(day + 2);
      head.innerHTML = `${isToday ? '<i class="today-dot"></i>' : ''}<span>${SHORT_DAYS[day]}</span><strong>${date.getDate()}</strong>`; root.append(head);
    }
    const axis = document.createElement('div'); axis.className = 'time-axis';
    axis.style.gridRow = '2'; axis.style.gridColumn = '1';
    for (let hour = 0; hour < CALENDAR_END_MINUTE / 60; hour++) {
      const label = document.createElement('span'); label.className = `time-label${hour === 0 ? ' time-label-start' : ''}`; label.style.top = `${hour * CALENDAR_HOUR_HEIGHT}px`;
      label.textContent = `${pad(hour)}:00`; axis.append(label);
    }
    root.append(axis);
    for (let day = 0; day < 7; day++) {
      const track = document.createElement('div'); track.className = `day-track ${weekOffset === 0 && day === todayIndex ? 'today-track' : ''}`; track.dataset.day = String(day);
      track.style.gridRow = '2'; track.style.gridColumn = String(day + 2);
      state.sessions.filter(session => session.day === day && activeSessionTypes.has(session.type)).sort((a, b) => a.start.localeCompare(b.start)).forEach(session => {
        const start = session.start.split(':').map(Number); const end = session.end.split(':').map(Number);
        const startMin = start[0] * 60 + start[1]; const endMin = end[0] * 60 + end[1];
        if (endMin <= CALENDAR_START_MINUTE || startMin >= CALENDAR_END_MINUTE) return;
        const visibleStart = Math.max(startMin, CALENDAR_START_MINUTE);
        const visibleEnd = Math.min(endMin, CALENDAR_END_MINUTE);
        const top = visibleStart - CALENDAR_START_MINUTE; const duration = visibleEnd - visibleStart;
        const block = document.createElement('button'); block.type = 'button'; block.className = `session-block ${session.type} ${duration < 51 ? 'short-block' : ''}`;
        block.dataset.id = session.id; block.style.top = `${top}px`; block.style.height = `${Math.max(32, duration)}px`; block.setAttribute('aria-label', `${session.title}, ${WEEKDAYS[day]}, ${session.start} to ${session.end}. Edit session.`);
        block.innerHTML = `<span class="session-title">${escapeHTML(session.title)}</span><span class="session-time">${escapeHTML(formatTime(session.start))} – ${escapeHTML(formatTime(session.end))}</span>${session.location ? `<span class="session-location">${escapeHTML(session.location)}</span>` : ''}`;
        track.append(block);
      });
      root.append(track);
    }
    const currentTrack = weekOffset === 0 ? $('.day-track.today-track', root) : null;
    if (currentTrack) {
      const now = new Date(); const minutes = now.getHours() * 60 + now.getMinutes();
      if (minutes >= CALENDAR_START_MINUTE && minutes <= CALENDAR_END_MINUTE) {
        const line = document.createElement('div'); line.className = 'current-time-line'; line.style.top = `${minutes - CALENDAR_START_MINUTE}px`; line.title = `Current time ${formatClock(now)}`; currentTrack.append(line);
      }
    }
    $('#week-label').textContent = weekRange();
    const visibleSessions = state.sessions.filter(session => activeSessionTypes.has(session.type) && session.end > '00:00' && session.start < '24:00');
    if (!visibleSessions.length) $$('.day-track', root).forEach(track => {
      const emptyState = document.createElement('div'); emptyState.className = 'no-sessions';
      emptyState.innerHTML = state.sessions.length ? 'No matching sessions' : 'No sessions<br>Click + Session to begin';
      track.append(emptyState);
    });
  }

  function formatTime(value) {
    const [hour, minute] = value.split(':').map(Number); const suffix = hour < 12 ? 'am' : 'pm';
    return `${hour % 12 || 12}${minute ? `:${pad(minute)}` : ''}${suffix}`;
  }

  function scrollCalendarToInitialHour() {
    const viewport = $('#calendar-viewport');
    const previousBehavior = viewport.style.scrollBehavior;
    viewport.style.scrollBehavior = 'auto';
    viewport.scrollTop = CALENDAR_INITIAL_SCROLL_MINUTE;
    viewport.style.scrollBehavior = previousBehavior;
  }

  function renderTasks() {
    const total = state.tasks.length; const completed = state.tasks.filter(task => task.completed).length;
    const percent = total ? Math.round(completed * 100 / total) : 0;
    $('#task-heading-count').textContent = String(total); $('#nav-task-count').textContent = String(state.tasks.filter(task => !task.completed).length);
    $('#filter-all-count').textContent = String(total); $('#stat-completion').innerHTML = `${percent}<span>%</span>`;
    $('#stat-task-progress').style.width = `${percent}%`; $('#stat-task-caption').textContent = total ? `${completed} of ${total} tasks complete` : 'No tasks yet';
    $('#task-progress-percent').textContent = `${percent}%`; $('#task-list-progress').style.width = `${percent}%`;
    $('#task-progress-title').textContent = total && completed === total ? 'You cleared the board!' : completed ? `${completed} task${completed === 1 ? '' : 's'} complete — nice work` : 'You’re building momentum';
    $('#task-progress-subtitle').textContent = total ? `${total - completed} task${total - completed === 1 ? '' : 's'} left to go.` : 'Add a task to start your progress.';
    $$('.filter-button').forEach(button => { const active = button.dataset.filter === taskFilter; button.classList.toggle('active', active); button.setAttribute('aria-selected', String(active)); });
    const filtered = state.tasks.filter(task => taskFilter === 'all' || (taskFilter === 'active' && !task.completed) || (taskFilter === 'completed' && task.completed)).sort((a, b) => Number(a.completed) - Number(b.completed) || a.due.localeCompare(b.due));
    const list = $('#task-list');
    if (!filtered.length) {
      const message = total ? (taskFilter === 'completed' ? 'Nothing completed yet. Keep going!' : 'All caught up. Enjoy the breathing room.') : 'Your study plan starts with one task.';
      list.innerHTML = `<div class="empty-state"><i data-lucide="${total ? 'sparkles' : 'list-plus'}"></i><span>${message}</span></div>`;
    } else {
      list.innerHTML = filtered.map(task => {
        const difference = dateDifference(task.due); const dateLabel = difference < 0 ? `${Math.abs(difference)}d overdue` : difference === 0 ? 'Due today' : difference === 1 ? 'Due tomorrow' : `Due ${formatShortDate(task.due)}`;
        const priorityLabel = task.priority === 'med' ? 'Medium' : task.priority[0].toUpperCase() + task.priority.slice(1);
        return `<div class="task-row ${task.completed ? 'completed' : ''}" data-id="${escapeHTML(task.id)}"><button class="task-check" data-action="toggle" aria-label="Mark ${escapeHTML(task.title)} ${task.completed ? 'incomplete' : 'complete'}" aria-pressed="${task.completed}"><i data-lucide="check"></i></button><div class="task-copy"><span class="task-name">${escapeHTML(task.title)}</span><span class="task-meta"><span class="priority-badge ${task.priority}">${priorityLabel}</span><span class="task-date ${difference < 0 && !task.completed ? 'overdue' : ''}">${dateLabel}</span></span></div><div class="task-actions"><button class="task-action" data-action="edit" aria-label="Edit task"><i data-lucide="pencil"></i></button><button class="task-action" data-action="delete" aria-label="Delete task"><i data-lucide="trash-2"></i></button></div></div>`;
      }).join('');
    }
    if (window.lucide) lucide.createIcons({ nodes: [list] });
    updateStats();
  }

  function examDateTime(exam) { return new Date(`${exam.date}T${exam.time || '09:00'}:00`); }
  function countdownParts(target) {
    const delta = Math.max(0, target.getTime() - Date.now()); const total = Math.floor(delta / 1000);
    return { total, days: Math.floor(total / 86400), hours: Math.floor(total % 86400 / 3600), minutes: Math.floor(total % 3600 / 60), seconds: total % 60 };
  }
  function renderExams() {
    const future = state.exams.filter(exam => examDateTime(exam).getTime() >= Date.now()).sort((a, b) => examDateTime(a) - examDateTime(b));
    const list = $('#exam-list');
    if (!future.length) {
      list.innerHTML = `<div class="exam-empty">${state.exams.length ? 'All your listed exams have passed.' : 'Your next milestone is waiting.'}<button type="button" id="empty-add-exam">+ Add an exam date</button></div>`;
    } else {
      const shown = examExpanded ? future : future.slice(0, 2);
      list.innerHTML = shown.map((exam, index) => {
        const parts = countdownParts(examDateTime(exam)); const type = exam.type || 'Exam';
        const urgency = Math.max(4, Math.min(100, 100 - (parts.days / 60 * 100)));
        return `<button type="button" class="exam-card" data-id="${escapeHTML(exam.id)}" style="--exam-color:${index ? '#a78bfa' : '#f7b955'}" aria-label="Edit ${escapeHTML(exam.title)} countdown"><span class="exam-card-top"><span class="exam-name">${escapeHTML(exam.title)}</span><span class="exam-type">${escapeHTML(type)}</span></span><span class="exam-note">${escapeHTML(exam.note || formatShortDate(exam.date, { weekday: 'short', year: 'numeric' }))}</span><span class="countdown"><span class="count-unit"><strong data-count="days" data-exam="${escapeHTML(exam.id)}">${pad(parts.days)}</strong><span>Days</span></span><span class="count-unit"><strong data-count="hours" data-exam="${escapeHTML(exam.id)}">${pad(parts.hours)}</strong><span>Hours</span></span><span class="count-unit"><strong data-count="minutes" data-exam="${escapeHTML(exam.id)}">${pad(parts.minutes)}</strong><span>Mins</span></span><span class="count-unit"><strong data-count="seconds" data-exam="${escapeHTML(exam.id)}">${pad(parts.seconds)}</strong><span>Secs</span></span></span><span class="exam-progress"><i style="width:${urgency}%"></i></span></button>`;
      }).join('');
    }
    const manageButton = $('#manage-exams');
    manageButton.textContent = future.length > 2 ? (examExpanded ? 'Show fewer exams' : `Show all ${future.length} exams`) : 'Add an exam';
    manageButton.innerHTML += ' <i data-lucide="arrow-up-right"></i>';
    updateStats();
    if (window.lucide) lucide.createIcons({ nodes: [manageButton] });
  }

  function updateStats() {
    const hours = state.sessions.reduce((sum, session) => { const [sh, sm] = session.start.split(':').map(Number); const [eh, em] = session.end.split(':').map(Number); return sum + Math.max(0, eh * 60 + em - sh * 60 - sm) / 60; }, 0);
    $('#stat-hours').innerHTML = `${Number.isInteger(hours) ? hours : hours.toFixed(1)}<span>h</span>`;
    $('#stat-sessions').textContent = `${state.sessions.length} session${state.sessions.length === 1 ? '' : 's'} scheduled`;
    const next = state.exams.filter(exam => examDateTime(exam).getTime() >= Date.now()).sort((a, b) => examDateTime(a) - examDateTime(b))[0];
    if (next) {
      const days = countdownParts(examDateTime(next)).days; $('#stat-next-exam').textContent = days === 0 ? 'Today' : `${days} day${days === 1 ? '' : 's'}`; $('#stat-next-exam-name').textContent = next.title;
    } else { $('#stat-next-exam').textContent = '—'; $('#stat-next-exam-name').textContent = 'Add an upcoming exam'; }
  }

  function renderCountdowns() {
    state.exams.forEach(exam => {
      const parts = countdownParts(examDateTime(exam));
      ['days', 'hours', 'minutes', 'seconds'].forEach(key => { const node = $(`[data-exam="${CSS.escape(exam.id)}"][data-count="${key}"]`); if (node) node.textContent = pad(parts[key]); });
    });
  }

  function renderTimer() {
    const timer = state.timer; const mode = TIMER_MODES[timer.mode];
    let remaining = timer.remaining;
    if (timer.running && timer.endAt) remaining = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
    $('#timer-time').textContent = `${pad(Math.floor(remaining / 60))}:${pad(remaining % 60)}`;
    $('#timer-mode-label').textContent = mode.label;
    const total = mode.minutes * 60; const progress = 1 - remaining / total;
    $('#timer-progress').style.strokeDashoffset = String(603.19 * (1 - Math.max(0, Math.min(1, progress))));
    $('#timer-progress').style.stroke = '#facc15';
    $('#timer-status').textContent = timer.running ? 'IN THE ZONE' : remaining === 0 ? 'SESSION COMPLETE' : 'READY TO FOCUS';
    const start = $('#timer-start'); start.classList.toggle('running', timer.running);
    start.innerHTML = timer.running ? '<i data-lucide="pause"></i><span>Pause session</span>' : '<i data-lucide="play"></i><span>Start focus</span>';
    $('#focus-sessions').textContent = `${timer.sessions} session${timer.sessions === 1 ? '' : 's'}`;
    $('#sound-toggle').classList.toggle('muted', !timer.sound); $('#sound-toggle').innerHTML = `<i data-lucide="${timer.sound ? 'volume-2' : 'volume-x'}"></i>`;
    $$('.focus-mode').forEach(button => { const active = button.dataset.mode === timer.mode; button.classList.toggle('active', active); button.setAttribute('aria-selected', String(active)); });
    if (window.lucide) lucide.createIcons({ nodes: [start, $('#sound-toggle')] });
  }

  function completeTimer(playChime = true) {
    const wasFocus = state.timer.mode === 'focus';
    state.timer.running = false; state.timer.endAt = null; state.timer.remaining = 0;
    if (wasFocus) state.timer.sessions += 1;
    if (playChime && state.timer.sound) playChimeSound();
    saveState(); renderTimer();
    toast(wasFocus ? 'Focus session complete. Take a well-earned break.' : 'Break complete. Ready when you are.');
  }

  function playChimeSound() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      audioContext ||= new AudioContextClass();
      if (audioContext.state === 'suspended') audioContext.resume();
      const now = audioContext.currentTime;
      [523.25, 659.25, 783.99].forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator(); const gain = audioContext.createGain();
        oscillator.type = 'sine'; oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(.0001, now + index * .17); gain.gain.exponentialRampToValueAtTime(.14, now + index * .17 + .03); gain.gain.exponentialRampToValueAtTime(.0001, now + index * .17 + .62);
        oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(now + index * .17); oscillator.stop(now + index * .17 + .65);
      });
    } catch (error) { console.warn('Audio chime could not play:', error); }
  }

  function prepareAudio() {
    if (!state.timer.sound) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      audioContext ||= new AudioContextClass();
      if (audioContext.state === 'suspended') audioContext.resume();
    } catch (error) { console.warn('Audio is unavailable:', error); }
  }

  function tick() {
    renderCountdowns();
    if (state.timer.running) {
      const remaining = Math.max(0, Math.ceil((state.timer.endAt - Date.now()) / 1000));
      if (remaining === 0) completeTimer(); else { state.timer.remaining = remaining; renderTimer(); }
    }
    const line = $('.current-time-line');
    if (line && weekOffset === 0) {
      const now = new Date(); const minutes = now.getHours() * 60 + now.getMinutes();
      if (minutes < 420 || minutes > 1200) { line.remove(); }
      else line.style.top = `${minutes - 420}px`;
    }
  }

  function openModal(backdrop, focusTarget) {
    lastFocus = document.activeElement; backdrop.hidden = false;
    requestAnimationFrame(() => { backdrop.classList.add('open'); focusTarget?.focus(); });
  }
  function closeModal(backdrop) {
    backdrop.classList.remove('open');
    setTimeout(() => { if (!backdrop.classList.contains('open')) backdrop.hidden = true; }, 230);
    lastFocus?.focus?.();
  }

  const sessionBackdrop = $('#modal-backdrop'); const taskBackdrop = $('#task-backdrop'); const examBackdrop = $('#exam-backdrop');
  function openSessionModal(session = null, day = (new Date().getDay() + 6) % 7) {
    editingSessionId = session?.id || null; $('#session-form').reset();
    $('#session-title').value = session?.title || ''; $('#session-day').value = String(session?.day ?? day); $('#session-type').value = session?.type || 'lecture';
    $('#session-start').value = session?.start || '09:00'; $('#session-end').value = session?.end || '10:00'; $('#session-location').value = session?.location || '';
    $('#modal-title').textContent = session ? 'Edit session' : 'Add a session'; $('#modal-kicker').textContent = session ? 'UPDATE YOUR SCHEDULE' : 'YOUR SCHEDULE'; $('#session-delete').hidden = !session;
    openModal(sessionBackdrop, $('#session-title'));
  }
  function openTaskModal(task = null) {
    editingTaskId = task?.id || null; $('#task-form').reset(); $('#task-title').value = task?.title || ''; $('#task-due').value = task?.due || isoDate(addDays(new Date(), 1)); $('#task-priority').value = task?.priority || 'med';
    $('#task-modal-title').textContent = task ? 'Edit study task' : 'Add a study task'; $('#task-delete').hidden = !task; openModal(taskBackdrop, $('#task-title'));
  }
  function openExamModal(exam = null) {
    editingExamId = exam?.id || null; $('#exam-form').reset();
    $('#exam-title').value = exam?.title || ''; $('#exam-date').value = exam?.date || isoDate(addDays(new Date(), 14)); $('#exam-time').value = exam?.time || '09:00'; $('#exam-type').value = exam?.type || 'Midterm'; $('#exam-note').value = exam?.note || '';
    $('#exam-modal-title').textContent = exam ? 'Edit exam' : 'Add an exam'; $('#exam-delete').hidden = !exam; openModal(examBackdrop, $('#exam-title'));
  }

  function exportData() {
    const payload = { ...state, exportedAt: new Date().toISOString(), app: "Kevin's Timetable" };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = `kevin-timetable-backup-${isoDate(new Date())}.json`; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Workspace backup downloaded.');
  }

  function importDataFile(file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast('Backup files must be smaller than 5 MB.', 'error'); $('#import-file').value = ''; return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)); state = normalizeData(parsed); weekOffset = 0; taskFilter = 'all'; saveState(); renderAll(); toast('Workspace restored from backup.');
      } catch (error) { toast(error instanceof SyntaxError ? 'That file is not valid JSON.' : error.message || 'Unable to restore that workspace.', 'error'); }
      $('#import-file').value = '';
    };
    reader.onerror = () => { toast('Unable to read that backup file.', 'error'); $('#import-file').value = ''; };
    reader.readAsText(file);
  }

  function renderAll() { updateDateHeader(); renderCalendar(); renderTasks(); renderExams(); renderTimer(); if (window.lucide) lucide.createIcons(); }

  WEEKDAYS.forEach((day, index) => { const option = document.createElement('option'); option.value = String(index); option.textContent = day; $('#session-day').append(option); });

  $('#calendar-grid').addEventListener('click', event => {
    const block = event.target.closest('.session-block'); if (!block) return;
    const session = state.sessions.find(item => item.id === block.dataset.id); if (session) openSessionModal(session);
  });
  $('#week-prev').addEventListener('click', () => { weekOffset--; renderCalendar(); });
  $('#week-next').addEventListener('click', () => { weekOffset++; renderCalendar(); });
  $('#today-btn').addEventListener('click', () => { weekOffset = 0; renderCalendar(); });
  $('#add-session').addEventListener('click', () => openSessionModal()); $('#quick-add').addEventListener('click', () => openSessionModal());
  $('#session-form').addEventListener('submit', event => {
    event.preventDefault(); const start = $('#session-start').value; const end = $('#session-end').value;
    if (end <= start) { toast('End time must be later than the start time.', 'error'); $('#session-end').focus(); return; }
    const values = { title: $('#session-title').value.trim(), day: Number($('#session-day').value), type: $('#session-type').value, start, end, location: $('#session-location').value.trim() };
    if (!values.title) return;
    const existing = state.sessions.findIndex(item => item.id === editingSessionId);
    if (existing >= 0) state.sessions[existing] = { ...state.sessions[existing], ...values }; else state.sessions.push({ id: makeId(), ...values });
    saveState(); renderCalendar(); closeModal(sessionBackdrop); toast(existing >= 0 ? 'Session updated.' : 'Session added.');
  });
  $('#session-delete').addEventListener('click', () => {
    if (!editingSessionId) return; state.sessions = state.sessions.filter(item => item.id !== editingSessionId); saveState(); renderCalendar(); closeModal(sessionBackdrop); toast('Session deleted.');
  });
  $('#modal-close').addEventListener('click', () => closeModal(sessionBackdrop)); $$('[data-close-modal]').forEach(button => button.addEventListener('click', () => closeModal(sessionBackdrop)));
  sessionBackdrop.addEventListener('click', event => { if (event.target === sessionBackdrop) closeModal(sessionBackdrop); });

  $('#add-task').addEventListener('click', () => openTaskModal());
  $$('.filter-button').forEach(button => button.addEventListener('click', () => { taskFilter = button.dataset.filter; renderTasks(); }));
  $$('.session-filter').forEach(button => button.addEventListener('click', () => {
    const type = button.dataset.sessionFilter;
    if (activeSessionTypes.has(type)) activeSessionTypes.delete(type); else activeSessionTypes.add(type);
    button.classList.toggle('active', activeSessionTypes.has(type));
    button.setAttribute('aria-pressed', String(activeSessionTypes.has(type)));
    renderCalendar();
  }));
  $('#task-list').addEventListener('click', event => {
    const row = event.target.closest('.task-row'); if (!row) return;
    const task = state.tasks.find(item => item.id === row.dataset.id); if (!task) return;
    const action = event.target.closest('[data-action]')?.dataset.action; if (!action) return;
    if (action === 'toggle') { task.completed = !task.completed; saveState(); renderTasks(); }
    if (action === 'edit') openTaskModal(task);
    if (action === 'delete') { state.tasks = state.tasks.filter(item => item.id !== task.id); saveState(); renderTasks(); toast('Task deleted.'); }
  });
  $('#task-form').addEventListener('submit', event => {
    event.preventDefault(); const values = { title: $('#task-title').value.trim(), due: $('#task-due').value, priority: $('#task-priority').value };
    if (!values.title || !values.due) return;
    const existing = state.tasks.find(item => item.id === editingTaskId);
    if (existing) Object.assign(existing, values); else state.tasks.push({ id: makeId(), ...values, completed: false });
    saveState(); renderTasks(); closeModal(taskBackdrop); toast(existing ? 'Task updated.' : 'Task added.');
  });
  $('#task-delete').addEventListener('click', () => {
    if (!editingTaskId) return; state.tasks = state.tasks.filter(item => item.id !== editingTaskId); saveState(); renderTasks(); closeModal(taskBackdrop); toast('Task deleted.');
  });
  $('#task-modal-close').addEventListener('click', () => closeModal(taskBackdrop)); $$('[data-close-task]').forEach(button => button.addEventListener('click', () => closeModal(taskBackdrop)));
  taskBackdrop.addEventListener('click', event => { if (event.target === taskBackdrop) closeModal(taskBackdrop); });

  $('#add-exam').addEventListener('click', () => openExamModal()); $('#empty-add-exam')?.addEventListener('click', () => openExamModal());
  $('#exam-list').addEventListener('click', event => {
    if (event.target.closest('#empty-add-exam')) { openExamModal(); return; }
    const card = event.target.closest('.exam-card'); if (!card) return;
    const exam = state.exams.find(item => item.id === card.dataset.id); if (exam) openExamModal(exam);
  });
  $('#manage-exams').addEventListener('click', () => {
    const upcomingCount = state.exams.filter(exam => examDateTime(exam).getTime() >= Date.now()).length;
    if (upcomingCount > 2) { examExpanded = !examExpanded; renderExams(); }
    else openExamModal();
  });
  $('#exam-form').addEventListener('submit', event => {
    event.preventDefault(); const values = { title: $('#exam-title').value.trim(), date: $('#exam-date').value, time: $('#exam-time').value || '09:00', type: $('#exam-type').value, note: $('#exam-note').value.trim() };
    if (!values.title || !values.date) return;
    const existing = state.exams.find(item => item.id === editingExamId);
    if (existing) Object.assign(existing, values); else state.exams.push({ id: makeId(), ...values });
    saveState(); renderExams(); closeModal(examBackdrop); toast(existing ? 'Exam updated.' : 'Exam countdown added.');
  });
  $('#exam-delete').addEventListener('click', () => {
    if (!editingExamId) return; state.exams = state.exams.filter(item => item.id !== editingExamId); saveState(); renderExams(); closeModal(examBackdrop); toast('Exam deleted.');
  });
  $('#exam-modal-close').addEventListener('click', () => closeModal(examBackdrop)); $$('[data-close-exam]').forEach(button => button.addEventListener('click', () => closeModal(examBackdrop)));
  examBackdrop.addEventListener('click', event => { if (event.target === examBackdrop) closeModal(examBackdrop); });

  $$('.focus-mode').forEach(button => button.addEventListener('click', () => {
    state.timer.running = false; state.timer.endAt = null; state.timer.mode = button.dataset.mode; state.timer.remaining = TIMER_MODES[state.timer.mode].minutes * 60; saveState(); renderTimer();
  }));
  $('#timer-start').addEventListener('click', () => {
    if (state.timer.running) { state.timer.remaining = Math.max(0, Math.ceil((state.timer.endAt - Date.now()) / 1000)); state.timer.running = false; state.timer.endAt = null; }
    else { if (state.timer.remaining <= 0) state.timer.remaining = TIMER_MODES[state.timer.mode].minutes * 60; state.timer.endAt = Date.now() + state.timer.remaining * 1000; state.timer.running = true; prepareAudio(); }
    saveState(); renderTimer();
  });
  $('#focus-reset').addEventListener('click', () => { state.timer.running = false; state.timer.endAt = null; state.timer.remaining = TIMER_MODES[state.timer.mode].minutes * 60; saveState(); renderTimer(); toast('Focus timer reset.'); });
  $('#sound-toggle').addEventListener('click', () => { state.timer.sound = !state.timer.sound; saveState(); renderTimer(); toast(state.timer.sound ? 'Completion chime enabled.' : 'Completion chime muted.'); });

  $('#export-btn').addEventListener('click', exportData); $('#export-btn-side').addEventListener('click', exportData);
  $('#import-btn').addEventListener('click', () => $('#import-file').click());
  $('#import-file').addEventListener('change', event => importDataFile(event.target.files?.[0]));
  $('#mobile-menu').addEventListener('click', () => document.body.classList.toggle('nav-open'));
  $$('.nav-item').forEach(item => item.addEventListener('click', () => { document.body.classList.remove('nav-open'); $$('.nav-item').forEach(link => link.classList.toggle('active', link === item)); }));
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (!sessionBackdrop.hidden) closeModal(sessionBackdrop); else if (!taskBackdrop.hidden) closeModal(taskBackdrop); else if (!examBackdrop.hidden) closeModal(examBackdrop); else document.body.classList.remove('nav-open');
  });

  // An expired timer restored from a closed tab is completed quietly; playback requires a live user gesture.
  if (state.timer.running && state.timer.endAt <= Date.now()) { state.timer.running = false; state.timer.endAt = null; state.timer.remaining = 0; if (state.timer.mode === 'focus') state.timer.sessions++; saveState(); }
  renderAll();
  scrollCalendarToInitialHour();
  saveState();
  window.addEventListener('pagehide', () => {
    clearTimeout(saveTimeout);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { /* The visible save status reports storage failures. */ }
  });
  setInterval(tick, 1000);
  setInterval(() => { updateDateHeader(); updateStats(); if (weekOffset === 0) renderCalendar(); }, 60_000);
})();
