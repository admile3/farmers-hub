import { useEffect } from "react";
import { X } from "lucide-react";

export default function ModuleGuideModal({
  isOpen,
  moduleKey,
  title,
  eyebrow = "Module Guide",
  children,
  onClose
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [isOpen]);

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

  function handleOverlayWheel(event) {
    if (event.target === event.currentTarget) {
      event.preventDefault();
    }
  }

  return (
    <div
      className="moduleGuideOverlay"
      role="dialog"
      aria-modal="true"
      onWheel={handleOverlayWheel}
    >
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
