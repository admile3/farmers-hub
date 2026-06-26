import clsx from "clsx";

export default function WorkspacePanel({
  eyebrow,
  title,
  description,
  actions = [],
  children,
  className = "",
  bodyClassName = "",
  compact = true
}) {
  return (
    <section
      className={clsx(
        "workspacePanel",
        compact ? "compactPanel" : "",
        "farmhubWorkspacePanel",
        className
      )}
    >
      {(eyebrow || title || description || actions.length) ? (
        <div className="workspaceHeader compactPanelHeader farmhubWorkspaceHeader">
          <div>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            {title ? <h3>{title}</h3> : null}
            {description ? (
              <p className="farmhubWorkspaceDescription">{description}</p>
            ) : null}
          </div>

          {actions.length ? (
            <div className="farmhubWorkspaceActions">
              {actions.map((action) => {
                const Icon = action.icon;
                const buttonClass =
                  action.variant === "secondary"
                    ? "secondaryButton compactButton"
                    : "primaryButton compactPrimary";

                return (
                  <button
                    key={action.label}
                    className={clsx(buttonClass, action.className)}
                    type="button"
                    onClick={action.onClick}
                    disabled={action.disabled}
                  >
                    {Icon ? <Icon size={15} /> : null}
                    {action.label}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={clsx("farmhubWorkspaceBody", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}
