(() => {
  'use strict';
  const STORAGE_KEY = 'campuscare_full_project_v1';
  const sections = [...document.querySelectorAll('.page-section')];
  const nav = document.getElementById('main-nav');
  const menuToggle = document.getElementById('menu-toggle');
  const form = document.getElementById('complaint-form');
  const list = document.getElementById('complaint-list');
  const emptyState = document.getElementById('empty-state');
  const formMessage = document.getElementById('form-message');
  const searchInput = document.getElementById('search-input');
  const statusFilter = document.getElementById('status-filter');
  const categoryFilter = document.getElementById('category-filter');
  let complaints = loadComplaints();

  function loadComplaints() {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.warn('Could not load saved complaints.', error);
      return [];
    }
  }

  function saveComplaints() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
      return true;
    } catch (error) {
      showMessage('Unable to save data in this browser. Check storage settings.', true);
      return false;
    }
  }

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function generateId() {
    const day = new Date().toISOString().slice(2, 10).replaceAll('-', '');
    return `CC-${day}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  function showMessage(message, isError = false) {
    formMessage.textContent = message;
    formMessage.classList.toggle('error', isError);
  }

  function routeTo(hash = location.hash || '#home') {
    const id = hash.replace('#', '');
    const target = document.getElementById(id);
    const pageId = target && target.classList.contains('page-section') ? id : 'home';
    sections.forEach(section => { section.hidden = section.id !== pageId; });
    document.querySelectorAll('.nav-link').forEach(link => {
      const active = link.dataset.page === pageId;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    nav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    renderAll();
  }

  window.addEventListener('hashchange', () => routeTo());
  menuToggle.addEventListener('click', () => {
    const opened = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(opened));
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const item = {
      id: generateId(),
      name: String(data.get('name')).trim(),
      studentId: String(data.get('studentId')).trim(),
      category: String(data.get('category')),
      location: String(data.get('location')).trim(),
      title: String(data.get('title')).trim(),
      description: String(data.get('description')).trim(),
      priority: String(data.get('priority')),
      email: String(data.get('email')).trim(),
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    if (!item.name || !item.studentId || !item.category || !item.location || !item.title || !item.description) {
      showMessage('Please complete all required fields.', true);
      return;
    }
    complaints.unshift(item);
    if (!saveComplaints()) {
      complaints.shift();
      return;
    }
    form.reset();
    showMessage(`Success! Your complaint ID is ${item.id}.`);
    searchInput.value = '';
    statusFilter.value = 'All';
    categoryFilter.value = 'All';
    renderAll();
    setTimeout(() => { location.hash = '#complaints'; }, 650);
  });

  function getFilteredComplaints() {
    const query = searchInput.value.trim().toLowerCase();
    const status = statusFilter.value;
    const category = categoryFilter.value;
    return complaints.filter(item => {
      const text = [item.id, item.name, item.studentId, item.category, item.location, item.title, item.description].join(' ').toLowerCase();
      return (!query || text.includes(query)) &&
        (status === 'All' || item.status === status) &&
        (category === 'All' || item.category === category);
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function renderComplaints() {
    const filtered = getFilteredComplaints();
    list.innerHTML = filtered.map(item => {
      const statusClass = item.status.replaceAll(' ', '-');
      const date = new Date(item.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
      return `<article class="complaint-card" data-id="${escapeHTML(item.id)}">
        <div>
          <div class="complaint-top"><span class="complaint-id">${escapeHTML(item.id)}</span><span class="status-tag ${statusClass}">${escapeHTML(item.status)}</span><span class="priority-text">Priority: ${escapeHTML(item.priority)}</span></div>
          <h3>${escapeHTML(item.title)}</h3>
          <div class="complaint-meta"><span>▦ ${escapeHTML(item.category)}</span><span>⌖ ${escapeHTML(item.location)}</span><span>◷ ${escapeHTML(date)}</span></div>
          <p class="complaint-description">${escapeHTML(item.description)}</p>
          <div class="complaint-byline">Reported by ${escapeHTML(item.name)} (${escapeHTML(item.studentId)})</div>
        </div>
        <div class="complaint-actions"><select class="status-select" data-id="${escapeHTML(item.id)}" aria-label="Update status for ${escapeHTML(item.id)}">${['Pending', 'In Progress', 'Resolved'].map(s => `<option ${item.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select><button class="delete-btn" type="button" data-delete="${escapeHTML(item.id)}">Delete</button></div>
      </article>`;
    }).join('');
    emptyState.hidden = filtered.length > 0;
    list.hidden = filtered.length === 0;
  }

  list.addEventListener('change', event => {
    if (!event.target.matches('.status-select')) return;
    const item = complaints.find(c => c.id === event.target.dataset.id);
    if (!item) return;
    const old = item.status;
    item.status = event.target.value;
    if (!saveComplaints()) item.status = old;
    renderAll();
  });

  list.addEventListener('click', event => {
    const button = event.target.closest('[data-delete]');
    if (!button) return;
    const id = button.dataset.delete;
    if (!window.confirm(`Delete complaint ${id}? This cannot be undone.`)) return;
    const previous = complaints;
    complaints = complaints.filter(c => c.id !== id);
    if (!saveComplaints()) complaints = previous;
    renderAll();
  });

  [searchInput, statusFilter, categoryFilter].forEach(el => {
    el.addEventListener('input', renderComplaints);
    el.addEventListener('change', renderComplaints);
  });

  document.getElementById('export-btn').addEventListener('click', () => {
    if (!complaints.length) {
      showMessage('There are no complaints to export yet.', true);
      return;
    }
    const columns = ['id', 'name', 'studentId', 'category', 'location', 'title', 'description', 'priority', 'email', 'status', 'createdAt'];
    const cell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csv = [columns.join(','), ...complaints.map(c => columns.map(key => cell(c[key])).join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'campuscare-complaints.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function renderHomeStats(counts) {
    setText('home-total', complaints.length);
    setText('home-pending', counts.pending);
    setText('home-resolved', counts.resolved);
  }

  function renderDashboard(counts) {
    const total = complaints.length;
    setText('dash-total', total);
    setText('dash-pending', counts.pending);
    setText('dash-progress', counts.progress);
    setText('dash-resolved', counts.resolved);
    setText('donut-total', total);
    setText('legend-pending', counts.pending);
    setText('legend-progress', counts.progress);
    setText('legend-resolved', counts.resolved);

    const pct = n => total ? (n / total) * 100 : 0;
    [['total-bar', total], ['pending-bar', counts.pending], ['progress-bar', counts.progress], ['resolved-bar', counts.resolved]].forEach(([id, n]) => {
      const bar = document.getElementById(id);
      if (bar) bar.style.width = `${total ? Math.max(4, pct(n)) : 0}%`;
    });
    const pendingDeg = total ? counts.pending / total * 360 : 0;
    const progressDeg = total ? counts.progress / total * 360 : 0;
    const resolvedDeg = total ? counts.resolved / total * 360 : 0;
    const donut = document.getElementById('status-donut');
    donut.style.background = total
      ? `conic-gradient(#e8b34d 0deg ${pendingDeg}deg, #579be1 ${pendingDeg}deg ${pendingDeg + progressDeg}deg, #2cb48a ${pendingDeg + progressDeg}deg ${pendingDeg + progressDeg + resolvedDeg}deg)`
      : 'conic-gradient(#e6e4f4 0deg 360deg)';

    const categories = {};
    complaints.forEach(c => { categories[c.category] = (categories[c.category] || 0) + 1; });
    const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1]);
    const breakdown = document.getElementById('category-breakdown');
    breakdown.innerHTML = sorted.map(([name, amount]) => `<div class="category-row"><span>${escapeHTML(name)}</span><div class="category-track"><i style="width:${Math.max(5, amount / (sorted[0]?.[1] || 1) * 100)}%"></i></div><b>${amount}</b></div>`).join('');
    document.getElementById('category-empty').hidden = sorted.length > 0;

    const recent = [...complaints].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    document.getElementById('recent-list').innerHTML = recent.map(c => `<div class="recent-item"><div><b>${escapeHTML(c.title)}</b><small>${escapeHTML(c.id)} · ${escapeHTML(c.category)} · ${escapeHTML(c.location)}</small></div><span class="status-tag ${c.status.replaceAll(' ', '-')}">${escapeHTML(c.status)}</span></div>`).join('');
    document.getElementById('recent-empty').hidden = recent.length > 0;
  }

  function renderAll() {
    const counts = {
      pending: complaints.filter(c => c.status === 'Pending').length,
      progress: complaints.filter(c => c.status === 'In Progress').length,
      resolved: complaints.filter(c => c.status === 'Resolved').length
    };
    renderHomeStats(counts);
    renderComplaints();
    renderDashboard(counts);
  }

  routeTo();
})();
