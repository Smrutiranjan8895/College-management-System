// 10-point GPA scale as per GCEK standards
const GRADE_SCALE = [
  { grade: 'O', minMarks: 90, points: 10 },
  { grade: 'A+', minMarks: 80, points: 9 },
  { grade: 'A', minMarks: 70, points: 8 },
  { grade: 'B+', minMarks: 60, points: 7 },
  { grade: 'B', minMarks: 50, points: 6 },
  { grade: 'C', minMarks: 45, points: 5 },
  { grade: 'P', minMarks: 40, points: 4 },
  { grade: 'F', minMarks: 0, points: 0 },
];

export function getGradeFromMarks(marks) {
  for (const { grade, minMarks } of GRADE_SCALE) {
    if (marks >= minMarks) {
      return grade;
    }
  }
  return 'F';
}

export function getPointsFromGrade(grade) {
  const found = GRADE_SCALE.find(g => g.grade === grade);
  return found ? found.points : 0;
}

export function calculateGPA(results) {
  if (!results || results.length === 0) return 0;
  
  let totalPoints = 0;
  let totalCredits = 0;
  
  for (const result of results) {
    const credits = result.credits || 3;
    const points = getPointsFromGrade(result.grade);
    totalPoints += points * credits;
    totalCredits += credits;
  }
  
  return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
}

export function getGradeColor(grade) {
  switch (grade) {
    case 'O': return '#10B981';
    case 'A+': return '#22C55E';
    case 'A': return '#84CC16';
    case 'B+': return '#EAB308';
    case 'B': return '#F59E0B';
    case 'C': return '#F97316';
    case 'P': return '#FB923C';
    case 'F': return '#EF4444';
    default: return '#64748B';
  }
}

export { GRADE_SCALE };
