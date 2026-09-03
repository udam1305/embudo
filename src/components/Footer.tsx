import React from 'react';
import { Sparkles, Shield, Cpu, Smartphone, HelpCircle, Heart } from 'lucide-react';
import { ActiveTab } from './Navbar';

interface FooterProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  return (
    <footer className="border-t border-slate-800 bg-[#080A0E] text-slate-400 text-sm mt-16">
      {/* Top Status Sub-Bar */}
      <div className="border-b border-slate-800/80 px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-4 text-[10px] text-slate-500 font-mono">
        <div className="flex items-center gap-3 uppercase font-bold tracking-widest">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            SERVER STATUS: ONLINE
          </span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400">DB VER: v2.6.0 (2026)</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5 text-slate-400">
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div> 1,402 Diagnósticos en vivo
          </span>
          <button onClick={() => setActiveTab('support')} className="hover:text-cyan-400 transition-colors uppercase">
            SOPORTE TÉCNICO
          </button>
          <button onClick={() => setActiveTab('support')} className="hover:text-cyan-400 transition-colors uppercase">
            PRIVACIDAD
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white transform rotate-12">
                <span className="font-bold text-sm -rotate-12">E</span>
              </div>
              <span className="font-extrabold text-base tracking-tight text-white">EMBUDO<span className="text-cyan-500">.tech</span></span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Plataforma de alta precisión para el análisis de cuello de botella, cálculo energético, rendimiento gráfico en FPS y optimización térmica para PC y Smartphones.
            </p>
          </div>

          {/* Column 2: Diagnósticos PC */}
          <div>
            <h4 className="font-bold text-slate-400 mb-3 flex items-center gap-1.5 text-xs uppercase tracking-widest">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Diagnóstico & PC
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  id="footer-link-diag"
                  onClick={() => setActiveTab('pc-diag')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  Calculadora Cuello de Botella
                </button>
              </li>
              <li>
                <button
                  id="footer-link-comparator"
                  onClick={() => setActiveTab('comparator')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  Comparador PC (Setup A vs Setup B)
                </button>
              </li>
              <li>
                <button
                  id="footer-link-calc"
                  onClick={() => setActiveTab('calculators')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  Estimador de Watts & Fuente PSU
                </button>
              </li>
              <li>
                <button
                  id="footer-link-catalog"
                  onClick={() => setActiveTab('catalog')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  Catálogo de Ensambles 0% Bottleneck
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Módulo Móvil & Herramientas */}
          <div>
            <h4 className="font-bold text-slate-400 mb-3 flex items-center gap-1.5 text-xs uppercase tracking-widest">
              <Smartphone className="w-3.5 h-3.5 text-blue-400" /> Móvil & Gestión
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  id="footer-link-smartphones"
                  onClick={() => setActiveTab('smartphones')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  Diagnóstico SoCs & Thermal Throttling
                </button>
              </li>
              <li>
                <button
                  id="footer-link-gaming-mobile"
                  onClick={() => setActiveTab('smartphones')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  Rendimiento en 120 FPS & Emulación
                </button>
              </li>
              <li>
                <button
                  id="footer-link-account"
                  onClick={() => setActiveTab('account')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  Historial y Diagnósticos Guardados
                </button>
              </li>
              <li>
                <button
                  id="footer-link-admin"
                  onClick={() => setActiveTab('admin')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  Panel de Administración Interno
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Soporte y Legal */}
          <div>
            <h4 className="font-bold text-slate-400 mb-3 flex items-center gap-1.5 text-xs uppercase tracking-widest">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" /> Soporte & Legal
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  id="footer-link-support-faq"
                  onClick={() => setActiveTab('support')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  ¿Qué es el cuello de botella? (FAQ)
                </button>
              </li>
              <li>
                <button
                  id="footer-link-privacy"
                  onClick={() => setActiveTab('support')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  Política de Privacidad y Telemetría
                </button>
              </li>
              <li>
                <button
                  id="footer-link-terms"
                  onClick={() => setActiveTab('support')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  Términos y Condiciones
                </button>
              </li>
              <li>
                <button
                  id="footer-link-contact"
                  onClick={() => setActiveTab('support')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  Contacto & Fuentes Oficiales
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 mt-8 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Embudo.tech Data Measurement Systems. Todos los derechos reservados.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Diseñado con precisión para hardware de alto rendimiento</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
