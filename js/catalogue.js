/* ------------------------------------------------------------------
   Catalogue page behavior: render fetched courses, then wire filters.
------------------------------------------------------------------ */
(() => {
  const {
    debounce,
    escapeHTML,
    initSemesterChips,
    loadCourses,
    plainAmpersands,
    posterBackgroundStyle,
    showError
  } = window.Syllabus;

  const state = {
    courses: [],
    query: '',
    degree: 'all',
    sort: 'alphabetical',
    semester: 'all'
  };

  const grid = document.getElementById('course-grid');
  const searchInput = document.getElementById('global-search');
  const degreeSelect = document.getElementById('filter-degree');
  const sortSelect = document.getElementById('filter-sort');
  const filterCount = document.querySelector('.filter-meta strong');

  const degreeValue = ({ department }) => (
    department === 'Computer Science' ? 'cs' : department.toLowerCase()
  );

  const courseSemesters = course => course.semesters || [course.semester || 'I'];

  const renderCourseCard = course => {
    const { title, professor, professorSlug, posterClass, degree, department, credits, code, slug } = course;
    const href = `course.html?course=${encodeURIComponent(slug)}`;
    const professorHref = professorSlug ? `professor.html?prof=${encodeURIComponent(professorSlug)}` : href;

    return `
      <article class="course-card" aria-label="${escapeHTML(title)} with ${escapeHTML(professor)}">
        <a href="${href}" class="card-poster-link">
          <div class="card-poster ${escapeHTML(posterClass)}" style="${posterBackgroundStyle(course)}">
            <div class="poster-overlay">
              <div class="poster-meta"><span class="poster-dept">CS &middot;· ${escapeHTML(code)}</span></div>
              <div class="poster-body">
                <h3 class="poster-title">${plainAmpersands(title)}</h3>
                <p class="poster-professor">${escapeHTML(professor)}</p>
              </div>
            </div>
          </div>
        </a>
        <div class="card-info">
          <h3 class="card-title"><a href="${href}" class="card-title-link">${plainAmpersands(title)}</a></h3>
          <p class="card-professor"><a href="${professorHref}" class="prof-link">${escapeHTML(professor)}</a></p>
          <p class="card-degree-tag">${escapeHTML(department)} · ${escapeHTML(degree)} · ${escapeHTML(credits)}</p>
        </div>
      </article>
    `;
  };

  const emptyCatalogue = message => `
    <div class="catalogue-empty">
      <p class="detail-description">${escapeHTML(message)}</p>
    </div>
  `;

  const sortCourses = courses => {
    const sorted = [...courses];
    if (state.sort === 'credits') {
      return sorted.sort((a, b) => parseInt(b.credits, 10) - parseInt(a.credits, 10));
    }
    if (state.sort === 'code') {
      return sorted.sort((a, b) => a.code.localeCompare(b.code));
    }
    return sorted.sort((a, b) => a.title.localeCompare(b.title));
  };

  const getVisibleCourses = () => {
    const query = state.query.toLowerCase();
    return sortCourses(state.courses.filter(course => {
      const matchesQuery = [course.title, course.professor]
        .some(value => value.toLowerCase().includes(query));
      const matchesDegree = state.degree === 'all' || degreeValue(course) === state.degree;
      const matchesSemester = state.semester === 'all' || courseSemesters(course).includes(state.semester);

      return matchesQuery && matchesDegree && matchesSemester;
    }));
  };

  const renderCourses = () => {
    const visible = getVisibleCourses();
    filterCount.textContent = String(visible.length);
    grid.innerHTML = visible.length
      ? visible.map(renderCourseCard).join('')
      : emptyCatalogue('No courses match those filters yet.');
  };

  const wireFilters = () => {
    searchInput.addEventListener('input', debounce(event => {
      state.query = event.target.value.trim();
      renderCourses();
    }, 220));

    degreeSelect.addEventListener('change', event => {
      state.degree = event.target.value;
      renderCourses();
    });

    sortSelect.addEventListener('change', event => {
      state.sort = event.target.value;
      renderCourses();
    });

    initSemesterChips(semester => {
      state.semester = semester;
      renderCourses();
    });
  };

  const initCatalogue = async () => {
    if (!grid) return;
    grid.innerHTML = emptyCatalogue('Loading courses...');

    try {
      const coursesBySlug = await loadCourses();
      state.courses = Object.entries(coursesBySlug).map(([slug, course]) => ({ slug, ...course }));
      renderCourses();
      wireFilters();
    } catch (error) {
      showError(grid, "Couldn't load courses — please refresh.");
    }
  };

  initCatalogue();
})();
