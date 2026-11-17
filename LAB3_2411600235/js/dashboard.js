document.addEventListener('DOMContentLoaded', function () {
  if (localStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'index.html';
    return;
  }

  const username = localStorage.getItem('user') || 'Student';
  document.getElementById('userName').textContent = username;
  updateGreeting(username);
  setupFilters();
  setupSession();
  renderDashboard();
});

let gradeCharts = {};

function updateGreeting(username) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('greeting').textContent = `${greeting}, ${username}`;
}

function setupFilters() {
  const manager = window.gradeManager;
  const termFilter = document.getElementById('termFilter');
  const terms = [...new Set(manager.getCourses().map((course) => course.term))];
  termFilter.innerHTML = '<option value="all">All terms</option>' +
    terms.map((term) => `<option value="${term}">${term}</option>`).join('');

  const controls = [
    ['searchInput', 'input', 'query'],
    ['termFilter', 'change', 'term'],
    ['statusFilter', 'change', 'standing'],
    ['minGrade', 'input', 'minGrade'],
    ['maxGrade', 'input', 'maxGrade']
  ];

  controls.forEach(([id, eventName, key]) => {
    const element = document.getElementById(id);
    element.addEventListener(eventName, function () {
      manager.setFilterState({ [key]: this.value });
      renderDashboard();
    });
  });

  document.getElementById('resetFilters').addEventListener('click', function () {
    manager.resetFilters();
    document.getElementById('searchInput').value = '';
    document.getElementById('termFilter').value = 'all';
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('minGrade').value = '';
    document.getElementById('maxGrade').value = '';
    renderDashboard();
  });

  document.getElementById('exportBtn').addEventListener('click', function () {
    const csv = manager.exportToCSV();
    manager.downloadCSV(`student-grades-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  });

  document.getElementById('simulateBtn').addEventListener('click', function () {
    const course = manager.simulateGradeUpdate();
    renderDashboard();
    const feedback = document.getElementById('updateFeedback');
    feedback.textContent = `Sample update: ${course.code} is now ${course.score}% (${course.letter}).`;
    window.setTimeout(() => { feedback.textContent = ''; }, 4000);
  });
}

function setupSession() {
  const logout = function () {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
  };
  document.getElementById('logoutBtn').addEventListener('click', logout);
}

function renderStatistics() {
  const stats = window.gradeManager.getStatistics();
  document.getElementById('stat-gpa').textContent = stats.gpa.toFixed(2);
  document.getElementById('stat-average').textContent = `${stats.average.toFixed(1)}%`;
  document.getElementById('stat-courses').textContent = stats.courseCount;
  document.getElementById('stat-attention').textContent = stats.attentionCount;
}

function renderAlerts() {
  const courses = window.gradeManager.getCourses().filter((course) => course.score < 70);
  const container = document.getElementById('gradeAlerts');
  container.innerHTML = courses.length
    ? `<div class="grade-alert"><span aria-hidden="true">!</span><div><strong>${courses.length} course${courses.length === 1 ? '' : 's'} may need attention</strong><div class="small">${courses.map((course) => `${course.code} (${course.score}%)`).join(' · ')}</div></div></div>`
    : '<div class="grade-positive">You are passing all courses. Keep up the good work!</div>';
}

function renderTable(courses) {
  const tbody = document.getElementById('gradesTableBody');
  document.getElementById('courseCount').textContent = `${courses.length} course${courses.length === 1 ? '' : 's'}`;

  if (!courses.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No courses match these filters. Try changing your search or filters.</td></tr>';
    return;
  }

  tbody.innerHTML = courses.map((course) => {
    const needsAttention = course.score < 70;
    return `<tr class="${needsAttention ? 'needs-attention-row' : ''}">
      <td><div class="course-code">${course.code}</div><div class="fw-semibold">${course.course}</div></td>
      <td>${course.instructor}</td>
      <td>${course.term}</td>
      <td>${course.credits}</td>
      <td><div class="score-cell"><span>${course.score}%</span><span class="score-track"><span style="width:${course.score}%"></span></span></div></td>
      <td><span class="grade-letter ${needsAttention ? 'grade-letter-low' : ''}">${course.letter}</span></td>
      <td><span class="standing-badge ${needsAttention ? 'standing-low' : 'standing-good'}">${needsAttention ? 'Needs attention' : 'Passing'}</span></td>
    </tr>`;
  }).join('');
}

function destroyCharts() {
  Object.values(gradeCharts).forEach((chart) => chart.destroy());
  gradeCharts = {};
}

function renderCharts() {
  const manager = window.gradeManager;
  const courses = manager.getFilteredCourses();
  const gradesCanvas = document.getElementById('gradesChart');
  const distributionCanvas = document.getElementById('distributionChart');
  if (!gradesCanvas || !distributionCanvas || typeof Chart === 'undefined') return;

  destroyCharts();
  gradeCharts.performance = new Chart(gradesCanvas, {
    type: 'bar',
    data: {
      labels: courses.map((course) => course.code),
      datasets: [{
        data: courses.map((course) => course.score),
        backgroundColor: courses.map((course) => course.score < 70 ? '#e5a545' : '#477bd1'),
        borderRadius: 6,
        maxBarThickness: 36
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => ` ${context.parsed.y}%` } } },
      scales: {
        y: { min: 0, max: 100, ticks: { stepSize: 20, callback: (value) => `${value}%` }, grid: { color: '#edf0f5' } },
        x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: false } }
      }
    }
  });

  const distribution = manager.getDistribution(courses);
  gradeCharts.distribution = new Chart(distributionCanvas, {
    type: 'doughnut',
    data: {
      labels: distribution.map((item) => item.grade),
      datasets: [{
        data: distribution.map((item) => item.count),
        backgroundColor: ['#315fb7', '#4b83d1', '#52a69a', '#8ebc76', '#e5b85c', '#e59150', '#d96b6b'],
        borderWidth: 3,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '66%',
      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 14 } } }
    }
  });
}

function renderDashboard() {
  renderStatistics();
  renderAlerts();
  renderTable(window.gradeManager.getFilteredCourses());
  renderCharts();
}
