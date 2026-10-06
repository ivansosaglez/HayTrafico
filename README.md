# HayTrafico

Mapa web de **incidencias de tráfico en España en tiempo real**, hecho solo con datos abiertos de la DGT y software libre. Coste de operación: 0 €. Sin API keys, sin cuentas y sin rastreadores.

> Proyecto personal. No está afiliado ni respaldado por la Dirección General de Tráfico.

**Demo:** _añade aquí la URL de Vercel cuando la tengas_

<!-- Añade capturas: docs/screenshot-desktop.png y docs/screenshot-mobile.png -->

## Qué hace

- Mapa (Leaflet + OpenStreetMap) con las incidencias activas: accidentes, retenciones, obras, cortes, peligros y otros. Cada tipo tiene color, forma y símbolo distintos, así que no depende solo del color.
- Clustering para renderizar más de mil marcadores sin penalizar el móvil.
- Panel lateral en escritorio y hoja deslizable en móvil, con recuentos, filtros y lista.
- Modo Lista con orden por hora, gravedad, tipo o carretera.
- Filtros por tipo, provincia, comunidad, carretera, gravedad, estado, sentido y "solo recientes", más búsqueda libre (`A-6`, `Madrid`, `Tenerife`…).
- Actualización automática cada 60 s, en pausa con la pestaña oculta, con indicador de frescura.
- Si la DGT falla, la interfaz lo dice y distingue "no hay incidencias" de "no se ha podido conectar con DGT".
- Aviso visible de cobertura: la DGT no publica Cataluña ni País Vasco.
- Páginas SEO por ciudad (`/trafico/madrid`, …), PWA instalable y página `/fuentes`.

## Decisiones técnicas

| Decisión | Motivo |
|---|---|
| Proxy en una route de Next.js | El NAP de la DGT no envía cabeceras CORS |
| Caché en memoria + `s-maxage` en la CDN | El feed pesa ~5 MB (≈170 KB con gzip) y se actualiza cada minuto: no se consulta desde cada navegador |
| Modelo interno `TrafficIncident` | Los componentes React no conocen DATEX II; si la DGT cambia el perfil solo se toca `lib/dgt/` |
| Tolerancia a datos incompletos | Un registro roto se descarta sin afectar al resto; nunca se inventan coordenadas ni campos |
| Leaflet directo, sin `react-leaflet` | Con clustering y resaltado de marcadores es más simple y evita una dependencia |
| Sin base de datos | No hace falta para mostrar el estado actual |

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Leaflet + leaflet.markercluster · fast-xml-parser · Vitest. Todas las dependencias son open source (MIT, BSD-2 o Apache-2.0).

## Arquitectura

```
Navegador ──► /api/incidents ──► caché en memoria (TTL) ──► NAP DGT (XML DATEX II v3.7)
```

| Ruta | Contenido |
|---|---|
| `lib/dgt/dgt-client.ts` | Descarga server-side con timeout, caché con TTL, *single-flight* y copia antigua marcada como `stale` si la DGT falla |
| `lib/dgt/datex-parser.ts` | XML → objetos sin namespaces |
| `lib/dgt/incident-normalizer.ts`, `classify.ts` | DATEX II → `TrafficIncident` y categorías |
| `lib/dgt/config.ts` | Constantes configurables (TTL, polling, tiles) |
| `lib/incidents/` | Filtros, orden, etiquetas, formato, ciudades SEO, carreteras populares |
| `components/`, `hooks/` | UI |
| `tests/` | Vitest con fixtures locales (no dependen de la DGT) |

## Fuente de datos

- Dataset **Incidencias DGT DATEX2 v3.7**: `https://nap.dgt.es/datex2/v3/dgt/SituationPublication/datex2_v37.xml`
- Formato XML, actualización cada minuto, licencia Creative Commons Attribution (CC BY). Condiciones: <https://www.dgt.es/contenido/aviso-legal/>
- Investigación completa, estructura real y feeds descartados: [`docs/dgt-data-source.md`](docs/dgt-data-source.md)
- Mapa base: © colaboradores de [OpenStreetMap](https://www.openstreetmap.org/copyright) (ODbL).

## Desarrollo local

Requiere Node.js 20 o superior (probado con 22).

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # tests
npm run typecheck
npm run build && npm start
```

## Despliegue en Vercel

No hace falta `vercel.json` ni base de datos. Funciona en el plan gratuito.

1. Sube el proyecto a GitHub. El directorio aún no es un repositorio: `git init`, commit y push.
2. En Vercel: **Add New → Project**, importa el repo. Se detecta Next.js solo, sin cambiar el build ni el output.
3. Antes de desplegar, añade en **Settings → Environment Variables**:
   - `NEXT_PUBLIC_SITE_URL` = la URL final, por ejemplo `https://haytrafico.tudominio.com`. La usan canonical, sitemap y robots.
4. Despliega. Si luego añades un dominio propio, actualiza `NEXT_PUBLIC_SITE_URL` y redespliega, porque es una variable de build.

Comprobaciones tras el despliegue:

- `/api/incidents` responde JSON con `incidents` y `stale: false`.
- `/manifest.webmanifest`, `/sitemap.xml` y `/trafico/madrid` responden 200.
- El mapa muestra marcadores y la atribución de OpenStreetMap.

**Consumo en el plan gratuito.** Las páginas se renderizan en servidor y la caché es en memoria por instancia: una instancia fría hace una petición a la DGT (≈170 KB comprimidos). `/api/incidents` envía `s-maxage`, por lo que la CDN de Vercel absorbe la mayor parte del tráfico de un portfolio.

**Tiles de OpenStreetMap.** Los tiles estándar valen para un portfolio con tráfico moderado, pero su [política de uso](https://operations.osmfoundation.org/policies/tiles/) no ampara tráfico alto ni uso comercial. Si el proyecto crece, cambia de proveedor con `NEXT_PUBLIC_TILE_URL` y `NEXT_PUBLIC_TILE_ATTRIBUTION`, respetando la licencia del nuevo proveedor.

## Variables de entorno

Todas son opcionales (ver `.env.example`). La DGT no requiere API key.

| Variable | Defecto | Uso |
|---|---|---|
| `DGT_API_URL` | feed v3.7 | URL del feed |
| `DGT_CACHE_TTL` | `60` | Segundos de caché en servidor |
| `NEXT_PUBLIC_POLL_INTERVAL` | `60` | Segundos entre consultas del navegador |
| `NEXT_PUBLIC_TILE_URL` | OSM estándar | Plantilla `{z}/{x}/{y}` del proveedor de tiles |
| `NEXT_PUBLIC_TILE_ATTRIBUTION` | OSM | Atribución en HTML |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Canonical, sitemap y robots |

Las variables `NEXT_PUBLIC_*` se incorporan en el build: tras cambiarlas hay que redesplegar. No hay secretos en el repositorio.

## Cómo funciona el parser DATEX II

1. `parseDatex` convierte el XML con `fast-xml-parser` (`removeNSPrefix`, `isArray` para `situation` y `situationRecord`) y devuelve cada registro junto a su situación.
2. `normalizeRecord` lee con accesores tolerantes: tipo, causa, restricción de carril o calzada, ubicación (tramo `from/to` o punto), extensiones `lse:*` (provincia, municipio, p. k.), vigencia y severidad.
3. `classifyType` decide la categoría con reglas explícitas. Prioridad: accidente, tráfico anormal, corte, obras, peligro, otros.
4. Un registro sin id se descarta. Las coordenadas fuera de España o ausentes dejan la incidencia en la lista pero sin marcador. Las fechas inválidas pasan a `null` y los códigos desconocidos reciben una etiqueta genérica.
5. Para traducir un código nuevo, edita los diccionarios de `lib/dgt/classify.ts`.

## Cambiar el intervalo de actualización

- Navegador: `NEXT_PUBLIC_POLL_INTERVAL`, o `POLL_INTERVAL_SECONDS` en `lib/dgt/config.ts`.
- Servidor: `DGT_CACHE_TTL`, o `DGT_CACHE_TTL_SECONDS` en el mismo archivo.

La DGT actualiza cada minuto, así que no tiene sentido bajar de ~30 s.

## Limitaciones

- **Cobertura:** el dataset excluye País Vasco y Cataluña. En la muestra analizada hubo 0 registros del País Vasco y 14 de Cataluña (de 1.153), en tramos concretos. Las vías autonómicas y locales aparecen de forma desigual.
- **Sin texto libre:** el feed solo trae códigos. Las descripciones se construyen traduciéndolos y, si un dato no existe, se omite.
- **Gravedad:** viene informada en ~10 % de los registros.
- **Datos antiguos:** algunas obras llevan meses activas en origen. Usa "Solo recientes".
- **Retenciones:** son las que la DGT marca como tráfico anormal, no una medición de velocidad de toda la red.
- **Sin modo offline:** es instalable como PWA, pero no hay service worker.

Información orientativa. Ante cualquier duda, sigue la señalización y las indicaciones de las autoridades.

## Posibles mejoras

Cámaras de la DGT (feed horario ya verificado), feeds de Cataluña y País Vasco del NAP, tiles vectoriales o propios, service worker, páginas por carretera y geolocalización del usuario.

## Licencia y atribución

Código del proyecto: [MIT](LICENSE). Datos de tráfico: Dirección General de Tráfico (CC BY). Mapa: © colaboradores de OpenStreetMap.
