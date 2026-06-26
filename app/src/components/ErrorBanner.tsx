export default function ErrorBanner({ error }: { error: string | null }) {
  if (!error) return null;
  return <div className="err">⚠ {error}</div>;
}
