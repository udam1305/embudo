import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={styles.heroSection}>
      <div className={styles.heroGlow} />
      <div className={styles.heroInner}>
        <div className={styles.heroBadge}>
          <span>⚡ MOTOR DE MEDICIÓN DE HARDWARE v2.6</span>
        </div>

        <Heading as="h1" className={styles.heroTitle}>
          Documentación Técnica de{' '}
          <span className={styles.heroGradientText}>EMBUDO.tech</span>
        </Heading>

        <p className={styles.heroSubtitle}>
          {siteConfig.tagline}. Explora la arquitectura del Asistente de 4 Pasos, el Auto-Escáner
          Zero-Install por WebGL/WebGPU, las fórmulas de cuello de botella y los endpoints de la API.
        </p>

        <div className={styles.heroButtons}>
          <Link className={styles.primaryBtn} to="/guia/intro">
            <span>Explorar Documentación</span>
            <span>→</span>
          </Link>

          <Link
            className={styles.secondaryBtn}
            to="/guia/diagnostico-pc/auto-escaner-vivo">
            <span>Auto-Escáner WebGL</span>
          </Link>

          <a className={styles.secondaryBtn} href="/">
            <span>Ir a la Plataforma en Vivo</span>
          </a>
        </div>

        <div className={styles.metricsStrip}>
          <div className={styles.metricPill}>
            <div className={styles.metricValue}>4 Pasos</div>
            <div className={styles.metricLabel}>Asistente secuencial CPU → GPU → Entorno</div>
          </div>
          <div className={styles.metricPill}>
            <div className={styles.metricValue}>Zero-Install</div>
            <div className={styles.metricLabel}>Escaneo WebGL / WebGPU en navegador</div>
          </div>
          <div className={styles.metricPill}>
            <div className={styles.metricValue}>20,000+</div>
            <div className={styles.metricLabel}>Componentes PC & 6,000+ Smartphones</div>
          </div>
          <div className={styles.metricPill}>
            <div className={styles.metricValue}>REST API</div>
            <div className={styles.metricLabel}>Endpoints de cálculo y telemetría</div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="Documentación Oficial"
      description="Guía técnica de EMBUDO.tech: Diagnóstico de Cuello de Botella, Auto-Escáner WebGL/WebGPU, SoCs Móviles y API REST.">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
