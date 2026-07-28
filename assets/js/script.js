const STORAGE_KEYS = {
  GMAIL: 'emailgen_gmail',
  THEME: 'emailgen_theme'
};

const DOM = {
  name: document.getElementById('name'),
  mobile: document.getElementById('mobile'),
  domain: document.getElementById('domain'),
  resultBox: document.getElementById('resultBox'),
  generatorForm: document.getElementById('generatorForm'),
  historyBody: document.getElementById('historyBody'),
  historySearch: document.getElementById('historySearch'),
  sortBy: document.getElementById('sortBy'),
  emptyState: document.getElementById('emptyState'),
  toastContainer: document.getElementById('toastContainer'),
  themeToggle: document.getElementById('themeToggle'),
  shortcutsBtn: document.getElementById('shortcutsBtn'),
  aboutBtn: document.getElementById('aboutBtn'),
  qrModal: document.getElementById('qrModal'),
  qrcode: document.getElementById('qrcode'),
  qrEmail: document.getElementById('qrEmail'),
  qrClose: document.getElementById('qrClose'),
  shortcutsModal: document.getElementById('shortcutsModal'),
  shortcutsClose: document.getElementById('shortcutsClose'),
  undoToast: document.getElementById('undoToast'),
  undoMessage: document.getElementById('undoMessage'),
  undoBtn: document.getElementById('undoBtn'),
  bulkInput: document.getElementById('bulkInput'),
  bulkGenerateBtn: document.getElementById('bulkGenerateBtn'),
  bulkProgress: document.getElementById('bulkProgress'),
  progressFill: document.getElementById('progressFill'),
  progressText: document.getElementById('progressText'),
  bulkStats: document.getElementById('bulkStats'),
  statsGrid: document.getElementById('statsGrid'),
  clearBtn: document.getElementById('clearBtn'),
  exportTxtBtn: document.getElementById('exportTxtBtn'),
  exportCsvBtn: document.getElementById('exportCsvBtn'),
  importBtn: document.getElementById('importBtn'),
  importFile: document.getElementById('importFile'),
  statsBtn: document.getElementById('statsBtn'),
  nameValidation: document.getElementById('nameValidation'),
  historyCount: document.getElementById('historyCount'),
  totalRecords: document.getElementById('totalRecords')
};

let emailData = { gmail: [] };
let stats = { gmail: { today: 0, week: 0, month: 0 } };
let lastGeneratedEmail = '';
let lastDeleted = null;
let undoTimeout = null;
let backupCounter = 0;

function init() {
  loadStorage();
  updateStatsCards();
  renderHistory();
  initTheme();
  bindEvents();
}

function loadStorage() {
  emailData.gmail = JSON.parse(localStorage.getItem(STORAGE_KEYS.GMAIL)) || [];
  if (emailData.gmail.length === 0) {
    seedSampleData();
  }
  calculateStats();
}

function seedSampleData() {
  const names = ['Leela Prasad', 'Rajesh Kumar', 'Priya Sharma', 'Amit Singh', 'Sneha Patel', 'Vikram Reddy', 'Ananya Gupta', 'Karthik Nair', 'Divya Menon', 'Ravi Teja'];
  const mobiles = ['9876543210', '8765432109', '7654321098', '9123456780', '9988776655', '8877665544', '7766554433', '9654321098', '8543210987', '9432109876'];
  const now = Date.now();
  for (let i = 0; i < names.length; i++) {
    const name = names[i].replace(/\s+/g, '').toLowerCase();
    const mobile = mobiles[i];
    const baseEmail = name + mobile.slice(-5);
    emailData.gmail.push({
      email: `${baseEmail}@gmail.com`,
      name: name,
      mobile: mobile,
      domain: '@gmail.com',
      timestamp: new Date(now - i * 86400000).toISOString()
    });
  }
  localStorage.setItem(STORAGE_KEYS.GMAIL, JSON.stringify(emailData.gmail));
}

function calculateStats() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  stats.gmail = { today: 0, week: 0, month: 0 };
  emailData.gmail.forEach(entry => {
    const date = new Date(entry.timestamp);
    if (date >= today) stats.gmail.today++;
    if (date >= weekAgo) stats.gmail.week++;
    if (date >= monthAgo) stats.gmail.month++;
  });
}

function bindEvents() {
  DOM.generatorForm.addEventListener('submit', handleGenerate);
  DOM.name.addEventListener('input', validateName);
  DOM.mobile.addEventListener('input', validateMobile);
  DOM.historySearch.addEventListener('input', debounce(filterHistory, 300));
  DOM.sortBy.addEventListener('change', renderHistory);
  DOM.themeToggle.addEventListener('click', toggleTheme);
  DOM.shortcutsBtn.addEventListener('click', () => toggleModal('shortcutsModal', true));
  DOM.aboutBtn.addEventListener('click', showAbout);
  DOM.qrClose.addEventListener('click', () => toggleModal('qrModal', false));
  DOM.shortcutsClose.addEventListener('click', () => toggleModal('shortcutsModal', false));
  DOM.clearBtn.addEventListener('click', clearHistory);
  DOM.undoBtn.addEventListener('click', undoDelete);
  DOM.exportTxtBtn.addEventListener('click', exportTxt);
  DOM.exportCsvBtn.addEventListener('click', exportCsv);
  DOM.importBtn.addEventListener('click', () => DOM.importFile.click());
  DOM.importFile.addEventListener('change', importCSV);
  DOM.bulkGenerateBtn.addEventListener('click', handleBulkGenerate);
  DOM.statsBtn.addEventListener('click', showStatistics);

  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) toggleModal(modal.id, false);
    });
  });

  document.addEventListener('keydown', handleKeyboard);
}

function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(STORAGE_KEYS.THEME, next);
  updateThemeIcon(next);
  showToast('success', 'Theme Changed', `Switched to ${next} mode`);
}

function updateThemeIcon(theme) {
  const icon = DOM.themeToggle.querySelector('i');
  icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function validateName() {
  const input = DOM.name.value;
  const clean = input.replace(/[^a-zA-Z\s]/g, '').replace(/\s+/g, '').toLowerCase();

  DOM.nameValidation.classList.remove('success');

  if (input && input !== clean) {
    DOM.nameValidation.innerHTML = '<i class="fas fa-info-circle"></i> Auto-cleaning to: ' + clean;
    DOM.nameValidation.classList.add('show');
    setTimeout(() => DOM.nameValidation.classList.remove('show'), 2000);
  } else if (!input) {
    DOM.nameValidation.classList.remove('show');
  }

  return clean;
}

function validateMobile() {
  const mobile = DOM.mobile.value.replace(/\D/g, '').slice(0, 10);
  DOM.mobile.value = mobile;

  if (mobile.length > 0 && mobile.length < 10) {
    DOM.mobile.nextElementSibling.innerHTML = '<i class="fas fa-exclamation-circle"></i> Must be 10 digits';
    DOM.mobile.nextElementSibling.classList.add('show');
    DOM.mobile.nextElementSibling.classList.remove('success');
    return false;
  } else if (mobile.length === 10 && !/^[6-9]/.test(mobile)) {
    DOM.mobile.nextElementSibling.innerHTML = '<i class="fas fa-exclamation-circle"></i> Must start with 6-9';
    DOM.mobile.nextElementSibling.classList.add('show');
    DOM.mobile.nextElementSibling.classList.remove('success');
    return false;
  } else if (mobile.length === 10) {
    DOM.mobile.nextElementSibling.innerHTML = '<i class="fas fa-check-circle"></i> Valid mobile number';
    DOM.mobile.nextElementSibling.classList.add('show', 'success');
    return true;
  }

  DOM.mobile.nextElementSibling.classList.remove('show');
  return false;
}

function handleGenerate(e) {
  e.preventDefault();

  const rawName = DOM.name.value.trim();
  const mobile = DOM.mobile.value.trim();

  if (!rawName) {
    showResult('Please enter a name', 'error');
    return;
  }

  const name = cleanName(rawName);
  if (!name) {
    showResult('Invalid name', 'error');
    return;
  }

  if (!isValidMobile(mobile)) {
    showResult('Please enter valid mobile number', 'error');
    return;
  }

  const email = generateEmailFromData(name, mobile);

  if (emailData.gmail.some(entry => entry.email === email.email)) {
    showResult('Already Exists', 'warning');
    return;
  }

  emailData.gmail.push(email);
  localStorage.setItem(STORAGE_KEYS.GMAIL, JSON.stringify(emailData.gmail));

  lastGeneratedEmail = email.email;

  showResult(email.email, 'success');
  showToast('success', 'Email Generated', email.email);

  autoCopy(email.email);
  updateStatsCards();
  calculateStats();
  renderHistory();
  checkAutoBackup();

  DOM.name.value = '';
  DOM.mobile.value = '';
  DOM.name.focus();
}

function cleanName(name) {
  return name.replace(/[^a-zA-Z\s]/g, '').replace(/\s+/g, '').toLowerCase();
}

function isValidMobile(mobile) {
  return /^[6-9]\d{9}$/.test(mobile);
}

function generateEmailFromData(name, mobile) {
  let baseEmail = name + mobile.slice(-5);
  const domain = 'gmail.com';

  let email = `${baseEmail}@${domain}`;
  let counter = 1;

  while (emailData.gmail.some(entry => entry.email === email)) {
    email = `${baseEmail}_${counter}@${domain}`;
    counter++;
  }

  return {
    email,
    name,
    mobile,
    domain: '@gmail.com',
    timestamp: new Date().toISOString()
  };
}

function showResult(message, type) {
  const resultBox = DOM.resultBox;
  resultBox.className = `result-box ${type}`;
  resultBox.innerHTML = `
    <div class="result-email">${message}</div>
    ${type === 'success' ? `<button class="btn btn-sm btn-primary" onclick="showQR('${message}')" style="margin-top:12px;padding:10px 18px;">
      <i class="fas fa-qrcode"></i> QR Code
    </button>` : ''}
  `;

  requestAnimationFrame(() => resultBox.classList.add('show'));

  if (type === 'success') {
    const btn = DOM.resultBox.querySelector('.result-email').nextElementSibling;
    if (btn) {
      btn.addEventListener('click', () => showQR(message));
    }
  }
}

async function autoCopy(email) {
  try {
    await navigator.clipboard.writeText(email);
    showToast('success', 'Copied', 'Email copied to clipboard');
  } catch (err) {
    const ta = document.createElement('textarea');
    ta.value = email;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('info', 'Copied', 'Email copied to clipboard');
  }
}

function renderHistory() {
  let combined = emailData.gmail.map(entry => ({...entry, domain: '@gmail.com'}));

  const sort = DOM.sortBy.value;
  combined.sort((a, b) => {
    if (sort === 'newest') return new Date(b.timestamp) - new Date(a.timestamp);
    if (sort === 'oldest') return new Date(a.timestamp) - new Date(b.timestamp);
    if (sort === 'alpha') return a.name.localeCompare(b.name);
    return 0;
  });

  const search = DOM.historySearch.value.toLowerCase().trim();
  if (search) {
    combined = combined.filter(entry =>
      entry.name.toLowerCase().includes(search) ||
      entry.mobile.includes(search) ||
      entry.email.toLowerCase().includes(search)
    );
  }

  DOM.historyCount.textContent = `${combined.length} record${combined.length !== 1 ? 's' : ''}`;
  DOM.totalRecords.textContent = emailData.gmail.length;

  if (combined.length === 0) {
    DOM.historyBody.innerHTML = '';
    DOM.emptyState.style.display = 'block';
    return;
  }

  DOM.emptyState.style.display = 'none';

  const tbody = document.createDocumentFragment();
  combined.forEach(entry => {
    const tr = document.createElement('tr');
    const date = new Date(entry.timestamp);
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    tr.innerHTML = `
      <td>${escapeHtml(entry.name)}</td>
      <td>${escapeHtml(entry.mobile)}</td>
      <td>${highlightMatch(entry.email, search)}</td>
      <td>${dateStr}<br><small style="color:var(--text-muted);font-size:12px;">${timeStr}</small></td>
      <td class="action-btns">
        <button class="btn-sm btn-primary" onclick="copyEntry('${entry.email}')" aria-label="Copy" style="background:linear-gradient(135deg, var(--primary), var(--primary-dark));">
          <i class="fas fa-copy"></i>
        </button>
        <button class="btn-sm btn-secondary" onclick="showQR('${entry.email}')" aria-label="QR" style="background:var(--bg-card-solid);color:var(--text-primary);">
          <i class="fas fa-qrcode"></i>
        </button>
        <button class="btn-sm" onclick="deleteEntry('${entry.email}', '${entry.domain}')" aria-label="Delete" style="background:linear-gradient(135deg, var(--error), #dc2626);">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  DOM.historyBody.innerHTML = '';
  DOM.historyBody.appendChild(tbody);
}

function highlightMatch(text, search) {
  if (!search) return escapeHtml(text);
  const regex = new RegExp(`(${escapeRegExp(search)})`, 'gi');
  return escapeHtml(text).replace(regex, '<span class="highlight">$1</span>');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function filterHistory() {
  renderHistory();
}

async function copyEntry(email) {
  await autoCopy(email);
  showToast('success', 'Copied', 'Email copied to clipboard');
}

function deleteEntry(email, domain) {
  const idx = emailData.gmail.findIndex(entry => entry.email === email);

  if (idx > -1) {
    lastDeleted = { domainKey: 'gmail', entry: emailData.gmail[idx], index: idx };

    emailData.gmail.splice(idx, 1);
    persistData('gmail');

    renderHistory();
    updateStatsCards();
    calculateStats();
    showUndoToast();
  }
}

function showUndoToast() {
  DOM.undoMessage.textContent = 'Item deleted';
  DOM.undoToast.classList.add('show');

  if (undoTimeout) clearTimeout(undoTimeout);
  undoTimeout = setTimeout(() => {
    DOM.undoToast.classList.remove('show');
    lastDeleted = null;
  }, 10000);
}

function undoDelete() {
  if (!lastDeleted) return;

  const { domainKey, entry, index } = lastDeleted;
  emailData[domainKey].splice(index, 0, entry);
  persistData('gmail');

  DOM.undoToast.classList.remove('show');
  lastDeleted = null;
  if (undoTimeout) clearTimeout(undoTimeout);

  renderHistory();
  updateStatsCards();
  calculateStats();
  showToast('success', 'Undo', 'History item restored');
}

function persistData(domainKey) {
  localStorage.setItem(STORAGE_KEYS.GMAIL, JSON.stringify(emailData.gmail));
}

function clearHistory() {
  if (confirm('Are you sure you want to clear all history?')) {
    const backup = {
      gmail: emailData.gmail,
      timestamp: new Date().toISOString()
    };
    downloadJSON(backup, `email_backup_${Date.now()}.json`);

    emailData.gmail = [];
    localStorage.removeItem(STORAGE_KEYS.GMAIL);

    renderHistory();
    updateStatsCards();
    showToast('success', 'Cleared', 'History cleared. Backup saved.');
  }
}

function exportTxt() {
  const lines = [];
  lines.push('Email Generator Export');
  lines.push('Generated: ' + new Date().toLocaleString());
  lines.push('=========================');
  lines.push('');

  if (emailData.gmail.length > 0) {
    lines.push('@gmail.com');
    lines.push('---------');
    emailData.gmail.forEach(e => {
      lines.push(`Name: ${e.name}`);
      lines.push(`Mobile: ${e.mobile}`);
      lines.push(`Email: ${e.email}`);
      lines.push(`Date: ${new Date(e.timestamp).toLocaleDateString()} ${new Date(e.timestamp).toLocaleTimeString()}`);
      lines.push('');
    });
  }

  downloadText(lines.join('\n'), 'emails.txt');
  showToast('success', 'Exported', 'TXT file downloaded');
}

function exportCsv() {
  const rows = [['Name', 'Mobile', 'Email', 'Date', 'Time']];

  emailData.gmail.forEach(e => {
    const d = new Date(e.timestamp);
    rows.push([e.name, e.mobile, e.email, d.toLocaleDateString(), d.toLocaleTimeString()]);
  });

  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  downloadText(csv, 'emails.csv');
  showToast('success', 'Exported', 'CSV file downloaded');
}

function importCSV(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const text = event.target.result;
      const lines = text.split('\n').filter(l => l.trim());

      if (lines.length < 2) {
        showToast('error', 'Import Error', 'CSV file is empty or invalid');
        return;
      }

      let success = 0, failed = 0, duplicates = 0;
      const header = lines[0].toLowerCase();

      let nameIdx = header.indexOf('name');
      let mobileIdx = header.indexOf('mobile');

      if (nameIdx === -1) {
        lines.forEach((line, i) => {
          if (i === 0 && /name,mobile/i.test(line)) return;
          const parts = line.split(',');
          if (parts.length >= 2) {
            const name = parts[0].trim();
            const mobile = parts[1].trim();
            const result = processImportEntry(name, mobile);
            if (result) { success++; if (result.duplicate) duplicates++; }
            else failed++;
          }
        });
      } else {
        lines.slice(1).forEach(line => {
          const parts = line.split(',');
          const name = parts[nameIdx]?.trim();
          const mobile = parts[mobileIdx]?.trim();
          const result = processImportEntry(name, mobile);
          if (result) { success++; if (result.duplicate) duplicates++; }
          else failed++;
        });
      }

      renderHistory();
      updateStatsCards();
      calculateStats();
      showToast('success', 'Import Complete',
        `${success} imported, ${duplicates} duplicates, ${failed} failed`);

    } catch (err) {
      showToast('error', 'Import Error', err.message);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function processImportEntry(name, mobile) {
  if (!name || !mobile) return null;

  const cleanNameVal = cleanName(name);
  if (!isValidMobile(mobile)) return null;

  const emailObj = generateEmailFromData(cleanNameVal, mobile);
  const exists = emailData.gmail.some(entry => entry.email === emailObj.email);

  if (exists) return { duplicate: true };

  emailData.gmail.push(emailObj);
  persistData('gmail');
  return { success: true };
}

async function handleBulkGenerate() {
  const input = DOM.bulkInput.value.trim();
  if (!input) {
    showToast('warning', 'Input Empty', 'Please enter data to process');
    return;
  }

  const lines = input.split('\n').filter(l => l.trim());
  if (lines.length === 0) {
    showToast('warning', 'No Data', 'Please enter at least one line');
    return;
  }

  DOM.bulkGenerateBtn.disabled = true;
  DOM.bulkProgress.classList.add('show');

  const results = { success: 0, duplicates: 0, failed: 0 };

  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].split(',').map(s => s.trim());
    if (parts.length >= 2) {
      const result = processImportEntry(parts[0], parts[1]);
      if (result) {
        results.success++;
        if (result.duplicate) results.duplicates++;
      } else {
        results.failed++;
      }
    } else {
      results.failed++;
    }

    const pct = Math.round(((i + 1) / lines.length) * 100);
    DOM.progressFill.style.width = `${pct}%`;
    DOM.progressText.textContent = `${pct}%`;

    if (i % 10 === 0) await new Promise(r => setTimeout(r, 0));
  }

  DOM.bulkGenerateBtn.disabled = false;
  renderHistory();
  updateStatsCards();
  calculateStats();

  DOM.bulkStats.innerHTML = `
    <div class="stat-badge success"><i class="fas fa-check"></i> ${results.success} Success</div>
    <div class="stat-badge warning"><i class="fas fa-exclamation"></i> ${results.duplicates} Duplicates</div>
    <div class="stat-badge error"><i class="fas fa-times"></i> ${results.failed} Failed</div>
  `;

  showToast('success', 'Bulk Complete',
    `${results.success} generated, ${results.duplicates} duplicates, ${results.failed} failed`);
}

function updateStatsCards() {
  const gmail = emailData.gmail;

  const total = gmail.length;
  const todayTotal = stats.gmail.today;
  const weekTotal = stats.gmail.week;
  const monthTotal = stats.gmail.month;

  let dupCount = 0;
  gmail.forEach(e => {
    if (/\_\d+@/.test(e.email)) dupCount++;
  });

  DOM.statsGrid.innerHTML = `
    <div class="stat-card">
      <div class="stat-icon"><i class="fas fa-envelope"></i></div>
      <div class="stat-value">${total}</div>
      <div class="stat-label">Total Emails</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon"><i class="fas fa-calendar-day"></i></div>
      <div class="stat-value">${todayTotal}</div>
      <div class="stat-label">Today's Emails</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon"><i class="fas fa-calendar-week"></i></div>
      <div class="stat-value">${weekTotal}</div>
      <div class="stat-label">This Week</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
      <div class="stat-value">${monthTotal}</div>
      <div class="stat-label">This Month</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon"><i class="fas fa-copy"></i></div>
      <div class="stat-value">${dupCount}</div>
      <div class="stat-label">Duplicates Prevented</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon"><i class="fas fa-hdd"></i></div>
      <div class="stat-value">${(JSON.stringify(emailData.gmail).length / 1024).toFixed(1)}KB</div>
      <div class="stat-label">Storage Used</div>
    </div>
  `;
}

function showStatistics() {
  showToast('info', 'Statistics',
    `Total: ${emailData.gmail.length} | Week: ${stats.gmail.week} | Month: ${stats.gmail.month}`);
}

function showQR(email) {
  DOM.qrEmail.textContent = email;
  DOM.qrcode.innerHTML = '';

  const size = 200;
  const qrImg = document.createElement('img');
  qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(email)}`;
  qrImg.alt = 'QR Code';
  DOM.qrcode.appendChild(qrImg);

  toggleModal('qrModal', true);
}

function showToast(type, title, message) {
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon"><i class="fas ${icons[type]}"></i></div>
    <div class="toast-content">
      <div class="toast-title">${escapeHtml(title)}</div>
      <div class="toast-message">${escapeHtml(message)}</div>
    </div>
  `;

  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastSlideOut 0.3s ease-out forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function checkAutoBackup() {
  backupCounter++;
  if (backupCounter >= 100) {
    const backup = {
      gmail: emailData.gmail,
      timestamp: new Date().toISOString()
    };
    downloadJSON(backup, `auto_backup_${Date.now()}.json`);
    showToast('info', 'Auto Backup', 'Backup downloaded');
    backupCounter = 0;
  }
}

function downloadText(text, filename) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadJSON(data, filename) {
  const text = JSON.stringify(data, null, 2);
  downloadText(text, filename);
}

function toggleModal(modalId, show) {
  const modal = document.getElementById(modalId);
  if (show) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  } else {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }
}

function showAbout() {
  showToast('info', 'Email Generator Pro', 'Enterprise-level Email Generator v2.0\nSingle @gmail.com domain');
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function handleKeyboard(e) {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
    document.body.style.overflow = '';
  }

  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'd') { e.preventDefault(); toggleTheme(); }
    if (e.key === 'c') {
      e.preventDefault();
      const emailEl = DOM.resultBox.querySelector('.result-email');
      if (emailEl && emailEl.textContent.includes('@')) autoCopy(emailEl.textContent);
    }
    if (e.key === 'h') {
      e.preventDefault();
      clearHistory();
    }
  }

  if (e.altKey) {
    if (e.key === '1') { e.preventDefault(); DOM.name.focus(); }
    if (e.key === '2') { e.preventDefault(); DOM.mobile.focus(); }
  }
}

init();