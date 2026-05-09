import { Search } from "lucide-react";
import { statusOptions, statusLabels } from "../constants";

export default function FilterBar({
  searchTerm,
  setSearchTerm,
  favoriteFilter,
  setFavoriteFilter,
  sortBy,
  setSortBy,
  selectedStatuses,
  setSelectedStatuses,
  toggleStatusFilter,
  resetFilters,
}) {
  return (
    <>
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
    </>
  );
}
