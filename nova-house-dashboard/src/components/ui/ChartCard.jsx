import React from 'react';

export default function ChartCard({ title, subtitle, action, children }) {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <h3 className="chart-title">{title}</h3>
          {subtitle && <p className="chart-subtitle">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="chart-container">
        {children}
      </div>
    </div>
  );
}
