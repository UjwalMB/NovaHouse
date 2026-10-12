import React from 'react';

export default function KpiCard({ title, value, subtitle, icon: Icon, trend, trendLabel }) {
  return (
    <div className="kpi-card">
      <div className="kpi-card-glow" />
      <div className="kpi-header">
        <span className="kpi-label">{title}</span>
        {Icon && (
          <div className="kpi-icon-wrap">
            <Icon size={16} />
          </div>
        )}
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-footer">
        {trend && (
          <span style={{ 
            color: trend.startsWith('+') ? 'var(--metric-positive)' : 'var(--metric-warning)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600
          }}>
            {trend}
          </span>
        )}
        <span>{trendLabel || subtitle}</span>
      </div>
    </div>
  );
}
