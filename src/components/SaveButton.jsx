import clsx from "clsx";
import { Check, Loader2, Save, TriangleAlert } from "lucide-react";

export default function SaveButton({
  dirty = false,
  saving = false,
  saved = false,
  error = false,
  disabled = false,
  onClick,
  label = "Save",
  dirtyLabel = "Save Changes",
  savingLabel = "Saving...",
  savedLabel = "Saved",
  errorLabel = "Save Failed",
  className = ""
}) {
  let Icon = Save;
  let buttonLabel = label;
  let stateClass = "idle";

  if (dirty) {
    buttonLabel = dirtyLabel;
    stateClass = "dirty";
  }

  if (saving) {
    Icon = Loader2;
    buttonLabel = savingLabel;
    stateClass = "saving";
  }

  if (saved) {
    Icon = Check;
    buttonLabel = savedLabel;
    stateClass = "saved";
  }

  if (error) {
    Icon = TriangleAlert;
    buttonLabel = errorLabel;
    stateClass = "error";
  }

  return (
    <button
      type="button"
      className={clsx(
        "primaryButton",
        "compactPrimary",
        "farmhubSaveButton",
        `farmhubSaveButton-${stateClass}`,
        className
      )}
      onClick={onClick}
      disabled={disabled || saving}
    >
      <Icon
        size={15}
        className={saving ? "farmhubSaveButtonSpinner" : ""}
      />
      {buttonLabel}
    </button>
  );
}
