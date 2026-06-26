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
  onRecordDoubleClick,
  className = ""
}) {
  if (!records.length) {
    return <div className="farmhubRecordListEmpty">{emptyMessage}</div>;
  }

  function handleRecordClick(record) {
    onRecordClick?.(record);
  }

  function handleRecordDoubleClick(record) {
    if (onRecordDoubleClick) {
      onRecordDoubleClick(record);
      return;
    }

    onRecordClick?.(record);
  }

  return (
    <div className={clsx("farmhubRecordList", className)}>
      {records.map((record, recordIndex) => {
        const recordId = getRecordId(record) || recordIndex;
        const title = getTitle(record);
        const subtitle = getSubtitle(record);
        const meta = getMeta(record) || [];
        const isClickable = Boolean(onRecordClick || onRecordDoubleClick);
        const isSelected =
          selectedRecordId && String(selectedRecordId) === String(recordId);

        return (
          <article
            key={recordId}
            className={clsx(
              "farmhubRecordCard",
              isClickable ? "clickable" : "",
              isSelected ? "selected" : ""
            )}
            onDoubleClick={() => handleRecordDoubleClick(record)}
          >
            <div className="farmhubRecordCardMain">
              <button
                type="button"
                className="farmhubRecordCardTitle"
                onClick={() => handleRecordClick(record)}
              >
                {title}
              </button>

              {subtitle ? (
                <p className="farmhubRecordCardSubtitle">{subtitle}</p>
              ) : null}

              {meta.length ? (
                <div className="farmhubRecordCardMeta">
                  {meta.map((item) => {
                    const label = item?.label;
                    const value = item?.value ?? item;

                    if (!value) return null;

                    return (
                      <span className="farmhubRecordCardMetaItem" key={`${label || "meta"}-${value}`}>
                        {label ? (
                          <span className="farmhubRecordCardMetaLabel">
                            {label}:
                          </span>
                        ) : null}
                        <span>{value}</span>
                      </span>
                    );
                  })}
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
