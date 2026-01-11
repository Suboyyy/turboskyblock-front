import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navigation from './components/Navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Hypixel Craft Tracker',
  description: 'Track your Hypixel Skyblock crafting progress',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" data-bs-theme="dark">
      <body className={inter.className}>
        <Navigation />
        <main className="container-fluid mt-4">
          {children}
        </main>
      </body>
    </html>
  );
}