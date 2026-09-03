import React, { useState } from 'react';
import { HelpCircle, FileText, Shield, Mail, CheckCircle2, MessageSquare, BookOpen, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

export const LegalSupportView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'faq' | 'methodology' | 'legal' | 'contact'>('faq');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);

  const faqs = [
    {
      q: '¿Cómo calcula Embudo el cuello de botella?',
      a: 'Embudo utiliza un motor determinístico multi-variable que pondera la puntuación mononúcleo/multinúcleo del CPU, la potencia de renderizado de la GPU según la resolución (1080p, 1440p, 4K), el ancho de banda de la memoria RAM (penalizando Single Channel hasta un 24%) y la latencia del almacenamiento. A mayor resolución, el peso del cálculo se traslada hacia la GPU.'
    },
    {
      q: '¿Por qué un 5% o 10% de cuello de botella no es perjudicial?',
      a: 'Ningún sistema informático es 100% simétrico en todas las situaciones de carga. Un cuello de botella inferior al 12% se considera dentro de la tolerancia de equilibrio normal, donde ambos componentes se aprovechan prácticamente al máximo de su capacidad sin pérdidas perceptibles de fluidez.'
    },
    {
      q: '¿Qué es el margen de +35% en la fuente de poder (PSU)?',
      a: 'Las tarjetas gráficas modernas (como las series RTX 40, RTX 50 y RX 7000) sufren transitorios de potencia o "micro-spikes" de milisegundos que pueden duplicar brevemente su consumo TDP nominal. El margen del +35% garantiza que la protección contra sobrecorriente (OCP) de la fuente no se dispare apagando el PC, y sitúa al sistema en el rango del 50-70% de carga donde las fuentes con certificación 80 PLUS Gold logran su máxima eficiencia.'
    },
    {
      q: '¿Cómo evalúa el módulo Smartphone el Thermal Throttling?',
      a: 'Los teléfonos móviles carecen de disipación activa (ventiladores). Evaluamos el nodo de fabricación del SoC (ej. 3nm TSMC), el consumo promedio bajo carga sostenida y el porcentaje histórico de retención de rendimiento tras 20 minutos de bucle en 3DMark Wild Life Stress Test. Si la retención cae por debajo del 75%, se genera una advertencia de estrangulamiento térmico y caídas de 1% Lows.'
    }
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessageSent(true);
    setTimeout(() => {
      setContactName('');
      setContactEmail('');
      setContactMessage('');
      setMessageSent(false);
    }, 4000);
  };

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 pt-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
          <BookOpen className="w-4 h-4 text-cyan-400" /> CENTRO DE AYUDA & METODOLOGÍA
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Soporte, Metodología de Cálculo & Marco Legal
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Información técnica detallada, preguntas frecuentes, fórmulas de balance y términos de uso.
        </p>

        {/* Tab switcher */}
        <div className="flex flex-wrap items-center gap-2 mt-6">
          {[
            { id: 'faq', label: 'Preguntas Frecuentes (FAQ)', icon: HelpCircle },
            { id: 'methodology', label: 'Metodología & Fórmulas', icon: BookOpen },
            { id: 'legal', label: 'Términos & Privacidad', icon: Shield },
            { id: 'contact', label: 'Contacto & Soporte', icon: MessageSquare }
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === t.id
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/10'
                    : 'bg-[#151921] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 text-cyan-400" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: FAQ */}
      {activeTab === 'faq' && (
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-[#151921] border border-slate-800 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[#1C222D]"
                >
                  <span className="text-sm font-bold text-white">{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: METHODOLOGY */}
      {activeTab === 'methodology' && (
        <div className="bg-[#151921] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed shadow-xl">
          <h3 className="text-base font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" /> Algoritmo de Ponderación de Hardware
          </h3>

          <p>
            El cálculo de <strong>Embudo</strong> no se basa en comparativas arbitrarias de precio o núcleos brutos, sino en el índice de balance de transferencia de fotogramas por segundo entre las etapas del pipeline de renderizado gráfico:
          </p>

          <div className="p-4 bg-[#1C222D] rounded-xl border border-slate-700 font-mono text-xs text-cyan-300 space-y-2">
            <div>1. CPU Score = (SingleCore × 0.65) + (MultiCore × 0.35) × RamFactor</div>
            <div>2. GPU Score = ResolutionTargetScore (1080p | 1440p | 4K)</div>
            <div>3. Relative Gap = |CPU Score - GPU Score| / Max(CPU, GPU)</div>
            <div>4. Bottleneck % = Max(0, Round(Relative Gap × (ResolutionScalingFactor)))</div>
          </div>

          <h4 className="text-sm font-bold text-white pt-2 uppercase tracking-wider">Factores de Corrección Aplicados:</h4>
          <ul className="list-disc pl-5 space-y-2 text-slate-400">
            <li><strong>Penalización Single Channel RAM:</strong> Si la memoria se detecta en un solo módulo, se aplica una penalización automática del 18% al 24% en los 1% Lows debido a la congestión de transferencias entre CPU y GPU.</li>
            <li><strong>Escalado de Resolución:</strong> En 1080p el procesador prepara y envía los draw calls a una tasa muy alta, requiriendo un IPC superior. En 4K Ultra HD la tarjeta gráfica requiere procesar más de 8.3 millones de píxeles por fotograma, convirtiéndose en el componente dominante.</li>
            <li><strong>Picos Transitorios de Fuente:</strong> Se calcula el consumo nominal sumando CPU TDP + GPU TDP + periféricos (60W fijos), y se aplica un multiplicador de 1.35x para asegurar compatibilidad con estándares ATX 3.1.</li>
          </ul>
        </div>
      )}

      {/* TAB 3: LEGAL & PRIVACY */}
      {activeTab === 'legal' && (
        <div className="bg-[#151921] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed shadow-xl">
          <h3 className="text-base font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" /> Descargo de Responsabilidad & Política de Privacidad
          </h3>

          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-1">1. Naturaleza de las Estimaciones</h4>
              <p className="text-slate-400">
                Los resultados ofrecidos por <strong>Embudo</strong> constituyen estimaciones orientativas y simulaciones basadas en benchmarks de laboratorio, especificaciones de fabricantes y datos empíricos de la comunidad. El rendimiento real puede variar según la optimización del juego, temperatura ambiente, versiones de drivers o estado del sistema operativo.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-1">2. Privacidad y Telemetría Anónima</h4>
              <p className="text-slate-400">
                No recopilamos información personal sensible. Si el usuario autoriza el consentimiento de telemetría estadística, únicamente se agregan de forma anónima los modelos de CPU, GPU y resolución seleccionados con fines de investigación y visualización de tendencias para la comunidad.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-1">3. Marcas Comerciales</h4>
              <p className="text-slate-400">
                AMD, Intel, NVIDIA, Qualcomm, Apple, MediaTek y todos los nombres de procesadores y videojuegos mencionados pertenecen a sus respectivos propietarios y se utilizan exclusivamente con fines descriptivos y comparativos bajo el principio de uso justo (Fair Use).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CONTACT & SUPPORT */}
      {activeTab === 'contact' && (
        <div className="bg-[#151921] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <h3 className="text-base font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-cyan-400" /> Formulario de Contacto & Sugerencias de Hardware
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">
            ¿Encontraste un componente que falta en la base de datos o tienes dudas con un resultado? Envíanos un mensaje y lo revisaremos.
          </p>

          {messageSent ? (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>¡Mensaje recibido! Gracias por ayudarnos a mejorar Embudo.</span>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">TU NOMBRE</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="ej: Carlos M."
                    className="w-full p-2.5 bg-[#1C222D] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">TU CORREO</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="carlos@ejemplo.com"
                    className="w-full p-2.5 bg-[#1C222D] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">MENSAJE O SUGERENCIA</label>
                <textarea
                  rows={4}
                  required
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Detalla tu consulta o el componente que deseas agregar..."
                  className="w-full p-2.5 bg-[#1C222D] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-cyan-500/20"
              >
                Enviar Mensaje
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
