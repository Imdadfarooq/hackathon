export default function Spinner({ label }) {
  return (
    <div>
      <div className="spinner" />
      {label && <p className="center-msg" style={{ padding: 0 }}>{label}</p>}
    </div>
  );
}
