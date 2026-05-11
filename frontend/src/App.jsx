import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BadgeCheck,
  BriefcaseBusiness,
  Download,
  FileText,
  Heart,
  Moon,
  Plus,
  SunMedium,
  Trash2,
} from "lucide-react";
import "./App.css";

import { API_BASE_URL, initialForm, statusColors, statusLabels, statusOptions } from "./constants";
import ApplicationCard from "./components/ApplicationCard";
import ApplicationForm from "./components/ApplicationForm";
import ApplicationsByMonthPanel from "./components/ApplicationsByMonthPanel";
import FilterBar from "./components/FilterBar";
import Login from "./components/Login";
import Register from "./components/Register";
import Sidebar from "./components/Sidebar";
import StatusBadge from "./components/StatusBadge";
import AiAdvisor from "./components/AiAdvisor";
import StatusChart from "./components/StatusChart";

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("jobflow-token"));
  const [authPage, setAuthPage] = useState("login");
  const [applications, setApplications] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editForm, setEditForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [favoriteFilter, setFavoriteFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [activeSection, setActiveSection] = useState(() => {
    const saved = localStorage.getItem("jobflow-active-section");
    return ["applications", "favorites", "dashboard", "ai"].includes(saved)
      ? saved
      : "dashboard";
  });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [togglingFavoriteId, setTogglingFavoriteId] = useState(null);
  const [shouldScrollToForm, setShouldScrollToForm] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("jobflow-theme") ?? "light");

  const authFetch = (url, options = {}) => {
    const headers = { ...options.headers };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return fetch(url, { ...options, headers });
  };

  const logout = () => {
    localStorage.removeItem("jobflow-token");
    setToken(null);
    setApplications([]);
  };

  const getUsername = () => {
    try {
      return JSON.parse(atob(token.split(".")[1])).sub;
    } catch {
      return null;
    }
  };

  const updateCreateForm = (field, value) => setForm((c) => ({ ...c, [field]: value }));
  const updateEditForm = (field, value) => setEditForm((c) => ({ ...c, [field]: value }));

  const normalizePayload = (data) => ({
    ...data,
    location: data.location || null,
    applied_date: data.applied_date || null,
    source: data.source || null,
    notes: data.notes || null,
  });

  const fetchApplications = async () => {
    setError("");
    try {
      const response = await authFetch(`${API_BASE_URL}/applications`);
      if (!response.ok) throw new Error("Failed to load applications. Make sure the FastAPI server is running.");
      setApplications(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    }
  };

  useEffect(() => { if (token) fetchApplications(); else setApplications([]); }, [token]);
  useEffect(() => { localStorage.setItem("jobflow-theme", theme); }, [theme]);
  useEffect(() => { localStorage.setItem("jobflow-active-section", activeSection); }, [activeSection]);

  useEffect(() => {
    if (!shouldScrollToForm || activeSection !== "applications") return;
    const frameId = window.requestAnimationFrame(() => {
      document.getElementById("application-form")?.scrollIntoView({ behavior: "smooth" });
      setShouldScrollToForm(false);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [activeSection, shouldScrollToForm]);

  const filteredApplications = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const filtered = applications.filter((app) => {
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(app.status);
      const matchesFavorite =
        favoriteFilter === "all" ||
        (favoriteFilter === "favorite" ? app.favorite : !app.favorite);
      const searchSource = [app.company, app.position, app.location, app.source, app.notes]
        .filter(Boolean).join(" ").toLowerCase();
      return matchesStatus && matchesFavorite && (!query || searchSource.includes(query));
    });

    return [...filtered].sort((a, b) => {
      const ad = a.applied_date ? new Date(a.applied_date).getTime() : 0;
      const bd = b.applied_date ? new Date(b.applied_date).getTime() : 0;
      if (sortBy === "oldest") return ad - bd;
      if (sortBy === "company_asc") return a.company.localeCompare(b.company);
      if (sortBy === "company_desc") return b.company.localeCompare(a.company);
      if (sortBy === "status") return a.status.localeCompare(b.status);
      return bd - ad;
    });
  }, [applications, favoriteFilter, searchTerm, selectedStatuses, sortBy]);

  const summary = useMemo(() => ({
    total: applications.length,
    active: applications.filter((a) => ["saved", "applied", "interview"].includes(a.status)).length,
    offers: applications.filter((a) => a.status === "offer").length,
    favorites: applications.filter((a) => a.favorite).length,
  }), [applications]);

  const recentActivity = useMemo(() => {
    const activityLabel = (status) =>
      status === "offer" ? "Offer in progress"
      : status === "interview" ? "Interview stage reached"
      : status === "applied" ? "Application sent"
      : status === "rejected" ? "Application closed"
      : "Saved for later";

    return [...applications]
      .sort((a, b) => {
        const ad = a.applied_date ? new Date(a.applied_date).getTime() : 0;
        const bd = b.applied_date ? new Date(b.applied_date).getTime() : 0;
        return bd - ad;
      })
      .slice(0, 4)
      .map((item) => ({
        id: item.id,
        title: `${item.position} at ${item.company}`,
        activity: activityLabel(item.status),
        date: item.applied_date
          ? new Date(item.applied_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
          : "No applied date",
        status: item.status,
      }));
  }, [applications]);

  const favoriteSummary = useMemo(() => {
    const favs = applications.filter((a) => a.favorite);
    return {
      total: favs.length,
      active: favs.filter((a) => ["saved", "applied", "interview"].includes(a.status)).length,
      offers: favs.filter((a) => a.status === "offer").length,
      withNotes: favs.filter((a) => a.notes && a.notes.trim().length > 0).length,
    };
  }, [applications]);

  const favoriteRecentActivity = useMemo(() => {
    const activityLabel = (status) =>
      status === "offer" ? "Offer in progress"
      : status === "interview" ? "Interview stage reached"
      : status === "applied" ? "Application sent"
      : status === "rejected" ? "Application closed"
      : "Saved for later";

    return applications
      .filter((a) => a.favorite)
      .sort((a, b) => {
        const ad = a.applied_date ? new Date(a.applied_date).getTime() : 0;
        const bd = b.applied_date ? new Date(b.applied_date).getTime() : 0;
        return bd - ad;
      })
      .slice(0, 4)
      .map((item) => ({
        id: item.id,
        title: `${item.position} at ${item.company}`,
        activity: activityLabel(item.status),
        date: item.applied_date
          ? new Date(item.applied_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
          : "No applied date",
        status: item.status,
      }));
  }, [applications]);

  const chartData = useMemo(
    () => statusOptions.map((status) => ({
      key: status,
      label: statusLabels[status],
      value: applications.filter((a) => a.status === status).length,
      color: statusColors[status],
    })),
    [applications],
  );

  const favoriteChartData = useMemo(
    () => statusOptions.map((status) => ({
      key: status,
      label: statusLabels[status],
      value: applications.filter((a) => a.favorite && a.status === status).length,
      color: statusColors[status],
    })),
    [applications],
  );

  const monthlyApplications = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("en-US", { month: "short" });
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      return { key, label: formatter.format(date), value: 0 };
    });

    const lookup = new Map(months.map((m) => [m.key, m]));
    applications.forEach((item) => {
      if (!item.applied_date) return;
      const date = new Date(item.applied_date);
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const target = lookup.get(key);
      if (target) target.value += 1;
    });
    return months;
  }, [applications]);

  const monthlyApplicationsTotal = useMemo(
    () => monthlyApplications.reduce((sum, m) => sum + m.value, 0),
    [monthlyApplications],
  );

  const statsCards =
    activeSection === "favorites"
      ? [
          { label: "Favorites", value: favoriteSummary.total, note: "Priority applications saved in your board", icon: <Heart size={15} />, tone: "pink" },
          { label: "Favorite Active", value: favoriteSummary.active, note: "Favorites still moving through the pipeline", icon: <Activity size={15} />, tone: "blue" },
          { label: "Favorite Offers", value: favoriteSummary.offers, note: "Favorite roles that already reached offer stage", icon: <BadgeCheck size={15} />, tone: "green" },
          { label: "With Notes", value: favoriteSummary.withNotes, note: "Favorite applications that include saved notes", icon: <FileText size={15} />, tone: "amber" },
        ]
      : [
          { label: "Total Applications", value: summary.total, note: "All tracked applications in your workspace", icon: <BriefcaseBusiness size={15} />, tone: "blue" },
          { label: "Active Pipeline", value: summary.active, note: "Applications currently saved, applied, or interview", icon: <Activity size={15} />, tone: "violet" },
          { label: "Offers", value: summary.offers, note: "Applications that reached a positive outcome", icon: <BadgeCheck size={15} />, tone: "green" },
          { label: "Favorites", value: summary.favorites, note: "Priority roles you marked to revisit quickly", icon: <Heart size={15} />, tone: "pink" },
        ];

  const pageHeading =
    activeSection === "dashboard" ? "Dashboard"
    : activeSection === "favorites" ? "Favorites"
    : activeSection === "ai" ? "AI Career Advisor"
    : "Applications";

  const pageCopy =
    activeSection === "dashboard"
      ? "See your pipeline health and the latest activity at a glance."
      : activeSection === "favorites"
        ? "Focus on the roles you marked as important."
        : activeSection === "ai"
          ? "Ask anything about your job search — tips, interview prep, salary advice and more."
          : "Track every company, status change, note, and favorite role from one place.";

  const dashboardDate = new Intl.DateTimeFormat("en-GB", {
    weekday: "long", day: "2-digit", month: "short", year: "numeric",
  }).format(new Date());

  const activateSection = (section) => {
    setActiveSection(section);
    if (section === "favorites") { setFavoriteFilter("favorite"); return; }
    setFavoriteFilter("all");
    setSelectedStatuses([]);
    if (section === "dashboard") setSearchTerm("");
  };

  const openAddApplicationForm = () => {
    setActiveSection("applications");
    setFavoriteFilter("all");
    setShouldScrollToForm(true);
  };

  const toggleTheme = () => setTheme((c) => (c === "dark" ? "light" : "dark"));

  if (!token) {
    return authPage === "login"
      ? <Login onLogin={setToken} onGoToRegister={() => setAuthPage("register")} />
      : <Register onGoToLogin={() => setAuthPage("login")} />;
  }

  const toggleStatusFilter = (status) => {
    setSelectedStatuses((current) =>
      current.includes(status) ? current.filter((s) => s !== status) : [...current, status],
    );
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedStatuses([]);
    setFavoriteFilter(activeSection === "favorites" ? "favorite" : "all");
    setSortBy("newest");
  };

  const exportApplicationsToCsv = () => {
    if (filteredApplications.length === 0) {
      setError("There are no applications to export.");
      setSuccess("");
      return;
    }

    const headers = ["Company", "Position", "Status", "Location", "Applied Date", "Source", "Favorite", "Notes"];
    const escape = (v) => `"${(v == null ? "" : String(v)).replaceAll('"', '""')}"`;
    const rows = filteredApplications.map((item) => [
      item.company, item.position, statusLabels[item.status] ?? item.status,
      item.location ?? "", item.applied_date ?? "", item.source ?? "",
      item.favorite ? "Yes" : "No", item.notes ?? "",
    ]);

    const blob = new Blob([[headers, ...rows].map((r) => r.map(escape).join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `job-applications-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    setSuccess("CSV exported.");
    setError("");
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const response = await authFetch(`${API_BASE_URL}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizePayload(form)),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.detail ? JSON.stringify(body.detail) : "Failed to create application.");
      }
      setForm(initialForm);
      setSuccess("Application added.");
      await fetchApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (application) => {
    setEditingId(application.id);
    setEditForm({
      company: application.company ?? "",
      position: application.position ?? "",
      status: application.status ?? "saved",
      location: application.location ?? "",
      applied_date: application.applied_date ?? "",
      source: application.source ?? "",
      notes: application.notes ?? "",
      favorite: Boolean(application.favorite),
    });
    setSuccess("");
    setError("");
  };

  const cancelEdit = () => { setEditingId(null); setEditForm(initialForm); };

  const saveEdit = async (applicationId) => {
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const response = await authFetch(`${API_BASE_URL}/applications/${applicationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizePayload(editForm)),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.detail ? JSON.stringify(body.detail) : "Failed to update application.");
      }
      setEditingId(null);
      setEditForm(initialForm);
      setSuccess("Application updated.");
      await fetchApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFavorite = async (application) => {
    setTogglingFavoriteId(application.id);
    setError("");
    setSuccess("");
    try {
      const response = await authFetch(`${API_BASE_URL}/applications/${application.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizePayload({
          company: application.company,
          position: application.position,
          status: application.status,
          location: application.location ?? "",
          applied_date: application.applied_date ?? "",
          source: application.source ?? "",
          notes: application.notes ?? "",
          favorite: !application.favorite,
        })),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.detail ? JSON.stringify(body.detail) : "Failed to update favorite.");
      }
      setSuccess(application.favorite ? "Removed from favorites." : "Added to favorites.");
      await fetchApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setTogglingFavoriteId(null);
    }
  };

  const openDeleteModal = (application) => setDeleteTarget(application);
  const closeDeleteModal = () => { if (!deletingId) setDeleteTarget(null); };

  const deleteApplication = async () => {
    if (!deleteTarget) return;
    const applicationId = deleteTarget.id;
    setDeletingId(applicationId);
    setError("");
    setSuccess("");
    try {
      const response = await authFetch(`${API_BASE_URL}/applications/${applicationId}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.detail || "Failed to delete application.");
      }
      if (editingId === applicationId) cancelEdit();
      setSuccess("Application deleted.");
      setDeleteTarget(null);
      await fetchApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setDeletingId(null);
    }
  };

  const filterBarProps = {
    searchTerm, setSearchTerm,
    favoriteFilter, setFavoriteFilter,
    sortBy, setSortBy,
    selectedStatuses, setSelectedStatuses,
    toggleStatusFilter, resetFilters,
  };

  const cardGridProps = {
    onEdit: startEdit,
    onDelete: openDeleteModal,
    onToggleFavorite: toggleFavorite,
    togglingFavoriteId,
    deletingId,
  };

  return (
    <div className={`page-canvas ${theme === "dark" ? "theme-dark" : ""}`}>
      <div className="app-shell">
        <Sidebar
          activeSection={activeSection}
          activateSection={activateSection}
          summary={summary}
          setAboutOpen={setAboutOpen}
          username={getUsername()}
          onLogout={logout}
        />

        <main className="main-panel">
          <section className="hero-panel">
            <div>
              {getUsername() ? (
                <div className="welcome-badge">
                  <span className="welcome-avatar">{getUsername()[0].toUpperCase()}</span>
                  <span>
                    {applications.length === 0
                      ? `Welcome to JobFlow, ${getUsername()} — let's get started!`
                      : `Good to see you, ${getUsername()} 👋`}
                  </span>
                </div>
              ) : (
                <p className="eyebrow">Your pipeline</p>
              )}
              <h1>{pageHeading}</h1>
              <p className="hero-copy">{pageCopy}</p>
              {activeSection === "dashboard" ? (
                <p className="hero-date">Today: {dashboardDate}</p>
              ) : null}
            </div>

            <div className="hero-actions">
              <button className="ghost-button" type="button" onClick={exportApplicationsToCsv}>
                <Download size={16} />
                Export CSV
              </button>
              {activeSection !== "applications" ? (
                <button className="primary-button" type="button" onClick={openAddApplicationForm}>
                  <Plus size={16} />
                  Add Application
                </button>
              ) : null}
              <button
                className="sidebar-theme-toggle"
                type="button"
                onClick={toggleTheme}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                title={theme === "dark" ? "Light mode" : "Dark mode"}
              >
                {theme === "dark" ? <SunMedium size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </section>

          {activeSection !== "ai" && (
            <section className="stats-grid">
              {statsCards.map((card) => (
                <article className={`stat-card stat-card-${card.tone}`} key={card.label}>
                  <div className="stat-card-head">
                    <div className="stat-card-icon">{card.icon}</div>
                    <span>{card.label}</span>
                  </div>
                  <strong>{card.value}</strong>
                  <p>{card.note}</p>
                </article>
              ))}
            </section>
          )}

          {activeSection === "dashboard" ? (
            <>
              <div className="dashboard-grid">
                <section className="applications-panel dashboard-activity">
                  <div className="section-head">
                    <div>
                      <h2>Recent activity</h2>
                      <p>Latest changes in your pipeline</p>
                    </div>
                  </div>
                  <div className="dashboard-list">
                    {recentActivity.length === 0 ? (
                      <div className="empty-state">
                        <strong>No applications yet.</strong>
                        <span>Add your first application from the form.</span>
                      </div>
                    ) : (
                      recentActivity.map((item) => (
                        <article className="dashboard-row" key={item.id}>
                          <div>
                            <strong>{item.title}</strong>
                            <p>{item.activity}</p>
                          </div>
                          <div className="dashboard-row-meta">
                            <StatusBadge status={item.status} />
                            <span>{item.date}</span>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </section>
                <StatusChart items={chartData} />
              </div>
              <div className="dashboard-grid dashboard-grid-secondary">
                <ApplicationsByMonthPanel items={monthlyApplications} total={monthlyApplicationsTotal} />
              </div>
            </>
          ) : activeSection === "favorites" ? (
            <>
              <div className="dashboard-grid">
                <section className="applications-panel dashboard-activity">
                  <div className="section-head">
                    <div>
                      <h2>Favorite activity</h2>
                      <p>Latest changes across your favorite roles</p>
                    </div>
                  </div>
                  <div className="dashboard-list">
                    {favoriteRecentActivity.length === 0 ? (
                      <div className="empty-state">
                        <strong>No favorite applications yet.</strong>
                        <span>Mark roles as favorite to track them here.</span>
                      </div>
                    ) : (
                      favoriteRecentActivity.map((item) => (
                        <article className="dashboard-row" key={item.id}>
                          <div>
                            <strong>{item.title}</strong>
                            <p>{item.activity}</p>
                          </div>
                          <div className="dashboard-row-meta">
                            <StatusBadge status={item.status} />
                            <span>{item.date}</span>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </section>
                <StatusChart
                  items={favoriteChartData}
                  title="Favorites chart"
                  subtitle="Status distribution across your favorite applications"
                  totalLabel="Favorites"
                />
              </div>
              <div className="content-grid content-grid-single">
                <section className="applications-panel">
                  <div className="section-head">
                    <div>
                      <h2>Favorite application board</h2>
                      <p>
                        {filteredApplications.length} favorite application{filteredApplications.length === 1 ? "" : "s"} shown
                      </p>
                    </div>
                  </div>
                  <FilterBar {...filterBarProps} />
                  {error ? <div className="message error-message">{error}</div> : null}
                  {success ? <div className="message success-message">{success}</div> : null}
                  <div className="card-grid">
                    {filteredApplications.length === 0 ? (
                      <div className="empty-state">
                        <strong>No applications found.</strong>
                        <span>Try another filter or add a new application on the right.</span>
                      </div>
                    ) : (
                      filteredApplications.map((item) => (
                        <ApplicationCard key={item.id} item={item} {...cardGridProps} />
                      ))
                    )}
                  </div>
                </section>
              </div>
            </>
          ) : activeSection === "ai" ? (
            <div className="content-grid content-grid-single">
              <section className="applications-panel">
                <AiAdvisor />
              </section>
            </div>
          ) : (
            <div className="content-grid">
              <section className="applications-panel">
                <div className="section-head">
                  <div>
                    <h2>Application board</h2>
                    <p>{filteredApplications.length} shown</p>
                  </div>
                </div>
                <FilterBar {...filterBarProps} />
                {error ? <div className="message error-message">{error}</div> : null}
                {success ? <div className="message success-message">{success}</div> : null}
                <div className="card-grid">
                  {filteredApplications.length === 0 ? (
                    <div className="empty-state">
                      <strong>No applications found.</strong>
                      <span>Try another filter or add a new application on the right.</span>
                    </div>
                  ) : (
                    filteredApplications.map((item) => (
                      <ApplicationCard key={item.id} item={item} {...cardGridProps} />
                    ))
                  )}
                </div>
              </section>

              <aside className="form-panel" id="application-form">
                <div className="section-head">
                  <div>
                    <h2>Add application</h2>
                    <p>Use your project fields and save directly to FastAPI.</p>
                  </div>
                </div>
                <ApplicationForm
                  form={form}
                  onChange={updateCreateForm}
                  onSubmit={handleCreate}
                  submitting={submitting}
                  submitLabel="Save Application"
                />
              </aside>
            </div>
          )}
        </main>

        {deleteTarget ? (
          <div className="modal-backdrop" role="presentation" onClick={closeDeleteModal}>
            <div
              className="confirm-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-modal-title"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="confirm-modal-eyebrow">Delete application</p>
              <h2 id="delete-modal-title">
                Remove {deleteTarget.position} at {deleteTarget.company}?
              </h2>
              <p className="confirm-modal-copy">
                This action will permanently delete the application from your tracker.
              </p>
              <div className="confirm-modal-actions">
                <button className="ghost-button" type="button" onClick={closeDeleteModal} disabled={Boolean(deletingId)}>
                  Cancel
                </button>
                <button className="danger-button" type="button" onClick={deleteApplication} disabled={Boolean(deletingId)}>
                  <Trash2 size={16} />
                  {deletingId ? "Deleting" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {editingId !== null ? (
          <div className="modal-backdrop" role="presentation" onClick={cancelEdit}>
            <div
              className="edit-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-modal-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="edit-modal-head">
                <div>
                  <p className="edit-modal-eyebrow">Edit application</p>
                  <h2 id="edit-modal-title">Update application details</h2>
                </div>
                <StatusBadge status={editForm.status} />
              </div>
              <ApplicationForm
                form={editForm}
                onChange={updateEditForm}
                onSubmit={(event) => { event.preventDefault(); saveEdit(editingId); }}
                submitting={submitting}
                submitLabel="Save Changes"
                onCancel={cancelEdit}
              />
            </div>
          </div>
        ) : null}

        {aboutOpen ? (
          <div className="modal-backdrop" role="presentation" onClick={() => setAboutOpen(false)}>
            <div
              className="about-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="about-modal-title"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="about-modal-eyebrow">About this app</p>
              <h2 id="about-modal-title">JobFlow Application Tracker</h2>
              <p className="about-modal-copy">
                This app helps you track job applications from one place. You can add,
                edit, delete, favorite, filter, sort, and export applications while
                following progress through statuses like saved, applied, interview,
                offer, and rejected.
              </p>
              <p className="about-modal-copy">
                Use the Dashboard for quick activity and status overview, Applications
                for full management, and Favorites to focus on the roles that matter most.
              </p>
              <div className="confirm-modal-actions">
                <button className="primary-button" type="button" onClick={() => setAboutOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
