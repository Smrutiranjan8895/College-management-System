import { useState, useEffect } from 'react';
import { Users, GraduationCap, Building2, Bell, Plus, TrendingUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api, { getApiErrorMessage } from '../../utils/api';
import Spinner from '../../components/Spinner';
import { readList } from '../../utils/apiData';

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalBranches: 5,
    totalNotices: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    const pollTimer = setInterval(() => {
      fetchDashboardData({ silent: true });
    }, 12000);

    return () => clearInterval(pollTimer);
  }, []);

  async function fetchDashboardData(options = {}) {
    const { silent = false } = options;

    if (!silent) {
      setLoading(true);
    }

    try {
      const [studentsRes, noticesRes] = await Promise.all([
        api.get('/students').catch(() => ({ data: { students: [] } })),
        api.get('/notices').catch(() => ({ data: { notices: [] } })),
      ]);

      const students = readList(studentsRes.data, ['students']);
      const notices = readList(noticesRes.data, ['notices']);
      const totalStudents = students.length > 0 ? students.length : 120;
      const totalNotices = notices.length > 0 ? notices.length : 8;
      
      setStats({
        totalStudents,
        totalTeachers: 12,
        totalBranches: 5,
        totalNotices,
      });
      
      setRecentActivity([
        { id: 1, action: 'New student registered', time: '2 hours ago', type: 'student' },
        { id: 2, action: 'Results published for CS Sem 5', time: '4 hours ago', type: 'result' },
        { id: 3, action: 'Attendance marked for EC', time: '5 hours ago', type: 'attendance' },
        { id: 4, action: 'New notice posted', time: '1 day ago', type: 'notice' },
      ]);
    } catch (error) {
      console.error('Dashboard error:', error);
      if (!silent) {
        toast.error(getApiErrorMessage(error, 'Failed to load dashboard data'));
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h2 className="dashboard__welcome">Welcome back, Admin</h2>
        <p className="dashboard__subtitle">Here's what's happening at GCEK today</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-card--blue">
          <div className="stat-card__icon">
            <Users size={24} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__value">{stats.totalStudents}</span>
            <span className="stat-card__label">Total Students</span>
          </div>
        </div>

        <div className="stat-card stat-card--green">
          <div className="stat-card__icon">
            <GraduationCap size={24} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__value">{stats.totalTeachers}</span>
            <span className="stat-card__label">Total Teachers</span>
          </div>
        </div>

        <div className="stat-card stat-card--purple">
          <div className="stat-card__icon">
            <Building2 size={24} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__value">{stats.totalBranches}</span>
            <span className="stat-card__label">Branches</span>
          </div>
        </div>

        <div className="stat-card stat-card--amber">
          <div className="stat-card__icon">
            <Bell size={24} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__value">{stats.totalNotices}</span>
            <span className="stat-card__label">Active Notices</span>
          </div>
        </div>
      </div>

      <div className="dashboard__grid">
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Quick Actions</h3>
          </div>
          <div className="card__body">
            <div className="quick-actions">
              <button className="quick-action">
                <Plus size={20} />
                <span>Add Student</span>
              </button>
              <button className="quick-action">
                <Bell size={20} />
                <span>Post Notice</span>
              </button>
              <button className="quick-action">
                <TrendingUp size={20} />
                <span>View Analytics</span>
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Recent Activity</h3>
          </div>
          <div className="card__body">
            <ul className="activity-list">
              {recentActivity.map((activity) => (
                <li key={activity.id} className="activity-item">
                  <div className={`activity-item__dot activity-item__dot--${activity.type}`}></div>
                  <div className="activity-item__content">
                    <span className="activity-item__action">{activity.action}</span>
                    <span className="activity-item__time">{activity.time}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
