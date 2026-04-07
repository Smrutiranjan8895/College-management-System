import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

import api, { getApiErrorMessage } from '../utils/api';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { readList } from '../utils/apiData';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'branch_admin', label: 'Branch Admin' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'student', label: 'Student' },
];

const BRANCHES = ['CS', 'EC', 'ME', 'CE', 'EE', 'ALL'];
const ITEMS_PER_PAGE = 12;

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'teacher',
    branch: 'CS',
    password: '',
  });

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const roleParam = roleFilter !== 'ALL' ? `&role=${encodeURIComponent(roleFilter)}` : '';
      const response = await api.get(`/users?limit=60${roleParam}`);
      setUsers(readList(response.data, ['users']));
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(getApiErrorMessage(error, 'Failed to load users'));
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setErrors({});
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'teacher',
      branch: 'CS',
      password: '',
    });
  }

  function openAddModal() {
    setEditingUser(null);
    resetForm();
    setIsModalOpen(true);
  }

  function openEditModal(user) {
    setEditingUser(user);
    setErrors({});
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'teacher',
      branch: user.branch || 'CS',
      password: '',
    });
    setIsModalOpen(true);
  }

  function validate() {
    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
      nextErrors.email = 'Enter a valid email';
    }

    if (!formData.role) {
      nextErrors.role = 'Role is required';
    }

    if (!formData.branch) {
      nextErrors.branch = 'Branch is required';
    }

    if (!editingUser) {
      if (!formData.password) {
        nextErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        nextErrors.password = 'Password must be at least 8 characters';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        role: formData.role,
        branch: formData.branch,
      };

      if (!editingUser) {
        payload.password = formData.password;
      }

      if (editingUser) {
        await api.put(`/users/${encodeURIComponent(editingUser.username)}`, payload);
        toast.success('User updated successfully');
      } else {
        await api.post('/users', payload);
        toast.success('User created successfully');
      }

      setIsModalOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(getApiErrorMessage(error, 'Failed to save user'));
    } finally {
      setFormLoading(false);
    }
  }

  const filteredUsers = users.filter((user) => {
    const query = search.toLowerCase();
    return (
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="page__loading">
        <Spinner size="large" />
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
              placeholder="Search users by name/email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <select
            className="form-select form-select--sm"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            <option value="ALL">All Roles</option>
            {ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        <button className="btn btn--primary" onClick={openAddModal}>
          <Plus size={20} />
          <span>Add User</span>
        </button>
      </div>

      {paginatedUsers.length === 0 ? (
        <EmptyState
          title="No users found"
          message={search ? 'Try a different search term' : 'Create users for teacher/student/admin access'}
        />
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Branch</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr key={user.username}>
                    <td>{user.name || '-'}</td>
                    <td>{user.email || user.username}</td>
                    <td>
                      <span className={`role-badge role-badge--${user.role || 'student'}`}>
                        {(user.role || 'student').replace('_', ' ')}
                      </span>
                    </td>
                    <td>{user.branch || 'CS'}</td>
                    <td>
                      <span className={`status-badge ${user.enabled ? 'status-badge--active' : 'status-badge--inactive'}`}>
                        {user.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <div className="table__actions">
                        <button
                          className="btn btn--icon btn--ghost"
                          title="Edit user"
                          onClick={() => openEditModal(user)}
                        >
                          <Edit2 size={16} />
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
                className="btn btn--outline"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="pagination__info">Page {currentPage} of {totalPages}</span>
              <button
                className="btn btn--outline"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="slide-panel" onClick={(event) => event.stopPropagation()}>
            <div className="slide-panel__header">
              <h2>{editingUser ? 'Update User Access' : 'Create User Access'}</h2>
              <button className="btn btn--icon btn--ghost" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <form className="slide-panel__body" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className={`form-input ${errors.name ? 'form-input--error' : ''}`}
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className={`form-input ${errors.email ? 'form-input--error' : ''}`}
                  value={formData.email}
                  onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  disabled={Boolean(editingUser)}
                />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number (optional)</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.phone}
                  onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                  placeholder="+91XXXXXXXXXX"
                />
              </div>

              {!editingUser && (
                <div className="form-group">
                  <label className="form-label">Initial Password</label>
                  <input
                    type="password"
                    className={`form-input ${errors.password ? 'form-input--error' : ''}`}
                    value={formData.password}
                    onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                  />
                  {errors.password && <span className="form-error">{errors.password}</span>}
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    className={`form-select ${errors.role ? 'form-input--error' : ''}`}
                    value={formData.role}
                    onChange={(event) => setFormData({ ...formData, role: event.target.value })}
                  >
                    {ROLES.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  {errors.role && <span className="form-error">{errors.role}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Branch</label>
                  <select
                    className={`form-select ${errors.branch ? 'form-input--error' : ''}`}
                    value={formData.branch}
                    onChange={(event) => setFormData({ ...formData, branch: event.target.value })}
                  >
                    {BRANCHES.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                  {errors.branch && <span className="form-error">{errors.branch}</span>}
                </div>
              </div>

              <div className="slide-panel__footer">
                <button type="button" className="btn btn--outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={formLoading}>
                  {formLoading ? <Spinner size="small" /> : editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
