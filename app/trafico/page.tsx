import type { Metadata } from "next";
import Home from "../page";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Tráfico en España en tiempo real",
  description:
    "Consulta las incidencias de tráfico actuales en España: accidentes, obras, cortes de carretera y retenciones. Datos abiertos de la DGT.",
  alternates: { canonical: "/" },
};

export default Home;
