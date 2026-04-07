# GCEK Central Frontend Implementation - Part 3 (CSS)

## File: src/App.css

```css
/* ============================================
   GCEK Central - Main Stylesheet
   Design System: Deep Navy + White + Indigo
   ============================================ */

/* ============================================
   CSS Variables
   ============================================ */
:root {
  /* Primary Colors */
  --color-navy: #0F172A;
  --color-navy-light: #1E293B;
  --color-navy-lighter: #334155;
  --color-indigo: #6366F1;
  --color-indigo-light: #818CF8;
  --color-indigo-dark: #4F46E5;

  /* Semantic Colors */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-danger: #EF4444;
  --color-info: #3B82F6;

  /* Neutral Colors */
  --color-white: #FFFFFF;
  --color-gray-50: #F8FAFC;
  --color-gray-100: #F1F5F9;
  --color-gray-200: #E2E8F0;
  --color-gray-300: #CBD5E1;
  --color-gray-400: #94A3B8;
  --color-gray-500: #64748B;
  --color-gray-600: #475569;
  --color-gray-700: #334155;
  --color-gray-800: #1E293B;
  --color-gray-900: #0F172A;

  /* Typography */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;

  /* Spacing */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-5: 1.25rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  --spacing-10: 2.5rem;
  --spacing-12: 3rem;

  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;
  --transition-slow: 300ms ease;

  /* Layout */
  --sidebar-width: 260px;
  --navbar-height: 64px;
}

/* ============================================
   Reset & Base Styles
   ============================================ */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  line-height: 1.5;
  color: var(--color-gray-900);
  background-color: var(--color-gray-50);
}

a {
  color: inherit;
  text-decoration: none;
}

button {
  font-family: inherit;
  cursor: pointer;
  border: none;
  background: none;
}

input, select, textarea {
  font-family: inherit;
  font-size: inherit;
}

/* ============================================
   App Layout
   ============================================ */
.app-layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  margin-left: var(--sidebar-width);
  background-color: var(--color-gray-50);
  min-height: 100vh;
}

.page-content {
  padding: var(--spacing-6);
  max-width: 1400px;
  margin: 0 auto;
}

/* ============================================
   Sidebar
   ============================================ */
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: var(--sidebar-width);
  background-color: var(--color-navy);
  display: flex;
  flex-direction: column;
  z-index: 100;
}

.sidebar-header {
  padding: var(--spacing-6);
  border-bottom: 1px solid var(--color-navy-lighter);
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  color: var(--color-white);
}

.sidebar-logo svg {
  color: var(--color-indigo);
}

.sidebar-logo-text {
  display: flex;
  flex-direction: column;
}

.sidebar-title {
  font-size: var(--font-size-xl);
  font-weight: 700;
  letter-spacing: -0.5px;
}

.sidebar-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-gray-400);
  font-weight: 400;
}

.sidebar-nav {
  flex: 1;
  padding: var(--spacing-4);
  overflow-y: auto;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-lg);
  color: var(--color-gray-400);
  font-size: var(--font-size-sm);
  font-weight: 500;
  transition: all var(--transition-fast);
  margin-bottom: var(--spacing-1);
}

.sidebar-link:hover {
  background-color: var(--color-navy-light);
  color: var(--color-white);
}

.sidebar-link-active {
  background-color: var(--color-indigo);
  color: var(--color-white);
}

.sidebar-footer {
  padding: var(--spacing-4);
  border-top: 1px solid var(--color-navy-lighter);
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  margin-bottom: var(--spacing-3);
}

.sidebar-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background-color: var(--color-indigo);
  color: var(--color-white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: var(--font-size-sm);
}

.sidebar-user-info {
  display: flex;
  flex-direction: column;
}

.sidebar-user-name {
  color: var(--color-white);
  font-weight: 500;
  font-size: var(--font-size-sm);
}

.sidebar-user-role {
  color: var(--color-gray-400);
  font-size: var(--font-size-xs);
  text-transform: capitalize;
}

.sidebar-logout {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-lg);
  color: var(--color-gray-400);
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
}

.sidebar-logout:hover {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
}

/* ============================================
   Navbar
   ============================================ */
.navbar {
  height: var(--navbar-height);
  background-color: var(--color-white);
  border-bottom: 1px solid var(--color-gray-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-6);
  position: sticky;
  top: 0;
  z-index: 50;
}

.navbar-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-gray-900);
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
}

.navbar-search {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-4);
  background-color: var(--color-gray-100);
  border-radius: var(--radius-lg);
  color: var(--color-gray-500);
}

.navbar-search input {
  border: none;
  background: none;
  outline: none;
  width: 200px;
  color: var(--color-gray-700);
}

.navbar-search input::placeholder {
  color: var(--color-gray-400);
}

.navbar-notification {
  position: relative;
  padding: var(--spacing-2);
  color: var(--color-gray-500);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
}

.navbar-notification:hover {
  background-color: var(--color-gray-100);
  color: var(--color-gray-700);
}

.notification-badge {
  position: absolute;
  top: 0;
  right: 0;
  width: 18px;
  height: 18px;
  background-color: var(--color-danger);
  color: var(--color-white);
  border-radius: var(--radius-full);
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.navbar-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background-color: var(--color-indigo);
  color: var(--color-white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: var(--font-size-sm);
}

/* ============================================
   Buttons
   ============================================ */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-5);
  font-size: var(--font-size-sm);
  font-weight: 500;
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--color-indigo);
  color: var(--color-white);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-indigo-dark);
}

.btn-secondary {
  background-color: var(--color-gray-100);
  color: var(--color-gray-700);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-gray-200);
}

.btn-danger {
  background-color: var(--color-danger);
  color: var(--color-white);
}

.btn-danger:hover:not(:disabled) {
  background-color: #DC2626;
}

.btn-full {
  width: 100%;
}

.btn-sm {
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-xs);
}

.btn-lg {
  padding: var(--spacing-4) var(--spacing-8);
  font-size: var(--font-size-base);
}

.btn-icon {
  width: 36px;
  height: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  color: var(--color-gray-500);
  transition: all var(--transition-fast);
}

.btn-icon:hover {
  background-color: var(--color-gray-100);
  color: var(--color-gray-700);
}

.btn-icon.danger:hover {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
}

.btn-icon.success:hover {
  background-color: rgba(16, 185, 129, 0.1);
  color: var(--color-success);
}

/* ============================================
   Forms
   ============================================ */
.form-group {
  margin-bottom: var(--spacing-5);
}

.form-group label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-gray-700);
  margin-bottom: var(--spacing-2);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-4);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper svg {
  position: absolute;
  left: var(--spacing-4);
  color: var(--color-gray-400);
  pointer-events: none;
}

.input-wrapper input,
.input-wrapper select {
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  padding-left: calc(var(--spacing-4) + 26px);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  color: var(--color-gray-900);
  background-color: var(--color-white);
  transition: all var(--transition-fast);
}

.input-wrapper input:focus,
.input-wrapper select:focus {
  outline: none;
  border-color: var(--color-indigo);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-group input:not(.input-wrapper input),
.form-group select:not(.input-wrapper select),
.form-group textarea {
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  color: var(--color-gray-900);
  background-color: var(--color-white);
  transition: all var(--transition-fast);
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-indigo);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.password-toggle {
  position: absolute;
  right: var(--spacing-3);
  padding: var(--spacing-1);
  color: var(--color-gray-400);
}

.password-toggle:hover {
  color: var(--color-gray-600);
}

/* ============================================
   Auth Pages
   ============================================ */
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-light) 100%);
  padding: var(--spacing-6);
}

.auth-container {
  width: 100%;
  max-width: 440px;
}

.auth-card {
  background-color: var(--color-white);
  border-radius: var(--radius-xl);
  padding: var(--spacing-8);
  box-shadow: var(--shadow-xl);
}

.auth-card-wide {
  max-width: 560px;
}

.auth-header {
  text-align: center;
  margin-bottom: var(--spacing-8);
}

.auth-logo {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, var(--color-indigo) 0%, var(--color-indigo-light) 100%);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-white);
  margin: 0 auto var(--spacing-6);
}

.auth-header h1 {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-gray-900);
  margin-bottom: var(--spacing-2);
}

.auth-header p {
  color: var(--color-gray-500);
  font-size: var(--font-size-sm);
}

.auth-form {
  margin-bottom: var(--spacing-6);
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--spacing-4);
}

.forgot-link {
  font-size: var(--font-size-sm);
  color: var(--color-indigo);
  font-weight: 500;
}

.forgot-link:hover {
  color: var(--color-indigo-dark);
}

.auth-divider {
  display: flex;
  align-items: center;
  margin: var(--spacing-6) 0;
}

.auth-divider span {
  flex: 1;
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  color: var(--color-gray-500);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-6);
  transition: color var(--transition-fast);
}

.back-link:hover {
  color: var(--color-gray-700);
}

.email-display {
  font-weight: 600;
  color: var(--color-gray-900);
}

/* OTP Input */
.otp-container {
  display: flex;
  justify-content: center;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-6);
}

.otp-input {
  width: 48px;
  height: 56px;
  text-align: center;
  font-size: var(--font-size-xl);
  font-weight: 600;
  border: 2px solid var(--color-gray-300);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
}

.otp-input:focus {
  outline: none;
  border-color: var(--color-indigo);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.resend-section {
  text-align: center;
}

.resend-section p {
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
  margin-bottom: var(--spacing-2);
}

.resend-btn {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-indigo);
}

.resend-btn:disabled {
  color: var(--color-gray-400);
}

/* ============================================
   Dashboard
   ============================================ */
.dashboard {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.dashboard-header {
  margin-bottom: var(--spacing-8);
}

.dashboard-header h2 {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-gray-900);
  margin-bottom: var(--spacing-2);
}

.dashboard-header p {
  color: var(--color-gray-500);
}

.header-with-badge {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
}

/* Stat Cards */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-6);
  margin-bottom: var(--spacing-8);
}

.stat-card {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.stat-card-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-card-content {
  display: flex;
  flex-direction: column;
}

.stat-card-value {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-gray-900);
}

.stat-card-label {
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
}

/* Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-6);
}

.dashboard-section {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-sm);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-5);
}

.section-header h3 {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-gray-900);
}

.view-all {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-indigo);
}

.view-all:hover {
  color: var(--color-indigo-dark);
}

/* Quick Actions */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-4);
}

.quick-action-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  background-color: var(--color-gray-50);
  border-radius: var(--radius-lg);
  color: var(--color-gray-700);
  transition: all var(--transition-fast);
}

.quick-action-card:hover {
  background-color: var(--color-indigo);
  color: var(--color-white);
}

.quick-action-card svg:first-child {
  color: var(--color-indigo);
}

.quick-action-card:hover svg:first-child {
  color: var(--color-white);
}

.quick-action-card svg:last-child {
  margin-left: auto;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.quick-action-card:hover svg:last-child {
  opacity: 1;
}

.quick-actions-vertical {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.quick-actions-vertical .quick-action-card {
  padding: var(--spacing-4) var(--spacing-5);
}

.quick-actions-vertical .quick-action-card > div {
  display: flex;
  flex-direction: column;
}

.action-title {
  font-weight: 500;
}

.action-desc {
  font-size: var(--font-size-xs);
  opacity: 0.7;
}

/* Activity List */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.activity-item {
  display: flex;
  gap: var(--spacing-4);
}

.activity-dot {
  width: 10px;
  height: 10px;
  background-color: var(--color-indigo);
  border-radius: var(--radius-full);
  margin-top: 6px;
  flex-shrink: 0;
}

.activity-content p {
  font-size: var(--font-size-sm);
  color: var(--color-gray-700);
  margin-bottom: var(--spacing-1);
}

.activity-content span {
  font-size: var(--font-size-xs);
  color: var(--color-gray-400);
}

/* Branch Badge */
.branch-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-1) var(--spacing-3);
  background-color: var(--color-indigo);
  color: var(--color-white);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 500;
}

.branch-badge.large {
  padding: var(--spacing-2) var(--spacing-4);
  font-size: var(--font-size-sm);
}

/* ============================================
   Student Dashboard
   ============================================ */
.student-grid {
  grid-template-columns: 1fr 1.5fr 1fr;
}

.attendance-card,
.results-card,
.notices-card {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-sm);
}

.attendance-header,
.results-header,
.notices-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-5);
}

.attendance-header h3,
.results-header h3,
.notices-header h3 {
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.attendance-circle {
  position: relative;
  width: 160px;
  height: 160px;
  margin: 0 auto var(--spacing-5);
}

.attendance-circle svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.attendance-percentage {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.percentage-value {
  display: block;
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-gray-900);
}

.percentage-label {
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
}

.attendance-summary {
  display: flex;
  justify-content: space-around;
}

.summary-item {
  text-align: center;
}

.summary-item .summary-value {
  display: block;
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-gray-900);
}

.summary-item .summary-label {
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
}

.cgpa-badge {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3);
  background-color: var(--color-success);
  color: var(--color-white);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-5);
}

.result-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-3);
  background-color: var(--color-gray-50);
  border-radius: var(--radius-md);
}

.result-subject {
  flex: 1;
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.result-marks {
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
  margin-right: var(--spacing-4);
}

.result-grade {
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.notices-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.notice-item {
  display: flex;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  background-color: var(--color-gray-50);
  border-radius: var(--radius-md);
}

.notice-priority {
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-sm);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  flex-shrink: 0;
}

.priority-high {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
}

.priority-medium {
  background-color: rgba(245, 158, 11, 0.1);
  color: var(--color-warning);
}

.priority-low {
  background-color: var(--color-gray-200);
  color: var(--color-gray-600);
}

.notice-content h4 {
  font-size: var(--font-size-sm);
  font-weight: 500;
  margin-bottom: var(--spacing-1);
}

.notice-content span {
  font-size: var(--font-size-xs);
  color: var(--color-gray-400);
}

/* ============================================
   Page Container
   ============================================ */
.page-container {
  animation: fadeIn 0.3s ease;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-6);
}

.header-left h2 {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-gray-900);
}

.header-left p {
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
}

.header-actions {
  display: flex;
  gap: var(--spacing-3);
}

/* Filters */
.filters-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-6);
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  background-color: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  flex: 1;
  max-width: 300px;
}

.search-box svg {
  color: var(--color-gray-400);
}

.search-box input {
  border: none;
  outline: none;
  width: 100%;
  font-size: var(--font-size-sm);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.filter-group label {
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
}

.filter-group select {
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background-color: var(--color-white);
}

.filter-tabs {
  display: flex;
  gap: var(--spacing-2);
}

.filter-tab {
  padding: var(--spacing-2) var(--spacing-4);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-gray-500);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  transition: all var(--transition-fast);
}

.filter-tab:hover {
  background-color: var(--color-gray-100);
}

.filter-tab.active {
  background-color: var(--color-white);
  border-color: var(--color-indigo);
  color: var(--color-indigo);
}

/* ============================================
   Data Table
   ============================================ */
.data-table-container {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  padding: var(--spacing-4);
  text-align: left;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-gray-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background-color: var(--color-gray-50);
  border-bottom: 1px solid var(--color-gray-200);
}

.data-table td {
  padding: var(--spacing-4);
  font-size: var(--font-size-sm);
  color: var(--color-gray-700);
  border-bottom: 1px solid var(--color-gray-100);
}

.data-table tr:hover td {
  background-color: var(--color-gray-50);
}

.data-table .font-mono {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: var(--font-size-xs);
}

.user-cell {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background-color: var(--color-indigo);
  color: var(--color-white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: var(--font-size-sm);
}

.user-avatar.small {
  width: 32px;
  height: 32px;
  font-size: var(--font-size-xs);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-2);
}

.grade-badge {
  display: inline-flex;
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.inline-edit {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.inline-edit input {
  width: 60px;
  padding: var(--spacing-2);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  text-align: center;
  font-size: var(--font-size-sm);
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-4);
  padding: var(--spacing-4);
  background-color: var(--color-white);
  border-top: 1px solid var(--color-gray-100);
}

.pagination span {
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
}

/* ============================================
   Modal
   ============================================ */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  animation: fadeIn 0.2s ease;
}

.modal {
  background-color: var(--color-white);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-small { width: 400px; }
.modal-medium { width: 520px; }
.modal-large { width: 640px; }

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-6);
  border-bottom: 1px solid var(--color-gray-200);
}

.modal-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.modal-close {
  color: var(--color-gray-400);
  padding: var(--spacing-1);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.modal-close:hover {
  background-color: var(--color-gray-100);
  color: var(--color-gray-600);
}

.modal-content {
  padding: var(--spacing-6);
}

.modal-form .form-group:last-of-type {
  margin-bottom: 0;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  margin-top: var(--spacing-6);
  padding-top: var(--spacing-6);
  border-top: 1px solid var(--color-gray-200);
}

.confirm-dialog {
  text-align: center;
}

.confirm-dialog p {
  margin-bottom: var(--spacing-4);
}

.confirm-dialog .warning-text {
  color: var(--color-danger);
  font-size: var(--font-size-sm);
}

/* ============================================
   Attendance Page
   ============================================ */
.attendance-controls {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-4);
  padding: var(--spacing-5);
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-6);
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.control-group label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-gray-600);
}

.control-group input,
.control-group select {
  padding: var(--spacing-3) var(--spacing-4);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}

.quick-actions {
  display: flex;
  gap: var(--spacing-2);
  margin-left: auto;
}

.attendance-stats {
  display: flex;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-6);
}

.stat-pill {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.stat-pill.present {
  background-color: rgba(16, 185, 129, 0.1);
  color: var(--color-success);
}

.stat-pill.absent {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
}

.stat-pill.total {
  background-color: var(--color-gray-100);
  color: var(--color-gray-600);
}

.attendance-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.attendance-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-4);
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 2px solid transparent;
}

.attendance-item:hover {
  box-shadow: var(--shadow-md);
}

.attendance-item.present {
  border-color: var(--color-success);
  background-color: rgba(16, 185, 129, 0.05);
}

.attendance-item.absent {
  border-color: var(--color-danger);
  background-color: rgba(239, 68, 68, 0.05);
}

.attendance-item .student-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.attendance-item .student-info > div {
  display: flex;
  flex-direction: column;
}

.attendance-item .student-name {
  font-weight: 500;
}

.attendance-item .student-id {
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
}

.attendance-toggle {
  display: flex;
  gap: var(--spacing-2);
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
  border: 1px solid var(--color-gray-200);
  transition: all var(--transition-fast);
}

.toggle-btn.present.active {
  background-color: var(--color-success);
  color: var(--color-white);
  border-color: var(--color-success);
}

.toggle-btn.absent.active {
  background-color: var(--color-danger);
  color: var(--color-white);
  border-color: var(--color-danger);
}

.page-footer {
  display: flex;
  justify-content: center;
  padding: var(--spacing-6);
  margin-top: var(--spacing-6);
}

/* Student Attendance Calendar */
.attendance-summary-cards {
  display: flex;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

.attendance-summary-cards .summary-card {
  flex: 1;
  padding: var(--spacing-5);
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  text-align: center;
}

.attendance-summary-cards .summary-card.present {
  border-left: 4px solid var(--color-success);
}

.attendance-summary-cards .summary-card.absent {
  border-left: 4px solid var(--color-danger);
}

.attendance-summary-cards .summary-label {
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
}

.attendance-summary-cards .summary-value {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-gray-900);
}

.attendance-calendar-section {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-6);
}

.calendar-header h3 {
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--spacing-2);
}

.calendar-header-cell {
  text-align: center;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-gray-500);
  padding: var(--spacing-2);
}

.calendar-cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  cursor: default;
}

.calendar-cell.empty {
  background: none;
}

.calendar-cell.status-full {
  background-color: var(--color-success);
  color: var(--color-white);
}

.calendar-cell.status-partial {
  background-color: var(--color-warning);
  color: var(--color-white);
}

.calendar-cell.status-absent {
  background-color: var(--color-danger);
  color: var(--color-white);
}

.calendar-cell.status-none {
  background-color: var(--color-gray-100);
  color: var(--color-gray-400);
}

.calendar-legend {
  display: flex;
  justify-content: center;
  gap: var(--spacing-6);
  margin-top: var(--spacing-6);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-sm);
}

.legend-dot.status-full { background-color: var(--color-success); }
.legend-dot.status-partial { background-color: var(--color-warning); }
.legend-dot.status-absent { background-color: var(--color-danger); }
.legend-dot.status-none { background-color: var(--color-gray-200); }

/* ============================================
   Results Page
   ============================================ */
.results-controls {
  display: flex;
  gap: var(--spacing-4);
  padding: var(--spacing-5);
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-6);
}

.semester-tabs {
  display: flex;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-6);
  overflow-x: auto;
  padding-bottom: var(--spacing-2);
}

.semester-tab {
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-gray-500);
  background-color: var(--color-white);
  border: 1px solid var(--color-gray-200);
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.semester-tab:hover {
  border-color: var(--color-gray-300);
}

.semester-tab.active {
  background-color: var(--color-indigo);
  border-color: var(--color-indigo);
  color: var(--color-white);
}

.cgpa-display {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-5);
  background: linear-gradient(135deg, var(--color-success) 0%, #059669 100%);
  color: var(--color-white);
  border-radius: var(--radius-full);
  font-weight: 600;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-4);
}

.result-card {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-5);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.result-card:hover {
  box-shadow: var(--shadow-md);
}

.result-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-4);
}

.result-card-header h4 {
  font-size: var(--font-size-base);
  font-weight: 600;
}

.result-card-body .marks-display {
  text-align: center;
  margin-bottom: var(--spacing-4);
}

.marks-obtained {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--color-gray-900);
}

.marks-total {
  font-size: var(--font-size-lg);
  color: var(--color-gray-400);
}

.result-details {
  background-color: var(--color-gray-50);
  border-radius: var(--radius-md);
  padding: var(--spacing-3);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-sm);
  padding: var(--spacing-2) 0;
}

.detail-row:not(:last-child) {
  border-bottom: 1px solid var(--color-gray-200);
}

.detail-row span:first-child {
  color: var(--color-gray-500);
}

.detail-row span:last-child {
  font-weight: 600;
  color: var(--color-gray-900);
}

/* ============================================
   Notices Page
   ============================================ */
.notices-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: var(--spacing-5);
}

.notice-card {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-5);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.notice-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.notice-card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
}

.priority-badge {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.branch-tag {
  padding: var(--spacing-1) var(--spacing-2);
  background-color: var(--color-gray-100);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  color: var(--color-gray-600);
}

.notice-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-gray-900);
  margin-bottom: var(--spacing-3);
}

.notice-content {
  font-size: var(--font-size-sm);
  color: var(--color-gray-600);
  line-height: 1.6;
  margin-bottom: var(--spacing-4);
}

.notice-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--spacing-4);
  border-top: 1px solid var(--color-gray-100);
}

.notice-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-xs);
  color: var(--color-gray-400);
}

.notice-author {
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
}

/* ============================================
   Analytics Page
   ============================================ */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-6);
  margin-bottom: var(--spacing-6);
}

.chart-card {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-sm);
}

.chart-header {
  margin-bottom: var(--spacing-5);
}

.chart-header h3 {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-gray-900);
  margin-bottom: var(--spacing-1);
}

.chart-header p {
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
}

.chart-body {
  height: 300px;
}

.analytics-summary {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-sm);
}

.analytics-summary h4 {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-5);
}

.insights-list {
  list-style: none;
}

.insights-list li {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) 0;
  font-size: var(--font-size-sm);
  color: var(--color-gray-700);
  border-bottom: 1px solid var(--color-gray-100);
}

.insights-list li:last-child {
  border-bottom: none;
}

.insight-icon {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: 700;
}

.insight-icon.positive {
  background-color: rgba(16, 185, 129, 0.1);
  color: var(--color-success);
}

.insight-icon.negative {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
}

.insight-icon.neutral {
  background-color: var(--color-gray-100);
  color: var(--color-gray-500);
}

/* ============================================
   Empty State
   ============================================ */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-12);
  color: var(--color-gray-400);
}

.empty-state svg {
  margin-bottom: var(--spacing-4);
}

.empty-state p {
  font-size: var(--font-size-lg);
}

/* ============================================
   Spinner
   ============================================ */
.spinner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.spinner-circle {
  border-radius: 50%;
  border-style: solid;
  border-color: currentColor;
  border-top-color: transparent;
  animation: spin 0.8s linear infinite;
}

.spinner-small .spinner-circle {
  width: 16px;
  height: 16px;
  border-width: 2px;
}

.spinner-medium .spinner-circle {
  width: 24px;
  height: 24px;
  border-width: 3px;
}

.spinner-large .spinner-circle {
  width: 40px;
  height: 40px;
  border-width: 4px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.page-loading,
.loading-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: var(--color-indigo);
}

.loading-screen p {
  margin-top: var(--spacing-4);
  color: var(--color-gray-500);
}

/* ============================================
   Unauthorized Page
   ============================================ */
.unauthorized-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
  padding: var(--spacing-6);
}

.unauthorized-page h1 {
  font-size: 120px;
  font-weight: 700;
  color: var(--color-gray-200);
  line-height: 1;
}

.unauthorized-page h2 {
  font-size: var(--font-size-2xl);
  font-weight: 600;
  margin-bottom: var(--spacing-4);
}

.unauthorized-page p {
  color: var(--color-gray-500);
  margin-bottom: var(--spacing-6);
}

/* ============================================
   Teacher Dashboard
   ============================================ */
.schedule-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.schedule-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  padding: var(--spacing-4);
  background-color: var(--color-gray-50);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
}

.schedule-item.completed {
  opacity: 0.6;
}

.schedule-time {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
  min-width: 140px;
}

.schedule-details {
  flex: 1;
}

.schedule-details h4 {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-gray-900);
}

.schedule-details span {
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
}

.schedule-status .badge {
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 500;
}

.badge-success {
  background-color: rgba(16, 185, 129, 0.1);
  color: var(--color-success);
}

/* ============================================
   Branch Admin Dashboard
   ============================================ */
.students-preview {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.student-preview-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  background-color: var(--color-gray-50);
  border-radius: var(--radius-lg);
}

.student-preview-item .student-avatar {
  width: 40px;
  height: 40px;
  background-color: var(--color-indigo);
  color: var(--color-white);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.student-preview-item .student-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.student-preview-item .student-name {
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.student-preview-item .student-email {
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
}

.student-preview-item .student-year {
  font-size: var(--font-size-xs);
  color: var(--color-gray-400);
  background-color: var(--color-white);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-sm);
}

/* ============================================
   Responsive Design
   ============================================ */
@media (max-width: 1200px) {
  .stat-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .student-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  :root {
    --sidebar-width: 0;
  }

  .sidebar {
    transform: translateX(-100%);
  }

  .main-content {
    margin-left: 0;
  }

  .stat-cards {
    grid-template-columns: 1fr;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .filters-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: none;
  }

  .modal-small,
  .modal-medium,
  .modal-large {
    width: calc(100% - 32px);
    margin: 16px;
  }
}
```

---

## Setup Instructions Summary

1. **Create directories** (run in Command Prompt):
```cmd
cd "F:\MY CODES 2.0\tekkzy\gcek-central"
mkdir frontend\src\components
mkdir frontend\src\pages\dashboards
mkdir frontend\src\hooks
mkdir frontend\src\utils
mkdir frontend\public
```

2. **Create package.json** and run npm install
3. **Copy all files from FRONTEND_FILES_PART1.md, PART2.md, and PART3.md** into their respective locations
4. **Create .env file** with your AWS Cognito credentials
5. **Run `npm run dev`** to start development server

