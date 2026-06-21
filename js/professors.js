/* ------------------------------------------------------------------
   Professors catalogue: each card links to an individual professor page.
------------------------------------------------------------------ */
(() => {
  const {
    debounce,
    escapeHTML,
    loadCourses,
    loadProfessors,
    plainAmpersands,
    showError
  } = window.Syllabus;

  const grid = document.getElementById('professors-grid');
  const searchInput = document.getElementById('global-search');
  let professors = [];
  let coursesBySlug = {};

  const initialsFor = name => name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();

  const coursesForProfessor = professor => {
    const explicitCourses = professor.courses || [];
    if (explicitCourses.length) {
      return explicitCourses
        .map(slug => ({ slug, ...coursesBySlug[slug] }))
        .filter(course => course.title);
    }

    const names = professor.matchNames || [professor.name];
    return Object.entries(coursesBySlug)
      .filter(([, course]) => names.includes(course.professor))
      .map(([slug, course]) => ({ slug, ...course }));
  };

  const renderAvatar = professor => {
    const initials = escapeHTML(initialsFor(professor.name));
    if (!professor.photoUrl) {
      return `<span class="prof-initials-fallback" style="display:flex;">${initials}</span>`;
    }

    return `
      <img
        src="${escapeHTML(professor.photoUrl)}"
        alt="${escapeHTML(professor.name)}"
        class="prof-photo"
        onerror="this.style.display='none';this.parentElement.querySelector('.prof-initials-fallback').style.display='flex';"
      />
      <span class="prof-initials-fallback" style="display:none;">${initials}</span>
    `;
  };

  const renderProfessorCard = professor => {
    const { name, slug, department, bio } = professor;
    const taught = coursesForProfessor(professor);
    const bioMarkup = bio
      ? `<p class="prof-bio">${escapeHTML(bio)}</p>`
      : '<p class="prof-bio bio-placeholder">Biography not yet added.</p>';
    const coursesMarkup = taught.length
      ? `
        <ul class="prof-courses-list" role="list">
          ${taught.map(course => `
            <li class="prof-course-item">
              <span class="prof-course-name">${plainAmpersands(course.title)}</span>
            </li>
          `).join('')}
        </ul>
      `
      : '<p class="prof-course-name" style="font-size:0.92rem; color:var(--text-secondary);">No current course assignments available.</p>';

    return `
      <a href="professor.html?prof=${encodeURIComponent(slug)}" class="prof-card prof-card-link" aria-label="Professor: ${escapeHTML(name)}">
        <div class="prof-avatar prof-avatar--photo" aria-hidden="true">
          ${renderAvatar(professor)}
        </div>
        <div class="prof-body">
          <h2 class="prof-name">${escapeHTML(name)}</h2>
          <p class="prof-dept">${plainAmpersands(department)}</p>
          ${bioMarkup}
          <div class="prof-courses-label">${taught.length ? 'Courses taught at KIU' : 'Current KIU offerings'}</div>
          ${coursesMarkup}
        </div>
      </a>
    `;
  };

  const renderProfessors = list => {
    grid.innerHTML = list.length
      ? list.map(renderProfessorCard).join('')
      : `
        <div class="catalogue-empty">
          <p class="detail-description">No professors match that search.</p>
        </div>
      `;
  };

  const wireSearch = () => {
    if (!searchInput) return;

    searchInput.addEventListener('input', debounce(event => {
      const query = event.target.value.trim().toLowerCase();
      const filtered = professors.filter(professor => (
        professor.name.toLowerCase().includes(query) ||
        professor.department.toLowerCase().includes(query)
      ));
      renderProfessors(filtered);
    }, 220));
  };

  const initProfessors = async () => {
    if (!grid) return;
    grid.innerHTML = `
      <div class="catalogue-empty">
        <p class="detail-description">Loading professors...</p>
      </div>
    `;

    try {
      const [courseData, professorData] = await Promise.all([
        loadCourses(),
        loadProfessors()
      ]);

      coursesBySlug = courseData;
      professors = professorData;
      renderProfessors(professors);
      wireSearch();
    } catch (error) {
      showError(grid, "Couldn't load professors — please refresh.");
    }
  };

  initProfessors();
})();
