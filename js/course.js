/* ------------------------------------------------------------------
   Course detail page behavior: render fetched data and persist student input.
------------------------------------------------------------------ */
(() => {
  const {
    calculateAverageRating,
    classNames,
    escapeHTML,
    getCurrentUser,
    getUserRating,
    initSemesterChips,
    loadCourses,
    plainAmpersands,
    posterBackground,
    posterBackgroundStyle,
    readStoredArray,
    requireAuth,
    saveCourseRating,
    writeStoredArray
  } = window.Syllabus;

  const params = new URLSearchParams(window.location.search);
  const courseKey = params.get('course');
  let currentCourse = null;
  let allCourses = {};

  const storageKey = type => `syllabus_${type}_${courseKey}`;

  const detailTitle = document.getElementById('detail-heading');
  const detailProfLink = document.getElementById('detail-prof-link');
  const detailDescription = document.getElementById('detail-description');
  const detailPrerequisite = document.getElementById('detail-prerequisite');
  const assessmentDiv = document.getElementById('assessment-breakdown');
  const detailWorkflow = document.getElementById('detail-workflow');
  const detailPoster = document.getElementById('detail-poster');
  const backdropPoster = document.getElementById('course-backdrop-poster');
  const breadcrumbCurrent = document.getElementById('breadcrumb-current');
  const breadcrumbDegree = document.getElementById('breadcrumb-degree');
  const materialsCount = document.getElementById('materials-count');
  const materialsList = document.getElementById('materials-list');
  const relatedGrid = document.getElementById('related-grid');
  const relatedSection = document.getElementById('related-section');
  const uploadButton = document.querySelector('.upload-btn');
  const writeReviewBtn = document.getElementById('write-review-btn');
  const reviewFormPanel = document.getElementById('review-form-panel');
  const cancelReviewBtn = document.getElementById('cancel-review-btn');
  const reviewForm = document.querySelector('.review-form');
  const reviewsList = document.getElementById('reviews-list');
  const rateHint = document.querySelector('.rate-hint');
  const averageRatingNode = document.getElementById('average-rating');

  const formatDate = iso => new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(iso));

  const reviewerInitials = name => name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const renderRatingStars = rating => {
    const ratingNumber = Number(rating);
    return `
      <span class="star-display star-display--sm" aria-label="${ratingNumber} out of 5 stars">
        ${[1, 2, 3, 4, 5].map(star => `
          <span class="star ${star <= ratingNumber ? 'star--full' : 'star--empty'}" aria-hidden="true">\u2605</span>
        `).join('')}
      </span>
    `;
  };

  const renderNotFound = () => {
    document.title = 'Course not found — SYLLABUS · KIU';
    detailTitle.textContent = 'Course not found';
    detailProfLink.textContent = 'Unknown instructor';
    detailDescription.textContent = 'The requested course could not be found. Return to the catalogue.';
    detailPrerequisite.style.display = 'none';
    assessmentDiv.innerHTML = '<p class="detail-description">No assessment data available.</p>';
    breadcrumbCurrent.textContent = 'Not found';
    breadcrumbDegree.textContent = 'Catalogue';
  };

  const renderAssessment = course => {
    assessmentDiv.innerHTML = `
      <table class="offering-table" aria-label="Assessment breakdown for ${escapeHTML(course.title)}">
        <caption class="sr-only">Assessment components, weights, details and minimum scores</caption>
        <thead>
          <tr>
            <th scope="col">Component</th>
            <th scope="col">Weight</th>
            <th scope="col">Details</th>
            <th scope="col">Minimum to pass</th>
          </tr>
        </thead>
        <tbody>
          ${course.assessment.map(item => `
            <tr class="${classNames(item.highlight && 'table-row--current')}">
              <td>${escapeHTML(item.component)}</td>
              <td class="table-rating">${escapeHTML(item.weight)}</td>
              <td>${escapeHTML(item.details)}</td>
              <td>${escapeHTML(item.minimum || '?')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  };

  const getMaterials = () => [
    ...(currentCourse.materials || []),
    ...readStoredArray(storageKey('materials'))
  ];

  const renderMaterials = () => {
    const materials = getMaterials();
    materialsCount.textContent = `${materials.length} file${materials.length !== 1 ? 's' : ''}`;
    materialsList.innerHTML = materials.length
      ? materials.map(material => `
          <li class="material-item">
            <span class="material-icon" aria-hidden="true">\uD83D\uDCC4</span>
            <div class="material-info">
                <span class="material-name">${plainAmpersands(material.name)}</span>
                <span class="material-meta">${plainAmpersands(material.meta)}</span>
            </div>
            <a href="#" class="material-download" aria-label="Download ${escapeHTML(material.name)}">\u2193</a>
          </li>
        `).join('')
      : `<li class="material-item">
           <span class="material-icon" aria-hidden="true">\uD83D\uDCC4</span>
           <div class="material-info">
             <span class="material-name">No materials yet</span>
             <span class="material-meta">Upload the first file for your peers.</span>
           </div>
         </li>`;
  };

  const renderRelatedCourses = () => {
    const sameTitleCourses = Object.entries(allCourses).filter(
      ([key, course]) => key !== courseKey && course.title === currentCourse.title
    );

    if (!sameTitleCourses.length) return;

    relatedSection.hidden = false;
    relatedGrid.innerHTML = sameTitleCourses.map(([key, course]) => `
      <article class="related-card">
        <a href="course.html?course=${encodeURIComponent(key)}" class="related-card-link">
          <div class="related-poster ${escapeHTML(course.posterClass)}" style="${posterBackgroundStyle(course)}"></div>
          <div class="related-info">
            <h3 class="related-title">${plainAmpersands(course.title)}</h3>
            <p class="related-prof">${escapeHTML(course.professor)}</p>
            <p class="related-semester">${escapeHTML(course.department)} · ${escapeHTML(course.credits)}</p>
          </div>
        </a>
      </article>
    `).join('');
  };

  const renderAverageRating = () => {
    if (!averageRatingNode) return;
    const { average, count } = calculateAverageRating(courseKey);
    averageRatingNode.classList.toggle('course-average-rating--empty', !count);
    averageRatingNode.innerHTML = count
      ? `Average rating: <strong>${average.toFixed(1)}</strong> <span class="star" aria-hidden="true">\u2605</span> (${count} rating${count !== 1 ? 's' : ''})`
      : 'Average rating: Not yet rated';
  };

  const renderCourse = course => {
    document.title = `${course.title} ? SYLLABUS ? KIU`;
    breadcrumbCurrent.innerHTML = plainAmpersands(course.title);
    breadcrumbDegree.textContent = course.department;
    detailTitle.innerHTML = plainAmpersands(course.title);
    detailProfLink.textContent = course.professor;
    detailProfLink.href = course.professorSlug
      ? `professor.html?prof=${encodeURIComponent(course.professorSlug)}`
      : 'professors.html';
    detailDescription.textContent = course.description;
    detailWorkflow.textContent = course.workflow;

    if (course.prerequisites && course.prerequisites !== 'None') {
      detailPrerequisite.innerHTML = `<span class="detail-prerequisite-label">Prerequisites:</span> ${escapeHTML(course.prerequisites)}`;
    } else {
      detailPrerequisite.style.display = 'none';
    }

    renderAssessment(course);
    renderAverageRating();
    detailPoster.className = `detail-poster ${course.posterClass}`;
    detailPoster.style.backgroundImage = posterBackground(course);
    detailPoster.style.backgroundSize = 'cover, cover';
    detailPoster.style.backgroundPosition = 'center, center';
    detailPoster.setAttribute('aria-label', course.posterLabel);

    backdropPoster.className = `course-backdrop-poster ${course.posterClass}`;
    backdropPoster.style.backgroundImage = posterBackground(course);
    backdropPoster.style.backgroundSize = 'cover, cover';
    backdropPoster.style.backgroundPosition = 'center, center';

    renderMaterials();
    renderRelatedCourses();
  };

  const getReviews = () => readStoredArray(storageKey('reviews'));

  const renderReviewCard = review => {
    const { id, userId, nickname, name, rating, body, date, helpfulCount = 0 } = review;
    const displayName = nickname || name || 'Student';
    const currentUser = getCurrentUser();
    const helpfulUserIds = review.helpfulUserIds || [];
    const count = Math.max(helpfulUserIds.length, helpfulCount);
    const isOwnReview = currentUser && userId === currentUser.id;
    const isMarkedHelpful = currentUser && helpfulUserIds.includes(currentUser.id);
    const buttonStateClass = isMarkedHelpful ? ' helpful-btn--active' : '';
    const disabledAttr = isOwnReview || isMarkedHelpful ? ' disabled' : '';
    const label = isOwnReview ? 'Your review' : 'Helpful';
    return `
      <article class="review-card" data-review-id="${escapeHTML(id)}">
        <div class="review-header">
          <div class="reviewer-avatar" aria-hidden="true">${escapeHTML(reviewerInitials(displayName))}</div>
          <div class="reviewer-info">
            <span class="reviewer-name">${escapeHTML(displayName)}</span>
            <span class="reviewer-rating">${renderRatingStars(rating)}</span>
          </div>
          <span class="review-date">${escapeHTML(formatDate(date))}</span>
        </div>
        <p class="review-body">${escapeHTML(body)}</p>
        <button class="helpful-btn${buttonStateClass}" type="button" data-review-id="${escapeHTML(id)}"${disabledAttr}>
          ${escapeHTML(label)} (<span class="helpful-count">${count}</span>)
        </button>
      </article>
    `;
  };

  const renderReviews = () => {
    const reviews = getReviews();
    reviewsList.innerHTML = reviews.length
      ? reviews.map(renderReviewCard).join('')
      : `<div class="review-empty" id="review-empty">
           <p class="detail-description">
             No reviews yet. Be the first — tell the next student what to expect.
           </p>
         </div>`;
  };

  const saveReview = event => {
    event.preventDefault();
    const user = requireAuth('Log in to submit a review.');
    if (!user) return;

    const formData = new FormData(reviewForm);
    const now = new Date().toISOString();
    const { rating, review } = Object.fromEntries(formData.entries());
    const newReview = {
      id: String(Date.now()),
      userId: user.id,
      nickname: user.nickname,
      rating,
      body: review,
      date: now,
      helpfulCount: 0,
      helpfulUserIds: []
    };
    const updated = [...getReviews(), newReview];

    writeStoredArray(storageKey('reviews'), updated);
    saveCourseRating(courseKey, user.id, rating);
    renderReviews();
    renderAverageRating();
    restoreRating();
    reviewForm.reset();
    reviewFormPanel.hidden = true;
    writeReviewBtn.setAttribute('aria-expanded', 'false');
  };

  const incrementHelpful = button => {
    const user = requireAuth('Log in to mark a review helpful.');
    if (!user) return;

    const reviewId = button.dataset.reviewId;
    const reviews = getReviews();
    let didUpdate = false;
    const updated = reviews.map(review => {
      if (review.id !== reviewId) return review;
      if (review.userId === user.id) return review;

      const helpfulUserIds = review.helpfulUserIds || [];
      if (helpfulUserIds.includes(user.id)) return review;

      const nextHelpfulUserIds = [...helpfulUserIds, user.id];
      const nextHelpfulCount = Math.max(helpfulUserIds.length, review.helpfulCount || 0) + 1;
      didUpdate = true;
      return {
        ...review,
        helpfulUserIds: nextHelpfulUserIds,
        helpfulCount: nextHelpfulCount
      };
    });

    if (!didUpdate) return;
    writeStoredArray(storageKey('reviews'), updated);
    renderReviews();
  };

  const restoreRating = () => {
    document.querySelectorAll('.rate-stars input[name="rate"]').forEach(input => {
      input.checked = false;
    });

    const user = getCurrentUser();
    if (!user) {
      if (rateHint) rateHint.textContent = 'Log in to rate this course';
      return;
    }

    const savedRating = getUserRating(courseKey, user.id);
    if (!savedRating) {
      if (rateHint) rateHint.textContent = 'Click a star to rate';
      return;
    }

    const input = document.querySelector(`.rate-stars input[value="${savedRating}"]`);
    if (input) input.checked = true;
    if (rateHint) rateHint.textContent = `You rated this course ${savedRating}/5`;
  };

  const wireCourseEvents = () => {
    writeReviewBtn.addEventListener('click', () => {
      const user = requireAuth('Log in to write a review.');
      if (!user) return;
      const isOpen = !reviewFormPanel.hidden;
      reviewFormPanel.hidden = isOpen;
      writeReviewBtn.setAttribute('aria-expanded', String(!isOpen));
      if (!isOpen) reviewFormPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    cancelReviewBtn.addEventListener('click', () => {
      reviewFormPanel.hidden = true;
      writeReviewBtn.setAttribute('aria-expanded', 'false');
      reviewForm.reset();
    });

    reviewForm.addEventListener('submit', saveReview);

    reviewsList.addEventListener('click', event => {
      const button = event.target.closest('.helpful-btn');
      if (button) incrementHelpful(button);
    });

    document.querySelectorAll('.rate-stars input[name="rate"]').forEach(input => {
      input.addEventListener('change', event => {
        const user = requireAuth('Log in to rate this course.');
        if (!user) {
          event.target.checked = false;
          restoreRating();
          return;
        }
        saveCourseRating(courseKey, user.id, event.target.value);
        renderAverageRating();
        if (rateHint) rateHint.textContent = `You rated this course ${event.target.value}/5`;
      });
    });

    window.addEventListener('syllabus:auth-change', restoreRating);
    window.addEventListener('syllabus:auth-change', renderReviews);

    uploadButton.addEventListener('click', () => {
      const filename = window.prompt('File name to add to Course Materials:');
      if (!filename || !filename.trim()) return;

      const existing = readStoredArray(storageKey('materials'));
      const updated = [...existing, { name: filename.trim(), meta: 'Uploaded by you' }];
      writeStoredArray(storageKey('materials'), updated);
      renderMaterials();
    });
  };

  const initCoursePage = async () => {
    try {
      allCourses = await loadCourses();
      currentCourse = allCourses[courseKey];
      if (!currentCourse) {
        renderNotFound();
        return;
      }

      renderCourse(currentCourse);
      renderReviews();
      restoreRating();
      wireCourseEvents();
      initSemesterChips();
    } catch (error) {
      renderNotFound();
    }
  };

  initCoursePage();
})();
