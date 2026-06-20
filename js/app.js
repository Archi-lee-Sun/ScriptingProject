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
      const res = await fetch(dataPath('courses.json'));
      if (!res.ok) throw new Error(`Courses request failed: ${res.status}`);
      const courses = await res.json();
      return courses;
    } catch (error) {
      showError('#course-grid, #assessment-breakdown', "Couldn't load courses — please refresh.");
      throw error;
    }
  }

  function loadProfessors() {
    return fetch(dataPath('professors.json'))
      .then(res => {
        if (!res.ok) throw new Error(`Professors request failed: ${res.status}`);
        return res.json();
      })
      .catch(error => {
        showError('#professors-grid', "Couldn't load professors — please refresh.");
        throw error;
      });
  }

  const initSemesterChips = (onChange = () => {}) => {
    const chips = [...document.querySelectorAll('.sem-chip')];
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(item => {
          item.classList.remove('sem-chip--active');
          item.setAttribute('aria-pressed', 'false');
        });
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
    writeStoredArray
  };
})();
