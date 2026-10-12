import React from 'react';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyTitle = 'No records found',
  emptyMessage = 'There are no items matching your criteria.',
  onRowClick,
  keyField = 'id',
}) {
  if (loading) {
    return (
      <div className="admin-card p-12">
        <LoadingState message="Loading records..." />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="admin-card p-8">
        <EmptyState title={emptyTitle} message={emptyMessage} />
      </div>
    );
  }

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                style={{ width: col.width, textAlign: col.align || 'left' }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr
              key={row[keyField] || rowIdx}
              onClick={() => onRowClick && onRowClick(row)}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {columns.map((col, colIdx) => (
                <td
                  key={col.key || colIdx}
                  style={{ textAlign: col.align || 'left' }}
                >
                  {col.render ? col.render(row, rowIdx) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
