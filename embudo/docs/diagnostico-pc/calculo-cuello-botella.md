---
sidebar_position: 3
---

# Metodología de Cuello de Botella

El motor `calculatorEngine.ts` evalúa el equilibrio dinámico entre el rendimiento mononúcleo/multinúcleo del procesador y la potencia rasterizada + VRAM de la tarjeta gráfica según la resolución elegida.

---

## Interpretación de Resultados

- **0% – 10% (Óptimo / Equilibrado)**: La CPU y la GPU trabajan en armonía sin desperdicio significativo de capacidad.
- **CPU Bound (Limitado por Procesador)**: Frecuente en **1080p competitivo** o al emparejar GPUs de gama alta con procesadores de generaciones anteriores. La GPU no logra alcanzar el 95–100% de carga.
- **GPU Bound (Limitado por Gráfica)**: Deseable para gaming en **1440p y 4K Ultra**. La tarjeta gráfica trabaja al 100% entregando el máximo rendimiento disponible.

## Impacto de Resolución y Reescalado

| Resolución | Carga Principal | Tecnología Recomendada |
| :--- | :--- | :--- |
| **1080p Full HD** | Alta exigencia en CPU | DLSS / FSR Calidad solo si se busca >144 Hz |
| **1440p Quad HD** | Equilibrio CPU / GPU | Nativo o DLSS/FSR/XeSS Calidad |
| **4K Ultra HD** | Carga pesada sobre GPU y VRAM | DLSS 4 / FSR 3.1 + Frame Generation |
