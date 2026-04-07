import { useState, useEffect } from 'react';
import { Calendar, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api, { getApiErrorMessage } from '../utils/api';
import useAuth from '../hooks/useAuth';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { readList } from '../utils/apiData';

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Electronics', 'English'];

function Attendance() {
  const { role, branch: userBranch, loading: authLoading } = useAuth();
  const isStudent = role === 'student';
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentRecords, setStudentRecords] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [calendarView, setCalendarView] = useState(false);
  const [monthData, setMonthData] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (authLoading) {
      return;
    }
    fetchAttendanceData();
  }, [authLoading, isStudent, userBranch]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (calendarView && !isStudent) {
      fetchMonthAttendance();
    }
  }, [calendarView, currentMonth, isStudent, authLoading]);

  async function fetchAttendanceData() {
    setLoading(true);
    try {
      if (isStudent) {
        const response = await api.get('/attendance/me');
        const records = readList(response.data, ['attendance'])
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        setStudentRecords(records);
        setStudents([]);
        setAttendance({});
        return;
      }

      const response = await api.get(`/students?branch=${userBranch}`);
      const studentList = readList(response.data, ['students']);
      setStudents(studentList);
      
      const initialAttendance = {};
      studentList.forEach((s) => {
        initialAttendance[s.studentId] = 'present';
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast.error(getApiErrorMessage(error, 'Failed to load attendance data'));
    } finally {
      setLoading(false);
    }
  }

  async function fetchMonthAttendance() {
    try {
      const year = currentMonth.getFullYear();
      const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
      const response = await api.get(`/attendance?month=${year}-${month}&branch=${userBranch}`);
      
      const data = {};
      readList(response.data, ['attendance']).forEach((record) => {
        const date = record.date;
        if (!data[date]) data[date] = { present: 0, absent: 0 };
        if (record.status === 'present') data[date].present++;
        else data[date].absent++;
      });
      setMonthData(data);
    } catch (error) {
      console.error('Error fetching month attendance:', error);
    }
  }

  function toggleAttendance(studentId) {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present',
    }));
  }

  function markAllPresent() {
    const newAttendance = {};
    students.forEach((s) => {
      newAttendance[s.studentId] = 'present';
    });
    setAttendance(newAttendance);
  }

  function markAllAbsent() {
    const newAttendance = {};
    students.forEach((s) => {
      newAttendance[s.studentId] = 'absent';
    });
    setAttendance(newAttendance);
  }

  async function handleSubmit() {
    if (isStudent) {
      return;
    }

    setSubmitting(true);
    try {
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        date: selectedDate,
        subject: selectedSubject,
        status,
        branch: userBranch,
      }));

      await api.post('/attendance', { records });
      toast.success('Attendance marked successfully');
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error(getApiErrorMessage(error, 'Failed to mark attendance'));
    } finally {
      setSubmitting(false);
    }
  }

  const presentCount = Object.values(attendance).filter((s) => s === 'present').length;
  const absentCount = Object.values(attendance).filter((s) => s === 'absent').length;

  function renderCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day calendar-day--empty"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = monthData[dateStr];
      let className = 'calendar-day';
      
      if (dayData) {
        const total = dayData.present + dayData.absent;
        const rate = dayData.present / total;
        if (rate >= 0.9) className += ' calendar-day--excellent';
        else if (rate >= 0.75) className += ' calendar-day--good';
        else if (rate >= 0.5) className += ' calendar-day--average';
        else className += ' calendar-day--poor';
      }
      
      days.push(
        <div key={day} className={className}>
          <span className="calendar-day__number">{day}</span>
          {dayData && (
            <span className="calendar-day__info">
              {Math.round((dayData.present / (dayData.present + dayData.absent)) * 100)}%
            </span>
          )}
        </div>
      );
    }
    
    return days;
  }

  if (loading) {
    return (
      <div className="page__loading">
        <Spinner size="large" />
      </div>
    );
  }

  if (isStudent) {
    const presentCount = studentRecords.filter((entry) => entry.status === 'present').length;
    const absentCount = studentRecords.filter((entry) => entry.status === 'absent').length;
    const attendancePercent = studentRecords.length > 0
      ? Math.round((presentCount / studentRecords.length) * 100)
      : 0;

    return (
      <div className="page">
        <div className="page__header">
          <h2 className="page__title">My Attendance</h2>
        </div>

        <div className="attendance-summary">
          <div className="attendance-summary__item attendance-summary__item--present">
            <Check size={20} />
            <span>Present: {presentCount}</span>
          </div>
          <div className="attendance-summary__item attendance-summary__item--absent">
            <X size={20} />
            <span>Absent: {absentCount}</span>
          </div>
          <div className="attendance-summary__item">
            <span>Attendance: {attendancePercent}%</span>
          </div>
        </div>

        {studentRecords.length === 0 ? (
          <EmptyState title="No attendance found" message="Your attendance records will appear here" />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Subject</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {studentRecords.map((record, index) => (
                  <tr key={`${record.dateSubject || record.date}-${index}`}>
                    <td>{record.date}</td>
                    <td>{record.subject}</td>
                    <td>
                      <span className={`priority-badge priority-badge--${record.status === 'present' ? 'low' : 'high'}`}>
                        {record.status}
                      </span>
                    </td>
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
          <div className="input-wrapper">
            <Calendar size={20} className="input-icon" />
            <input
              type="date"
              className="form-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
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
        <div className="page__actions">
          <button
            className={`btn ${calendarView ? 'btn--primary' : 'btn--outline'}`}
            onClick={() => setCalendarView(!calendarView)}
          >
            {calendarView ? 'Mark Attendance' : 'View Calendar'}
          </button>
        </div>
      </div>

      {calendarView ? (
        <div className="card">
          <div className="card__header">
            <button
              className="btn btn--icon btn--ghost"
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="card__title">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              className="btn btn--icon btn--ghost"
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="card__body">
            <div className="calendar">
              <div className="calendar__header">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="calendar__day-name">{d}</div>
                ))}
              </div>
              <div className="calendar__grid">
                {renderCalendar()}
              </div>
            </div>
            <div className="calendar-legend">
              <span className="calendar-legend__item"><span className="calendar-legend__color calendar-legend__color--excellent"></span> 90%+ </span>
              <span className="calendar-legend__item"><span className="calendar-legend__color calendar-legend__color--good"></span> 75-90%</span>
              <span className="calendar-legend__item"><span className="calendar-legend__color calendar-legend__color--average"></span> 50-75%</span>
              <span className="calendar-legend__item"><span className="calendar-legend__color calendar-legend__color--poor"></span> &lt;50%</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="attendance-summary">
            <div className="attendance-summary__item attendance-summary__item--present">
              <Check size={20} />
              <span>Present: {presentCount}</span>
            </div>
            <div className="attendance-summary__item attendance-summary__item--absent">
              <X size={20} />
              <span>Absent: {absentCount}</span>
            </div>
            <div className="attendance-summary__actions">
              <button className="btn btn--sm btn--outline" onClick={markAllPresent}>
                Mark All Present
              </button>
              <button className="btn btn--sm btn--outline" onClick={markAllAbsent}>
                Mark All Absent
              </button>
            </div>
          </div>

          {students.length === 0 ? (
            <EmptyState title="No students found" message="Add students to mark attendance" />
          ) : (
            <div className="attendance-list">
              {students.map((student) => (
                <div
                  key={student.studentId}
                  className={`attendance-item ${attendance[student.studentId] === 'present' ? 'attendance-item--present' : 'attendance-item--absent'}`}
                  onClick={() => toggleAttendance(student.studentId)}
                >
                  <div className="attendance-item__info">
                    <span className="attendance-item__name">{student.name}</span>
                    <span className="attendance-item__roll">{student.rollNumber}</span>
                  </div>
                  <div className="attendance-item__status">
                    {attendance[student.studentId] === 'present' ? (
                      <Check size={24} className="text-success" />
                    ) : (
                      <X size={24} className="text-danger" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="page__footer">
            <button
              className="btn btn--primary btn--lg"
              onClick={handleSubmit}
              disabled={submitting || students.length === 0}
            >
              {submitting ? <Spinner size="small" /> : 'Submit Attendance'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Attendance;
