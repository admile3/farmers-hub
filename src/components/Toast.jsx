import clsx from "clsx";
import { CheckCircle2, Info, TriangleAlert, XCircle } from "lucide-react";

const TOAST_VARIANTS = {
  success: CheckCircle2,
  info: Info,
  warning: TriangleAlert,
  error: XCircle
};

export default function Toast({
  open = false,
  variant = "success",
  title = "",
  message = "",
  onClose,
  className = ""
}) {
  if (!open) return null;

  const Icon = TOAST_VARIANTS[variant] || CheckCircle2;

  return (
    <div className={clsx("farmhubToast", `farmhubToast-${variant}`, className)}>
      <div className="farmhubToastIcon">
        <Icon size={18} />
      </div>

      <div className="farmhubToastContent">
        {title ? <strong>{title}</strong> : null}
        {message ? <span>{message}</span> : null}
      </div>

      {onClose ? (
        <button
          type="button"
          className="farmhubToastClose"
          aria-label="Dismiss notification"
          onClick={onClose}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
