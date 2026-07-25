import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Worlds — Interactive Stories', description: 'A shared world, one choice at a time.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
