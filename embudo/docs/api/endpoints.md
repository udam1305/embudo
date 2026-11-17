---
sidebar_position: 1
---

# Referencia de Endpoints API REST

El backend Express de EMBUDO.tech expone endpoints JSON para cálculo de cuello de botella, sincronización del catálogo de hardware y consultas de smartphones.

---

## Endpoints de Sistema & Componentes

### `GET /api/health`
Verifica el estado activo del motor Express.

```json
{
  "status": "ok",
  "service": "Embudo Core Engine"
}
```

### `GET /api/components/all`
Devuelve el catálogo completo de **CPUs, GPUs, Placas Base, RAM, Almacenamiento, PSUs y SoCs móviles**.

### `POST /api/calculate/bottleneck`
Calcula el diagnóstico completo a partir de la configuración de hardware enviada en el cuerpo JSON:

```json
{
  "cpu": { "id": "cpu-7800x3d", "name": "AMD Ryzen 7 7800X3D" },
  "gpu": { "id": "gpu-5070ti", "name": "NVIDIA GeForce RTX 5070 Ti" },
  "ram": { "id": "ram-corsair-veng-rgb-32-6000", "capacityGb": 32 },
  "storage": { "id": "stor-2tb-gen4", "capacityGb": 2000 },
  "resolution": "1440p"
}
```

### `POST /api/calculate/mobile`
Evalúa rendimiento gráfico, FPS y throttling térmico de un SoC móvil.

---

## Endpoints de Smartphones (Mobile Specs API)

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/phones/brands` | Lista todas las marcas de smartphones disponibles. |
| `GET` | `/api/phones/latest` | Dispositivos recién lanzados. |
| `GET` | `/api/phones/search?query=pixel` | Búsqueda en el catálogo de +6,000 dispositivos. |
| `GET` | `/api/phones/details/:slug` | Especificaciones técnicas detalladas de un modelo. |
