import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Building2,
  Download,
  Heart,
  MapPin,
  PencilLine,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import "./App.css";

const API_BASE_URL = "http://127.0.0.1:8000";

const initialForm = {
  company: "",
  position: "",
  status: "saved",
  location: "",
  applied_date: "",
  source: "",
  notes: "",
  favorite: false,
};

const statusOptions = ["saved", "applied", "interview", "offer", "rejected"];

const statusLabels = {
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-${status}`}>
      {statusLabels[status] ?? status}
    </span>
  );
}

function formatDate(value) {
  if (!value) {
    return "No date";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function ApplicationForm({
  form,
  onChange,
  onSubmit,
  submitting,
  submitLabel,
  onCancel,
}) {
  return (
    <form className="application-form" onSubmit={onSubmit}>
      <label>
        <span>Company</span>
        <input
          required
          value={form.company}
          onChange={(event) => onChange("company", event.target.value)}
          placeholder="Company name"
        />
      </label>

      <label>
        <span>Position</span>
        <input
          required
          value={form.position}
          onChange={(event) => onChange("position", event.target.value)}
          placeholder="Job title"
        />
      </label>

      <label>
        <span>Status</span>
        <select
          value={form.status}
          onChange={(event) => onChange("status", event.target.value)}
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Location</span>
        <input
          value={form.location}
          onChange={(event) => onChange("location", event.target.value)}
          placeholder="Location"
        />
      </label>

      <label>
        <span>Applied date</span>
        <input
          type="date"
          value={form.applied_date}
          onChange={(event) => onChange("applied_date", event.target.value)}
        />
      </label>

      <label>
        <span>Source</span>
        <input
          value={form.source}
          onChange={(event) => onChange("source", event.target.value)}
          placeholder="Application source"
        />
      </label>

      <label className="form-notes">
        <span>Notes</span>
        <textarea
          value={form.notes}
          onChange={(event) => onChange("notes", event.target.value)}
          placeholder="Notes"
        />
      </label>

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={form.favorite}
          onChange={(event) => onChange("favorite", event.target.checked)}
        />
        <span>Mark as favorite</span>
      </label>

      <div className="form-actions">
        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? "Saving..." : submitLabel}
        </button>
        {onCancel ? (
          <button className="ghost-button" type="button" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

export default function App() {
  const [applications, setApplications] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editForm, setEditForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [favoriteFilter, setFavoriteFilter] = useState("all");
  const [activeSection, setActiveSection] = useState("applications");

  const updateCreateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateEditForm = (field, value) => {
    setEditForm((current) => ({ ...current, [field]: value }));
  };

  const normalizePayload = (data) => ({
    ...data,
    location: data.location || null,
    applied_date: data.applied_date || null,
    source: data.source || null,
    notes: data.notes || null,
  });

  const fetchApplications = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/applications`);
      if (!response.ok) {
        throw new Error("Failed to load applications. Make sure the FastAPI server is running.");
      }

      const data = await response.json();
      setApplications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const filteredApplications = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesStatus =
        statusFilter === "all" || application.status === statusFilter;
      const matchesFavorite =
        favoriteFilter === "all" ||
        (favoriteFilter === "favorite" ? application.favorite : !application.favorite);
      const searchSource = [
        application.company,
        application.position,
        application.location,
        application.source,
        application.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = !query || searchSource.includes(query);

      return matchesStatus && matchesFavorite && matchesSearch;
    });
  }, [applications, favoriteFilter, searchTerm, statusFilter]);

  const summary = useMemo(
    () => ({
      total: applications.length,
      active: applications.filter((item) =>
        ["saved", "applied", "interview"].includes(item.status),
      ).length,
      offers: applications.filter((item) => item.status === "offer").length,
      favorites: applications.filter((item) => item.favorite).length,
    }),
    [applications],
  );

  const recentApplications = useMemo(
    () =>
      [...applications]
        .sort((a, b) => {
          const left = a.applied_date ? new Date(a.applied_date).getTime() : 0;
          const right = b.applied_date ? new Date(b.applied_date).getTime() : 0;
          return right - left;
        })
        .slice(0, 4),
    [applications],
  );

  const favoriteSummary = useMemo(() => {
    const favorites = applications.filter((item) => item.favorite);

    return {
      total: favorites.length,
      active: favorites.filter((item) =>
        ["saved", "applied", "interview"].includes(item.status),
      ).length,
      offers: favorites.filter((item) => item.status === "offer").length,
      withNotes: favorites.filter((item) => item.notes && item.notes.trim().length > 0).length,
    };
  }, [applications]);

  const statsCards =
    activeSection === "favorites"
      ? [
          { label: "Favorites", value: favoriteSummary.total, note: "Marked as priority" },
          { label: "Favorite active", value: favoriteSummary.active, note: "Still in progress" },
          { label: "Favorite offers", value: favoriteSummary.offers, note: "Positive favorite outcomes" },
          { label: "With notes", value: favoriteSummary.withNotes, note: "Favorites with saved context" },
        ]
      : [
          { label: "Total", value: summary.total, note: "All tracked applications" },
          { label: "Active", value: summary.active, note: "Still in progress" },
          { label: "Offers", value: summary.offers, note: "Positive outcomes" },
          { label: "Favorites", value: summary.favorites, note: "Priority roles" },
        ];

  const pageHeading =
    activeSection === "dashboard"
      ? "Dashboard"
      : activeSection === "favorites"
        ? "Favorites"
        : "Applications";
  const pageCopy =
    activeSection === "dashboard"
      ? "See your pipeline health and the latest activity at a glance."
      : activeSection === "favorites"
        ? "Focus on the roles you marked as important."
        : "Track every company, status change, note, and favorite role from one place.";

  const activateSection = (section) => {
    setActiveSection(section);

    if (section === "favorites") {
      setFavoriteFilter("favorite");
      return;
    }

    setFavoriteFilter("all");
    setStatusFilter("all");

    if (section === "dashboard") {
      setSearchTerm("");
    }
  };

  const exportApplicationsToCsv = () => {
    if (filteredApplications.length === 0) {
      setError("There are no applications to export.");
      setSuccess("");
      return;
    }

    const headers = [
      "Company",
      "Position",
      "Status",
      "Location",
      "Applied Date",
      "Source",
      "Favorite",
      "Notes",
    ];

    const escapeCsvValue = (value) => {
      const text = value == null ? "" : String(value);
      return `"${text.replaceAll('"', '""')}"`;
    };

    const rows = filteredApplications.map((item) => [
      item.company,
      item.position,
      statusLabels[item.status] ?? item.status,
      item.location ?? "",
      item.applied_date ?? "",
      item.source ?? "",
      item.favorite ? "Yes" : "No",
      item.notes ?? "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `job-applications-${stamp}.csv`;
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
      const response = await fetch(`${API_BASE_URL}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizePayload(form)),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const detail = body?.detail ? JSON.stringify(body.detail) : "Failed to create application.";
        throw new Error(detail);
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

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(initialForm);
  };

  const saveEdit = async (applicationId) => {
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_BASE_URL}/applications/${applicationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizePayload(editForm)),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const detail = body?.detail ? JSON.stringify(body.detail) : "Failed to update application.";
        throw new Error(detail);
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

  const deleteApplication = async (applicationId, company, position) => {
    const confirmed = window.confirm(
      `Delete ${position} at ${company}? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(applicationId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_BASE_URL}/applications/${applicationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const detail = body?.detail || "Failed to delete application.";
        throw new Error(detail);
      }

      if (editingId === applicationId) {
        cancelEdit();
      }

      setSuccess("Application deleted.");
      await fetchApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">J</div>
          <div>
            <strong>JobFlow</strong>
            <span>Application Tracker</span>
          </div>
        </div>

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

      <main className="main-panel">
        <section
          className="hero-panel"
        >
          <div>
            <p className="eyebrow">Your pipeline</p>
            <h1>{pageHeading}</h1>
            <p className="hero-copy">{pageCopy}</p>
          </div>

          <div className="hero-actions">
            <button className="ghost-button" type="button" onClick={exportApplicationsToCsv}>
              <Download size={16} />
              Export CSV
            </button>
            <button className="ghost-button" type="button" onClick={fetchApplications} disabled={loading}>
              <RefreshCw size={16} className={loading ? "spin" : ""} />
              {loading ? "Refreshing" : "Refresh"}
            </button>
            <button
              className="primary-button"
              type="button"
              onClick={() => document.getElementById("application-form")?.scrollIntoView({ behavior: "smooth" })}
            >
              <Plus size={16} />
              Add Application
            </button>
          </div>
        </section>

        <section className="stats-grid">
          {statsCards.map((card) => (
            <article className="stat-card" key={card.label}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <p>{card.note}</p>
            </article>
          ))}
        </section>

        {activeSection === "dashboard" ? (
          <div className="dashboard-grid">
            <section className="dashboard-summary">
              <p className="dashboard-summary-label">Summary metric</p>
              <strong>{summary.active}</strong>
              <h2>Active applications</h2>
              <p>
                Roles currently in `saved`, `applied`, or `interview` status.
              </p>
            </section>

            <section className="applications-panel">
              <div className="section-head">
                <div>
                  <h2>Recent applications</h2>
                  <p>Your latest entries</p>
                </div>
              </div>

              <div className="dashboard-list">
                {recentApplications.length === 0 ? (
                  <div className="empty-state">
                    <strong>No applications yet.</strong>
                    <span>Add your first application from the form.</span>
                  </div>
                ) : (
                  recentApplications.map((item) => (
                    <article className="dashboard-row" key={item.id}>
                      <div>
                        <strong>{item.position}</strong>
                        <p>{item.company}</p>
                      </div>
                      <div className="dashboard-row-meta">
                        <StatusBadge status={item.status} />
                        <span>{formatDate(item.applied_date)}</span>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        ) : (
          <div className={`content-grid ${activeSection === "favorites" ? "content-grid-single" : ""}`}>
            <section className="applications-panel">
            <div className="section-head">
              <div>
                <h2>Application board</h2>
                <p>
                  {filteredApplications.length} shown
                  {activeSection === "favorites" ? " in favorites" : ""}
                </p>
              </div>
            </div>

            <div className="filters">
              <label className="search-filter">
                <Search size={16} />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search company, role, source, notes..."
                />
              </label>

              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">All statuses</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>

              <select value={favoriteFilter} onChange={(event) => setFavoriteFilter(event.target.value)}>
                <option value="all">All priorities</option>
                <option value="favorite">Favorites</option>
                <option value="regular">Regular</option>
              </select>
            </div>

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
                  <article
                    key={item.id}
                    className="application-card"
                  >
                    {editingId === item.id ? (
                      <>
                        <div className="card-top">
                          <div>
                            <p className="card-label">Editing</p>
                            <h3>{item.company}</h3>
                          </div>
                          <StatusBadge status={editForm.status} />
                        </div>

                        <ApplicationForm
                          form={editForm}
                          onChange={updateEditForm}
                          onSubmit={(event) => {
                            event.preventDefault();
                            saveEdit(item.id);
                          }}
                          submitting={submitting}
                          submitLabel="Save Changes"
                          onCancel={cancelEdit}
                        />
                      </>
                    ) : (
                      <>
                        <div className="card-top">
                          <div>
                            <p className="card-label">{item.company}</p>
                            <h3>{item.position}</h3>
                          </div>
                          <StatusBadge status={item.status} />
                        </div>

                        <div className="card-meta">
                          <span>
                            <Building2 size={15} />
                            {item.company}
                          </span>
                          <span>
                            <MapPin size={15} />
                            {item.location || "No location"}
                          </span>
                          <span>
                            <Star size={15} />
                            {item.source || "No source"}
                          </span>
                        </div>

                        <div className="card-footer">
                          <div className="card-date">
                            Applied: <strong>{formatDate(item.applied_date)}</strong>
                          </div>
                          {item.favorite ? <span className="favorite-pill">Favorite</span> : null}
                        </div>

                        {item.notes ? <p className="card-notes">{item.notes}</p> : null}

                        <div className="card-actions">
                          <button className="ghost-button" type="button" onClick={() => startEdit(item)}>
                            <PencilLine size={16} />
                            Edit
                          </button>
                          <button
                            className="danger-button"
                            type="button"
                            onClick={() => deleteApplication(item.id, item.company, item.position)}
                            disabled={deletingId === item.id}
                          >
                            <Trash2 size={16} />
                            {deletingId === item.id ? "Deleting" : "Delete"}
                          </button>
                        </div>
                      </>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>

            {activeSection !== "favorites" ? (
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
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
