import { Card } from './ui.jsx';
export default function Placeholder({ title }) {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold mb-4">{title}</h1>
      <Card><p className="text-ink-muted">Coming in a later milestone.</p></Card>
    </div>
  );
}
