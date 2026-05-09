import { BriefcaseBusiness, Building2, Heart } from "lucide-react";

export default function Sidebar({ activeSection, activateSection, summary, setAboutOpen }) {
  return (
    <aside className="sidebar">
      <button className="brand brand-button" type="button" onClick={() => setAboutOpen(true)}>
        <div className="brand-mark">J</div>
        <div>
          <strong>JobFlow</strong>
          <span>Application Tracker</span>
        </div>
      </button>

      <p className="sidebar-section-title">Main Menu</p>
      <nav className="sidebar-nav">
        <button
          type="button"
          className={`nav-item ${activeSection === "dashboard" ? "nav-item-active" : ""}`}
          onClick={() => activateSection("dashboard")}
        >
          <BriefcaseBusiness size={18} />
          <span>Dashboard</span>
        </button>
        <button
          type="button"
          className={`nav-item ${activeSection === "applications" ? "nav-item-active" : ""}`}
          onClick={() => activateSection("applications")}
        >
          <Building2 size={18} />
          <span>Applications</span>
          <span className="nav-count">{summary.total}</span>
        </button>
        <button
          type="button"
          className={`nav-item ${activeSection === "favorites" ? "nav-item-active" : ""}`}
          onClick={() => activateSection("favorites")}
        >
          <Heart size={18} />
          <span>Favorites</span>
          <span className="nav-count">{summary.favorites}</span>
        </button>
      </nav>

      <div className="sidebar-card">
        <p>Stay organized</p>
        <strong>{summary.active} active opportunities</strong>
        <span>Saved, applied, and interview stages in one view.</span>
      </div>
    </aside>
  );
}
