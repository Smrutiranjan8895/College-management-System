import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  ShieldCheck,
  ArrowRight,
  Users,
  CalendarCheck,
  FileText,
  Bell,
  BarChart3,
  Workflow,
  UserCog,
  Clock3,
  Sparkles
} from 'lucide-react';
import './Landing.css';

const modules = [
  {
    icon: Users,
    title: 'Student Registry',
    description: 'Maintain student profiles, branch mapping, and academic identity in one structured workspace.'
  },
  {
    icon: CalendarCheck,
    title: 'Attendance Control',
    description: 'Track class-wise presence with quick updates and transparent attendance history for every learner.'
  },
  {
    icon: FileText,
    title: 'Results and GPA',
    description: 'Capture marks, generate results, and present performance insights without spreadsheet overhead.'
  },
  {
    icon: Bell,
    title: 'Smart Notices',
    description: 'Deliver announcements to targeted audiences so students and faculty see only what matters.'
  },
  {
    icon: BarChart3,
    title: 'Actionable Analytics',
    description: 'Visual dashboards expose trends in attendance, performance, and engagement for faster decisions.'
  },
  {
    icon: Workflow,
    title: 'Unified Workflow',
    description: 'From student records to reports, complete daily academic operations through one connected flow.'
  }
];

const highlights = [
  { value: '01', label: 'Single platform for student, attendance, result, and notice management' },
  { value: '02', label: 'Role-specific access for Admin, Branch Admin, Teacher, and Student' },
  { value: '03', label: 'API-driven backend with secure authentication and scalable data design' }
];

const metrics = [
  { value: '24x7', label: 'Web Access' },
  { value: '4', label: 'User Roles' },
  { value: '5+', label: 'Core Modules' },
  { value: 'Real-Time', label: 'Academic Visibility' }
];

const audiences = [
  {
    icon: UserCog,
    role: 'Administrators',
    points: ['Control users and data integrity', 'Oversee institute-wide visibility', 'Monitor operations through analytics']
  },
  {
    icon: GraduationCap,
    role: 'Teachers',
    points: ['Mark attendance quickly', 'Publish marks and results', 'Communicate updates with notices']
  },
  {
    icon: ShieldCheck,
    role: 'Students',
    points: ['View attendance and performance', 'Track notices from one place', 'Stay updated without paperwork']
  }
];

const process = [
  {
    icon: Sparkles,
    title: 'Sign In by Role',
    detail: 'Users get a focused interface based on their permissions and responsibilities.'
  },
  {
    icon: Clock3,
    title: 'Update in Minutes',
    detail: 'Record attendance, publish results, and post notices using clean, fast workflows.'
  },
  {
    icon: BarChart3,
    title: 'Track Progress',
    detail: 'Leadership and faculty can monitor engagement and academic trends with visual insights.'
  }
];

function Landing() {
  return (
    <div className="lp-page">
      <div className="lp-backdrop" aria-hidden="true"></div>

      <nav className="lp-nav lp-shell">
        <div className="lp-brand">
          <div className="lp-brand__icon">
            <GraduationCap size={32} />
          </div>
          <div>
            <p className="lp-brand__title">GCEK Central</p>
            <p className="lp-brand__subtitle">Academic Operations Hub</p>
          </div>
        </div>

        <div className="lp-nav__actions">
          <Link to="/login" className="lp-btn lp-btn--ghost">Sign In</Link>
          <Link to="/register" className="lp-btn lp-btn--primary">Create Account</Link>
        </div>
      </nav>

      <header className="lp-hero lp-shell">
        <div className="lp-hero__content lp-reveal lp-reveal--1">
          <p className="lp-kicker">Government College of Engineering Kalahandi</p>
          <h1>
            One digital campus desk
            <span> for attendance, results, notices, and student records.</span>
          </h1>
          <p className="lp-hero__text">
            GCEK Central is a role-based web application that simplifies routine academic operations,
            reduces manual follow-ups, and gives every stakeholder a clear view of student progress.
          </p>

          <div className="lp-hero__actions">
            <Link to="/register" className="lp-btn lp-btn--primary lp-btn--large">
              Explore the Platform
              <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="lp-btn lp-btn--outline lp-btn--large">
              Continue to Login
            </Link>
          </div>

          <div className="lp-highlight-list">
            {highlights.map((item, index) => (
              <div key={item.value} className={`lp-highlight lp-reveal lp-reveal--${index + 2}`}>
                <span className="lp-highlight__num">{item.value}</span>
                <p>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lp-panel lp-reveal lp-reveal--4">
          <p className="lp-panel__title">What You Can Manage</p>
          <div className="lp-module-grid">
            {modules.slice(0, 4).map((item) => (
              <div className="lp-module" key={item.title}>
                <item.icon size={20} />
                <span>{item.title}</span>
              </div>
            ))}
          </div>

          <div className="lp-metrics-grid">
            {metrics.map((metric) => (
              <div className="lp-metric" key={metric.label}>
                <p className="lp-metric__value">{metric.value}</p>
                <p className="lp-metric__label">{metric.label}</p>
              </div>
            ))}
          </div>

          <div className="lp-panel__foot">
            <ShieldCheck size={18} />
            <span>Secure access with authenticated, role-based permissions.</span>
          </div>
        </div>
      </header>

      <section className="lp-section lp-shell">
        <div className="lp-section__heading">
          <p className="lp-kicker">Core Modules</p>
          <h2>Everything your academic team uses daily, unified in one webapp.</h2>
        </div>

        <div className="lp-card-grid">
          {modules.map((moduleItem, index) => (
            <article className={`lp-card lp-reveal lp-reveal--${(index % 4) + 1}`} key={moduleItem.title}>
              <div className="lp-card__icon">
                <moduleItem.icon size={20} />
              </div>
              <h3>{moduleItem.title}</h3>
              <p>{moduleItem.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-section lp-shell lp-section--audience">
        <div className="lp-section__heading">
          <p className="lp-kicker">Who It Helps</p>
          <h2>Built for administrators, teachers, and students with focused interfaces.</h2>
        </div>

        <div className="lp-audience-grid">
          {audiences.map((audienceItem, index) => (
            <article className={`lp-audience lp-reveal lp-reveal--${index + 1}`} key={audienceItem.role}>
              <div className="lp-audience__head">
                <audienceItem.icon size={20} />
                <h3>{audienceItem.role}</h3>
              </div>

              <ul>
                {audienceItem.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-section lp-shell">
        <div className="lp-section__heading">
          <p className="lp-kicker">How It Works</p>
          <h2>A clear three-step flow for daily campus operations.</h2>
        </div>

        <div className="lp-process-grid">
          {process.map((item, index) => (
            <article className={`lp-process lp-reveal lp-reveal--${index + 1}`} key={item.title}>
              <div className="lp-process__index">0{index + 1}</div>
              <item.icon size={22} />
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-cta lp-shell lp-reveal lp-reveal--3">
        <div>
          <p className="lp-kicker">Ready to Start?</p>
          <h2>Make GCEK Central your single source of academic truth.</h2>
          <p>
            Create your account, sign in by role, and start managing attendance, results,
            notices, and student data from one secure workspace.
          </p>
        </div>

        <div className="lp-cta__actions">
          <Link to="/register" className="lp-btn lp-btn--primary lp-btn--large">
            Create Account
            <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="lp-btn lp-btn--outline lp-btn--large">
            Sign In
          </Link>
        </div>
      </section>

      <footer className="lp-footer lp-shell">
        <p>GCEK Central</p>
        <p>Government College of Engineering Kalahandi</p>
      </footer>
    </div>
  );
}

export default Landing;
