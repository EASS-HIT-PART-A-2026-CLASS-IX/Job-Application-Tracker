export default function StatusChart({
  items,
  title = "Application chart",
  subtitle = "Status distribution across your pipeline",
  totalLabel = "Total",
}) {
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
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="chart-layout">
        <div className="chart-ring-wrap">
          <div className="chart-ring" style={{ background: chartBackground }}>
            <div className="chart-ring-center">
              <strong>{total}</strong>
              <span>{totalLabel}</span>
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
