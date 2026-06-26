import clsx from "clsx";

export default function DataTable({
  columns = [],
  rows = [],
  getRowKey,
  emptyMessage = "No records found.",
  onRowClick,
  onRowDoubleClick,
  selectedRowId = "",
  getRowId,
  className = ""
}) {
  const templateColumns = columns
    .map((column) => column.width || "1fr")
    .join(" ");

  const primaryColumn = columns.find((column) => column.isPrimary) || columns[0] || null;

  function resolveRowId(row, rowIndex) {
    if (getRowId) return getRowId(row);
    if (getRowKey) return getRowKey(row);
    return row.id || rowIndex;
  }

  function getCellContent(column, row) {
    return column.render ? column.render(row) : row[column.key];
  }

  function getMobileLabel(column) {
    if (column.mobileLabel === false) return "";
    return column.mobileLabel || column.label;
  }

  function handleRowClick(row) {
    onRowClick?.(row);
  }

  function handleRowDoubleClick(row) {
    if (onRowDoubleClick) {
      onRowDoubleClick(row);
      return;
    }

    onRowClick?.(row);
  }

  return (
    <div className={clsx("farmhubDataTableWrap", className)}>
      <div
        className="farmhubDataTableHeader"
        style={{ gridTemplateColumns: templateColumns }}
      >
        {columns.map((column) => (
          <span key={column.key}>{column.label}</span>
        ))}
      </div>

      <div className="farmhubDataTableBody">
        {rows.length ? (
          rows.map((row, rowIndex) => {
            const rowId = resolveRowId(row, rowIndex);
            const isClickable = Boolean(onRowClick || onRowDoubleClick);
            const isSelected = selectedRowId && String(selectedRowId) === String(rowId);

            return (
              <div
                className={clsx(
                  "farmhubDataTableRow",
                  isClickable ? "clickable" : "",
                  isSelected ? "selected" : ""
                )}
                key={rowId}
                style={{ gridTemplateColumns: templateColumns }}
                onDoubleClick={() => handleRowDoubleClick(row)}
              >
                {columns.map((column) => {
                  const isPrimary = primaryColumn?.key === column.key;
                  const cellContent = getCellContent(column, row);
                  const mobileLabel = getMobileLabel(column);

                  return (
                    <div
                      className={clsx(
                        "farmhubDataTableCell",
                        isPrimary ? "primaryCell" : "",
                        column.className
                      )}
                      key={column.key}
                      data-label={mobileLabel}
                    >
                      {isPrimary && isClickable ? (
                        <button
                          className="farmhubDataTablePrimaryButton"
                          type="button"
                          onClick={() => handleRowClick(row)}
                        >
                          <span className="farmhubDataTablePrimaryContent">
                            {cellContent}
                          </span>
                          <span className="farmhubDataTablePrimaryArrow">›</span>
                        </button>
                      ) : (
                        cellContent
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        ) : (
          <div className="farmhubDataTableEmpty">{emptyMessage}</div>
        )}
      </div>
    </div>
  );
}
