import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Paseo Aranjuez | Paseo Points & Asistente Inteligente Jarvis',
  description:
    'Plataforma integral de Paseo Aranjuez: sistema de fidelización Paseo Points, catálogo de tiendas, eventos culturales y asistente virtual inteligente Jarvis con RAG en tiempo real.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className="antialiased selection:bg-amber-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
