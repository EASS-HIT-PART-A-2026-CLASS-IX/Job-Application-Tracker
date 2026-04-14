import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Download,
  FileText,
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

const statusColors = {
  saved: "#64748b",
  applied: "#2563eb",
  interview: "#d97706",
  offer: "#16a34a",
  rejected: "#dc2626",
};

function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-${status}`}>
      {statusLabels[status] ?? status}
    </span>
  );
}

function StatusChart({ items }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  let currentStop = 0;

  const segments = items
    .filter((item) => item.value > 0)
    .map((item) => {
      const slice = (item.value / Math.max(total, 1)) * 100;
      const start = currentStop;
      currentStop += slice;
      return `${item.color} ${start}% ${currentStop}%`;
    });

  const chartBackground =
    total === 0
      ? "conic-gradient(#e5e7eb 0% 100%)"
      : `conic-gradient(${segments.join(", ")})`;

  return (
    <div className="chart-panel">
      <div className="section-head">
        <div>
          <h2>Application chart</h2>
          <p>Status distribution across your pipeline</p>
        </div>
      </div>

      <div className="chart-layout">
        <div className="chart-ring-wrap">
          <div className="chart-ring" style={{ background: chartBackground }}>
            <div className="chart-ring-center">
              <strong>{total}</strong>
              <span>Total</span>
            </div>
          </div>
        </div>

        <div className="chart-status-flow">
          {items.map((item) => (
            <div className="chart-flow-item" key={item.key}>
              <span className="chart-dot" style={{ background: item.color }} />
              <span className="chart-flow-label">{item.label}</span>
              <span className="chart-flow-separator">:</span>
              <strong className="chart-flow-value">
                {total ? `${Math.round((item.value / total) * 100)}%` : "0%"}
              </strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) {
    return "No applied date";
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

function getAppliedAge(value) {
  if (!value) {
    return "Date not set";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Date not set";
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (diffDays === 0) {
    return "Today";
  }

  if (diffDays === 1) {
    return "1 day ago";
  }

  return `${diffDays} days ago`;
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
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [favoriteFilter, setFavoriteFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [activeSection, setActiveSection] = useState("applications");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [togglingFavoriteId, setTogglingFavoriteId] = useState(null);
  const [shouldScrollToForm, setShouldScrollToForm] = useState(false);

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

  useEffect(() => {
    if (!shouldScrollToForm || activeSection !== "applications") {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      document.getElementById("application-form")?.scrollIntoView({ behavior: "smooth" });
      setShouldScrollToForm(false);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [activeSection, shouldScrollToForm]);

  const filteredApplications = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const filtered = applications.filter((application) => {
      const matchesStatus =
        selectedStatuses.length === 0 || selectedStatuses.includes(application.status);
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

    return [...filtered].sort((left, right) => {
      const leftDate = left.applied_date ? new Date(left.applied_date).getTime() : 0;
      const rightDate = right.applied_date ? new Date(right.applied_date).getTime() : 0;

      if (sortBy === "oldest") {
        return leftDate - rightDate;
      }

      if (sortBy === "company_asc") {
        return left.company.localeCompare(right.company);
      }

      if (sortBy === "company_desc") {
        return right.company.localeCompare(left.company);
      }

      if (sortBy === "status") {
        return left.status.localeCompare(right.status);
      }

      return rightDate - leftDate;
    });
  }, [applications, favoriteFilter, searchTerm, selectedStatuses, sortBy]);

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

  const recentActivity = useMemo(
    () =>
      recentApplications.map((item) => ({
        id: item.id,
        title: `${item.position} at ${item.company}`,
        activity:
          item.status === "offer"
            ? "Offer in progress"
            : item.status === "interview"
              ? "Interview stage reached"
              : item.status === "applied"
                ? "Application sent"
                : item.status === "rejected"
                  ? "Application closed"
                  : "Saved for later",
        date: formatDate(item.applied_date),
        status: item.status,
      })),
    [recentApplications],
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

  const chartData = useMemo(
    () =>
      ["saved", "applied", "interview", "offer", "rejected"].map((status) => ({
        key: status,
        label: statusLabels[status],
        value: applications.filter((item) => item.status === status).length,
        color: statusColors[status],
      })),
    [applications],
  );

  const statsCards =
    activeSection === "favorites"
      ? [
          {
            label: "Favorites",
            value: favoriteSummary.total,
            note: "Priority applications saved in your board",
            icon: <Heart size={15} />,
            tone: "pink",
          },
          {
            label: "Favorite Active",
            value: favoriteSummary.active,
            note: "Favorites still moving through the pipeline",
            icon: <Activity size={15} />,
            tone: "blue",
          },
          {
            label: "Favorite Offers",
            value: favoriteSummary.offers,
            note: "Favorite roles that already reached offer stage",
            icon: <BadgeCheck size={15} />,
            tone: "green",
          },
          {
            label: "With Notes",
            value: favoriteSummary.withNotes,
            note: "Favorite applications that include saved notes",
            icon: <FileText size={15} />,
            tone: "amber",
          },
        ]
      : [
          {
            label: "Total Applications",
            value: summary.total,
            note: "All tracked applications in your workspace",
            icon: <BriefcaseBusiness size={15} />,
            tone: "blue",
          },
          {
            label: "Active Pipeline",
            value: summary.active,
            note: "Applications currently saved, applied, or interview",
            icon: <Activity size={15} />,
            tone: "violet",
          },
          {
            label: "Offers",
            value: summary.offers,
            note: "Applications that reached a positive outcome",
            icon: <BadgeCheck size={15} />,
            tone: "green",
          },
          {
            label: "Favorites",
            value: summary.favorites,
            note: "Priority roles you marked to revisit quickly",
            icon: <Heart size={15} />,
            tone: "pink",
          },
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
    setSelectedStatuses([]);

    if (section === "dashboard") {
      setSearchTerm("");
    }
  };

  const openAddApplicationForm = () => {
    setActiveSection("applications");
    setFavoriteFilter("all");
    setShouldScrollToForm(true);
  };

  const toggleStatusFilter = (status) => {
    setSelectedStatuses((current) =>
      current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status],
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

  const toggleFavorite = async (application) => {
    setTogglingFavoriteId(application.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_BASE_URL}/applications/${application.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          normalizePayload({
            company: application.company,
            position: application.position,
            status: application.status,
            location: application.location ?? "",
            applied_date: application.applied_date ?? "",
            source: application.source ?? "",
            notes: application.notes ?? "",
            favorite: !application.favorite,
          }),
        ),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const detail = body?.detail ? JSON.stringify(body.detail) : "Failed to update favorite.";
        throw new Error(detail);
      }

      setSuccess(application.favorite ? "Removed from favorites." : "Added to favorites.");
      await fetchApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setTogglingFavoriteId(null);
    }
  };

  const openDeleteModal = (application) => {
    setDeleteTarget(application);
  };

  const closeDeleteModal = () => {
    if (deletingId) {
      return;
    }

    setDeleteTarget(null);
  };

  const deleteApplication = async () => {
    if (!deleteTarget) {
      return;
    }

    const applicationId = deleteTarget.id;
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
      setDeleteTarget(null);
      await fetchApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page-canvas">
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">J</div>
          <div>
            <strong>JobFlow</strong>
            <span>Application Tracker</span>
          </div>
        </div>

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
            {activeSection !== "applications" ? (
              <button
                className="primary-button"
                type="button"
                onClick={openAddApplicationForm}
              >
                <Plus size={16} />
                Add Application
              </button>
            ) : null}
          </div>
        </section>

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

        {activeSection === "dashboard" ? (
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

              <select value={favoriteFilter} onChange={(event) => setFavoriteFilter(event.target.value)}>
                <option value="all">All priorities</option>
                <option value="favorite">Favorites</option>
                <option value="regular">Regular</option>
              </select>

              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="company_asc">Company A-Z</option>
                <option value="company_desc">Company Z-A</option>
                <option value="status">Status</option>
              </select>
            </div>

            <div className="quick-filters">
              <div className="status-chips">
                <button
                  type="button"
                  className={`status-chip ${selectedStatuses.length === 0 ? "status-chip-active" : ""}`}
                  onClick={() => setSelectedStatuses([])}
                >
                  All
                </button>
                {statusOptions.map((status) => (
                  <button
                    type="button"
                    key={status}
                    className={`status-chip ${selectedStatuses.includes(status) ? "status-chip-active" : ""}`}
                    onClick={() => toggleStatusFilter(status)}
                  >
                    {statusLabels[status]}
                  </button>
                ))}
              </div>

              <button className="ghost-button filter-reset" type="button" onClick={resetFilters}>
                Reset filters
              </button>
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
                    <>
                        <div className="card-top">
                          <div>
                            <p className="card-label">{item.company}</p>
                            <h3>{item.position}</h3>
                          </div>
                          <div className="card-top-actions">
                            <button
                              className={`favorite-toggle ${item.favorite ? "favorite-toggle-active" : ""}`}
                              type="button"
                              onClick={() => toggleFavorite(item)}
                              disabled={togglingFavoriteId === item.id}
                              aria-label={item.favorite ? "Remove from favorites" : "Add to favorites"}
                            >
                              <Heart size={16} fill={item.favorite ? "currentColor" : "none"} />
                            </button>
                            <StatusBadge status={item.status} />
                          </div>
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
                          <span className="card-age">{getAppliedAge(item.applied_date)}</span>
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
                            onClick={() => openDeleteModal(item)}
                            disabled={deletingId === item.id}
                          >
                            <Trash2 size={16} />
                            {deletingId === item.id ? "Deleting" : "Delete"}
                          </button>
                        </div>
                    </>
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
              onSubmit={(event) => {
                event.preventDefault();
                saveEdit(editingId);
              }}
              submitting={submitting}
              submitLabel="Save Changes"
              onCancel={cancelEdit}
            />
          </div>
        </div>
      ) : null}
    </div>
    </div>
  );
}
