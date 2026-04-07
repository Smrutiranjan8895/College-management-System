import { useState, useEffect } from 'react';
import { Plus, Bell, AlertTriangle, Info, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api, { getApiErrorMessage } from '../utils/api';
import useAuth from '../hooks/useAuth';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { readList } from '../utils/apiData';

const PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'];
const BRANCHES = ['ALL', 'CS', 'EC', 'ME', 'CE', 'EE'];

function Notices() {
  const { role, branch: userBranch } = useAuth();
  const defaultTargetBranch = role === 'branch_admin' || role === 'teacher' ? userBranch : 'ALL';
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'MEDIUM',
    targetBranch: defaultTargetBranch || 'ALL',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      targetBranch: defaultTargetBranch || 'ALL',
    }));
  }, [defaultTargetBranch]);

  useEffect(() => {
    fetchNotices();

    const pollTimer = setInterval(() => {
      fetchNotices({ silent: true });
    }, 10000);

    return () => clearInterval(pollTimer);
  }, [userBranch, role]);

  async function fetchNotices(options = {}) {
    const { silent = false } = options;
    if (!silent) {
      setLoading(true);
    }

    try {
      const noticesPath = role === 'admin'
        ? '/notices?limit=100'
        : `/notices?branch=${userBranch || 'ALL'}&limit=100`;

      const response = await api.get(noticesPath);
      setNotices(readList(response.data, ['notices']));
    } catch (error) {
      console.error('Error fetching notices:', error);
      if (!silent) {
        toast.error(getApiErrorMessage(error, 'Failed to load notices'));
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  function validate() {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.content.trim()) newErrors.content = 'Content is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function openPostModal() {
    setFormData({
      title: '',
      content: '',
      priority: 'MEDIUM',
      targetBranch: defaultTargetBranch || 'ALL',
    });
    setErrors({});
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setFormLoading(true);
    try {
      await api.post('/notices', {
        title: formData.title,
        content: formData.content,
        description: formData.content,
        priority: formData.priority,
        branch: role === 'teacher' ? userBranch : formData.targetBranch,
      });
      toast.success('Notice posted successfully');
      setIsModalOpen(false);
      setFormData({
        title: '',
        content: '',
        priority: 'MEDIUM',
        targetBranch: defaultTargetBranch || 'ALL',
      });
      fetchNotices({ silent: true });
    } catch (error) {
      console.error('Error posting notice:', error);
      toast.error(getApiErrorMessage(error, 'Failed to post notice'));
    } finally {
      setFormLoading(false);
    }
  }

  function getPriorityIcon(priority) {
    switch (priority) {
      case 'HIGH':
        return <AlertTriangle size={16} className="text-danger" />;
      case 'MEDIUM':
        return <Bell size={16} className="text-warning" />;
      default:
        return <Info size={16} className="text-muted" />;
    }
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const canPost = role === 'admin' || role === 'branch_admin' || role === 'teacher';

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
        <h2 className="page__title">Notice Board</h2>
        {canPost && (
          <button className="btn btn--primary" onClick={openPostModal}>
            <Plus size={20} />
            <span>Post Notice</span>
          </button>
        )}
      </div>

      {notices.length === 0 ? (
        <EmptyState title="No notices" message="There are no notices at the moment" />
      ) : (
        <div className="notices-grid">
          {notices.map((notice, index) => (
            <div key={index} className={`notice-card notice-card--${notice.priority?.toLowerCase() || 'low'}`}>
              <div className="notice-card__header">
                <div className="notice-card__priority">
                  {getPriorityIcon(notice.priority)}
                  <span className={`priority-badge priority-badge--${notice.priority?.toLowerCase() || 'low'}`}>
                    {notice.priority || 'LOW'}
                  </span>
                </div>
                {notice.branch && notice.branch !== 'ALL' && (
                  <span className="branch-badge">{notice.branch}</span>
                )}
              </div>
              <h3 className="notice-card__title">{notice.title}</h3>
              <p className="notice-card__content">{notice.content}</p>
              <div className="notice-card__footer">
                <span className="notice-card__date">
                  {notice.createdAt ? formatDate(notice.createdAt) : 'Recently'}
                </span>
                {notice.postedBy && (
                  <span className="notice-card__author">by {notice.postedBy}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Notice Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Post New Notice</h2>
              <button className="btn btn--icon btn--ghost" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal__content">
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className={`form-input ${errors.title ? 'form-input--error' : ''}`}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter notice title"
                  />
                  {errors.title && <span className="form-error">{errors.title}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Content</label>
                  <textarea
                    className={`form-textarea ${errors.content ? 'form-input--error' : ''}`}
                    rows={5}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Enter notice content..."
                  />
                  {errors.content && <span className="form-error">{errors.content}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-select"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Target Branch</label>
                    <select
                      className="form-select"
                      value={formData.targetBranch}
                      onChange={(e) => setFormData({ ...formData, targetBranch: e.target.value })}
                      disabled={role === 'branch_admin' || role === 'teacher'}
                    >
                      {BRANCHES.map((b) => (
                        <option key={b} value={b}>{b === 'ALL' ? 'All Branches' : b}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal__footer">
                <button type="button" className="btn btn--outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={formLoading}>
                  {formLoading ? <Spinner size="small" /> : 'Post Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notices;
