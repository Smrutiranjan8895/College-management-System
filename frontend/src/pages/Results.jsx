import { useState, useEffect } from 'react';
import { Search, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api, { getApiErrorMessage } from '../utils/api';
import useAuth from '../hooks/useAuth';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { getGradeFromMarks, getGradeColor, calculateGPA } from '../utils/gpa';
import { readList } from '../utils/apiData';

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Electronics', 'English'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

function Results() {
  const { role, branch: userBranch, loading: authLoading } = useAuth();
  const isStudent = role === 'student';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState([]);
  const [myResults, setMyResults] = useState([]);
  const [results, setResults] = useState({});
  const [gpa, setGpa] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [selectedSemester, setSelectedSemester] = useState(3);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (authLoading) {
      return;
    }
    fetchStudentsAndResults();
  }, [authLoading, selectedSubject, selectedSemester, isStudent, userBranch]);

  async function fetchStudentsAndResults() {
    setLoading(true);
    try {
      if (isStudent) {
        const resultsRes = await api.get(`/results/me?semester=${selectedSemester}&subject=${encodeURIComponent(selectedSubject)}`);
        const studentResults = readList(resultsRes.data, ['results']);
        setMyResults(studentResults);
        setGpa(studentResults.length > 0 ? calculateGPA(studentResults) : 8.1);
        setStudents([]);
        setResults({});
        return;
      }

      const [studentsRes, resultsRes] = await Promise.all([
        api.get(`/students?branch=${userBranch}`),
        api.get(`/results?branch=${userBranch}&semester=${selectedSemester}&subject=${encodeURIComponent(selectedSubject)}`).catch(() => ({ data: { results: [] } })),
      ]);

      const studentList = readList(studentsRes.data, ['students']);
      setStudents(studentList);

      const resultsData = {};
      readList(resultsRes.data, ['results']).forEach((r) => {
        resultsData[r.studentId] = {
          marks: r.marks,
          grade: r.grade,
          credits: r.credits || 3,
        };
      });

      studentList.forEach((s) => {
        if (!resultsData[s.studentId]) {
          resultsData[s.studentId] = { marks: '', grade: '', credits: 3 };
        }
      });

      setResults(resultsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(getApiErrorMessage(error, 'Failed to load data'));
    } finally {
      setLoading(false);
    }
  }

  function handleMarksChange(studentId, marks) {
    const numMarks = parseInt(marks) || 0;
    const clampedMarks = Math.min(100, Math.max(0, numMarks));
    const grade = marks ? getGradeFromMarks(clampedMarks) : '';

    setResults((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        marks: marks === '' ? '' : clampedMarks,
        grade,
      },
    }));
  }

  async function handleSave() {
    if (isStudent) {
      return;
    }

    setSaving(true);
    try {
      const records = Object.entries(results)
        .filter(([_, data]) => data.marks !== '')
        .map(([studentId, data]) => ({
          studentId,
          semester: selectedSemester,
          subject: selectedSubject,
          marks: data.marks,
          maxMarks: 100,
          branch: userBranch,
        }));

      if (records.length === 0) {
        toast.error('No results to save');
        return;
      }

      await api.post('/results', { records, branch: userBranch });
      toast.success('Results saved successfully');
    } catch (error) {
      console.error('Error saving results:', error);
      toast.error(getApiErrorMessage(error, 'Failed to save results'));
    } finally {
      setSaving(false);
    }
  }

  const filteredStudents = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNumber?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="page__loading">
        <Spinner size="large" />
      </div>
    );
  }

  if (isStudent) {
    const filteredMyResults = myResults.filter(
      (record) =>
        record.subject?.toLowerCase().includes(search.toLowerCase()) ||
        String(record.semester || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
      <div className="page">
        <div className="page__header">
          <div className="page__filters">
            <div className="search-box">
              <Search size={20} className="search-box__icon" />
              <input
                type="text"
                className="search-box__input"
                placeholder="Search subjects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="form-select"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
            >
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
            <select
              className="form-select"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="stat-card stat-card--green" style={{ minWidth: '160px' }}>
            <div className="stat-card__content">
              <span className="stat-card__value">{gpa}</span>
              <span className="stat-card__label">Current GPA</span>
            </div>
          </div>
        </div>

        {filteredMyResults.length === 0 ? (
          <EmptyState title="No results found" message="Your published results will appear here" />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Semester</th>
                  <th>Marks</th>
                  <th>Grade</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {filteredMyResults.map((record, index) => (
                  <tr key={`${record.semesterSubject || record.subject}-${index}`}>
                    <td>{record.subject}</td>
                    <td>{record.semester}</td>
                    <td>{record.marks}</td>
                    <td>
                      <span className="grade-badge" style={{ backgroundColor: getGradeColor(record.grade) }}>
                        {record.grade}
                      </span>
                    </td>
                    <td>{record.percentage ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__filters">
          <div className="search-box">
            <Search size={20} className="search-box__icon" />
            <input
              type="text"
              className="search-box__input"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
          >
            {SEMESTERS.map((s) => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
          <select
            className="form-select"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
          {saving ? <Spinner size="small" /> : <><Save size={20} /> <span>Save Results</span></>}
        </button>
      </div>

      {filteredStudents.length === 0 ? (
        <EmptyState title="No students found" message="Add students to enter results" />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Roll Number</th>
                <th>Name</th>
                <th>Marks (0-100)</th>
                <th>Grade</th>
                <th>GPA Points</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => {
                const result = results[student.studentId] || {};
                return (
                  <tr key={student.studentId}>
                    <td>{student.rollNumber}</td>
                    <td>{student.name}</td>
                    <td>
                      <input
                        type="number"
                        className="form-input form-input--sm form-input--inline"
                        min="0"
                        max="100"
                        value={result.marks}
                        onChange={(e) => handleMarksChange(student.studentId, e.target.value)}
                        placeholder="Enter marks"
                      />
                    </td>
                    <td>
                      {result.grade && (
                        <span
                          className="grade-badge"
                          style={{ backgroundColor: getGradeColor(result.grade) }}
                        >
                          {result.grade}
                        </span>
                      )}
                    </td>
                    <td>
                      {result.grade && (
                        <span className="gpa-points">
                          {result.grade === 'O' ? 10 :
                           result.grade === 'A+' ? 9 :
                           result.grade === 'A' ? 8 :
                           result.grade === 'B+' ? 7 :
                           result.grade === 'B' ? 6 :
                           result.grade === 'C' ? 5 :
                           result.grade === 'P' ? 4 : 0}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="results-summary">
        <div className="results-summary__card">
          <h4>Grade Distribution</h4>
          <div className="grade-distribution">
            {['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F'].map((grade) => {
              const count = Object.values(results).filter((r) => r.grade === grade).length;
              return (
                <div key={grade} className="grade-distribution__item">
                  <span
                    className="grade-badge grade-badge--sm"
                    style={{ backgroundColor: getGradeColor(grade) }}
                  >
                    {grade}
                  </span>
                  <span className="grade-distribution__count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Results;
