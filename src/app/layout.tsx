import type { Metadata } from 'next';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Ticketplus - ERP de Gestión de Eventos & Ticketing',
  description: 'Plataforma administrativa para organizadores de eventos en Perú.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen bg-app-bg text-text-main">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
