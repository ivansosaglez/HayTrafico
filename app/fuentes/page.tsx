import type { Metadata } from "next";
import Link from "next/link";
import { DGT_API_URL, POLL_INTERVAL_SECONDS } from "@/lib/dgt/config";

export const metadata: Metadata = {
  title: "Fuentes y datos",
  description: "Origen, licencia, frecuencia de actualización, cobertura y limitaciones de los datos de tráfico.",
  alternates: { canonical: "/fuentes" },
};

const ext = { target: "_blank", rel: "noopener noreferrer", className: "text-blue-700 underline" } as const;

export default function Fuentes() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 text-slate-800">
      <Link href="/" className="btn-link">← Volver al mapa</Link>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">Fuentes y datos</h1>
      <p className="mt-3 text-lg">
        Los datos de tráfico proceden de fuentes públicas de la Dirección General de Tráfico.
      </p>
      <p className="mt-2 rounded-lg bg-slate-100 px-4 py-3 font-medium">
        Esta aplicación no está afiliada ni respaldada por la Dirección General de Tráfico.
      </p>

      <Section title="Fuente">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Conjunto de datos <strong>Incidencias DGT DATEX2 v3.7</strong>, publicado en el{" "}
            <a href="https://nap.dgt.es/" {...ext}>Punto de Acceso Nacional de Tráfico y Movilidad (NAP)</a>.{" "}
            <a href="https://nap.dgt.es/dataset/incidencias-dgt-datex2-v3-7" {...ext}>Ficha del dataset</a>.
          </li>
          <li>Endpoint: <code className="break-all rounded bg-slate-100 px-1 text-sm">{DGT_API_URL}</code></li>
          <li>Formato: XML DATEX II (perfil simplificado de la DGT).</li>
        </ul>
      </Section>

      <Section title="Frecuencia de actualización">
        <p>
          La DGT actualiza el feed cada minuto. Nuestro servidor guarda una copia en caché y la reutiliza para no
          sobrecargar la fuente; tu navegador consulta nuestro servidor cada {POLL_INTERVAL_SECONDS} segundos mientras
          la pestaña está visible. Si la fuente deja de responder, la interfaz lo indica y muestra la última copia
          disponible con su antigüedad.
        </p>
      </Section>

      <Section title="Licencia">
        <p>
          Los datos se publican con licencia Creative Commons Attribution (CC BY). Condiciones generales de la DGT:{" "}
          <a href="https://www.dgt.es/contenido/aviso-legal/" {...ext}>aviso legal</a>. Atribución: «Fuente: Dirección
          General de Tráfico (DGT)». Mapa base: © colaboradores de{" "}
          <a href="https://www.openstreetmap.org/copyright" {...ext}>OpenStreetMap</a> (ODbL).
        </p>
      </Section>

      <Section title="Cobertura" id="cobertura">
        <p>
          El dataset cubre la red estatal de carreteras <strong>excepto País Vasco y Cataluña</strong>, cuyo tráfico
          gestionan sus propios servicios (Dirección de Tráfico del Gobierno Vasco y Servei Català de Trànsit). En el
          feed aparecen algunas incidencias de Cataluña en tramos concretos, pero no hay cobertura completa, y del País
          Vasco no se ha observado ninguna. También se incluyen algunas carreteras autonómicas y provinciales
          comunicadas a la DGT por otras administraciones, de forma desigual según la zona.
        </p>
        <p className="mt-2">
          <strong>El mapa no representa todas las carreteras de España.</strong> La ausencia de incidencias en una zona
          no garantiza que no las haya.
        </p>
      </Section>

      <Section title="Limitaciones">
        <ul className="list-disc space-y-1 pl-5">
          <li>El feed publica códigos (tipo de causa, restricción, carril…), no texto libre: las descripciones se construyen traduciendo esos códigos.</li>
          <li>La gravedad solo está informada en una pequeña parte de las incidencias.</li>
          <li>Algunas incidencias llevan semanas o meses activas en origen (por ejemplo, obras de larga duración).</li>
          <li>Las retenciones son las que la DGT clasifica como tráfico anormal; no es una medición de velocidad en toda la red.</li>
          <li>Información orientativa: ante cualquier duda, sigue las indicaciones de las autoridades y la señalización.</li>
        </ul>
      </Section>

      <Section title="Privacidad">
        <p>Sin cuentas, sin analítica ni rastreadores. La aplicación no recopila datos personales.</p>
      </Section>
    </main>
  );
}

function Section({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-8 scroll-mt-4">
      <h2 className="mb-2 text-xl font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}
