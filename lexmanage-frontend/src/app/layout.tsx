import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/components/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'LexManage | Cabinet d\'Avocats',
  description: 'Système de gestion de cabinet d\'avocats africain - SaaS Enterprise',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="bg-slate-950 text-slate-50">
        <QueryProvider>
          {children}
          <Toaster richColors position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
