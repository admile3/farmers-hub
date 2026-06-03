import { X } from "lucide-react";

export default function ModuleGuideModal({
  isOpen,
  moduleKey,
  title,
  eyebrow = "Module Guide",
  children,
  onClose
}) {
  if (!isOpen) return null;

  function handleClose() {
    onClose?.();
  }

  function handleDismissChange(event) {
    if (!moduleKey) return;

    if (event.target.checked) {
      localStorage.setItem(`hideModuleGuide_${moduleKey}`, "true");
    } else {
      localStorage.removeItem(`hideModuleGuide_${moduleKey}`);
    }
  }

  return (
    <div className="moduleGuideOverlay" role="dialog" aria-modal="true">
      <div className="moduleGuideModal">
        <div className="moduleGuideHeader">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2>{title}</h2>
          </div>

          <button
            className="moduleGuideCloseButton"
            type="button"
            onClick={handleClose}
            aria-label="Close module guide"
          >
            <X size={20} />
          </button>
        </div>

        <div className="moduleGuideBody">{children}</div>

        <div className="moduleGuideFooter">
          <label className="moduleGuideDismiss">
            <input type="checkbox" onChange={handleDismissChange} />
            <span>Don’t show this guide automatically next time.</span>
          </label>

          <button className="primaryButton compactPrimary" type="button" onClick={handleClose}>
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
