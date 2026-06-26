import clsx from "clsx";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message = "Please confirm this action.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  icon = AlertTriangle,
  onConfirm,
  onCancel,
  className = ""
}) {
  if (!open) return null;

  const Icon = icon;

  return (
    <div className="confirmDialogOverlay" role="presentation">
      <div
        className={clsx("confirmDialog", className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmDialogTitle"
        aria-describedby="confirmDialogMessage"
      >
        <button
          type="button"
          className="confirmDialogClose"
          aria-label="Close confirmation dialog"
          onClick={onCancel}
        >
          <X size={16} />
        </button>

        <div className="confirmDialogIcon">
          {Icon ? <Icon size={22} /> : null}
        </div>

        <div className="confirmDialogContent">
          <h2 id="confirmDialogTitle">{title}</h2>
          {message ? <p id="confirmDialogMessage">{message}</p> : null}
        </div>

        <div className="confirmDialogActions">
          <button
            type="button"
            className="secondaryButton compactButton"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className={clsx(
              "compactButton",
              confirmVariant === "danger"
                ? "dangerButton"
                : "primaryButton compactPrimary"
            )}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
