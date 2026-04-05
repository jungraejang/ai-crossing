import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Crossing',
  description: 'A village simulation powered by AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
