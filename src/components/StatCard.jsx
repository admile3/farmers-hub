import clsx from "clsx";

export default function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = "green",
  className = ""
}) {
  return (
    <article className={clsx("hubStatCard", accent, className)}>
      {Icon ? (
        <div className={clsx("hubStatIcon", accent)}>
          <Icon size={22} />
        </div>
      ) : null}

      <div className="hubStatText">
        <span>{label}</span>
        <strong>{value}</strong>
        {sub ? <p>{sub}</p> : null}
      </div>
    </article>
  );
}
