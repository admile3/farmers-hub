import clsx from "clsx";

export default function DataTable({
  columns = [],
  rows = [],
  getRowKey,
  emptyMessage = "No records found.",
  className = ""
}) {
  return (
    <div className={clsx("farmhubDataTableWrap", className)}>
      <div
        className="farmhubDataTableHeader"
        style={{
          gridTemplateColumns: columns.map((column) => column.width || "1fr").join(" ")
        }}
      >
        {columns.map((column) => (
          <span key={column.key}>{column.label}</span>
        ))}
      </div>

      <div className="farmhubDataTableBody">
        {rows.length ? (
          rows.map((row, rowIndex) => (
            <div
              className="farmhubDataTableRow"
              key={getRowKey ? getRowKey(row) : row.id || rowIndex}
              style={{
                gridTemplateColumns: columns.map((column) => column.width || "1fr").join(" ")
              }}
            >
              {columns.map((column) => (
                <div className="farmhubDataTableCell" key={column.key}>
                  {column.render ? column.render(row) : row[column.key]}
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="farmhubDataTableEmpty">{emptyMessage}</div>
        )}
      </div>
    </div>
  );
}
