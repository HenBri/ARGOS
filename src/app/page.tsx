'use client';

import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { ChatWidget } from '@/components/chat/ChatWidget';

export default function HomePage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleRunIngest = async () => {
    setIsSeeding(true);
    setSeedResult(null);
    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al ejecutar ingesta en base_conocimiento');
      }
      setSeedResult({
        success: true,
        message: data.message,
      });
    } catch (err) {
      setSeedResult({
        success: false,
        message: err instanceof Error ? err.message : 'Error al conectar con la API',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 relative pb-28">
      {/* Barra Superior Informativa */}
      <div className="bg-slate-950 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Abierto hoy de 10:00 a 21:30 hrs • Paseo Aranjuez (Cochabamba)</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Red WiFi: <strong>PASEO-ARANJUEZ-WIFI</strong></span>
            <span>Informes: Piso 1 (Planta Baja)</span>
          </div>
        </div>
      </div>

      {/* Navbar Principal */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-rose-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-rose-600/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">
                JARVIS PASEO
              </span>
              <span className="block text-[10px] text-amber-700 font-semibold uppercase tracking-wider">
                Asistente Virtual de Paseo Aranjuez
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunIngest}
              disabled={isSeeding}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-300 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-all shadow-sm"
              title="Vectoriza e inserta el conocimiento en base_conocimiento de Supabase"
            >
              {isSeeding ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Indexando base_conocimiento...</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5 text-amber-600" />
                  <span>Sincronizar RAG (base_conocimiento)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Banner de Notificación del Seed */}
      {seedResult && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div
            className={`p-3.5 rounded-xl border flex items-center gap-3 text-sm ${
              seedResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {seedResult.success ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
            )}
            <div className="flex-1">{seedResult.message}</div>
            <button
              onClick={() => setSeedResult(null)}
              className="text-xs font-semibold underline ml-2"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Presentación del Asistente */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 text-amber-900 text-xs font-semibold mx-auto">
          <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
          <span>RAG en tiempo real + Voz con Google Gemini</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Habla con Jarvis Paseo
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          El asistente virtual de Paseo Aranjuez responde en tiempo real sobre tiendas,
          pisos y locales, eventos culturales, servicios, horarios, estacionamiento y el
          programa Paseo Points, consultando la base de datos oficial y la memoria vectorial{' '}
          <code className="text-amber-700">base_conocimiento</code>.
        </p>
        <p className="text-sm text-slate-500">
          Escríbele desde la esquina inferior derecha o usa el micrófono para conversar por voz.
        </p>
      </section>

      {/* Widget Flotante de Jarvis Paseo */}
      <ChatWidget />
    </main>
  );
}
