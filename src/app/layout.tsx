import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Jarvis Paseo | Asistente Virtual de Paseo Aranjuez',
  description:
    'Asistente virtual inteligente de Paseo Aranjuez: RAG en tiempo real sobre tiendas, eventos y servicios, con conversación por voz y memoria vectorial base_conocimiento.',
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
