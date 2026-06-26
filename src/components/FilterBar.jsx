import clsx from "clsx";
import { Search } from "lucide-react";

export default function FilterBar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  actions = [],
  className = ""
}) {
  return (
    <div className={clsx("farmhubFilterBar", className)}>
      <div className="searchBox compactSearch farmhubFilterSearch">
        <Search size={17} />
        <input
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange?.(event.target.value)}
          placeholder={searchPlaceholder}
        />
      </div>

      {filters.map((filter) => (
        <label className="farmhubFilterControl" key={filter.label}>
          {filter.label}
          <select
            value={filter.value}
            onChange={(event) => filter.onChange?.(event.target.value)}
          >
            {filter.options.map((option) => {
              const value = typeof option === "string" ? option : option.value;
              const label = typeof option === "string" ? option : option.label;

              return (
                <option key={value} value={value}>
                  {label}
                </option>
              );
            })}
          </select>
        </label>
      ))}

      {actions.length ? (
        <div className="farmhubFilterActions">
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
  );
}
