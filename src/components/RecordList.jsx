import clsx from "clsx";

export default function RecordList({
  records = [],
  selectedRecordId = null,
  getRecordId = (record) => record.id,
  getTitle = (record) => record.title || record.name,
  getSubtitle = (record) => record.subtitle || record.description,
  getMeta = () => [],
  renderStatus = null,
  renderActions = null,
  emptyMessage = "No records to display.",
  onRecordClick,
  className = ""
}) {
  if (!records.length) {
    return <div className="farmhubRecordListEmpty">{emptyMessage}</div>;
  }

  function handleOpen(record) {
    if (onRecordClick) {
      onRecordClick(record);
    }
  }

  return (
    <div className={clsx("farmhubRecordList", className)}>
      {records.map((record) => {
        const recordId = getRecordId(record);
        const title = getTitle(record);
        const subtitle = getSubtitle(record);
        const meta = getMeta(record) || [];
        const isSelected = selectedRecordId === recordId;

        return (
          <article
            key={recordId}
            className={clsx(
              "farmhubRecordCard",
              onRecordClick ? "clickable" : "",
              isSelected ? "selected" : ""
            )}
            onDoubleClick={() => handleOpen(record)}
          >
            <div className="farmhubRecordCardMain">
              <button
                type="button"
                className="farmhubRecordCardTitle"
                onClick={() => handleOpen(record)}
              >
                <span>{title}</span>
                {onRecordClick ? (
                  <span className="farmhubRecordCardArrow">›</span>
                ) : null}
              </button>

              {subtitle ? (
                <p className="farmhubRecordCardSubtitle">{subtitle}</p>
              ) : null}

              {meta.length ? (
                <div className="farmhubRecordCardMeta">
                  {meta.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              ) : null}
            </div>

            {(renderStatus || renderActions) ? (
              <div className="farmhubRecordCardSide">
                {renderStatus ? (
                  <div className="farmhubRecordCardStatus">
                    {renderStatus(record)}
                  </div>
                ) : null}

                {renderActions ? (
                  <div className="farmhubRecordCardActions">
                    {renderActions(record)}
                  </div>
                ) : null}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
