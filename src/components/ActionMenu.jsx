import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { MoreVertical } from "lucide-react";

export default function ActionMenu({
  items = [],
  align = "right",
  buttonLabel = "More actions",
  buttonIcon: ButtonIcon = MoreVertical,
  className = "",
  menuClassName = ""
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleItemClick(item) {
    if (item.disabled || item.divider || item.sectionLabel) return;

    item.onClick?.();
    setOpen(false);
  }

  return (
    <div className={clsx("farmhubActionMenu", className)} ref={menuRef}>
      <button
        type="button"
        className={clsx(
          "farmhubActionMenuButton",
          open ? "open" : ""
        )}
        aria-label={buttonLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
      >
        {ButtonIcon ? <ButtonIcon size={16} /> : null}
      </button>

      {open ? (
        <div
          className={clsx(
            "farmhubActionMenuPanel",
            align === "left" ? "alignLeft" : "alignRight",
            menuClassName
          )}
          role="menu"
        >
          {items.map((item, index) => {
            if (item.divider) {
              return (
                <div
                  className="farmhubActionMenuDivider"
                  key={`divider-${index}`}
                  role="separator"
                />
              );
            }

            if (item.sectionLabel) {
              return (
                <div
                  className="farmhubActionMenuSectionLabel"
                  key={`section-${item.sectionLabel}-${index}`}
                >
                  {item.sectionLabel}
                </div>
              );
            }

            const Icon = item.icon;

            return (
              <button
                type="button"
                className={clsx(
                  "farmhubActionMenuItem",
                  item.destructive ? "destructive" : "",
                  item.disabled ? "disabled" : ""
                )}
                key={`${item.label}-${index}`}
                role="menuitem"
                disabled={item.disabled}
                onClick={(event) => {
                  event.stopPropagation();
                  handleItemClick(item);
                }}
              >
                {Icon ? <Icon size={15} /> : null}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
