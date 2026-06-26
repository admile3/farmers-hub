import clsx from "clsx";

export default function FormField({
  label,
  helper,
  error,
  required = false,
  disabled = false,
  children,
  className = "",
  fullWidth = false
}) {
  return (
    <div
      className={clsx(
        "farmhubFormField",
        fullWidth && "fullSpan",
        disabled && "disabled",
        error && "hasError",
        className
      )}
    >
      {label ? (
        <label className="farmhubFormFieldLabel">
          <span>{label}</span>

          {required ? (
            <span className="farmhubRequiredMark">*</span>
          ) : null}
        </label>
      ) : null}

      {helper ? (
        <p className="farmhubFormFieldHelper">
          {helper}
        </p>
      ) : null}

      <div className="farmhubFormFieldControl">
        {children}
      </div>

      {error ? (
        <p className="farmhubFormFieldError">
          {error}
        </p>
      ) : null}
    </div>
  );
}
