import { Building2, Heart, MapPin, PencilLine, Star, Trash2 } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { formatDate, getAppliedAge } from "../utils";

export default function ApplicationCard({
  item,
  onEdit,
  onDelete,
  onToggleFavorite,
  togglingFavoriteId,
  deletingId,
}) {
  return (
    <article className="application-card">
      <div className="card-top">
        <div>
          <p className="card-label">{item.company}</p>
          <h3>{item.position}</h3>
        </div>
        <div className="card-top-actions">
          <button
            className={`favorite-toggle ${item.favorite ? "favorite-toggle-active" : ""}`}
            type="button"
            onClick={() => onToggleFavorite(item)}
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
        <button className="ghost-button" type="button" onClick={() => onEdit(item)}>
          <PencilLine size={16} />
          Edit
        </button>
        <button
          className="danger-button"
          type="button"
          onClick={() => onDelete(item)}
          disabled={deletingId === item.id}
        >
          <Trash2 size={16} />
          {deletingId === item.id ? "Deleting" : "Delete"}
        </button>
      </div>
    </article>
  );
}
