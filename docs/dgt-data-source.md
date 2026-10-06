# Fuente de datos: DGT / NAP

Investigación realizada el 2026-10-06 con peticiones reales a los endpoints.

## Endpoint elegido

| Campo | Valor |
|---|---|
| Dataset | **Incidencias DGT DATEX2 v3.7** (NAP, nap.dgt.es) |
| URL | `https://nap.dgt.es/datex2/v3/dgt/SituationPublication/datex2_v37.xml` |
| Formato | XML DATEX II v3 (perfil "DGT (Spain) Profile RTTI SituationPublication", `profileVersion 3.7_1.0`) |
| Método | HTTPS GET (pull), sin API key, sin registro |
| Compresión | `gzip` (≈5,1 MB → ≈167 KB) |
| Frecuencia | Cada 1 minuto según el NAP. Cabecera `Cache-Control: max-age≈10-13` en la CDN |
| Licencia | Creative Commons Attribution (CC BY), gratuito. Condiciones: <https://www.dgt.es/contenido/aviso-legal/> |
| CORS | **No** hay cabeceras `Access-Control-Allow-*` → no se puede llamar desde el navegador. **Hace falta proxy server-side** |
| Cobertura | Red estatal de carreteras **excepto País Vasco y Cataluña** (ver abajo) |
| Documentación | Página del dataset: <https://nap.dgt.es/dataset/incidencias-dgt-datex2-v3-7> (incluye XSD y PDF del perfil) |

`.../datex2_v36.xml` responde con `301` al v3.7. El dataset "Incidencias DGT DATEX2 v3 (A EXTINGUIR 12/01/2026)" está retirado.

## Estructura real

```
d2:payload (xsi:type=sit:SituationPublication)
  com:publicationTime
  sit:situation id=…            (782 en la muestra)
    sit:overallSeverity?        (opcional)
    sit:situationRecord id=… version=… xsi:type=sit:<Tipo>   (1153 en la muestra; 1..12 por situación)
      sit:situationRecordCreationTime / VersionTime
      sit:severity?
      sit:source/com:sourceIdentification     DGT | DGT3.0 | 112 | JCYL
      sit:validity/com:validityStatus         (solo "active" observado)
        com:validityTimeSpecification/com:overallStartTime, com:overallEndTime?
      sit:cause/sit:causeType + sit:detailedCauseType/<tipo específico>
      sit:locationReference xsi:type=loc:SingleRoadLinearLocation | loc:PointLocation
        loc:supplementaryPositionalDescription/loc:roadInformation/loc:roadName, loc:roadDestination?
        loc:tpegLinearLocation/{from,to}  |  loc:tpegPointLocation/point
          loc:pointCoordinates/{latitude,longitude}
          …/lse:{autonomousCommunity,province,municipality,kilometerPoint}
        loc:tpegDirection (compás) + lse:tpegDirectionRoad (positive|negative|both)
      campos específicos del tipo (p. ej. sit:roadOrCarriagewayOrLaneManagementType)
```

Tipos de `situationRecord` observados (muestra): `RoadOrCarriagewayOrLaneManagement` 788, `GenericSituationRecord` 254, `AbnormalTraffic` 33, `GeneralObstruction` 30, `SpeedManagement` 19, `NonWeatherRelatedRoadConditions` 19, `PoorEnvironmentConditions` 6, `GeneralInstructionOrMessageToRoadUsers` 3, `VehicleObstruction` 1.

`causeType` observados: roadMaintenance, vehicleObstruction, obstruction, environmentalObstruction, accident, infrastructureDamageObstruction, abnormalTraffic, roadOrCarriagewayOrLaneManagement, poorEnvironment.

## Limitaciones del dato

- **No hay texto descriptivo libre**: solo códigos. La descripción mostrada se construye traduciendo esos códigos; no se inventa nada.
- `severity` solo aparece en ~10 % de los registros y solo con valores `medium`/`highest`.
- `validityStatus` observado: solo `active`. `overallEndTime` aparece en ~57 %.
- No hay retenciones "reales" por tramo: `AbnormalTraffic` (`slowTraffic`) es lo más cercano (≈59 registros).
- Un registro puede tener tramo (from/to) o punto. Se usa el punto medio para el marcador.
- Fuentes mezcladas dentro del feed: `DGT`, `DGT3.0`, `112` y `JCYL` (Castilla y León).
- Canarias aparece (Santa Cruz de Tenerife, Las Palmas).

## Cobertura: Cataluña y País Vasco

El NAP lo declara: el dataset excluye País Vasco y Cataluña (competencias de tráfico transferidas: Servei Català de Trànsit y Dirección de Tráfico del Gobierno Vasco). En la muestra real:

- **País Vasco: 0 registros.**
- **Cataluña: 14 registros** (9 con provincia Barcelona), en tramos de competencia estatal; **no** es una cobertura completa.

La interfaz lo indica de forma visible. Esas administraciones publican sus propios feeds en el NAP, no incorporados en v1.

## Otros feeds comprobados

| Feed | URL | Estado | Uso |
|---|---|---|---|
| Cámaras DGT DATEX2 v3.7 | `https://nap.dgt.es/datex2/v3/dgt/DevicePublication/camaras_datex2_v37.xml` | 200 OK, ≈3,7 MB, actualización horaria, CC BY | No en v1 (mejora futura) |
| SRTI LOD DATEX II | `http://nap.dgt.es/datex2/lod/dgt/incidencias.rdf` | Responde `301` (RDF/XML, ≤5 min). Formato más pesado y obsoleto | Descartado |
| Paneles DGT (tiempo real / ubicaciones) | No se localizó una URL verificada | — | Pendiente de investigar |

## Mapa base

OpenStreetMap (tiles estándar) con atribución. Su política de uso (<https://operations.osmfoundation.org/policies/tiles/>) permite uso moderado pero no garantiza servicio para tráfico elevado; la URL de tiles es configurable (`NEXT_PUBLIC_TILE_URL`) para cambiar a otro proveedor o a tiles propios.
