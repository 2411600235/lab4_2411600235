(function () {
  const gradeData = [
    { id: 1, code: 'CS101', course: 'Introduction to Programming', instructor: 'M. Santos', term: 'Fall 2026', credits: 3, score: 92 },
    { id: 2, code: 'MATH120', course: 'College Algebra', instructor: 'A. Reyes', term: 'Fall 2026', credits: 3, score: 86 },
    { id: 3, code: 'ENG105', course: 'Academic Writing', instructor: 'L. Cruz', term: 'Fall 2026', credits: 3, score: 88 },
    { id: 4, code: 'IT110', course: 'Computer Systems', instructor: 'J. Garcia', term: 'Fall 2026', credits: 4, score: 74 },
    { id: 5, code: 'HIST101', course: 'Philippine History', instructor: 'R. Flores', term: 'Fall 2026', credits: 3, score: 67 },
    { id: 6, code: 'CS102', course: 'Web Development', instructor: 'M. Santos', term: 'Spring 2026', credits: 4, score: 95 },
    { id: 7, code: 'MATH110', course: 'Statistics', instructor: 'A. Reyes', term: 'Spring 2026', credits: 3, score: 81 },
    { id: 8, code: 'COMM100', course: 'Communication Skills', instructor: 'L. Cruz', term: 'Spring 2026', credits: 3, score: 90 }
  ];

  const state = { term: 'all', standing: 'all', minGrade: '', maxGrade: '', query: '' };

  function letterGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  function gradePoints(score) {
    if (score >= 90) return 4;
    if (score >= 85) return 3.5;
    if (score >= 80) return 3;
    if (score >= 75) return 2.5;
    if (score >= 70) return 2;
    if (score >= 60) return 1;
    return 0;
  }

  function getCourses() {
    return gradeData.map((item) => ({
      ...item,
      letter: letterGrade(item.score),
      standing: item.score < 70 ? 'Needs attention' : 'Passing'
    }));
  }

  function getFilteredCourses() {
    const query = state.query.trim().toLowerCase();
    const min = state.minGrade === '' ? -Infinity : Number(state.minGrade);
    const max = state.maxGrade === '' ? Infinity : Number(state.maxGrade);

    return getCourses().filter((item) => {
      const matchesQuery = !query || [item.course, item.code, item.instructor].some((value) => value.toLowerCase().includes(query));
      const matchesTerm = state.term === 'all' || item.term === state.term;
      const matchesStanding = state.standing === 'all' || (state.standing === 'attention' ? item.score < 70 : item.score >= 70);
      return matchesQuery && matchesTerm && matchesStanding && item.score >= min && item.score <= max;
    });
  }

  function getStatistics() {
    const courses = getCourses();
    const totalCredits = courses.reduce((sum, item) => sum + item.credits, 0);
    const weightedPoints = courses.reduce((sum, item) => sum + gradePoints(item.score) * item.credits, 0);
    const weightedScore = courses.reduce((sum, item) => sum + item.score * item.credits, 0);
    return {
      gpa: totalCredits ? weightedPoints / totalCredits : 0,
      average: totalCredits ? weightedScore / totalCredits : 0,
      courseCount: courses.length,
      attentionCount: courses.filter((item) => item.score < 70).length
    };
  }

  function getDistribution(courses = getCourses()) {
    const grades = ['A', 'B+', 'B', 'C+', 'C', 'D', 'F'];
    return grades.map((grade) => ({ grade, count: courses.filter((item) => item.letter === grade).length }));
  }

  function exportToCSV(courses = getFilteredCourses()) {
    const headers = ['Course Code', 'Course', 'Instructor', 'Term', 'Credits', 'Score (%)', 'Letter Grade', 'Standing'];
    const rows = courses.map((item) => [item.code, item.course, item.instructor, item.term, item.credits, item.score, item.letter, item.standing]);
    return [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
  }

  function downloadCSV(filename, content) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function simulateGradeUpdate() {
    const course = gradeData[Math.floor(Math.random() * gradeData.length)];
    const change = Math.random() < 0.5 ? -2 : 2;
    course.score = Math.max(0, Math.min(100, course.score + change));
    return getCourses().find((item) => item.id === course.id);
  }

  function setFilterState(nextState) {
    Object.assign(state, nextState);
  }

  function resetFilters() {
    Object.assign(state, { term: 'all', standing: 'all', minGrade: '', maxGrade: '', query: '' });
  }

  window.gradeManager = {
    getCourses,
    getFilteredCourses,
    getStatistics,
    getDistribution,
    exportToCSV,
    downloadCSV,
    simulateGradeUpdate,
    setFilterState,
    resetFilters,
    state
  };
})();
