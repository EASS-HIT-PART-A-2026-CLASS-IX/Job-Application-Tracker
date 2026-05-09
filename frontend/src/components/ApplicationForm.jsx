import { statusOptions, statusLabels } from "../constants";

export default function ApplicationForm({
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
