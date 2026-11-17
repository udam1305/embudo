import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/docs/blog',
    component: ComponentCreator('/docs/blog', '377'),
    exact: true
  },
  {
    path: '/docs/blog/archive',
    component: ComponentCreator('/docs/blog/archive', '5ff'),
    exact: true
  },
  {
    path: '/docs/blog/authors',
    component: ComponentCreator('/docs/blog/authors', '164'),
    exact: true
  },
  {
    path: '/docs/blog/lanzamiento-embudo-v2-6',
    component: ComponentCreator('/docs/blog/lanzamiento-embudo-v2-6', 'd8f'),
    exact: true
  },
  {
    path: '/docs/blog/tags',
    component: ComponentCreator('/docs/blog/tags', 'a37'),
    exact: true
  },
  {
    path: '/docs/blog/tags/hardware',
    component: ComponentCreator('/docs/blog/tags/hardware', 'a49'),
    exact: true
  },
  {
    path: '/docs/blog/tags/lanzamiento',
    component: ComponentCreator('/docs/blog/tags/lanzamiento', '98f'),
    exact: true
  },
  {
    path: '/docs/blog/tags/webgl',
    component: ComponentCreator('/docs/blog/tags/webgl', 'ff9'),
    exact: true
  },
  {
    path: '/docs/markdown-page',
    component: ComponentCreator('/docs/markdown-page', '1e2'),
    exact: true
  },
  {
    path: '/docs/guia',
    component: ComponentCreator('/docs/guia', '2ae'),
    routes: [
      {
        path: '/docs/guia',
        component: ComponentCreator('/docs/guia', 'c10'),
        routes: [
          {
            path: '/docs/guia',
            component: ComponentCreator('/docs/guia', 'fe4'),
            routes: [
              {
                path: '/docs/guia/api/endpoints',
                component: ComponentCreator('/docs/guia/api/endpoints', '206'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/guia/category/diagnóstico-pc',
                component: ComponentCreator('/docs/guia/category/diagnóstico-pc', 'ffc'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/guia/diagnostico-pc/asistente-paso-a-paso',
                component: ComponentCreator('/docs/guia/diagnostico-pc/asistente-paso-a-paso', '58e'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/guia/diagnostico-pc/auto-escaner-vivo',
                component: ComponentCreator('/docs/guia/diagnostico-pc/auto-escaner-vivo', '6c7'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/guia/diagnostico-pc/calculo-cuello-botella',
                component: ComponentCreator('/docs/guia/diagnostico-pc/calculo-cuello-botella', '57c'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/guia/intro',
                component: ComponentCreator('/docs/guia/intro', 'dc8'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/guia/smartphones/diagnostico-soc',
                component: ComponentCreator('/docs/guia/smartphones/diagnostico-soc', 'bcb'),
                exact: true,
                sidebar: "tutorialSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/docs/',
    component: ComponentCreator('/docs/', '2a6'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
