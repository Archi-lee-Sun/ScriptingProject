/* ------------------------------------------------------------------
   SYLLABUS shared JavaScript
   These helpers are loaded on every page so page scripts can stay small.
------------------------------------------------------------------ */
(() => {
  const dataPath = fileName => `data/${fileName}`;

  const escapeHTML = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const classNames = (...args) => args.filter(Boolean).join(' ');

  const posterFallbacks = {
    'card-poster--1': 'linear-gradient(145deg, #0b2417 0%, #081509 100%)',
    'card-poster--2': 'linear-gradient(145deg, #091629 0%, #060e1c 100%)',
    'card-poster--3': 'linear-gradient(145deg, #1e1208 0%, #120a04 100%)',
    'card-poster--4': 'linear-gradient(145deg, #160a26 0%, #0d0618 100%)',
    'card-poster--5': 'linear-gradient(145deg, #181818 0%, #0a0a0a 100%)',
    'card-poster--6': 'linear-gradient(145deg, #230d0a 0%, #160806 100%)'
  };

  const posterBackground = ({ posterImage, posterUrl, posterClass }) => {
    const fallback = posterFallbacks[posterClass] || 'linear-gradient(145deg, #181818 0%, #0a0a0a 100%)';
    const image = posterImage || posterUrl;
    return image ? `url("${image.replace(/"/g, '%22')}"), ${fallback}` : fallback;
  };

  const posterBackgroundStyle = course => `
    background-image: ${escapeHTML(posterBackground(course))};
    background-size: cover, cover;
    background-position: center, center;
  `;

  const plainAmpersands = value => escapeHTML(value)
    .replace(/&amp;/g, '<span class="ampersand-plain">&amp;</span>');

  const showError = (target, message) => {
    const node = typeof target === 'string' ? document.querySelector(target) : target;
    if (!node) return;

    node.innerHTML = `
      <div class="catalogue-empty" role="alert">
        <p class="detail-description">${escapeHTML(message)}</p>
      </div>
    `;
  };

  const delay = (callback, ms = 120) => {
    window.setTimeout(callback, ms);
  };

  function debounce(fn, delayMs = 250) {
    let timeoutId;
    return (...args) => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => fn(...args), delayMs);
    };
  }

  async function loadCourses() {
    try {
      const res = await fetch(dataPath('courses.json'), { cache: 'no-store' });
      if (!res.ok) throw new Error(`Courses request failed: ${res.status}`);
      const courses = await res.json();
      return courses;
    } catch (error) {
      showError('#course-grid, #assessment-breakdown', "Couldn't load courses - please refresh.");
      throw error;
    }
  }

  function loadProfessors() {
    return fetch(dataPath('professors.json'), { cache: 'no-store' })
      .then(res => {
        if (!res.ok) throw new Error(`Professors request failed: ${res.status}`);
        return res.json();
      })
      .catch(error => {
        showError('#professors-grid', "Couldn't load professors - please refresh.");
        throw error;
      });
  }

  const initSemesterChips = (onChange = () => {}) => {
    const chips = [...document.querySelectorAll('.sem-chip')];
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const isActive = chip.classList.contains('sem-chip--active');
        chips.forEach(item => {
          item.classList.remove('sem-chip--active');
          item.setAttribute('aria-pressed', 'false');
        });
        if (isActive) {
          onChange('all');
          return;
        }
        chip.classList.add('sem-chip--active');
        chip.setAttribute('aria-pressed', 'true');
        onChange(chip.textContent.trim());
      });
    });
  };

  const readStoredArray = key => {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch (error) {
      return [];
    }
  };

  const writeStoredArray = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  const getUsers = () => readStoredArray('syllabus_users');

  const getSessionId = () => localStorage.getItem('syllabus_session');

  const getCurrentUser = () => {
    const sessionId = getSessionId();
    if (!sessionId) return null;
    return getUsers().find(user => user.id === sessionId) || null;
  };

  // Demo-only transform for this static project. This is not cryptographically
  // secure hashing; it only avoids storing human-readable passwords in localStorage.
  const demoPasswordHash = value => {
    let hash = 2166136261;
    String(value).split('').forEach(char => {
      hash ^= char.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    });
    return `demo-${(hash >>> 0).toString(16)}`;
  };

  const writeSession = userId => {
    localStorage.setItem('syllabus_session', userId);
    window.dispatchEvent(new CustomEvent('syllabus:auth-change', { detail: getCurrentUser() }));
  };

  const clearSession = () => {
    localStorage.removeItem('syllabus_session');
    window.dispatchEvent(new CustomEvent('syllabus:auth-change', { detail: null }));
  };

  const normalizeEmail = email => String(email || '').trim().toLowerCase();

  const getRatingsStore = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem('syllabus_ratings')) || {};
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (error) {
      return {};
    }
  };

  const writeRatingsStore = ratings => {
    localStorage.setItem('syllabus_ratings', JSON.stringify(ratings));
    window.dispatchEvent(new CustomEvent('syllabus:ratings-change'));
  };

  const getCourseRatings = courseSlug => getRatingsStore()[courseSlug] || [];

  const calculateAverageRating = courseSlug => {
    const entries = getCourseRatings(courseSlug).filter(item => Number(item.rating) > 0);
    const count = entries.length;
    if (!count) return { average: null, count: 0 };
    const total = entries.reduce((sum, item) => sum + Number(item.rating), 0);
    return { average: Math.round((total / count) * 10) / 10, count };
  };

  const getUserRating = (courseSlug, userId = getSessionId()) => {
    if (!userId) return null;
    const entry = getCourseRatings(courseSlug).find(item => item.userId === userId);
    return entry ? Number(entry.rating) : null;
  };

  const saveCourseRating = (courseSlug, userId, rating) => {
    const ratings = getRatingsStore();
    const existing = ratings[courseSlug] || [];
    const nextEntry = { userId, rating: Number(rating) };
    const hasExisting = existing.some(item => item.userId === userId);
    ratings[courseSlug] = hasExisting
      ? existing.map(item => (item.userId === userId ? nextEntry : item))
      : [...existing, nextEntry];
    writeRatingsStore(ratings);
    return calculateAverageRating(courseSlug);
  };

  const ratingSummaryText = courseSlug => {
    const { average, count } = calculateAverageRating(courseSlug);
    if (!count) return 'Not yet rated';
    return `${average.toFixed(1)} \u2605 \u00b7 ${count} rating${count !== 1 ? 's' : ''}`;
  };

  let authModalNode = null;
  let authMode = 'login';
  let authMessage = '';

  const setAuthError = message => {
    const node = authModalNode?.querySelector('[data-auth-error]');
    if (node) {
      node.textContent = message || '';
      node.hidden = !message;
    }
  };

  const renderAuthForm = () => {
    if (!authModalNode) return;
    const isRegister = authMode === 'register';
    const title = isRegister ? 'Create account' : 'Log in';
    const action = isRegister ? 'Create Account' : 'Log In';
    authModalNode.querySelector('[data-auth-title]').textContent = title;
    authModalNode.querySelector('[data-auth-message]').textContent = authMessage || (isRegister ? 'Create a demo account to review and rate courses.' : 'Log in to review and rate courses.');
    authModalNode.querySelector('[data-auth-form]').innerHTML = `
      ${isRegister ? `
        <div class="form-group form-group--full">
          <label for="auth-nickname" class="form-label">Nickname</label>
          <input id="auth-nickname" name="nickname" class="form-input" type="text" required autocomplete="nickname" />
        </div>
      ` : ''}
      <div class="form-group form-group--full">
        <label for="auth-email" class="form-label">Email</label>
        <input id="auth-email" name="email" class="form-input" type="email" required autocomplete="email" />
      </div>
      <div class="form-group form-group--full">
        <label for="auth-password" class="form-label">Password</label>
        <input id="auth-password" name="password" class="form-input" type="password" required autocomplete="${isRegister ? 'new-password' : 'current-password'}" />
      </div>
      ${isRegister ? `
        <div class="form-group form-group--full">
          <label for="auth-confirm" class="form-label">Confirm Password</label>
          <input id="auth-confirm" name="confirmPassword" class="form-input" type="password" required autocomplete="new-password" />
        </div>
      ` : ''}
      <p class="auth-error" data-auth-error hidden></p>
      <div class="auth-actions">
        <button type="submit" class="btn btn--primary">${action}</button>
        <button type="button" class="btn btn--ghost" data-auth-swap>
          ${isRegister ? 'I already have an account' : 'Create account'}
        </button>
      </div>
    `;
  };

  const closeAuthModal = () => {
    if (!authModalNode) return;
    authModalNode.hidden = true;
    document.body.classList.remove('auth-modal-open');
  };

  const openAuthModal = ({ mode = 'login', message = '' } = {}) => {
    authMode = mode;
    authMessage = message;
    if (!authModalNode) initAuthModal();
    renderAuthForm();
    authModalNode.hidden = false;
    document.body.classList.add('auth-modal-open');
    authModalNode.querySelector('input')?.focus();
  };

  const handleAuthSubmit = event => {
    event.preventDefault();
    const form = event.target.closest('[data-auth-form]');
    if (!form) return;
    setAuthError('');
    const formData = new FormData(form);
    const email = normalizeEmail(formData.get('email'));
    const password = String(formData.get('password') || '');
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      setAuthError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setAuthError('Password is required.');
      return;
    }

    const users = getUsers();

    if (authMode === 'register') {
      const nickname = String(formData.get('nickname') || '').trim();
      const confirmPassword = String(formData.get('confirmPassword') || '');
      if (!nickname) {
        setAuthError('Nickname is required.');
        return;
      }
      if (password !== confirmPassword) {
        setAuthError('Passwords do not match.');
        return;
      }
      if (users.some(user => normalizeEmail(user.email) === email)) {
        setAuthError('An account with this email already exists.');
        return;
      }
      const newUser = {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        nickname,
        email,
        passwordHash: demoPasswordHash(password),
        createdAt: new Date().toISOString()
      };
      writeStoredArray('syllabus_users', [...users, newUser]);
      writeSession(newUser.id);
      closeAuthModal();
      return;
    }

    const match = users.find(user => normalizeEmail(user.email) === email && user.passwordHash === demoPasswordHash(password));
    if (!match) {
      setAuthError('Incorrect email or password.');
      return;
    }
    writeSession(match.id);
    closeAuthModal();
  };

  function initAuthModal() {
    authModalNode = document.createElement('div');
    authModalNode.className = 'auth-modal';
    authModalNode.hidden = true;
    authModalNode.innerHTML = `
      <div class="auth-modal__backdrop" data-auth-close></div>
      <section class="auth-modal__panel" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button type="button" class="auth-modal__close" aria-label="Close account dialog" data-auth-close>&times;</button>
        <h2 id="auth-title" class="auth-modal__title" data-auth-title>Log in</h2>
        <p class="auth-modal__message" data-auth-message></p>
        <form class="auth-form" data-auth-form></form>
        <p class="auth-demo-note">Demo-only local account system for this static project. Do not use a real password.</p>
      </section>
    `;
    document.body.appendChild(authModalNode);
    authModalNode.addEventListener('click', event => {
      if (event.target.closest('[data-auth-close]')) closeAuthModal();
      if (event.target.closest('[data-auth-swap]')) {
        authMode = authMode === 'login' ? 'register' : 'login';
        authMessage = '';
        renderAuthForm();
      }
    });
    authModalNode.addEventListener('submit', handleAuthSubmit);
  }

  const renderAuthIndicator = () => {
    const user = getCurrentUser();
    document.querySelectorAll('[data-auth-indicator]').forEach(node => {
      node.innerHTML = user
        ? `
          <span class="auth-pill__name">${escapeHTML(user.nickname)}</span>
          <button type="button" class="auth-link" data-auth-logout>Log out</button>
        `
        : `
          <button type="button" class="auth-link" data-auth-open="login">Log in</button>
          <button type="button" class="auth-link auth-link--accent" data-auth-open="register">Register</button>
        `;
    });
  };

  const initAuthUI = () => {
    document.querySelectorAll('.nav-inner').forEach(nav => {
      if (nav.querySelector('[data-auth-indicator]')) return;
      const indicator = document.createElement('div');
      indicator.className = 'auth-pill';
      indicator.dataset.authIndicator = '';
      const search = nav.querySelector('.search-wrapper');
      if (search) search.insertAdjacentElement('afterend', indicator);
      else nav.appendChild(indicator);
    });
    renderAuthIndicator();
    document.addEventListener('click', event => {
      const openButton = event.target.closest('[data-auth-open]');
      if (openButton) {
        openAuthModal({ mode: openButton.dataset.authOpen || 'login' });
        return;
      }
      if (event.target.closest('[data-auth-logout]')) clearSession();
    });
    window.addEventListener('syllabus:auth-change', renderAuthIndicator);
  };

  const requireAuth = (message = 'Log in to continue.') => {
    const user = getCurrentUser();
    if (user) return user;
    openAuthModal({ mode: 'login', message });
    return null;
  };

  window.Syllabus = {
    classNames,
    debounce,
    delay,
    escapeHTML,
    initSemesterChips,
    loadCourses,
    loadProfessors,
    posterBackground,
    posterBackgroundStyle,
    plainAmpersands,
    readStoredArray,
    showError,
    calculateAverageRating,
    clearSession,
    getCurrentUser,
    getUserRating,
    openAuthModal,
    ratingSummaryText,
    requireAuth,
    saveCourseRating,
    writeStoredArray
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthUI);
  } else {
    initAuthUI();
  }
})();
