import clsx from "clsx";
import { Inbox } from "lucide-react";

export default function EmptyState({
  icon: Icon = Inbox,
  title = "No records yet",
  message = "Add your first record to get started.",
  actions = [],
  className = ""
}) {
  return (
    <div className={clsx("farmhubEmptyState", className)}>
      {Icon ? (
        <div className="farmhubEmptyStateIcon">
          <Icon size={24} />
        </div>
      ) : null}

      <div>
        <h3>{title}</h3>
        <p>{message}</p>
      </div>

      {actions.length ? (
        <div className="farmhubEmptyStateActions">
          {actions.map((action) => {
            const ButtonIcon = action.icon;
            const buttonClass =
              action.variant === "secondary"
                ? "secondaryButton compactButton"
                : "primaryButton compactPrimary";

            return (
              <button
                key={action.label}
                className={buttonClass}
                type="button"
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {ButtonIcon ? <ButtonIcon size={15} /> : null}
                {action.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
