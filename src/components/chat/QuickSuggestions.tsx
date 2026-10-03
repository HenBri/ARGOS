'use client';

import React from 'react';
import { QrCode, Gift, Store, Calendar, Car } from 'lucide-react';

interface QuickSuggestionsProps {
  onSelect: (text: string) => void;
  disabled?: boolean;
}

const SUGGESTIONS = [
  {
    icon: QrCode,
    label: '¿Cómo funciona Paseo Points?',
    query: '¿Cómo funciona el programa Paseo Points y para qué sirve mi código QR?',
  },
  {
    icon: Gift,
    label: 'Catálogo de Recompensas',
    query: '¿Qué premios o recompensas puedo canjear con mis Paseo Points?',
  },
  {
    icon: Calendar,
    label: 'Eventos y Actividades',
    query: '¿Qué eventos, talleres o música en vivo hay programados en Paseo Aranjuez?',
  },
  {
    icon: Store,
    label: 'Ubicación de Tiendas',
    query: '¿Dónde quedan Café Typica, Cinnabon y Multicine? ¿En qué pisos y locales están?',
  },
  {
    icon: Car,
    label: 'Tarifas Estacionamiento',
    query: '¿Cuánto cuesta el estacionamiento de Paseo Aranjuez y cómo obtengo horas gratis?',
  },
];

export const QuickSuggestions: React.FC<QuickSuggestionsProps> = ({
  onSelect,
  disabled = false,
}) => {
  return (
    <div className="py-2.5 px-3 border-t border-slate-100 bg-slate-50/70">
      <p className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
        Consultas frecuentes en Paseo Aranjuez
      </p>
      <div className="flex gap-1.5 overflow-x-auto pb-1 chat-scrollbar no-scrollbar">
        {SUGGESTIONS.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(item.query)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200/80 rounded-full hover:border-amber-400 hover:text-amber-800 hover:bg-amber-50/50 transition-all duration-150 flex-shrink-0 disabled:opacity-50 disabled:pointer-events-none shadow-sm active:scale-95"
            >
              <Icon className="w-3.5 h-3.5 text-amber-600" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
