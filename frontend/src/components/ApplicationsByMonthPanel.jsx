export default function ApplicationsByMonthPanel({ items, total }) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <section className="applications-panel dashboard-trend">
      <div className="section-head">
        <div>
          <h2>Applications by month</h2>
          <p>Recent trend based on applied dates</p>
        </div>
      </div>

      {total === 0 ? (
        <div className="empty-state">
          <strong>No dated applications yet.</strong>
          <span>Add applied dates to build your monthly trend.</span>
        </div>
      ) : (
        <div className="trend-chart-shell">
          <div className="trend-chart-scale">
            {[maxValue, Math.max(Math.ceil(maxValue / 2), 1), 0].map((value) => (
              <span key={value}>{value}</span>
            ))}
          </div>
          <div className="trend-chart">
            {items.map((item) => (
              <div className="trend-bar-group" key={item.key}>
                <span className="trend-bar-value">{item.value}</span>
                <div className="trend-bar-track">
                  <div
                    className="trend-bar-fill"
                    style={{ height: `${Math.max((item.value / maxValue) * 100, item.value > 0 ? 12 : 0)}%` }}
                  />
                </div>
                <span className="trend-bar-label">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="trend-summary">
            <strong>{total} total</strong>
            <span>applications across the last 6 months</span>
          </div>
        </div>
      )}
    </section>
  );
}
