import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Worlds — Stories that remember',
  description: 'Step into persistent, multiplayer stories shaped by every choice.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
