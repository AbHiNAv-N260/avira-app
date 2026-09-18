const apiBaseUrl = window.AVIRA_API_BASE_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:4000/api'
  : '/api');
const authTokenKey = 'aviraAuthToken';
const userKey = 'aviraUser';

const navToggle = document.querySelector('.nav-toggle');
const mainNav = document.querySelector('.main-nav');
const navLinks = document.querySelectorAll('.main-nav a');
const revealEls = document.querySelectorAll('.reveal');
const faqItems = document.querySelectorAll('.faq-item');
const phRange = document.getElementById('phRange');
const phValue = document.getElementById('phValue');
const phStatusEl = document.getElementById('phStatus');
const rangeMarker = document.getElementById('rangeMarker');
const statusBadge = document.querySelector('.status-badge');
const slides = document.querySelectorAll('.slide');
const sliderButtons = document.querySelectorAll('.slider-btn');
const recordTableBody = document.getElementById('recordTableBody') || document.querySelector('.record-table tbody');
const recordSearchInput = document.getElementById('recordSearchInput');
const recordTypeFilter = document.getElementById('recordTypeFilter');
const exportRecordsBtn = document.getElementById('exportRecordsBtn');
const recordCountValue = document.getElementById('recordCountValue');
const recordAverageValue = document.getElementById('recordAverageValue');
const recordLatestValue = document.getElementById('recordLatestValue');
const centresGridPage = document.querySelector('.centre-grid-page');
const addRecordBtn = document.getElementById('addRecordBtn');
const pHInput = document.getElementById('pHInput');
const pagePhValue = document.getElementById('pagePhValue');
const pagePhStatus = document.getElementById('pagePhStatus');
const resultBanner = document.getElementById('resultBanner');
const saveReadingBtn = document.getElementById('saveReadingBtn');
const viewHistoryBtn = document.getElementById('viewHistoryBtn');
const phTestDate = document.getElementById('phTestDate');
const phLastTestValue = document.getElementById('phLastTestValue');
const phSymptomsValue = document.getElementById('phSymptomsValue');
const phReferralValue = document.getElementById('phReferralValue');
const phReadingCount = document.getElementById('phReadingCount');
const phHistoryList = document.getElementById('phHistoryList');
const centreSearchBtn = document.getElementById('centreSearchBtn');
const centreSortSelect = document.getElementById('centreSortSelect');
const centreResultMeta = document.getElementById('centreResultMeta');
const cycleForm = document.getElementById('cycleForm');
const cycleLengthInput = document.getElementById('cycleLengthInput');
const lastPeriodInput = document.getElementById('lastPeriodInput');
const entryDateInput = document.getElementById('entryDateInput');
const flowInput = document.getElementById('flowInput');
const moodInput = document.getElementById('moodInput');
const energyInput = document.getElementById('energyInput');
const cycleNotes = document.getElementById('cycleNotes');
const cycleHistoryList = document.getElementById('cycleHistoryList');
const cycleDayNumber = document.getElementById('cycleDayNumber');
const cyclePhaseBadge = document.getElementById('cyclePhaseBadge');
const cyclePhaseTitle = document.getElementById('cyclePhaseTitle');
const cyclePhaseNote = document.getElementById('cyclePhaseNote');
const cycleStageValue = document.getElementById('cycleStageValue');
const nextPeriodValue = document.getElementById('nextPeriodValue');
const fertileWindowValue = document.getElementById('fertileWindowValue');
const daysToPeriodValue = document.getElementById('daysToPeriodValue');
const symptomsTodayValue = document.getElementById('symptomsTodayValue');
const careReminderValue = document.getElementById('careReminderValue');
const cycleProgressLabel = document.getElementById('cycleProgressLabel');
const cycleTodayMarker = document.getElementById('cycleTodayMarker');

const cyclePreferencesKey = 'aviraCyclePreferences';
let recordsCache = [];

const phDashboardExists = Boolean(phRange && phValue && phStatusEl && rangeMarker && statusBadge);

function getToken() {
  return localStorage.getItem(authTokenKey) || '';
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(userKey) || 'null');
  } catch (error) {
    return null;
  }
}

function setCurrentUser(user) {
  if (user) {
    localStorage.setItem(userKey, JSON.stringify(user));
  } else {
    localStorage.removeItem(userKey);
  }
}

function apiFetch(endpoint, options = {}) {
  const token = getToken();
  return fetch(`${apiBaseUrl}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  }).then(async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }
    return data;
  });
}

function openAuthModal() {
  const modal = document.getElementById('authModal');
  if (!modal) return;
  modal.classList.remove('hidden');
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (!modal) return;
  modal.classList.add('hidden');
}

function showToast(message) {
  const toast = document.getElementById('aviraToast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

function updateHeaderAuthState() {
  const user = getCurrentUser();
  const headerCta = document.querySelector('.header-cta');
  if (!headerCta) return;

  if (user) {
    headerCta.textContent = `${user.name.split(' ')[0]}`;
    headerCta.href = 'account.html';
    headerCta.setAttribute('title', 'Signed in');
    headerCta.style.pointerEvents = 'auto';
    headerCta.classList.add('signed-in');
  } else {
    headerCta.textContent = 'Take the test';
    headerCta.href = 'phtest.html';
    headerCta.setAttribute('title', 'Sign in to continue');
    headerCta.classList.remove('signed-in');
  }

  if (headerCta && !headerCta.dataset.listenerAdded) {
    headerCta.addEventListener('click', (event) => {
      const user = getCurrentUser();
      if (!user) {
        event.preventDefault();
        openAuthModal();
      }
    });
    headerCta.dataset.listenerAdded = 'true';
  }
}

function renderAccountScreen() {
  const accountProfile = document.getElementById('accountProfile');
  if (!accountProfile) return;

  const user = getCurrentUser();
  const accountHeading = document.getElementById('accountHeading');
  const accountIntro = document.getElementById('accountIntro');
  const accountAvatar = document.getElementById('accountAvatar');
  const accountName = document.getElementById('accountName');
  const accountEmail = document.getElementById('accountEmail');
  const accountProvider = document.getElementById('accountProvider');
  const accountActionTitle = document.getElementById('accountActionTitle');
  const accountActionText = document.getElementById('accountActionText');
  const accountLoginBtn = document.getElementById('accountLoginBtn');
  const accountLogoutBtn = document.getElementById('accountLogoutBtn');

  if (user) {
    const name = user.name || 'AVIRA member';
    accountHeading.textContent = `Welcome back, ${name.split(' ')[0]}.`;
    accountIntro.textContent = 'Your AVIRA account keeps your health journey connected across every feature.';
    accountAvatar.textContent = name.charAt(0).toUpperCase();
    accountName.textContent = name;
    accountEmail.textContent = user.email || 'Email not available';
    accountProvider.textContent = user.provider && user.provider !== 'local' ? `Signed in with ${user.provider}` : 'AVIRA account';
    accountActionTitle.textContent = 'Your account is active';
    accountActionText.textContent = 'Your saved readings, cycle entries, and health insights are connected to this account.';
    accountLoginBtn.classList.add('hidden');
    accountLogoutBtn.classList.remove('hidden');
  } else {
    accountHeading.textContent = 'Welcome to your account.';
    accountIntro.textContent = 'Log in to keep your health journey connected across every AVIRA feature.';
    accountAvatar.textContent = 'A';
    accountName.textContent = 'Your account';
    accountEmail.textContent = 'Sign in to view your account details.';
    accountProvider.textContent = '';
    accountActionTitle.textContent = 'Sign in to continue';
    accountActionText.textContent = 'Log in to save readings, review your records, and continue your health journey.';
    accountLoginBtn.classList.remove('hidden');
    accountLogoutBtn.classList.add('hidden');
  }
}

function bindAccountScreen() {
  const accountLoginBtn = document.getElementById('accountLoginBtn');
  const accountLogoutBtn = document.getElementById('accountLogoutBtn');

  accountLoginBtn?.addEventListener('click', openAuthModal);
  accountLogoutBtn?.addEventListener('click', () => {
    localStorage.removeItem(authTokenKey);
    setCurrentUser(null);
    updateHeaderAuthState();
    renderAccountScreen();
    showToast('You have been logged out.');
  });
}

function bindAuthModal() {
  if (document.getElementById('authModal')) return;

  const modal = document.createElement('div');
  modal.id = 'authModal';
  modal.className = 'auth-modal hidden';
  modal.innerHTML = `
    <div class="auth-backdrop" data-close="true"></div>
    <div class="auth-panel" role="dialog" aria-modal="true" aria-labelledby="authTitle">
      <button class="auth-close" type="button" aria-label="Close">×</button>
      <div class="auth-header">
        <p class="eyebrow eyebrow-dark">Welcome</p>
        <h3 id="authTitle">Access your AVIRA account</h3>
      </div>

      <div class="auth-socials">
        <button class="social-icon" type="button" data-provider="google" aria-label="Continue with Google">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.6 12.23c0-.7-.06-1.37-.18-2.02H12v3.82h5.39a4.61 4.61 0 0 1-2 3.02v2.5h3.25c1.9-1.75 2.96-4.33 2.96-7.32z" fill="#4285F4"/><path d="M12 22c2.7 0 4.96-.9 6.61-2.45l-3.25-2.5c-.9.6-2.06.96-3.36.96-2.58 0-4.77-1.74-5.55-4.08H.92v2.6A10 10 0 0 0 12 22z" fill="#34A853"/><path d="M6.45 19.89A6 6 0 0 1 6 17.1V14.5H2.72A10 10 0 0 0 2 12c0-1.62.39-3.15 1.08-4.5H6.45v2.63A5.97 5.97 0 0 1 12 8.75c1.18 0 2.24.45 3.07 1.33l2.38-2.38A8.97 8.97 0 0 0 12 2.5 10 10 0 0 0 2.72 7.5H6.45A6 6 0 0 1 12 5.62c1.66 0 3.16.58 4.39 1.72l2.65-2.65A9.92 9.92 0 0 0 12 2c-5.52 0-10 4.48-10 10 0 1.74.4 3.37 1.12 4.82L6.45 19.89z" fill="#FBBC05" opacity="0.3"/><path d="M12 5.62c1.66 0 3.16.58 4.38 1.72l2.64-2.64A9.92 9.92 0 0 0 12 2 10 10 0 0 0 2.72 7.5H6.45A6 6 0 0 1 12 5.62z" fill="#EA4335"/><path d="M12 8.75c.99 0 1.9.34 2.63.96l2.17-2.17A5.94 5.94 0 0 0 12 5.62a6 6 0 0 0-5.55 3.38H2.72A10 10 0 0 1 12 8.75z" fill="#FBBC05" opacity="0.6"/></svg>
        </button>
        <button class="social-icon fb" type="button" data-provider="facebook" aria-label="Continue with Facebook">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.4 22v-8.3h2.8l.4-3.2h-3.2V7.2c0-.9.3-1.6 1.7-1.6h1.8V2.7c-.3 0-1.4-.1-2.7-.1-2.7 0-4.5 1.6-4.5 4.6v2.6H7.6v3.2h2.8V22h2.9z" fill="currentColor"/></svg>
        </button>
        <button class="social-icon apple" type="button" data-provider="apple" aria-label="Continue with Apple">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.8 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.5-.2-2.8.9-3.5.9-.7 0-1.8-.9-3-.9-1.5 0-2.9.9-3.7 2.2-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.7 2.3 3 2.2 1.2-.1 1.7-.8 3.2-.8 1.5 0 2 .8 3.2.8 1.3 0 2.1-1.1 3-2.2.9-1.4 1.3-2.8 1.3-2.9-.1-.1-2.9-1.1-4.8-3.2zm-2.7-6.5c.6-.7 1.1-1.7 1-2.7-.9.1-2 .6-2.7 1.3-.6.7-1.1 1.7-1 2.7.9.1 2.1-.5 2.7-1.3z" fill="currentColor"/></svg>
        </button>
      </div>

      <div class="auth-toggle">
        <button type="button" class="auth-mode active" data-auth-mode="login">Login</button>
        <button type="button" class="auth-mode" data-auth-mode="signup">Sign up</button>
      </div>

      <form id="authForm" class="auth-form">
        <div class="field-group">
          <label for="authName">Full name</label>
          <input id="authName" class="form-control" type="text" placeholder="Your full name" />
        </div>
        <div class="field-group">
          <label for="authEmail">Email</label>
          <input id="authEmail" class="form-control" type="email" placeholder="you@example.com" required />
        </div>
        <div class="field-group">
          <label for="authPassword">Password</label>
          <input id="authPassword" class="form-control" type="password" placeholder="••••••••" required />
        </div>
        <button class="primary-btn auth-submit" type="submit">Continue</button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  const modalCloseButtons = modal.querySelectorAll('[data-close="true"], .auth-close');
  modalCloseButtons.forEach((btn) => btn.addEventListener('click', closeAuthModal));

  modal.querySelectorAll('.auth-mode').forEach((button) => {
    button.addEventListener('click', () => {
      const mode = button.dataset.authMode;
      const authNameField = document.getElementById('authName');
      const authTitle = document.getElementById('authTitle');
      const authSubmit = document.querySelector('.auth-submit');
      const isSignup = mode === 'signup';

      authNameField.closest('.field-group').style.display = isSignup ? 'grid' : 'none';
      authTitle.textContent = isSignup ? 'Create your AVIRA account' : 'Access your AVIRA account';
      authSubmit.textContent = isSignup ? 'Create account' : 'Login';
      modal.querySelectorAll('.auth-mode').forEach((item) => item.classList.toggle('active', item === button));
    });
  });

  modal.querySelector('#authForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const isSignup = document.querySelector('.auth-mode.active')?.dataset.authMode === 'signup';
    const name = document.getElementById('authName').value.trim();
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;

    if (!email || !password || (isSignup && !name)) {
      showToast('Please fill in the required fields.');
      return;
    }

    try {
      const endpoint = isSignup ? '/auth/signup' : '/auth/login';
      const payload = isSignup ? { name, email, password } : { email, password };
      const result = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      localStorage.setItem(authTokenKey, result.token);
      setCurrentUser(result.user);
      closeAuthModal();
      updateHeaderAuthState();
      renderAccountScreen();
      showToast(isSignup ? 'Account created successfully.' : 'Welcome back.');
      if (window.location.pathname.includes('records.html')) {
        refreshRecords();
      }
    } catch (error) {
      showToast(error.message || 'Authentication failed');
    }
  });
}

async function handleSocialAuth(provider) {
  const email = `${provider.toLowerCase()}-user@avira.local`;
  const name = provider.charAt(0).toUpperCase() + provider.slice(1);

  try {
    const result = await apiFetch('/auth/social', {
      method: 'POST',
      body: JSON.stringify({ name, email, provider, avatar: '' })
    });

    localStorage.setItem(authTokenKey, result.token);
    setCurrentUser(result.user);
    closeAuthModal();
    updateHeaderAuthState();
    renderAccountScreen();
    showToast(`${provider} sign-in successful.`);
  } catch (error) {
    showToast('Social sign-in failed.');
  }
}

function updatePHStatus(value) {
  const numericValue = Number(value || 4.2);
  const result = determinePHStatus(numericValue);

  if (pagePhValue) pagePhValue.textContent = numericValue.toFixed(1);
  if (pagePhStatus) pagePhStatus.textContent = result.label;
  if (resultBanner) {
    resultBanner.innerHTML = `
      <span class="label">Suggested guidance</span>
      <strong>${result.message}</strong>
    `;
  }

  const symptomCount = document.querySelectorAll('.choice-pill input[type="checkbox"]:checked').length;
  if (phSymptomsValue) phSymptomsValue.textContent = `${symptomCount} active`;
  if (phReferralValue) phReferralValue.textContent = numericValue > 4.5 || numericValue < 3.8 || symptomCount >= 2 ? 'Review soon' : 'Low';
}

function determinePHStatus(value) {
  if (Number(value) < 3.8) {
    return { label: 'Acidic', message: 'Your pH is slightly below the usual range. Consider tracking a few more readings and discussing any symptoms with a healthcare professional.' };
  }
  if (Number(value) > 4.5) {
    return { label: 'Elevated', message: 'Your pH is above the common healthy range. It may be useful to monitor recurring symptoms and seek professional guidance.' };
  }
  return { label: 'Balanced', message: 'Your pH appears in a healthy range.' };
}

async function saveHealthRecord() {
  if (!pHInput) return;

  if (!getToken()) {
    openAuthModal();
    showToast('Sign in to save your health record.');
    return;
  }

  const value = Number(pHInput.value || 4.2);
  if (!Number.isFinite(value) || value < 3 || value > 6.5) {
    showToast('Enter a pH reading between 3.0 and 6.5.');
    return;
  }
  const selectedSymptoms = [...document.querySelectorAll('.choice-pill input[type="checkbox"]:checked')].map((box) => box.parentElement.textContent.trim());
  const selectedPhase = document.querySelector('.choice-pill input[name="phase"]:checked')?.closest('.choice-pill')?.textContent.trim() || 'Not set';
  const readingDate = phTestDate?.value || new Date().toISOString().slice(0, 10);

  try {
    const payload = {
      type: 'ph',
      value,
      notes: `Reading date: ${readingDate}; Symptoms: ${selectedSymptoms.join(', ') || 'None'}; Phase: ${selectedPhase}`
    };

    const response = await apiFetch('/records', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (response.record) {
      showToast('Reading saved successfully.');
      refreshRecords();
      refreshPHHistory();
    }
  } catch (error) {
    showToast(error.message || 'Unable to save the record.');
  }
}

async function refreshPHHistory() {
  if (!phHistoryList) return;

  if (!getToken()) {
    phHistoryList.innerHTML = '<p class="empty-history">Sign in to see saved readings.</p>';
    if (phReadingCount) phReadingCount.textContent = '0 saved';
    return;
  }

  try {
    const data = await apiFetch('/records');
    const readings = (data.records || []).filter((record) => record.type === 'ph');
    if (phReadingCount) phReadingCount.textContent = `${readings.length} saved`;
    if (!readings.length) {
      phHistoryList.innerHTML = '<p class="empty-history">No readings saved yet.</p>';
      return;
    }

    const latest = readings[0];
    if (phLastTestValue) phLastTestValue.textContent = new Date(latest.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    phHistoryList.innerHTML = readings.slice(0, 4).map((record) => {
      const status = determinePHStatus(Number(record.value));
      return `<div class="ph-history-item"><span>${new Date(record.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span><strong>${Number(record.value).toFixed(1)}</strong><small>${status.label}</small></div>`;
    }).join('');
  } catch (error) {
    phHistoryList.innerHTML = '<p class="empty-history">Unable to load saved readings.</p>';
  }
}

function renderRecordSummary(rows) {
  if (recordCountValue) {
    recordCountValue.textContent = String(rows.length);
  }

  if (recordAverageValue) {
    const phValues = rows.filter((row) => row.type === 'ph' && Number(row.value)).map((row) => Number(row.value));
    if (phValues.length) {
      recordAverageValue.textContent = (phValues.reduce((sum, value) => sum + value, 0) / phValues.length).toFixed(1);
    } else {
      recordAverageValue.textContent = '—';
    }
  }

  if (recordLatestValue) {
    const latest = rows[0];
    recordLatestValue.textContent = latest ? (latest.notes ? latest.notes.slice(0, 18) + (latest.notes.length > 18 ? '…' : '') : 'No notes') : '—';
  }
}

async function refreshRecords() {
  if (!recordTableBody) return;

  const token = getToken();
  if (!token) {
    recordsCache = [];
    recordTableBody.innerHTML = '<tr><td colspan="5">Log in to sync health records.</td></tr>';
    renderRecordSummary([]);
    return;
  }

  try {
    const data = await apiFetch('/records');
    const rows = data.records || [];
    recordsCache = rows;
    const searchTerm = (recordSearchInput?.value || '').trim().toLowerCase();
    const selectedType = recordTypeFilter?.value || 'all';
    const filteredRows = rows.filter((record) => {
      const matchesType = selectedType === 'all' || (selectedType === 'other' ? record.type !== 'ph' : record.type === selectedType);
      const matchesSearch = searchTerm
        ? (() => {
          const haystack = `${record.type || ''} ${record.notes || ''} ${new Date(record.created_at).toLocaleDateString('en-GB')} ${record.value || ''}`.toLowerCase();
          return haystack.includes(searchTerm);
        })()
        : true;
      return matchesType && matchesSearch;
    });

    renderRecordSummary(rows);

    if (!filteredRows.length) {
      recordTableBody.innerHTML = '<tr><td colspan="5">No matching records yet. Add a new reading or refine your search.</td></tr>';
      return;
    }

    recordTableBody.innerHTML = filteredRows.map((record) => `
      <tr>
        <td>${new Date(record.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
        <td>${record.value ?? '—'}</td>
        <td>${record.notes || 'No notes'}</td>
        <td><span class="status-tag">${record.type === 'ph' ? 'Tracked' : 'Saved'}</span></td>
        <td><button class="table-action-btn" type="button" data-record-id="${record.id}">Delete</button></td>
      </tr>
    `).join('');

    recordTableBody.querySelectorAll('[data-record-id]').forEach((button) => {
      button.addEventListener('click', () => deleteRecord(button.dataset.recordId));
    });
  } catch (error) {
    recordsCache = [];
    renderRecordSummary([]);
    recordTableBody.innerHTML = '<tr><td colspan="5">Unable to load records right now.</td></tr>';
  }
}

async function deleteRecord(recordId) {
  if (!recordId) return;
  try {
    await apiFetch(`/records/${recordId}`, { method: 'DELETE' });
    showToast('Record deleted.');
    refreshRecords();
    refreshPHHistory();
  } catch (error) {
    showToast(error.message || 'Unable to delete record.');
  }
}

function exportRecords() {
  if (!recordsCache.length) {
    showToast('There are no records to export.');
    return;
  }

  const rows = [['Date', 'Type', 'Value', 'Notes']].concat(recordsCache.map((record) => [
    new Date(record.created_at).toISOString().slice(0, 10),
    record.type || '',
    record.value ?? '',
    record.notes || ''
  ]));
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  link.download = 'avira-health-records.csv';
  link.click();
  URL.revokeObjectURL(link.href);
}

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function renderCentresList(centres) {
  if (!centresGridPage) return;

  if (!centres || !centres.length) {
    centresGridPage.dataset.loadedCentres = '[]';
    centresGridPage.innerHTML = '<article class="centre-card-page"><h3>No nearby clinics found.</h3><p>Try a different location or search term.</p></article>';
    return;
  }

  const latitude = Number(localStorage.getItem('aviraLastLat')) || 12.9716;
  const longitude = Number(localStorage.getItem('aviraLastLng')) || 77.5946;

  const sortedCentres = [...centres].map((centre) => ({
    ...centre,
    distanceKm: getDistanceKm(latitude, longitude, Number(centre.lat || latitude), Number(centre.lng || longitude))
  })).sort((first, second) => {
    const sortMode = centreSortSelect?.value || 'distance';
    if (sortMode === 'name') return String(first.name).localeCompare(String(second.name));
    if (sortMode === 'open') return Number(second.open_now) - Number(first.open_now) || first.distanceKm - second.distanceKm;
    return first.distanceKm - second.distanceKm;
  });

  if (centreResultMeta) centreResultMeta.textContent = `${sortedCentres.length} nearby result${sortedCentres.length === 1 ? '' : 's'}`;
  centresGridPage.dataset.loadedCentres = JSON.stringify(centres);
  centresGridPage.innerHTML = sortedCentres.map((centre) => {
    const city = centre.city || centre.vicinity?.split(',').slice(-2).join(',').trim() || 'Nearby';
    const address = centre.address || centre.vicinity || 'Address unavailable';
    const rating = centre.rating ? `${Number(centre.rating).toFixed(1)} ★` : 'New listing';
    const status = centre.open_now ? 'Open now' : (centre.isFallback ? 'Local listing' : 'Hours unknown');
    const distanceKm = centre.distanceKm;
    const distanceLabel = `${distanceKm < 1 ? '< 1 km' : `${distanceKm.toFixed(1)} km`}`;

    return `
      <article class="centre-card-page">
        <span class="tag">${city}</span>
        <h3>${centre.name}</h3>
        <p>${address}</p>
        <p class="centre-meta"><strong>${rating}</strong> • ${status} • ${distanceLabel}</p>
      </article>
    `;
  }).join('');
}

function showCentresLoading() {
  if (!centresGridPage) return;

  centresGridPage.innerHTML = `
    <div class="centre-loading" role="status">
      <span class="centre-spinner" aria-hidden="true"></span>
      <span>Finding nearby centres...</span>
    </div>
  `;
}

function getCyclePhaseName(cycleDay, cycleLength = 28) {
  const ovulationDay = Math.max(10, Number(cycleLength || 28) - 14);
  if (cycleDay <= 5) return 'Menstrual';
  if (cycleDay < ovulationDay - 1) return 'Follicular';
  if (cycleDay <= ovulationDay + 1) return 'Ovulation';
  return 'Luteal';
}

function getCycleInsight(phase) {
  const insights = {
    Menstrual: { title: 'Menstrual phase', note: 'Your body may need rest, hydration, and gentle movement.' },
    Follicular: { title: 'Follicular phase', note: 'Energy is often rising; this is a good time for planning and activity.' },
    Ovulation: { title: 'Ovulation window', note: 'This is the peak fertility window; watch symptoms and keep track of patterns.' },
    Luteal: { title: 'Luteal phase', note: 'You may notice more mood and physical changes as your cycle progresses.' }
  };

  return insights[phase] || insights.Luteal;
}

function getNextPeriodDate(lastPeriodDate, cycleLength) {
  const baseDate = new Date(lastPeriodDate);
  if (Number.isNaN(baseDate.getTime())) return 'Set date';
  baseDate.setDate(baseDate.getDate() + Number(cycleLength || 28));
  return baseDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCycleDate(date) {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getFertileWindow(lastPeriodDate, cycleLength) {
  const baseDate = new Date(lastPeriodDate);
  if (Number.isNaN(baseDate.getTime())) return 'Set date';

  const ovulationDay = Math.max(6, Number(cycleLength || 28) - 14);
  const startDate = new Date(baseDate);
  const endDate = new Date(baseDate);
  startDate.setDate(startDate.getDate() + ovulationDay - 6);
  endDate.setDate(endDate.getDate() + ovulationDay);
  return `${formatCycleDate(startDate)} - ${formatCycleDate(endDate)}`;
}

function getDaysUntilNextPeriod(lastPeriodDate, cycleLength) {
  const baseDate = new Date(lastPeriodDate);
  if (Number.isNaN(baseDate.getTime())) return '—';

  const nextPeriod = new Date(baseDate);
  nextPeriod.setDate(nextPeriod.getDate() + Number(cycleLength || 28));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  nextPeriod.setHours(0, 0, 0, 0);
  return String(Math.max(0, Math.ceil((nextPeriod - today) / (1000 * 60 * 60 * 24))));
}

function getCycleDay(lastPeriodDate) {
  if (!lastPeriodDate) return 1;
  const now = new Date();
  const start = new Date(lastPeriodDate);
  const difference = Math.max(1, Math.ceil((now - start) / (1000 * 60 * 60 * 24)) + 1);
  return Math.min(difference, 35);
}

function updateCycleDashboard() {
  if (!cycleDayNumber || !cyclePhaseBadge || !cyclePhaseTitle || !cyclePhaseNote || !cycleStageValue || !nextPeriodValue || !symptomsTodayValue || !careReminderValue) return;

  const cycleLength = Math.min(45, Math.max(20, Number(cycleLengthInput?.value || 28)));
  const lastPeriodDate = lastPeriodInput?.value;
  const cycleDay = getCycleDay(lastPeriodDate);
  const phase = getCyclePhaseName(cycleDay, cycleLength);
  const phaseInsight = getCycleInsight(phase);

  cycleDayNumber.textContent = String(cycleDay);
  cyclePhaseBadge.textContent = phase;
  cyclePhaseTitle.textContent = phaseInsight.title;
  cyclePhaseNote.textContent = phaseInsight.note;
  cycleStageValue.textContent = phase;
  nextPeriodValue.textContent = getNextPeriodDate(lastPeriodDate, cycleLength);
  if (fertileWindowValue) fertileWindowValue.textContent = getFertileWindow(lastPeriodDate, cycleLength);
  if (daysToPeriodValue) daysToPeriodValue.textContent = getDaysUntilNextPeriod(lastPeriodDate, cycleLength);
  if (cycleProgressLabel) cycleProgressLabel.textContent = `Day ${cycleDay} of ${cycleLength}`;
  if (cycleTodayMarker) cycleTodayMarker.style.left = `${Math.min(100, ((cycleDay - 1) / Math.max(1, cycleLength - 1)) * 100)}%`;

  const selectedSymptoms = [...document.querySelectorAll('.symptom-list input:checked')].map((item) => item.value);
  symptomsTodayValue.textContent = `${selectedSymptoms.length} tracked`;
  careReminderValue.textContent = selectedSymptoms.length > 2 || flowInput?.value === 'Heavy' ? 'Monitor closely' : 'Review pattern';
}

function loadCyclePreferences() {
  const today = new Date();
  const stored = JSON.parse(localStorage.getItem(cyclePreferencesKey) || '{}');
  if (lastPeriodInput && stored.lastPeriod) lastPeriodInput.value = stored.lastPeriod;
  if (cycleLengthInput && stored.cycleLength) cycleLengthInput.value = stored.cycleLength;
  if (entryDateInput && !entryDateInput.value) entryDateInput.valueAsDate = today;
}

function saveCyclePreferences() {
  if (!lastPeriodInput || !cycleLengthInput) return;
  localStorage.setItem(cyclePreferencesKey, JSON.stringify({
    lastPeriod: lastPeriodInput.value,
    cycleLength: cycleLengthInput.value
  }));
}

async function refreshCycleHistory() {
  if (!cycleHistoryList) return;

  const token = getToken();
  if (!token) {
    cycleHistoryList.innerHTML = '<li class="empty-cycle-entry">Sign in to save cycle tracking.</li>';
    return;
  }

  try {
    const data = await apiFetch('/cycle');
    const entries = data.entries || [];

    if (!entries.length) {
      cycleHistoryList.innerHTML = '<li class="empty-cycle-entry">No cycle entries yet. Save your first tracking note.</li>';
      return;
    }

    cycleHistoryList.innerHTML = entries.slice(0, 8).map((entry) => {
      const phase = getCyclePhaseName(Number(entry.cycle_day || 1), Number(cycleLengthInput?.value || 28));
      const dateLabel = entry.entry_date
        ? formatCycleDate(new Date(`${entry.entry_date}T00:00:00`))
        : new Date(entry.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      return `
        <li class="cycle-history-entry">
          <div class="cycle-history-main">
            <span>${dateLabel}</span>
            <strong>${phase} · Day ${entry.cycle_day || '—'}</strong>
            <small>${entry.symptoms || 'No symptoms recorded'} · ${entry.flow || 'No flow data'} · ${entry.mood || 'Steady'} mood · ${entry.energy || 'Moderate'} energy</small>
            ${entry.notes && entry.notes !== 'No notes' ? `<small>${entry.notes}</small>` : ''}
          </div>
          <button class="history-delete-btn" type="button" data-cycle-id="${entry.id}" aria-label="Delete cycle entry">Delete</button>
        </li>
      `;
    }).join('');

    cycleHistoryList.querySelectorAll('[data-cycle-id]').forEach((button) => {
      button.addEventListener('click', () => deleteCycleEntry(button.dataset.cycleId));
    });
  } catch (error) {
    cycleHistoryList.innerHTML = '<li class="empty-cycle-entry">Unable to load cycle history.</li>';
  }
}

async function deleteCycleEntry(entryId) {
  if (!entryId) return;
  try {
    await apiFetch(`/cycle/${entryId}`, { method: 'DELETE' });
    showToast('Cycle entry removed.');
    refreshCycleHistory();
  } catch (error) {
    showToast(error.message || 'Unable to remove cycle entry.');
  }
}

async function saveCycleEntry(event) {
  if (event) event.preventDefault();

  if (!getToken()) {
    openAuthModal();
    showToast('Sign in to save your cycle log.');
    return;
  }

  const lastPeriodDate = lastPeriodInput?.value;
  const cycleLength = Number(cycleLengthInput?.value || 28);
  const entryDate = entryDateInput?.value;
  const selectedSymptoms = [...document.querySelectorAll('.symptom-list input:checked')].map((item) => item.value);
  const notes = cycleNotes?.value.trim() || 'No notes';

  if (!lastPeriodDate) {
    showToast('Please select your last period date.');
    return;
  }

  try {
    const cycleDay = getCycleDay(lastPeriodDate);
    const payload = {
      cycle_day: cycleDay,
      entry_date: entryDate || new Date().toISOString().slice(0, 10),
      symptoms: selectedSymptoms.join(', ') || 'No symptoms',
      flow: flowInput?.value || 'None',
      mood: moodInput?.value || 'Steady',
      energy: energyInput?.value || 'Moderate',
      notes: notes
    };

    await apiFetch('/cycle', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    showToast('Cycle entry saved successfully.');
    refreshCycleHistory();
    if (cycleForm) cycleForm.reset();
    if (lastPeriodInput) lastPeriodInput.value = lastPeriodDate;
    if (cycleLengthInput) cycleLengthInput.value = String(cycleLength);
    if (entryDateInput) entryDateInput.valueAsDate = new Date();
    if (flowInput) flowInput.value = 'None';
    if (moodInput) moodInput.value = 'Steady';
    if (energyInput) energyInput.value = 'Moderate';
    saveCyclePreferences();
    updateCycleDashboard();
  } catch (error) {
    showToast(error.message || 'Unable to save cycle entry.');
  }
}

async function refreshHomeInsights() {
  const avgPhValue = document.getElementById('avgPhValue');
  const latestPhaseValue = document.getElementById('latestPhaseValue');
  const healthScoreValue = document.getElementById('healthScoreValue');
  const savedEntriesValue = document.getElementById('savedEntriesValue');

  if (!avgPhValue && !latestPhaseValue && !healthScoreValue && !savedEntriesValue) return;

  const fallback = {
    averagePh: '4.2',
    latestPhase: 'Ovulation',
    healthScore: '82%',
    totalRecords: 0
  };

  try {
    const token = getToken();
    if (!token) {
      avgPhValue && (avgPhValue.textContent = fallback.averagePh);
      latestPhaseValue && (latestPhaseValue.textContent = fallback.latestPhase);
      healthScoreValue && (healthScoreValue.textContent = fallback.healthScore);
      savedEntriesValue && (savedEntriesValue.textContent = String(fallback.totalRecords));
      return;
    }

    const data = await apiFetch('/insights');
    avgPhValue && (avgPhValue.textContent = `${Number(data.averagePh || 4.2).toFixed(1)}`);
    latestPhaseValue && (latestPhaseValue.textContent = data.latestPhase || 'Ovulation');
    healthScoreValue && (healthScoreValue.textContent = `${Number(data.healthScore || 82)}%`);
    savedEntriesValue && (savedEntriesValue.textContent = String(data.totalRecords || 0));
  } catch (error) {
    avgPhValue && (avgPhValue.textContent = fallback.averagePh);
    latestPhaseValue && (latestPhaseValue.textContent = fallback.latestPhase);
    healthScoreValue && (healthScoreValue.textContent = fallback.healthScore);
    savedEntriesValue && (savedEntriesValue.textContent = String(fallback.totalRecords));
  }
}

async function refreshCentres() {
  if (!centresGridPage) return;

  showCentresLoading();
  try {
    const data = await apiFetch('/centres');
    renderCentresList(data.centres || []);
  } catch (error) {
    centresGridPage.innerHTML = '<article class="centre-card-page"><h3>Unable to load centres</h3></article>';
  }
}

async function fetchNearbyCentres(latitude, longitude, keyword = 'Women Health Care check up centre') {
  if (!centresGridPage) return;

  showCentresLoading();
  try {
    const data = await apiFetch(`/centres/nearby?lat=${latitude}&lng=${longitude}&keyword=${encodeURIComponent(keyword)}`);
    renderCentresList(data.centres || []);
  } catch (error) {
    showToast('Unable to fetch nearby centres right now.');
    refreshCentres();
  }
}

function requestNearbyCentres() {
  showCentresLoading();

  if (!navigator.geolocation) {
    showToast('Location access is not supported on this browser.');
    refreshCentres();
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      localStorage.setItem('aviraLastLat', String(latitude));
      localStorage.setItem('aviraLastLng', String(longitude));
      showToast('Finding nearby women health centres...');
      await fetchNearbyCentres(latitude, longitude);
    },
    () => {
      showToast('Location permission denied. Showing local centre list instead.');
      refreshCentres();
    },
    { enableHighAccuracy: true, timeout: 15000 }
  );
}

function bindPageActions() {
  if (saveReadingBtn) {
    saveReadingBtn.addEventListener('click', saveHealthRecord);
  }

  if (pHInput) {
    pHInput.addEventListener('input', () => updatePHStatus(pHInput.value));
    updatePHStatus(pHInput.value);
  }

  if (phTestDate && !phTestDate.value) {
    phTestDate.valueAsDate = new Date();
  }

  document.querySelectorAll('.choice-pill input[type="checkbox"]').forEach((box) => {
    box.addEventListener('change', () => updatePHStatus(pHInput?.value || 4.2));
  });

  if (addRecordBtn) {
    addRecordBtn.addEventListener('click', () => {
      window.location.href = 'phtest.html';
    });
  }

  if (viewHistoryBtn) {
    viewHistoryBtn.addEventListener('click', () => {
      if (!getToken()) {
        openAuthModal();
        showToast('Sign in to view your health history.');
        return;
      }
      window.location.href = 'records.html';
    });
  }

  if (centreSearchBtn) {
    centreSearchBtn.addEventListener('click', requestNearbyCentres);
  }

  if (centreSortSelect) {
    centreSortSelect.addEventListener('change', () => {
      if (centresGridPage?.dataset.loadedCentres) {
        renderCentresList(JSON.parse(centresGridPage.dataset.loadedCentres));
      }
    });
  }

  if (recordSearchInput) {
    recordSearchInput.addEventListener('input', refreshRecords);
  }

  if (recordTypeFilter) {
    recordTypeFilter.addEventListener('change', refreshRecords);
  }

  if (exportRecordsBtn) {
    exportRecordsBtn.addEventListener('click', exportRecords);
  }

  if (cycleForm) {
    cycleForm.addEventListener('submit', saveCycleEntry);
  }

  if (cycleLengthInput || lastPeriodInput) {
    loadCyclePreferences();
    [cycleLengthInput, lastPeriodInput].forEach((field) => {
      field?.addEventListener('input', updateCycleDashboard);
      field?.addEventListener('change', updateCycleDashboard);
    });
    [flowInput, moodInput, energyInput].forEach((field) => {
      field?.addEventListener('change', updateCycleDashboard);
    });
    document.querySelectorAll('.symptom-list input').forEach((box) => {
      box.addEventListener('change', updateCycleDashboard);
    });
    if (lastPeriodInput && !lastPeriodInput.value) {
      lastPeriodInput.valueAsDate = new Date();
    }
    saveCyclePreferences();
    updateCycleDashboard();
  }

  document.querySelectorAll('.social-icon').forEach((button) => {
    button.addEventListener('click', () => {
      const provider = button.getAttribute('data-provider') || 'google';
      if (provider === 'google' || provider === 'facebook' || provider === 'apple') {
        handleSocialAuth(provider);
      }
    });
  });
}

function bindSlider() {
  if (!slides.length) return;

  let activeIndex = 0;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === index);
    });
    activeIndex = index;
  }

  sliderButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const direction = button.dataset.direction === 'next' ? 1 : -1;
      const nextIndex = (activeIndex + direction + slides.length) % slides.length;
      showSlide(nextIndex);
    });
  });

  setInterval(() => {
    const nextIndex = (activeIndex + 1) % slides.length;
    showSlide(nextIndex);
  }, 4200);
}

function bindNav() {
  if (!navToggle || !mainNav) return;

  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navLinks.forEach((item) => item.classList.remove('active'));
      link.classList.add('active');
    });
  });
}

function bindFaq() {
  faqItems.forEach((item) => {
    const button = item.querySelector('.faq-question');
    if (!button) return;

    button.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach((faqItem) => faqItem.classList.remove('active'));
      if (!isActive) item.classList.add('active');
    });
  });
}

function bindPhDashboard() {
  if (!phRange || !phValue || !phStatusEl || !rangeMarker || !statusBadge) return;

  const updateDisplay = (value) => {
    const numericValue = Number(value);
    let tone = 'Balanced';
    let pillClass = 'balanced';
    let markerPercent = ((numericValue - 3) / (6.5 - 3)) * 100;

    if (numericValue < 3.8) {
      tone = 'Acidic';
      pillClass = 'acidic';
    } else if (numericValue > 4.5) {
      tone = 'Elevated';
      pillClass = 'elevated';
    }

    phValue.textContent = value;
    phStatusEl.textContent = tone;
    rangeMarker.style.left = `${markerPercent}%`;
    statusBadge.textContent = tone;
    statusBadge.className = `status-badge ${pillClass}`;

    if (tone === 'Balanced') {
      statusBadge.style.background = 'rgba(15, 141, 123, 0.12)';
      statusBadge.style.color = '#0c6d62';
    } else if (tone === 'Acidic') {
      statusBadge.style.background = 'rgba(245, 162, 97, 0.12)';
      statusBadge.style.color = '#a85a15';
    } else {
      statusBadge.style.background = 'rgba(90, 112, 214, 0.12)';
      statusBadge.style.color = '#3f4ca1';
    }
  };

  phRange.addEventListener('input', (event) => updateDisplay(event.target.value));
  updateDisplay(phRange.value);
}

function initRevealObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealEls.forEach((item) => observer.observe(item));
}

function initToaster() {
  if (document.getElementById('aviraToast')) return;
  const toast = document.createElement('div');
  toast.id = 'aviraToast';
  toast.className = 'avira-toast';
  document.body.appendChild(toast);
}

function initApp() {
  bindAuthModal();
  initToaster();
  updateHeaderAuthState();
  bindAccountScreen();
  renderAccountScreen();
  bindNav();
  bindFaq();
  bindSlider();
  bindPhDashboard();
  bindPageActions();
  initRevealObserver();
  refreshRecords();
  refreshPHHistory();
  refreshCycleHistory();
  refreshHomeInsights();
  if (centresGridPage) {
    requestNearbyCentres();
  } else {
    refreshCentres();
  }
  setInterval(refreshRecords, 5000);
  setInterval(refreshHomeInsights, 10000);
  setInterval(refreshCycleHistory, 10000);
  if (centresGridPage) {
    setInterval(requestNearbyCentres, 30000);
  } else {
    setInterval(refreshCentres, 5000);
  }
}

window.addEventListener('DOMContentLoaded', initApp);