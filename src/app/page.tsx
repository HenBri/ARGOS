'use client';

import React, { useState } from 'react';
import {
  ShoppingBag,
  Clock,
  Car,
  Utensils,
  MapPin,
  Sparkles,
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2,
  QrCode,
  Award,
  Calendar,
  Gift,
  Coins,
  ShieldCheck,
  Zap,
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
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">
                PASEO ARANJUEZ
              </span>
              <span className="block text-[10px] text-amber-700 font-semibold uppercase tracking-wider">
                Paseo Points & Jarvis AI
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#puntos" className="hover:text-amber-700 transition-colors">Paseo Points</a>
            <a href="#tiendas" className="hover:text-amber-700 transition-colors">Tiendas</a>
            <a href="#eventos" className="hover:text-amber-700 transition-colors">Eventos</a>
            <a href="#servicios" className="hover:text-amber-700 transition-colors">Servicios</a>
          </nav>

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

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 bg-gradient-to-b from-amber-50/40 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 text-amber-900 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Reto 1: Fidelización + Reto 2: Jarvis Paseo con RAG</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                La experiencia inteligente de Paseo Aranjuez
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                Descubre tiendas por piso, eventos culturales y acumula <strong>Paseo Points</strong> con
                tu código QR personal en cada compra en Bolivianos (Bs).
                Consulta a <strong>Jarvis Paseo</strong> en la esquina inferior derecha para resolver dudas
                en tiempo real.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm text-slate-600 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Base de Datos Oficial Supabase</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm">
                  <Zap className="w-4 h-4 text-rose-500" />
                  <span>Realtime en historial_chats</span>
                </div>
              </div>
            </div>

            {/* Tarjeta de Métricas de Paseo Aranjuez */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-amber-300 transition-all">
                <Coins className="w-7 h-7 text-amber-600 mb-3" />
                <h2 className="text-xl font-bold text-slate-900">10 Bs = 1 Punto</h2>
                <p className="text-xs text-slate-500 mt-1">Acumula con tu Código QR</p>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-amber-300 transition-all">
                <Award className="w-7 h-7 text-rose-600 mb-3" />
                <h2 className="text-xl font-bold text-slate-900">3 Niveles</h2>
                <p className="text-xs text-slate-500 mt-1">Bronce, Plata y Oro</p>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-amber-300 transition-all">
                <Calendar className="w-7 h-7 text-indigo-600 mb-3" />
                <h2 className="text-xl font-bold text-slate-900">Eventos en Vivo</h2>
                <p className="text-xs text-slate-500 mt-1">Música y Talleres Infantiles</p>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-amber-300 transition-all">
                <Car className="w-7 h-7 text-emerald-600 mb-3" />
                <h2 className="text-xl font-bold text-slate-900">400+ Plazas</h2>
                <p className="text-xs text-slate-500 mt-1">Estacionamiento Subterráneo</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reto 1: Sección Paseo Points */}
      <section id="puntos" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold">
              <QrCode className="w-3.5 h-3.5" />
              <span>Reto 1: Sistema de Fidelización Paseo Points</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              ¿Cómo funciona Paseo Points para Clientes y Comercios?
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Cada cliente registrado en la tabla <code>perfiles</code> cuenta con un <code>token_codigo_qr</code> único.
              Al realizar una compra en cualquier tienda de Paseo Aranjuez:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-2xl border border-white/15">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-sm mb-3">
                1
              </div>
              <h3 className="font-semibold text-base">Identificación por QR</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                El cliente muestra su código QR desde su celular. El comercio lo escanea con su lector o cámara.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-2xl border border-white/15">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-sm mb-3">
                2
              </div>
              <h3 className="font-semibold text-base">Registro de Transacción</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                El comercio ingresa el monto en Bs. Se registra en <code>transacciones_puntos</code> y suma puntos en la <code>billetera</code>.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-2xl border border-white/15">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-sm mb-3">
                3
              </div>
              <h3 className="font-semibold text-base">Canje de Recompensas</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                El cliente solicita su premio de <code>recompensas</code>. Se crea el registro en <code>canjes</code> y el comercio lo valida.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Directorio de Tiendas y Eventos */}
      <section id="tiendas" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="border-b border-slate-200 pb-4 mb-6 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Directorio Oficial y Eventos</h2>
            <p className="text-sm text-slate-500 mt-1">
              Información integrada con la base de datos de Paseo Aranjuez
            </p>
          </div>
          <span className="text-xs text-slate-400">Pisos 1, 2 y 3</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Piso 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                P1
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Piso 1: Cafeterías & Belleza</h3>
                <p className="text-xs text-slate-500">Ingreso Principal y Hall</p>
              </div>
            </div>
            <ul className="text-xs space-y-2.5 text-slate-600">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                <span><strong>Café Typica:</strong> Local 105 (Junto a espejo de agua)</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                <span><strong>Cinnabon:</strong> Local 112 (Pasillo central norte)</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                <span><strong>Mac Cosmetics:</strong> Local 108 (Pasillo este)</span>
              </li>
            </ul>
          </div>

          {/* Piso 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-sm">
                P2
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Piso 2: Deportes & Moda</h3>
                <p className="text-xs text-slate-500">Indumentaria y Accesorios</p>
              </div>
            </div>
            <ul className="text-xs space-y-2.5 text-slate-600">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-rose-600 mt-0.5 flex-shrink-0" />
                <span><strong>Fair Play:</strong> Local 210 (Frente a escaleras mecánicas)</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-rose-600 mt-0.5 flex-shrink-0" />
                <span><strong>Totto:</strong> Local 218 (Mochilas y maletas de viaje)</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-rose-600 mt-0.5 flex-shrink-0" />
                <span><strong>Lactario y Sanitarios:</strong> Pasillo sur</span>
              </li>
            </ul>
          </div>

          {/* Piso 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-sm">
                P3
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Piso 3: Gastronomía & Cine</h3>
                <p className="text-xs text-slate-500">Terraza Aranjuez y Multicine</p>
              </div>
            </div>
            <ul className="text-xs space-y-2.5 text-slate-600">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-indigo-600 mt-0.5 flex-shrink-0" />
                <span><strong>Multicine Aranjuez:</strong> Salas de cine Dolby Atmos</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-indigo-600 mt-0.5 flex-shrink-0" />
                <span><strong>Factory Express:</strong> Local 302 (Parrillas y alitas)</span>
              </li>
              <li className="flex items-start gap-2">
                <Calendar className="w-3.5 h-3.5 text-indigo-600 mt-0.5 flex-shrink-0" />
                <span><strong>Música en Vivo:</strong> Viernes y Sábados 19:30 en Terraza</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Widget Flotante de Jarvis Paseo */}
      <ChatWidget />
    </main>
  );
}
