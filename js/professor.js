/* ------------------------------------------------------------------
   Individual professor page: biography + course filmography.
------------------------------------------------------------------ */
(() => {
  const {
    escapeHTML,
    loadCourses,
    loadProfessors,
    plainAmpersands,
    posterBackgroundStyle,
    showError
  } = window.Syllabus;

  const params = new URLSearchParams(window.location.search);
  const professorSlug = params.get('prof');

  const breadcrumbDepartment = document.getElementById('breadcrumb-department');
  const breadcrumbCurrent = document.getElementById('breadcrumb-current');
  const avatar = document.getElementById('professor-avatar');
  const nameNode = document.getElementById('professor-heading');
  const departmentNode = document.getElementById('professor-department');
  const bioNode = document.getElementById('professor-bio');
  const courseCountNode = document.getElementById('professor-course-count');
  const courseGrid = document.getElementById('professor-course-grid');

  let coursesBySlug = {};

  const initialsFor = name => name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();

  const renderAvatar = professor => {
    const initials = escapeHTML(initialsFor(professor.name));
    avatar.innerHTML = professor.photoUrl
      ? `
        <img
          src="${escapeHTML(professor.photoUrl)}"
          alt="${escapeHTML(professor.name)}"
          class="prof-photo"
          onerror="this.style.display='none';this.parentElement.querySelector('.prof-initials-fallback').style.display='flex';"
        />
        <span class="prof-initials-fallback" style="display:none;">${initials}</span>
      `
      : `<span class="prof-initials-fallback" style="display:flex;">${initials}</span>`;
  };

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

  const renderCoursePoster = course => {
    const { slug, title, professor, posterClass, code, department, degree, credits } = course;
    const href = `course.html?course=${encodeURIComponent(slug)}`;

    return `
      <article class="course-card" aria-label="${escapeHTML(title)} with ${escapeHTML(professor)}">
        <a href="${href}" class="card-poster-link">
          <div class="card-poster ${escapeHTML(posterClass)}" style="${posterBackgroundStyle(course)}">
            <div class="poster-overlay">
              <div class="poster-meta"><span class="poster-dept">CS · ${escapeHTML(code)}</span></div>
              <div class="poster-body">
                <h3 class="poster-title">${plainAmpersands(title)}</h3>
                <p class="poster-professor">${escapeHTML(professor)}</p>
              </div>
            </div>
          </div>
        </a>
        <div class="card-info">
          <h3 class="card-title"><a href="${href}" class="card-title-link">${plainAmpersands(title)}</a></h3>
          <p class="card-professor"><a href="professor.html?prof=${encodeURIComponent(course.professorSlug)}" class="prof-link">${escapeHTML(professor)}</a></p>
          <p class="card-degree-tag">${escapeHTML(department)} · ${escapeHTML(degree)} · ${escapeHTML(credits)}</p>
        </div>
      </article>
    `;
  };

  const renderNotFound = () => {
    document.title = 'Professor not found — SYLLABUS · KIU';
    breadcrumbDepartment.textContent = 'Catalogue';
    breadcrumbCurrent.textContent = 'Not found';
    avatar.innerHTML = '<span class="prof-initials-fallback" style="display:flex;">?</span>';
    nameNode.textContent = 'Professor not found';
    departmentNode.textContent = 'Professors';
    bioNode.innerHTML = 'The requested professor could not be found. <a href="professors.html" class="prof-link">Return to professors</a>.';
    courseCountNode.textContent = 'No course offerings available.';
    courseGrid.innerHTML = `
      <div class="review-empty">
        <p class="detail-description">Choose a professor from the faculty catalogue to see their course offerings.</p>
      </div>
    `;
  };

  const renderProfessor = professor => {
    const courses = coursesForProfessor(professor);

    document.title = `${professor.name} — SYLLABUS · KIU`;
    breadcrumbDepartment.innerHTML = plainAmpersands(professor.department);
    breadcrumbCurrent.textContent = professor.name;
    nameNode.textContent = professor.name;
    departmentNode.innerHTML = plainAmpersands(professor.department);
    if (professor.bio) {
      bioNode.textContent = professor.bio;
      bioNode.classList.remove('bio-placeholder');
    } else {
      bioNode.textContent = 'Biography not yet added.';
      bioNode.classList.add('bio-placeholder');
    }
    courseCountNode.textContent = courses.length
      ? `${courses.length} course${courses.length !== 1 ? 's' : ''} taught at KIU.`
      : 'No current course assignments available.';
    renderAvatar(professor);

    courseGrid.innerHTML = courses.length
      ? courses.map(renderCoursePoster).join('')
      : `
        <div class="review-empty">
          <p class="detail-description">No current course assignments available for this professor.</p>
        </div>
      `;
  };

  const initProfessor = async () => {
    try {
      const [courseData, professors] = await Promise.all([
        loadCourses(),
        loadProfessors()
      ]);

      coursesBySlug = courseData;
      const professor = professors.find(item => item.slug === professorSlug);

      if (!professor) {
        renderNotFound();
        return;
      }

      renderProfessor(professor);
    } catch (error) {
      showError(courseGrid, "Couldn't load professor details — please refresh.");
    }
  };

  initProfessor();
})();
