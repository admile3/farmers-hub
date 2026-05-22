export default function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = "green"
}) {
  return (
    <div className={`hubStatCard ${accent}`}>
      {Icon ? (
        <div className={`hubStatIcon ${accent}`}>
          <Icon size={22} />
        </div>
      ) : null}

      <div className="hubStatText">
        <span>{label}</span>
        <strong>{value}</strong>
        {sub ? <p>{sub}</p> : null}
      </div>
    </div>
  );
}
