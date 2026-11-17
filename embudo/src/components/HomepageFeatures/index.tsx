import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  to: string;
  cta: string;
  icon: ReactNode;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Asistente de Cuello de Botella (4 Pasos)',
    to: '/guia/diagnostico-pc/asistente-paso-a-paso',
    cta: 'Ver guía del asistente →',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2"/>
        <rect x="9" y="9" width="6" height="6"/>
        <path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/>
        <path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>
      </svg>
    ),
    description: (
      <>
        Flujo secuencial paso a paso para seleccionar CPU, GPU, resolución (1080p a 8K), memoria
        RAM y carga de trabajo con evaluación instantánea de <strong>CPU/GPU Bound</strong>, FPS y Watts.
      </>
    ),
  },
  {
    title: 'Auto-Escáner en Vivo (WebGL / WebGPU)',
    to: '/guia/diagnostico-pc/auto-escaner-vivo',
    cta: 'Explorar detección WebGL →',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
        <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
        <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
        <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
        <path d="M7 12h10"/>
      </svg>
    ),
    description: (
      <>
        Detección <strong>Zero-Install</strong> directamente en el navegador leyendo{' '}
        <code>UNMASKED_RENDERER_WEBGL</code>, hilos lógicos, <code>deviceMemory</code> y resolución
        nativa de pantalla sin comandos PowerShell ni descargas.
      </>
    ),
  },
  {
    title: 'SoCs Móviles & API REST',
    to: '/guia/api/endpoints',
    cta: 'Consultar endpoints API →',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ),
    description: (
      <>
        Documentación completa de la API Express (<code>/api/components/all</code>,{' '}
        <code>/api/calculate/bottleneck</code>, <code>/api/phones/*</code>) e integración con el
        catálogo BuildCores y GSMArena.
      </>
    ),
  },
];

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className={styles.grid}>
        {FeatureList.map((item, idx) => (
          <article key={idx} className={styles.card}>
            <div>
              <div className={styles.iconWrap}>{item.icon}</div>
              <Heading as="h3" className={styles.cardTitle}>
                {item.title}
              </Heading>
              <p className={styles.cardDesc}>{item.description}</p>
            </div>
            <Link className={styles.cardLink} to={item.to}>
              {item.cta}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
