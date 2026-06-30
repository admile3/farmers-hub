import clsx from "clsx";

export default function RecordList({
  records = [],
  getRecordId,
  selectedRecordId = "",
  selectedRecordIds = [],
  multiSelect = false,
  onSelectionChange,
  onRecordClick,
  onRecordDoubleClick,
  getTitle,
  getSubtitle,
  getMeta,
  renderStatus,
  renderActions,
  emptyMessage = "No records found.",
  className = ""
}) {
  function resolveRecordId(record, recordIndex) {
    if (getRecordId) return getRecordId(record);
    return record.id || record.key || recordIndex;
  }

  function isRecordSelected(recordId) {
    if (multiSelect) {
      return selectedRecordIds.map(String).includes(String(recordId));
    }

    return selectedRecordId && String(selectedRecordId) === String(recordId);
  }

  function toggleSelection(recordId, record) {
    if (!multiSelect) {
      onRecordClick?.(record);
      return;
    }

    const normalizedId = String(recordId);
    const currentIds = selectedRecordIds.map(String);
    const nextIds = currentIds.includes(normalizedId)
      ? currentIds.filter((id) => id !== normalizedId)
      : [...currentIds, normalizedId];

    onSelectionChange?.(nextIds, record);
    onRecordClick?.(record);
  }

  function handleRecordDoubleClick(record) {
    if (onRecordDoubleClick) {
      onRecordDoubleClick(record);
      return;
    }

    onRecordClick?.(record);
  }

  function getTitleContent(record) {
    if (getTitle) return getTitle(record);
    return record.name || record.title || "Untitled Record";
  }

  function getSubtitleContent(record) {
    if (getSubtitle) return getSubtitle(record);
    return record.subtitle || record.description || "";
  }

  function getMetaItems(record) {
    if (!getMeta) return [];
    return (getMeta(record) || []).filter((item) => item && item.value !== "" && item.value !== null && item.value !== undefined);
  }

  if (!records.length) {
    return <div className="farmhubRecordListEmpty">{emptyMessage}</div>;
  }

  return (
    <div className={clsx("farmhubRecordList", multiSelect ? "multiSelect" : "", className)}>
      {records.map((record, recordIndex) => {
        const recordId = resolveRecordId(record, recordIndex);
        const selected = isRecordSelected(recordId);
        const title = getTitleContent(record);
        const subtitle = getSubtitleContent(record);
        const metaItems = getMetaItems(record);
        const clickable = Boolean(onRecordClick || onRecordDoubleClick || multiSelect);

        return (
          <article
            className={clsx(
              "farmhubRecordItem",
              clickable ? "clickable" : "",
              selected ? "selected" : ""
            )}
            key={recordId}
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : undefined}
            onClick={() => toggleSelection(recordId, record)}
            onDoubleClick={() => handleRecordDoubleClick(record)}
            onKeyDown={(event) => {
              if (!clickable) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                toggleSelection(recordId, record);
              }
            }}
          >
            {multiSelect ? (
              <div className="farmhubRecordSelectCell" aria-hidden="true">
                <span className={clsx("farmhubRecordCheckbox", selected ? "checked" : "")} />
              </div>
            ) : null}

            <div className="farmhubRecordMain">
              <div className="farmhubRecordTitleRow">
                <div className="farmhubRecordTitleBlock">
                  <strong>{title}</strong>
                  {subtitle ? <span>{subtitle}</span> : null}
                </div>

                <div className="farmhubRecordHeaderActions">
                  {renderStatus ? renderStatus(record) : null}
                  {renderActions ? (
                    <div
                      className="farmhubRecordActions"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {renderActions(record)}
                    </div>
                  ) : null}
                </div>
              </div>

              {metaItems.length ? (
                <div className="farmhubRecordMeta">
                  {metaItems.map((item, itemIndex) => (
                    <span key={`${recordId}-meta-${item.label || itemIndex}`}>
                      {item.label ? <b>{item.label}:</b> : null}
                      {item.value}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
