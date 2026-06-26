import clsx from "clsx";

export default function ModuleHero({
  eyebrow,
  title,
  description,
  actions = [],
  accent = "",
  icon: HeroIcon = null,
  className = ""
}) {
  return (
    <section
      className={clsx(
        "farmhubModuleHero",
        "moduleHero",
        "compactHero",
        accent,
        className
      )}
    >
      <div className="farmhubModuleHeroText">
        {eyebrow ? (
          <div className="farmhubModuleHeroEyebrowRow">
            {HeroIcon ? (
              <span className="farmhubModuleHeroEyebrowIcon">
                <HeroIcon size={16} />
              </span>
            ) : null}
            <p className="eyebrow">{eyebrow}</p>
          </div>
        ) : null}

        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>

      {actions.length ? (
        <div className="farmhubModuleHeroActions">
          {actions.map((action) => {
            const Icon = action.icon;
            const variant =
              action.variant === "secondary" ? "secondaryButton" : "primaryButton";

            return (
              <button
                key={action.label}
                className={clsx(
                  variant,
                  "compactPrimary",
                  "farmhubHeroButton",
                  action.className
                )}
                type="button"
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {Icon ? <Icon size={16} /> : null}
                {action.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
