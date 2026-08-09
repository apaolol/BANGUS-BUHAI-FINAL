export default function Message({ type = "info", children }) {
  if (!children) return null;
  return <div className={`msg ${type}`}>{children}</div>;
}
