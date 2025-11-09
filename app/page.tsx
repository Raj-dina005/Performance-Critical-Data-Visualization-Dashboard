// app/page.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ padding: 40 }}>
      <h1>Performance Dashboard Demo</h1>
      <p><Link href="/dashboard">Open Dashboard</Link></p>
    </main>
  );
}
