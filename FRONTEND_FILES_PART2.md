# GCEK Central Frontend Implementation - Part 2

## File: src/App.jsx

```javascript
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Layout
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';

// Dashboards
import AdminDashboard from './pages/dashboards/AdminDashboard';
import BranchAdminDashboard from './pages/dashboards/BranchAdminDashboard';
import TeacherDashboard from './pages/dashboards/TeacherDashboard';
import StudentDashboard from './pages/dashboards/StudentDashboard';

// Pages
import Students from './pages/Students';
import Attendance from './pages/Attendance';
import Results from './pages/Results';
import Notices from './pages/Notices';
import Analytics from './pages/Analytics';

function DashboardLayout({ children, title }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar title={title} />
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}

function DashboardRouter() {
  const { role } = useAuth();

  const getDashboardByRole = () => {
    switch (role) {
      case 'admin':
        return <AdminDashboard />;
      case 'branch_admin':
        return <BranchAdminDashboard />;
      case 'teacher':
        return <TeacherDashboard />;
      case 'student':
        return <StudentDashboard />;
      default:
        return <StudentDashboard />;
    }
  };

  return getDashboardByRole();
}

function Unauthorized() {
  return (
    <div className="unauthorized-page">
      <h1>403</h1>
      <h2>Access Denied</h2>
      <p>You don't have permission to access this page.</p>
      <a href="/dashboard" className="btn btn-primary">Go to Dashboard</a>
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout title="Dashboard">
              <DashboardRouter />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/students"
        element={
          <ProtectedRoute roles={['admin', 'branch_admin', 'teacher']}>
            <DashboardLayout title="Students">
              <Students />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/attendance"
        element={
          <ProtectedRoute roles={['admin', 'branch_admin', 'teacher', 'student']}>
            <DashboardLayout title="Attendance">
              <Attendance />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/results"
        element={
          <ProtectedRoute roles={['admin', 'branch_admin', 'teacher', 'student']}>
            <DashboardLayout title="Results">
              <Results />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/notices"
        element={
          <ProtectedRoute roles={['admin', 'branch_admin', 'teacher', 'student']}>
            <DashboardLayout title="Notices">
              <Notices />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <ProtectedRoute roles={['admin', 'branch_admin']}>
            <DashboardLayout title="Analytics">
              <Analytics />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Default Redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
```

---

## File: src/pages/Students.jsx

```javascript
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Search, Plus, Edit2, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

const BRANCHES = ['CS', 'EC', 'ME', 'CE', 'EE'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

function Students() {
  const { role, branch: userBranch } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(userBranch || 'CS');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    email: '',
    branch: userBranch || 'CS',
    year: '1st Year',
    department: '',
    phone: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const pageSize = 10;

  useEffect(() => {
    loadStudents();
  }, [selectedBranch]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/students', { params: { branch: selectedBranch } });
      setStudents(response.data.data || []);
    } catch (error) {
      console.error('Error loading students:', error);
      // Use placeholder data for demo
      setStudents([
        { studentId: 'CS2024001', name: 'Rahul Kumar', email: 'rahul@gcek.ac.in', branch: 'CS', year: '2nd Year', phone: '9876543210' },
        { studentId: 'CS2024002', name: 'Priya Sharma', email: 'priya@gcek.ac.in', branch: 'CS', year: '2nd Year', phone: '9876543211' },
        { studentId: 'CS2024003', name: 'Amit Patel', email: 'amit@gcek.ac.in', branch: 'CS', year: '3rd Year', phone: '9876543212' },
        { studentId: 'CS2024004', name: 'Sneha Gupta', email: 'sneha@gcek.ac.in', branch: 'CS', year: '1st Year', phone: '9876543213' },
        { studentId: 'CS2024005', name: 'Vikram Singh', email: 'vikram@gcek.ac.in', branch: 'CS', year: '4th Year', phone: '9876543214' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredStudents.length / pageSize);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleOpenModal = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        branch: student.branch,
        year: student.year,
        department: student.department || '',
        phone: student.phone || ''
      });
    } else {
      setEditingStudent(null);
      setFormData({
        studentId: '',
        name: '',
        email: '',
        branch: userBranch || 'CS',
        year: '1st Year',
        department: '',
        phone: ''
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingStudent(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.studentId || !formData.name || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      if (editingStudent) {
        await api.put(`/students/${formData.studentId}`, formData);
        toast.success('Student updated successfully');
      } else {
        await api.post('/students', formData);
        toast.success('Student added successfully');
      }
      handleCloseModal();
      loadStudents();
    } catch (error) {
      console.error('Error saving student:', error);
      toast.error(error.response?.data?.error || 'Failed to save student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (student) => {
    try {
      await api.delete(`/students/${student.studentId}`, { data: { branch: student.branch } });
      toast.success('Student deleted successfully');
      setDeleteConfirm(null);
      loadStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error(error.response?.data?.error || 'Failed to delete student');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-left">
          <h2>Students</h2>
          <p>{filteredStudents.length} students found</p>
        </div>
        <div className="header-actions">
          {role !== 'student' && (
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              <Plus size={18} />
              <span>Add Student</span>
            </button>
          )}
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {role === 'admin' && (
          <div className="filter-group">
            <label>Branch:</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              {BRANCHES.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="page-loading">
          <Spinner size="large" />
        </div>
      ) : paginatedStudents.length === 0 ? (
        <EmptyState message="No students found" />
      ) : (
        <>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Year</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.map((student) => (
                  <tr key={student.studentId}>
                    <td className="font-mono">{student.studentId}</td>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar small">{student.name.charAt(0)}</div>
                        <span>{student.name}</span>
                      </div>
                    </td>
                    <td>{student.email}</td>
                    <td>{student.year}</td>
                    <td>{student.phone || '-'}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon" onClick={() => handleOpenModal(student)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="btn-icon danger" onClick={() => setDeleteConfirm(student)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-sm"
                onClick={() => setCurrentPage(p => p - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                className="btn btn-sm"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingStudent ? 'Edit Student' : 'Add New Student'}
        size="medium"
      >
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>Student ID *</label>
              <input
                type="text"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                disabled={editingStudent}
                placeholder="e.g., CS2024001"
              />
            </div>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="student@gcek.ac.in"
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Branch</label>
              <select
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                disabled={role !== 'admin'}
              >
                {BRANCHES.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Year</label>
              <select
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              >
                {YEARS.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <Spinner size="small" /> : (editingStudent ? 'Update' : 'Add Student')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirm Delete"
        size="small"
      >
        <div className="confirm-dialog">
          <p>Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>?</p>
          <p className="warning-text">This action cannot be undone.</p>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Students;
```

---

## File: src/pages/Attendance.jsx

```javascript
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Calendar, Check, X, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';

const SUBJECTS = ['Data Structures', 'Algorithms', 'Database Systems', 'Computer Networks', 'Operating Systems'];

function Attendance() {
  const { role, branch, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [viewMode, setViewMode] = useState(role === 'student' ? 'view' : 'mark');
  const [studentAttendance, setStudentAttendance] = useState([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  useEffect(() => {
    if (role === 'student') {
      loadStudentAttendance();
    } else {
      loadStudentsForAttendance();
    }
  }, [selectedDate, selectedSubject, role]);

  const loadStudentsForAttendance = async () => {
    setLoading(true);
    try {
      const response = await api.get('/students', { params: { branch } });
      const studentList = response.data.data || [];
      setStudents(studentList);
      
      // Initialize attendance state
      const initialAttendance = {};
      studentList.forEach(s => {
        initialAttendance[s.studentId] = 'present';
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Error loading students:', error);
      // Demo data
      const demoStudents = [
        { studentId: 'CS2024001', name: 'Rahul Kumar' },
        { studentId: 'CS2024002', name: 'Priya Sharma' },
        { studentId: 'CS2024003', name: 'Amit Patel' },
        { studentId: 'CS2024004', name: 'Sneha Gupta' },
        { studentId: 'CS2024005', name: 'Vikram Singh' },
      ];
      setStudents(demoStudents);
      const initialAttendance = {};
      demoStudents.forEach(s => {
        initialAttendance[s.studentId] = 'present';
      });
      setAttendance(initialAttendance);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentAttendance = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/attendance/${user?.userId}`);
      setStudentAttendance(response.data.data || []);
    } catch (error) {
      console.error('Error loading attendance:', error);
      // Demo data
      setStudentAttendance([
        { date: '2024-01-15', subject: 'Data Structures', status: 'present' },
        { date: '2024-01-15', subject: 'Algorithms', status: 'present' },
        { date: '2024-01-14', subject: 'Data Structures', status: 'absent' },
        { date: '2024-01-14', subject: 'Database Systems', status: 'present' },
        { date: '2024-01-13', subject: 'Computer Networks', status: 'present' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = (studentId) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
    }));
  };

  const markAllPresent = () => {
    const newAttendance = {};
    students.forEach(s => {
      newAttendance[s.studentId] = 'present';
    });
    setAttendance(newAttendance);
  };

  const markAllAbsent = () => {
    const newAttendance = {};
    students.forEach(s => {
      newAttendance[s.studentId] = 'absent';
    });
    setAttendance(newAttendance);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status
      }));

      await api.post('/attendance/batch', {
        date: selectedDate,
        subject: selectedSubject,
        branch,
        records
      });

      toast.success(`Attendance marked for ${records.length} students`);
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const presentCount = Object.values(attendance).filter(s => s === 'present').length;
  const absentCount = Object.values(attendance).filter(s => s === 'absent').length;

  // Calendar heat map data
  const getCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add days of month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayAttendance = studentAttendance.filter(a => a.date === dateStr);
      const presentCount = dayAttendance.filter(a => a.status === 'present').length;
      const totalCount = dayAttendance.length;

      days.push({
        day: i,
        date: dateStr,
        present: presentCount,
        total: totalCount,
        status: totalCount === 0 ? 'none' : presentCount === totalCount ? 'full' : presentCount > 0 ? 'partial' : 'absent'
      });
    }

    return days;
  };

  if (loading) {
    return (
      <div className="page-loading">
        <Spinner size="large" />
      </div>
    );
  }

  // Student View
  if (role === 'student') {
    return (
      <div className="page-container">
        <div className="page-header">
          <h2>My Attendance</h2>
        </div>

        <div className="attendance-summary-cards">
          <div className="summary-card">
            <span className="summary-label">Total Classes</span>
            <span className="summary-value">{studentAttendance.length}</span>
          </div>
          <div className="summary-card present">
            <span className="summary-label">Present</span>
            <span className="summary-value">{studentAttendance.filter(a => a.status === 'present').length}</span>
          </div>
          <div className="summary-card absent">
            <span className="summary-label">Absent</span>
            <span className="summary-value">{studentAttendance.filter(a => a.status === 'absent').length}</span>
          </div>
        </div>

        <div className="attendance-calendar-section">
          <div className="calendar-header">
            <button className="btn btn-icon" onClick={() => setCalendarMonth(new Date(calendarMonth.setMonth(calendarMonth.getMonth() - 1)))}>
              <ChevronLeft size={20} />
            </button>
            <h3>{calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
            <button className="btn btn-icon" onClick={() => setCalendarMonth(new Date(calendarMonth.setMonth(calendarMonth.getMonth() + 1)))}>
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="calendar-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="calendar-header-cell">{day}</div>
            ))}
            {getCalendarDays().map((day, index) => (
              <div
                key={index}
                className={`calendar-cell ${day ? `status-${day.status}` : 'empty'}`}
                title={day ? `${day.present}/${day.total} classes attended` : ''}
              >
                {day?.day}
              </div>
            ))}
          </div>

          <div className="calendar-legend">
            <div className="legend-item"><span className="legend-dot status-full"></span> Full attendance</div>
            <div className="legend-item"><span className="legend-dot status-partial"></span> Partial attendance</div>
            <div className="legend-item"><span className="legend-dot status-absent"></span> Absent</div>
            <div className="legend-item"><span className="legend-dot status-none"></span> No classes</div>
          </div>
        </div>
      </div>
    );
  }

  // Teacher/Admin View
  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Mark Attendance</h2>
      </div>

      <div className="attendance-controls">
        <div className="control-group">
          <label>Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="control-group">
          <label>Subject</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            {SUBJECTS.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>

        <div className="quick-actions">
          <button className="btn btn-sm btn-secondary" onClick={markAllPresent}>
            <Check size={16} /> Mark All Present
          </button>
          <button className="btn btn-sm btn-secondary" onClick={markAllAbsent}>
            <X size={16} /> Mark All Absent
          </button>
        </div>
      </div>

      <div className="attendance-stats">
        <div className="stat-pill present">
          <Check size={16} />
          <span>Present: {presentCount}</span>
        </div>
        <div className="stat-pill absent">
          <X size={16} />
          <span>Absent: {absentCount}</span>
        </div>
        <div className="stat-pill total">
          <Users size={16} />
          <span>Total: {students.length}</span>
        </div>
      </div>

      {students.length === 0 ? (
        <EmptyState message="No students found in this branch" />
      ) : (
        <>
          <div className="attendance-list">
            {students.map((student) => (
              <div
                key={student.studentId}
                className={`attendance-item ${attendance[student.studentId]}`}
                onClick={() => toggleAttendance(student.studentId)}
              >
                <div className="student-info">
                  <div className="student-avatar">{student.name.charAt(0)}</div>
                  <div>
                    <span className="student-name">{student.name}</span>
                    <span className="student-id">{student.studentId}</span>
                  </div>
                </div>
                <div className="attendance-toggle">
                  <button
                    className={`toggle-btn present ${attendance[student.studentId] === 'present' ? 'active' : ''}`}
                  >
                    <Check size={18} />
                    Present
                  </button>
                  <button
                    className={`toggle-btn absent ${attendance[student.studentId] === 'absent' ? 'active' : ''}`}
                  >
                    <X size={18} />
                    Absent
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="page-footer">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleSubmit}
              disabled={submitting}
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
```

---

## File: src/pages/Results.jsx

```javascript
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { FileText, Edit2, Save, X, TrendingUp } from 'lucide-react';
import { calculateGrade, calculateCGPA, getGradeColor } from '../utils/gpa';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';

const SEMESTERS = ['SEM1', 'SEM2', 'SEM3', 'SEM4', 'SEM5', 'SEM6', 'SEM7', 'SEM8'];
const SUBJECTS = ['Data Structures', 'Algorithms', 'Database Systems', 'Computer Networks', 'Operating Systems'];

function Results() {
  const { role, branch, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState('SEM3');
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState({ marks: '', maxMarks: 100 });
  const [studentResults, setStudentResults] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (role === 'student') {
      loadStudentResults();
    } else {
      loadResults();
    }
  }, [selectedSemester, selectedSubject, role]);

  const loadResults = async () => {
    setLoading(true);
    try {
      const response = await api.get('/students', { params: { branch } });
      setStudents(response.data.data || []);
      
      // Load existing results
      const resultsMap = {};
      // In real app, fetch results from API
      setResults(resultsMap);
    } catch (error) {
      console.error('Error loading results:', error);
      // Demo data
      const demoStudents = [
        { studentId: 'CS2024001', name: 'Rahul Kumar' },
        { studentId: 'CS2024002', name: 'Priya Sharma' },
        { studentId: 'CS2024003', name: 'Amit Patel' },
        { studentId: 'CS2024004', name: 'Sneha Gupta' },
        { studentId: 'CS2024005', name: 'Vikram Singh' },
      ];
      setStudents(demoStudents);

      // Demo results
      setResults({
        'CS2024001': { marks: 85, maxMarks: 100 },
        'CS2024002': { marks: 78, maxMarks: 100 },
        'CS2024003': { marks: 92, maxMarks: 100 },
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStudentResults = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/results/${user?.userId}`, {
        params: { semester: selectedSemester }
      });
      setStudentResults(response.data.data || []);
    } catch (error) {
      console.error('Error loading results:', error);
      // Demo data
      setStudentResults([
        { subject: 'Data Structures', semester: 'SEM3', marks: 85, maxMarks: 100, grade: 'A+', gradePoints: 9 },
        { subject: 'Algorithms', semester: 'SEM3', marks: 92, maxMarks: 100, grade: 'O', gradePoints: 10 },
        { subject: 'Database Systems', semester: 'SEM3', marks: 78, maxMarks: 100, grade: 'A', gradePoints: 8 },
        { subject: 'Computer Networks', semester: 'SEM3', marks: 65, maxMarks: 100, grade: 'B+', gradePoints: 7 },
        { subject: 'Operating Systems', semester: 'SEM3', marks: 88, maxMarks: 100, grade: 'A+', gradePoints: 9 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (studentId, currentResult) => {
    setEditingId(studentId);
    setEditValue({
      marks: currentResult?.marks || '',
      maxMarks: currentResult?.maxMarks || 100
    });
  };

  const handleSave = async (studentId) => {
    if (!editValue.marks || editValue.marks < 0 || editValue.marks > editValue.maxMarks) {
      toast.error('Please enter valid marks');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/results', {
        studentId,
        semester: selectedSemester,
        subject: selectedSubject,
        marks: parseInt(editValue.marks),
        maxMarks: parseInt(editValue.maxMarks),
        branch
      });

      const gradeInfo = calculateGrade(parseInt(editValue.marks), parseInt(editValue.maxMarks));
      setResults(prev => ({
        ...prev,
        [studentId]: {
          marks: parseInt(editValue.marks),
          maxMarks: parseInt(editValue.maxMarks),
          ...gradeInfo
        }
      }));

      toast.success('Result saved successfully');
      setEditingId(null);
    } catch (error) {
      console.error('Error saving result:', error);
      toast.error('Failed to save result');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue({ marks: '', maxMarks: 100 });
  };

  if (loading) {
    return (
      <div className="page-loading">
        <Spinner size="large" />
      </div>
    );
  }

  // Student View
  if (role === 'student') {
    const cgpa = calculateCGPA(studentResults);

    return (
      <div className="page-container">
        <div className="page-header">
          <h2>My Results</h2>
          <div className="cgpa-display">
            <TrendingUp size={20} />
            <span>SGPA: {cgpa}</span>
          </div>
        </div>

        <div className="semester-tabs">
          {SEMESTERS.map(sem => (
            <button
              key={sem}
              className={`semester-tab ${selectedSemester === sem ? 'active' : ''}`}
              onClick={() => setSelectedSemester(sem)}
            >
              {sem}
            </button>
          ))}
        </div>

        {studentResults.length === 0 ? (
          <EmptyState message="No results available for this semester" />
        ) : (
          <div className="results-grid">
            {studentResults.map((result, index) => {
              const gradeInfo = calculateGrade(result.marks, result.maxMarks);
              return (
                <div key={index} className="result-card">
                  <div className="result-card-header">
                    <h4>{result.subject}</h4>
                    <div
                      className="grade-badge"
                      style={{ backgroundColor: `${getGradeColor(gradeInfo.grade)}20`, color: getGradeColor(gradeInfo.grade) }}
                    >
                      {gradeInfo.grade}
                    </div>
                  </div>
                  <div className="result-card-body">
                    <div className="marks-display">
                      <span className="marks-obtained">{result.marks}</span>
                      <span className="marks-total">/ {result.maxMarks}</span>
                    </div>
                    <div className="result-details">
                      <div className="detail-row">
                        <span>Percentage</span>
                        <span>{gradeInfo.percentage}%</span>
                      </div>
                      <div className="detail-row">
                        <span>Grade Points</span>
                        <span>{gradeInfo.gradePoints}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Teacher/Admin View
  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Enter Results</h2>
      </div>

      <div className="results-controls">
        <div className="control-group">
          <label>Semester</label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            {SEMESTERS.map(sem => (
              <option key={sem} value={sem}>{sem}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Subject</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            {SUBJECTS.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>
      </div>

      {students.length === 0 ? (
        <EmptyState message="No students found" />
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Marks</th>
                <th>Grade</th>
                <th>Points</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const result = results[student.studentId];
                const gradeInfo = result ? calculateGrade(result.marks, result.maxMarks) : null;
                const isEditing = editingId === student.studentId;

                return (
                  <tr key={student.studentId}>
                    <td className="font-mono">{student.studentId}</td>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar small">{student.name.charAt(0)}</div>
                        <span>{student.name}</span>
                      </div>
                    </td>
                    <td>
                      {isEditing ? (
                        <div className="inline-edit">
                          <input
                            type="number"
                            value={editValue.marks}
                            onChange={(e) => setEditValue({ ...editValue, marks: e.target.value })}
                            min="0"
                            max={editValue.maxMarks}
                            placeholder="Marks"
                            autoFocus
                          />
                          <span>/</span>
                          <input
                            type="number"
                            value={editValue.maxMarks}
                            onChange={(e) => setEditValue({ ...editValue, maxMarks: e.target.value })}
                            min="1"
                            placeholder="Max"
                          />
                        </div>
                      ) : (
                        <span>{result ? `${result.marks}/${result.maxMarks}` : '-'}</span>
                      )}
                    </td>
                    <td>
                      {gradeInfo && (
                        <span
                          className="grade-badge"
                          style={{ backgroundColor: `${getGradeColor(gradeInfo.grade)}20`, color: getGradeColor(gradeInfo.grade) }}
                        >
                          {gradeInfo.grade}
                        </span>
                      )}
                    </td>
                    <td>{gradeInfo?.gradePoints ?? '-'}</td>
                    <td>
                      <div className="action-buttons">
                        {isEditing ? (
                          <>
                            <button
                              className="btn-icon success"
                              onClick={() => handleSave(student.studentId)}
                              disabled={submitting}
                            >
                              <Save size={16} />
                            </button>
                            <button className="btn-icon" onClick={handleCancel}>
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <button className="btn-icon" onClick={() => handleEdit(student.studentId, result)}>
                            <Edit2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Results;
```

---

## File: src/pages/Notices.jsx

```javascript
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Bell, Plus, Calendar, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

const PRIORITIES = [
  { value: 'HIGH', label: 'High', color: '#EF4444', icon: AlertTriangle },
  { value: 'MEDIUM', label: 'Medium', color: '#F59E0B', icon: AlertCircle },
  { value: 'LOW', label: 'Low', color: '#6B7280', icon: Info }
];

function Notices() {
  const { role, branch } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'MEDIUM',
    branch: branch || 'ALL'
  });
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadNotices();
  }, [branch]);

  const loadNotices = async () => {
    setLoading(true);
    try {
      const response = await api.get('/notices', { params: { branch } });
      setNotices(response.data.data || []);
    } catch (error) {
      console.error('Error loading notices:', error);
      // Demo data
      setNotices([
        {
          id: 1,
          title: 'End Semester Examination Schedule',
          content: 'The end semester examinations will commence from 15th January 2024. Students are advised to collect their hall tickets from the examination cell. Please ensure you have cleared all dues before collecting your hall tickets.',
          priority: 'HIGH',
          branch: 'ALL',
          postedBy: 'Admin',
          createdAt: '2024-01-10T10:00:00Z'
        },
        {
          id: 2,
          title: 'Library Books Return Notice',
          content: 'All students are requested to return library books by 12th January 2024. Failure to return books will result in a fine of Rs. 10 per day per book.',
          priority: 'MEDIUM',
          branch: 'ALL',
          postedBy: 'Librarian',
          createdAt: '2024-01-08T14:30:00Z'
        },
        {
          id: 3,
          title: 'Sports Day Announcement',
          content: 'Annual sports day will be held on 20th January 2024. Interested students can register at the sports department. Participation certificates will be provided to all participants.',
          priority: 'LOW',
          branch: 'CS',
          postedBy: 'Sports Coordinator',
          createdAt: '2024-01-05T09:15:00Z'
        },
        {
          id: 4,
          title: 'Placement Drive - TCS',
          content: 'TCS will be conducting a placement drive on campus on 25th January 2024. Eligible students should register on the placement portal by 18th January. Minimum CGPA requirement: 7.0',
          priority: 'HIGH',
          branch: 'CS',
          postedBy: 'Placement Cell',
          createdAt: '2024-01-03T11:00:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/notices', formData);
      toast.success('Notice posted successfully');
      setModalOpen(false);
      setFormData({
        title: '',
        content: '',
        priority: 'MEDIUM',
        branch: branch || 'ALL'
      });
      loadNotices();
    } catch (error) {
      console.error('Error posting notice:', error);
      toast.error('Failed to post notice');
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityInfo = (priority) => {
    return PRIORITIES.find(p => p.value === priority) || PRIORITIES[1];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(dateString);
  };

  const filteredNotices = filter === 'all' 
    ? notices 
    : notices.filter(n => n.priority === filter);

  const canPost = role === 'admin' || role === 'branch_admin';

  if (loading) {
    return (
      <div className="page-loading">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-left">
          <h2>Notice Board</h2>
          <p>{notices.length} notices</p>
        </div>
        {canPost && (
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={18} />
            <span>Post Notice</span>
          </button>
        )}
      </div>

      <div className="filters-bar">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          {PRIORITIES.map(p => (
            <button
              key={p.value}
              className={`filter-tab ${filter === p.value ? 'active' : ''}`}
              onClick={() => setFilter(p.value)}
              style={filter === p.value ? { borderColor: p.color, color: p.color } : {}}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {filteredNotices.length === 0 ? (
        <EmptyState message="No notices found" />
      ) : (
        <div className="notices-grid">
          {filteredNotices.map((notice) => {
            const priorityInfo = getPriorityInfo(notice.priority);
            const PriorityIcon = priorityInfo.icon;

            return (
              <div key={notice.id} className="notice-card">
                <div className="notice-card-header">
                  <div
                    className="priority-badge"
                    style={{ backgroundColor: `${priorityInfo.color}20`, color: priorityInfo.color }}
                  >
                    <PriorityIcon size={14} />
                    <span>{priorityInfo.label}</span>
                  </div>
                  {notice.branch !== 'ALL' && (
                    <span className="branch-tag">{notice.branch}</span>
                  )}
                </div>

                <h3 className="notice-title">{notice.title}</h3>
                <p className="notice-content">{notice.content}</p>

                <div className="notice-footer">
                  <div className="notice-meta">
                    <Calendar size={14} />
                    <span>{getTimeAgo(notice.createdAt)}</span>
                  </div>
                  <span className="notice-author">Posted by {notice.postedBy}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post Notice Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Post New Notice"
        size="large"
      >
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter notice title"
            />
          </div>

          <div className="form-group">
            <label>Content *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Enter notice content..."
              rows={6}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                {PRIORITIES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Target Branch</label>
              <select
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              >
                <option value="ALL">All Branches</option>
                {['CS', 'EC', 'ME', 'CE', 'EE'].map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <Spinner size="small" /> : 'Post Notice'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Notices;
```

---

## File: src/pages/Analytics.jsx

```javascript
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { TrendingUp, Users, CalendarCheck, Award } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import api from '../utils/api';
import Spinner from '../components/Spinner';

const COLORS = ['#10B981', '#22C55E', '#84CC16', '#EAB308', '#F97316', '#FB923C', '#EF4444'];

function Analytics() {
  const { branch, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    avgAttendance: 0,
    avgCGPA: 0,
    passRate: 0
  });
  const [attendanceData, setAttendanceData] = useState([]);
  const [gradeData, setGradeData] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // In real app, fetch from API
      // Demo data
      setStats({
        totalStudents: 1250,
        avgAttendance: 87.5,
        avgCGPA: 7.8,
        passRate: 92.3
      });

      setAttendanceData([
        { branch: 'CS', attendance: 89 },
        { branch: 'EC', attendance: 85 },
        { branch: 'ME', attendance: 82 },
        { branch: 'CE', attendance: 88 },
        { branch: 'EE', attendance: 84 }
      ]);

      setGradeData([
        { name: 'O (90-100)', value: 15, grade: 'O' },
        { name: 'A+ (80-89)', value: 25, grade: 'A+' },
        { name: 'A (70-79)', value: 30, grade: 'A' },
        { name: 'B+ (60-69)', value: 15, grade: 'B+' },
        { name: 'B (50-59)', value: 10, grade: 'B' },
        { name: 'C (40-49)', value: 3, grade: 'C' },
        { name: 'F (<40)', value: 2, grade: 'F' }
      ]);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <Spinner size="large" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Students', value: stats.totalStudents.toLocaleString(), icon: Users, color: '#6366F1' },
    { label: 'Avg. Attendance', value: `${stats.avgAttendance}%`, icon: CalendarCheck, color: '#10B981' },
    { label: 'Average CGPA', value: stats.avgCGPA.toFixed(1), icon: TrendingUp, color: '#F59E0B' },
    { label: 'Pass Rate', value: `${stats.passRate}%`, icon: Award, color: '#8B5CF6' }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Analytics Dashboard</h2>
        <p>Performance overview across all departments</p>
      </div>

      <div className="stat-cards">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-card-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
              <stat.icon size={24} />
            </div>
            <div className="stat-card-content">
              <span className="stat-card-value">{stat.value}</span>
              <span className="stat-card-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Attendance by Branch</h3>
            <p>Average attendance percentage across departments</p>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="branch" 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#F8FAFC'
                  }}
                  formatter={(value) => [`${value}%`, 'Attendance']}
                />
                <Bar 
                  dataKey="attendance" 
                  fill="#6366F1" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Grade Distribution</h3>
            <p>Overall grade breakdown across all subjects</p>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={gradeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {gradeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#F8FAFC'
                  }}
                  formatter={(value) => [`${value}%`, 'Students']}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  formatter={(value) => <span style={{ color: '#374151', fontSize: '12px' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="analytics-summary">
        <div className="summary-card">
          <h4>Key Insights</h4>
          <ul className="insights-list">
            <li>
              <span className="insight-icon positive">↑</span>
              Overall attendance improved by 3.2% compared to last semester
            </li>
            <li>
              <span className="insight-icon positive">↑</span>
              85% of students have attendance above 75%
            </li>
            <li>
              <span className="insight-icon neutral">→</span>
              CS department leads with highest average CGPA of 8.2
            </li>
            <li>
              <span className="insight-icon negative">↓</span>
              ME department needs attention - lowest attendance at 82%
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
```

---

## File: src/App.css

This file is very long. I'll include it in FRONTEND_FILES_PART3.md

