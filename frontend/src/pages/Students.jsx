import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api, { getApiErrorMessage } from '../utils/api';
import useAuth from '../hooks/useAuth';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { readList } from '../utils/apiData';

const BRANCHES = ['CS', 'EC', 'ME', 'CE', 'EE'];
const ITEMS_PER_PAGE = 10;

function Students() {
  const { role, branch: userBranch } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(role === 'branch_admin' ? userBranch : '');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    branch: 'CS',
    semester: 1,
    rollNumber: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchStudents();
  }, [selectedBranch]);

  async function fetchStudents() {
    setLoading(true);
    try {
      const params = selectedBranch ? `?branch=${selectedBranch}` : '';
      const response = await api.get(`/students${params}`);
      setStudents(readList(response.data, ['students']));
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error(getApiErrorMessage(error, 'Failed to load students'));
    } finally {
      setLoading(false);
    }
  }

  const filteredStudents = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  function openAddModal() {
    setEditingStudent(null);
    setFormData({ name: '', email: '', branch: userBranch || 'CS', semester: 1, rollNumber: '' });
    setErrors({});
    setIsModalOpen(true);
  }

  function openEditModal(student) {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      branch: student.branch,
      semester: student.semester,
      rollNumber: student.rollNumber,
    });
    setErrors({});
    setIsModalOpen(true);
  }

  function validate() {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.rollNumber) newErrors.rollNumber = 'Roll number is required';
    if (formData.semester < 1 || formData.semester > 8) newErrors.semester = 'Semester must be 1-8';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setFormLoading(true);
    try {
      if (editingStudent) {
        await api.put(`/students/${editingStudent.studentId}`, formData);
        toast.success('Student updated successfully');
      } else {
        await api.post('/students', formData);
        toast.success('Student added successfully');
      }
      setIsModalOpen(false);
      fetchStudents();
    } catch (error) {
      console.error('Error saving student:', error);
      toast.error(getApiErrorMessage(error, 'Failed to save student'));
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(studentId) {
    try {
      await api.delete(`/students/${studentId}`, {
        data: {
          branch: deleteConfirm?.branch,
        },
      });
      toast.success('Student deleted successfully');
      setDeleteConfirm(null);
      fetchStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error(getApiErrorMessage(error, 'Failed to delete student'));
    }
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
          {role === 'admin' && (
            <select
              className="form-select form-select--sm"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="">All Branches</option>
              {BRANCHES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          )}
        </div>
        <button className="btn btn--primary" onClick={openAddModal}>
          <Plus size={20} />
          <span>Add Student</span>
        </button>
      </div>

      {loading ? (
        <div className="page__loading">
          <Spinner size="large" />
        </div>
      ) : paginatedStudents.length === 0 ? (
        <EmptyState
          title="No students found"
          message={search ? 'Try adjusting your search' : 'Add your first student to get started'}
        />
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Branch</th>
                  <th>Semester</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.map((student) => (
                  <tr key={student.studentId}>
                    <td>{student.rollNumber}</td>
                    <td>{student.name}</td>
                    <td>{student.email}</td>
                    <td><span className="branch-badge">{student.branch}</span></td>
                    <td>{student.semester}</td>
                    <td>
                      <div className="table__actions">
                        <button
                          className="btn btn--icon btn--ghost"
                          onClick={() => openEditModal(student)}
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn btn--icon btn--ghost btn--danger"
                          onClick={() => setDeleteConfirm(student)}
                          title="Delete"
                        >
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
                className="btn btn--icon btn--ghost"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={20} />
              </button>
              <span className="pagination__info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="btn btn--icon btn--ghost"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="slide-panel" onClick={(e) => e.stopPropagation()}>
            <div className="slide-panel__header">
              <h2>{editingStudent ? 'Edit Student' : 'Add Student'}</h2>
              <button className="btn btn--icon btn--ghost" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <form className="slide-panel__body" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className={`form-input ${errors.name ? 'form-input--error' : ''}`}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className={`form-input ${errors.email ? 'form-input--error' : ''}`}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Roll Number</label>
                <input
                  type="text"
                  className={`form-input ${errors.rollNumber ? 'form-input--error' : ''}`}
                  value={formData.rollNumber}
                  onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                />
                {errors.rollNumber && <span className="form-error">{errors.rollNumber}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Branch</label>
                  <select
                    className="form-select"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    disabled={role === 'branch_admin'}
                  >
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <input
                    type="number"
                    className={`form-input ${errors.semester ? 'form-input--error' : ''}`}
                    min="1"
                    max="8"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) || 1 })}
                  />
                  {errors.semester && <span className="form-error">{errors.semester}</span>}
                </div>
              </div>

              <div className="slide-panel__footer">
                <button type="button" className="btn btn--outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={formLoading}>
                  {formLoading ? <Spinner size="small" /> : editingStudent ? 'Update' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Delete Student</h2>
            </div>
            <div className="modal__content">
              <p>Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?</p>
              <p className="text-muted">This action cannot be undone.</p>
            </div>
            <div className="modal__footer">
              <button className="btn btn--outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button
                className="btn btn--danger"
                onClick={() => handleDelete(deleteConfirm.studentId)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Students;
