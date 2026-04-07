import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, TrendingUp, CalendarCheck, Award } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api, { getApiErrorMessage } from '../utils/api';
import useAuth from '../hooks/useAuth';
import Spinner from '../components/Spinner';

const BRANCHES = ['CS', 'EC', 'ME', 'CE', 'EE'];
const GRADE_COLORS = {
  'O': '#10B981',
  'A+': '#22C55E',
  'A': '#84CC16',
  'B+': '#EAB308',
  'B': '#F59E0B',
  'C': '#F97316',
  'P': '#FB923C',
  'F': '#EF4444',
};

function Analytics() {
  const { role, branch: userBranch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]);
  const [gradeData, setGradeData] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    avgAttendance: 0,
    avgGPA: 0,
    topPerformers: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      // Simulated data for demo
      const branchAttendance = BRANCHES.map((branch) => ({
        branch,
        attendance: Math.floor(Math.random() * 30) + 70,
      }));
      setAttendanceData(branchAttendance);

      const grades = [
        { name: 'O', value: 12, color: GRADE_COLORS['O'] },
        { name: 'A+', value: 18, color: GRADE_COLORS['A+'] },
        { name: 'A', value: 25, color: GRADE_COLORS['A'] },
        { name: 'B+', value: 20, color: GRADE_COLORS['B+'] },
        { name: 'B', value: 15, color: GRADE_COLORS['B'] },
        { name: 'C', value: 6, color: GRADE_COLORS['C'] },
        { name: 'P', value: 3, color: GRADE_COLORS['P'] },
        { name: 'F', value: 1, color: GRADE_COLORS['F'] },
      ];
      setGradeData(grades);

      setStats({
        totalStudents: 450,
        avgAttendance: 82,
        avgGPA: 7.6,
        topPerformers: 45,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error(getApiErrorMessage(error, 'Failed to load analytics'));
    } finally {
      setLoading(false);
    }
  }

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
        <h2 className="page__title">Analytics Dashboard</h2>
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
            <CalendarCheck size={24} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__value">{stats.avgAttendance}%</span>
            <span className="stat-card__label">Avg Attendance</span>
          </div>
        </div>

        <div className="stat-card stat-card--purple">
          <div className="stat-card__icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__value">{stats.avgGPA}</span>
            <span className="stat-card__label">Average GPA</span>
          </div>
        </div>

        <div className="stat-card stat-card--amber">
          <div className="stat-card__icon">
            <Award size={24} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__value">{stats.topPerformers}</span>
            <span className="stat-card__label">Top Performers</span>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Attendance by Branch</h3>
          </div>
          <div className="card__body">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="branch" stroke="#64748B" />
                  <YAxis stroke="#64748B" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                    }}
                  />
                  <Bar dataKey="attendance" fill="#6366F1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Grade Distribution</h3>
          </div>
          <div className="card__body">
            <div className="chart-container">
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
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {gradeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card__header">
          <h3 className="card__title">Branch-wise Performance</h3>
        </div>
        <div className="card__body">
          <div className="performance-table">
            <table className="table">
              <thead>
                <tr>
                  <th>Branch</th>
                  <th>Students</th>
                  <th>Avg Attendance</th>
                  <th>Avg GPA</th>
                  <th>Pass Rate</th>
                </tr>
              </thead>
              <tbody>
                {BRANCHES.map((branch) => (
                  <tr key={branch}>
                    <td><span className="branch-badge">{branch}</span></td>
                    <td>{Math.floor(Math.random() * 50) + 80}</td>
                    <td>
                      <div className="progress-bar">
                        <div
                          className="progress-bar__fill"
                          style={{ width: `${Math.floor(Math.random() * 20) + 75}%` }}
                        ></div>
                      </div>
                    </td>
                    <td>{(Math.random() * 2 + 7).toFixed(2)}</td>
                    <td>{Math.floor(Math.random() * 10) + 90}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
