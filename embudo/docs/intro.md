---
sidebar_position: 1
---

# Introducción a EMBUDO.tech v2.6

**EMBUDO.tech** es una plataforma integral de diagnóstico de hardware diseñada para calcular con precisión el **cuello de botella (bottleneck)** entre CPU y GPU, estimar el rendimiento en **FPS**, el consumo eléctrico real en **Watts** y evaluar **SoCs móviles**.

---

## Módulos Principales

| Módulo | Acceso | Descripción |
| :--- | :--- | :--- |
| **Diagnóstico PC (Wizard 4 Pasos)** | Público | Asistente paso a paso para CPU, GPU, Resolución/RAM y Resultados completos. |
| **Auto-Escáner en Vivo** | Público | Detección instantánea en el navegador mediante WebGL, WebGPU y Navigator APIs. |
| **Calculadoras & PSU** | Con sesión iniciada | Dimensionamiento de fuente de poder ATX 3.0/3.1 y márgenes de seguridad. |
| **Comparador PC** | Con sesión iniciada | Comparativa directa Setup A vs Setup B. |
| **Smartphones & SoCs** | Con sesión iniciada | Diagnóstico térmico (Thermal Throttling) y fichas vía Mobile Specs API. |
| **Catálogo & Admin** | Con sesión iniciada | Ensambles 0% Bottleneck, catálogo BuildCores y hot-updates en vivo. |

---

## Control de Acceso y Seguridad

En la barra superior de la aplicación principal (`Navbar.tsx`):

- **Usuario sin sesión (`isLoggedIn === false`)**: solo visualiza el logo **EMBUDO.tech**, **Diagnóstico PC** y el botón **LOGIN**.
- **Usuario autenticado (`isLoggedIn === true`)**: se desbloquean **Calculadoras**, **Comparador PC**, **Smartphones**, **Catálogo**, **Cuenta**, **Historial** y **Admin**.

---

## Siguientes Pasos

- Revisa cómo funciona el [Asistente Paso a Paso (4 Pasos)](./diagnostico-pc/asistente-paso-a-paso).
- Conoce la arquitectura del [Auto-Escáner en Vivo (WebGL)](./diagnostico-pc/auto-escaner-vivo).
- Consulta los [Endpoints de la API REST](./api/endpoints).
