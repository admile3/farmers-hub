import clsx from "clsx";

const STATUS_PILL_VARIANTS = [
  "success",
  "warning",
  "danger",
  "info",
  "neutral",
  "primary"
];

const STATUS_PILL_SIZES = [
  "small",
  "default",
  "large"
];

export default function StatusPill({
  label,
  variant = "neutral",
  size = "default",
  className = ""
}) {
  const safeVariant = STATUS_PILL_VARIANTS.includes(variant)
    ? variant
    : "neutral";

  const safeSize = STATUS_PILL_SIZES.includes(size)
    ? size
    : "default";

  if (!label) return null;

  return (
    <span
      className={clsx(
        "statusPill",
        `statusPill-${safeVariant}`,
        `statusPill-${safeSize}`,
        className
      )}
    >
      {label}
    </span>
  );
}
