---
sidebar_position: 2
---

# Auto-Escáner en Vivo (Zero-Install)

El **Auto-Escáner en Vivo** permite detectar el hardware del equipo directamente desde el navegador al pulsar **Escanear mi PC actual**, sin descargar ejecutables ni ejecutar comandos en PowerShell o Terminal.

---

## Web APIs Utilizadas

| Componente | Web API / Fuente | Precisión y Comportamiento |
| :--- | :--- | :--- |
| **Tarjeta Gráfica (GPU)** | `WEBGL_debug_renderer_info` (`UNMASKED_RENDERER_WEBGL`) y `navigator.gpu.requestAdapter()` | Extrae el string real de GPU (ej. `NVIDIA GeForce RTX 3060`, `AMD Radeon RX 6700 XT`, `Intel Arc B580`, `Apple M3 Pro`). |
| **Procesador (CPU)** | `navigator.hardwareConcurrency` | Lee la cantidad exacta de hilos lógicos disponibles (ej. `8`, `12`, `16`, `24`, `32`). |
| **Memoria RAM** | `navigator.deviceMemory` | Estima la RAM del sistema ajustada frente al límite de privacidad de Chromium. |
| **Monitor / Pantalla** | `window.screen.width`, `window.screen.height`, `window.devicePixelRatio` | Mapea la resolución física real a `1080p`, `1440p`, `ultrawide`, `4k` o `8k`. |

---

## Lógica de Parseo y Matching (`hardwareDetector.ts`)

1. **Limpieza del string WebGL**: Se eliminan wrappers como `ANGLE (...)`, `Direct3D11`, `vs_5_0`, `ps_5_0` para aislar fabricante, serie y modelo exacto (distinguiendo variantes como `Ti`, `SUPER`, `XT`, `XTX`, `GRE`).
2. **Emparejamiento de CPU por hilos + confirmación en 1 clic**:
   - Dado que los navegadores ocultan el nombre comercial exacto de la CPU x86 por privacidad, EMBUDO.tech autocompleta **GPU**, **RAM** y **Resolución** y presenta los modelos de CPU coincidentes con el conteo de hilos detectado (`getCandidateCpusForThreads`).
   - En dispositivos **Apple Silicon (macOS)**, la combinación de WebGPU/WebGL, pantalla Retina y hilos identifica directamente el chip (`M1`, `M2`, `M3`, `M4`).
3. **Despliegue inmediato**: Al confirmar, el asistente salta automáticamente al **Paso 4: Resultados del Análisis**.
