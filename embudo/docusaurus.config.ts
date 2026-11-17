import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'EMBUDO.tech Docs',
  tagline:
    'Documentación oficial de medición de cuello de botella, Auto-Escáner en Vivo (WebGL/WebGPU) y telemetría de hardware v2.6',
  favicon: 'img/logo.svg',

  future: {
    v4: true,
  },

  url: 'https://embudo.tech',
  baseUrl: '/docs/',

  organizationName: 'embudo-tech',
  projectName: 'embudo',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'es',
    locales: ['es'],
  },

  stylesheets: [
    {
      href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap',
      type: 'text/css',
    },
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: 'guia',
          sidebarPath: './sidebars.ts',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'EMBUDO.tech',
      logo: {
        alt: 'EMBUDO.tech Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentación',
        },
        {
          to: '/guia/diagnostico-pc/auto-escaner-vivo',
          label: 'Auto-Escáner WebGL',
          position: 'left',
        },
        {
          to: '/guia/api/endpoints',
          label: 'API REST',
          position: 'left',
        },
        {
          to: '/blog',
          label: 'Novedades',
          position: 'left',
        },
        {
          href: 'pathname:///',
          target: '_self',
          label: '⚡ Abrir Plataforma',
          position: 'right',
          className: 'embudo-nav-cta',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Guías Técnicas',
          items: [
            {
              label: 'Introducción a EMBUDO.tech',
              to: '/guia/intro',
            },
            {
              label: 'Asistente Paso a Paso (4 Pasos)',
              to: '/guia/diagnostico-pc/asistente-paso-a-paso',
            },
            {
              label: 'Auto-Escáner en Vivo (WebGL)',
              to: '/guia/diagnostico-pc/auto-escaner-vivo',
            },
            {
              label: 'Metodología de Cuello de Botella',
              to: '/guia/diagnostico-pc/calculo-cuello-botella',
            },
          ],
        },
        {
          title: 'Plataforma en Vivo',
          items: [
            {
              label: 'Diagnóstico PC & Bottleneck',
              href: 'pathname:///#pc-diag',
              target: '_self',
            },
            {
              label: 'Diagnóstico Móvil (SoC)',
              to: '/guia/smartphones/diagnostico-soc',
            },
            {
              label: 'Referencia de Endpoints API',
              to: '/guia/api/endpoints',
            },
          ],
        },
        {
          title: 'Ecosistema',
          items: [
            {
              label: 'Novedades & Changelog',
              to: '/blog',
            },
            {
              label: 'Volver a EMBUDO.tech',
              href: 'pathname:///',
              target: '_self',
            },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} EMBUDO.tech Data Measurement Systems • Documentación Oficial v2.6`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.vsDark,
      additionalLanguages: ['bash', 'json', 'typescript'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
