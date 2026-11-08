import Icon from "./Icon.jsx";

// Shared look for the login and register pages: colorful left side, form on the right
export default function AuthLayout({ children }) {
  return (
    <div className="auth-split">
      <section className="auth-hero">
        <div className="brand">
          <span className="brand-icon"><Icon name="pulse" size={22} /></span>
          <span className="brand-text">Healthcare Manager</span>
        </div>

        <div>
          <h1 className="hero-title">Patient records,<br />organised and understood.</h1>
          <p className="hero-text">
            Keep patient details in one place, upload medical PDFs, and let AI prepare
            a summary for you to review.
          </p>
          <ul className="hero-features">
            <li><span className="tick"><Icon name="users" /></span>Manage patients with role based access</li>
            <li><span className="tick"><Icon name="sparkle" /></span>AI summaries and extracted test values</li>
            <li><span className="tick"><Icon name="shield" /></span>Every important action is audit logged</li>
          </ul>
        </div>

        <p className="hero-foot">AI results are always for human review. They are not a diagnosis.</p>
      </section>

      <section className="auth-panel">{children}</section>
    </div>
  );
}
