import { IngestItem } from '@/types/chat';

export const PASEO_ARANJUEZ_KNOWLEDGE: IngestItem[] = [
  // --- RETO 1: PASEO POINTS Y FIDELIZACIÓN ---
  {
    tipo_fuente: 'recompensa',
    contenido:
      'Programa de Fidelización Paseo Points: Los clientes acumulan puntos por cada compra realizada en los comercios adheridos de Paseo Aranjuez. Por cada 10 Bs gastados se acumula 1 punto. Para acumular o canjear puntos, el cliente solo debe mostrar su Código QR personal generado en su perfil digital.',
    metadatos: { modulo: 'paseo_points', tipo: 'reglas_generales' },
  },
  {
    tipo_fuente: 'recompensa',
    contenido:
      'Niveles de Billetera Paseo Points: Existen tres niveles de fidelización: 1) Bronce (0 a 499 puntos acumulados). 2) Plata (500 a 1.499 puntos, otorga 10% de puntos extra por cada compra). 3) Oro (1.500 puntos o más, otorga 20% de puntos extra, estacionamiento preferencial y accesos VIP a eventos del Paseo).',
    metadatos: { modulo: 'paseo_points', tipo: 'niveles_cliente' },
  },
  {
    tipo_fuente: 'recompensa',
    contenido:
      'Proceso de Canje de Recompensas: El cliente elige su recompensa en el catálogo desde la app o sitio web. Se genera una solicitud de canje con estado "pendiente". Al acudir al establecimiento correspondiente, el comercio escanea el código QR del cliente o valida el canje en su panel, entregando el beneficio y cambiando el estado a "validado".',
    metadatos: { modulo: 'paseo_points', tipo: 'flujo_canjes' },
  },
  {
    tipo_fuente: 'recompensa',
    contenido:
      'Catálogo de Recompensas Activas: 1) Café Americano o Espresso en Café Typica por 80 puntos. 2) Classic Roll en Cinnabon por 120 puntos. 3) Entrada 2D para Multicine Aranjuez por 150 puntos. 4) Vale de consumo de 50 Bs en Fair Play por 250 puntos. 5) Lavado de vehículo ecológico en estacionamiento por 100 puntos.',
    metadatos: { modulo: 'paseo_points', tipo: 'catalogo_premios' },
  },

  // --- TIENDAS Y LOCALES DE PASEO ARANJUEZ ---
  {
    tipo_fuente: 'tienda',
    contenido:
      'Café Typica: Cafetería de especialidad boliviana, repostería artesanal y desayunos. Ubicada en el Piso 1, Local 105, junto al espejo de agua de la entrada principal. Horario de atención: Lunes a Domingo de 08:30 a 22:00 hrs.',
    metadatos: { nombre: 'Café Typica', piso: 1, local: '105', categoria: 'Cafetería' },
  },
  {
    tipo_fuente: 'tienda',
    contenido:
      'Cinnabon & Seattle’s Best Coffee: Rollos de canela recién horneados, café gourmet y bebidas frías. Ubicado en el Piso 1, Local 112, en el pasillo central norte. Horario de atención: Lunes a Sábado de 10:00 a 21:30 hrs y Domingos de 11:00 a 21:00 hrs.',
    metadatos: { nombre: 'Cinnabon', piso: 1, local: '112', categoria: 'Pastelería' },
  },
  {
    tipo_fuente: 'tienda',
    contenido:
      'Fair Play: Tienda oficial multimarcas de ropa, calzado e indumentaria deportiva (Nike, Adidas, Puma, Under Armour). Ubicada en el Piso 2, Local 210, frente a las escaleras mecánicas. Horario: Lunes a Sábado de 10:00 a 21:30 hrs.',
    metadatos: { nombre: 'Fair Play', piso: 2, local: '210', categoria: 'Deportes' },
  },
  {
    tipo_fuente: 'tienda',
    contenido:
      'Totto: Mochilas ergonómicas, maletas de viaje, billeteras y accesorios de alta durabilidad. Ubicado en el Piso 2, Local 218, sector moda urbana. Horario: 10:00 a 21:30 hrs.',
    metadatos: { nombre: 'Totto', piso: 2, local: '218', categoria: 'Accesorios' },
  },
  {
    tipo_fuente: 'tienda',
    contenido:
      'Factory Express & Grill: Hamburguesas artesanales, alitas con salsas especiales, cortes a la parrilla y cervezas. Ubicado en el Piso 3, Terraza Gastronómica, Local 302. Horario: 11:30 a 23:00 hrs todos los días.',
    metadatos: { nombre: 'Factory Express', piso: 3, local: '302', categoria: 'Gastronomía' },
  },
  {
    tipo_fuente: 'tienda',
    contenido:
      'Multicine Aranjuez: Complejo de salas de cine con sonido Dolby Atmos, pantallas gigantes y área de confitería. Ubicado en el Piso 3. Horario: Lunes a Domingo de 12:30 a 23:45 hrs (sujeto a cartelera de estrenos).',
    metadatos: { nombre: 'Multicine', piso: 3, local: 'Piso 3 Completo', categoria: 'Entretenimiento' },
  },
  {
    tipo_fuente: 'tienda',
    contenido:
      'Mac Cosmetics & Beauty Lounge: Maquillaje profesional, cuidado de la piel y asesoría de imagen personalizada. Ubicado en el Piso 1, Local 108, pasillo este. Horario: 10:00 a 21:00 hrs.',
    metadatos: { nombre: 'Mac Cosmetics', piso: 1, local: '108', categoria: 'Belleza' },
  },

  // --- RETO 2: EVENTOS EN PASEO ARANJUEZ ---
  {
    tipo_fuente: 'evento',
    contenido:
      'Noches de Música en Vivo en la Terraza: Todos los viernes y sábados de 19:30 a 22:30 hrs en la Terraza Gastronómica (Piso 3). Presentaciones acústicas de jazz, pop y folklore contemporáneo al aire libre con acceso libre.',
    metadatos: { evento: 'Musica en Vivo', lugar: 'Terraza Piso 3', recurrente: true },
  },
  {
    tipo_fuente: 'evento',
    contenido:
      'Taller Infantil "Pequeños Creadores": Actividad lúdica de pintura, origami y robótica básica para niños de 5 a 12 años. Sábados de 15:30 a 17:30 hrs en la Plaza Central del Piso 1. Participación gratuita para clientes del Paseo.',
    metadatos: { evento: 'Taller Infantil', lugar: 'Plaza Central Piso 1' },
  },
  {
    tipo_fuente: 'evento',
    contenido:
      'Feria de Diseño y Emprendimiento Local: Muestra de diseñadores independientes de Cochabamba, accesorios hechos a mano y café de origen. Se realiza los primeros domingos de cada mes de 11:00 a 19:00 hrs en el Atrio Exterior.',
    metadatos: { evento: 'Feria de Diseño', lugar: 'Atrio Exterior' },
  },

  // --- HORARIOS, ESTACIONAMIENTO Y SERVICIOS GENERALES ---
  {
    tipo_fuente: 'general',
    contenido:
      'Horario General de Paseo Aranjuez: El centro comercial abre sus puertas de Lunes a Sábado de 10:00 a 21:30 hrs. Domingos y días feriados de 11:00 a 20:30 hrs. Las cafeterías y área de desayuno atienden desde las 08:30 hrs y los restaurantes de la Terraza atienden hasta las 23:00 hrs.',
    metadatos: { seccion: 'horarios_generales' },
  },
  {
    tipo_fuente: 'general',
    contenido:
      'Estacionamiento Subterráneo: Paseo Aranjuez cuenta con estacionamiento subterráneo seguro con más de 400 plazas. Accesos vehiculares por la Av. América y Calle Pando. Primeros 20 minutos gratis. Tarifa general: 5 Bs por hora. Con compras acumuladas mayores a 100 Bs se obtienen 2 horas de estacionamiento gratuito sellando el ticket en los comercios o caja central.',
    metadatos: { seccion: 'estacionamiento', tarifa: '5 Bs/hora' },
  },
  {
    tipo_fuente: 'general',
    contenido:
      'Cajeros Automáticos y Servicios Bancarios: Disponibles en el Piso 1, pasillo de servicios contiguo a escaleras mecánicas. Cajeros 24/7 de Banco Nacional de Bolivia (BNB), Banco Mercantil Santa Cruz y Banco Unión.',
    metadatos: { seccion: 'cajeros', piso: 1 },
  },
  {
    tipo_fuente: 'general',
    contenido:
      'Atención al Cliente e Informes: El Módulo de Informes y Atención al Cliente de Paseo Aranjuez se encuentra en la Planta Baja (Piso 1), cerca del ingreso principal. Ofrece préstamos de sillas de ruedas, coches para bebés, asistencia para Paseo Points y recepción de objetos perdidos.',
    metadatos: { seccion: 'informes', piso: 1, ubicacion: 'Ingreso Principal' },
  },
  {
    tipo_fuente: 'general',
    contenido:
      'Red WiFi Gratuita: Paseo Aranjuez ofrece internet inalámbrico de alta velocidad bajo el nombre de red "PASEO-ARANJUEZ-WIFI". Acceso libre aceptando las condiciones en pantalla.',
    metadatos: { seccion: 'wifi' },
  },
];
