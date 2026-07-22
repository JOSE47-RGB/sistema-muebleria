import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { api } from "../services/api";

import Layout from "../components/Layout";
import Card from "../components/Card";
import Loader from "../components/Loader";
import BotonPrimario from "../components/BotonPrimario";
import BotonSecundario from "../components/BotonSecundario";
import ReciboVenta, {
  type DocumentoVenta,
} from "../components/ReciboVenta";

export default function DocumentoDetalle() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [documento, setDocumento] =
    useState<DocumentoVenta | null>(null);

  const [cargando, setCargando] =
    useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const respuesta =
          await api.get<DocumentoVenta>(
            `/documentos/${id}`,
          );

        setDocumento(respuesta.data);
      } catch (error: any) {
        alert(
          error.response?.data?.message ||
            "Error al cargar el documento",
        );

        navigate("/documentos");
      } finally {
        setCargando(false);
      }
    };

    cargar();
  }, [id, navigate]);

  const imprimir = async () => {
    if (!documento) {
      return;
    }

    try {
      await api.post(
        `/documentos/${documento.id_documento}/imprimir`,
      );
    } catch (error) {
      console.error(
        "No se pudo registrar la impresión:",
        error,
      );
    }

    window.print();
  };

  if (cargando) {
    return (
      <Layout>
        <Card>
          <Loader texto="Cargando recibo..." />
        </Card>
      </Layout>
    );
  }

  if (!documento) {
    return null;
  }

  return (
    <Layout>
      <div className="mb-5 flex flex-wrap gap-3 print:hidden">
  <BotonPrimario
    type="button"
    onClick={imprimir}
  >
    Imprimir recibo
  </BotonPrimario>

  <BotonPrimario
    type="button"
    onClick={imprimir}
  >
    Guardar como PDF
  </BotonPrimario>

  <BotonSecundario
    type="button"
    onClick={() => navigate("/documentos")}
  >
    Regresar
  </BotonSecundario>
</div>

<BotonPrimario
  type="button"
  onClick={imprimir}
>
  Imprimir / Guardar PDF
</BotonPrimario>

      <Card className="print:rounded-none print:p-0 print:shadow-none">
        <ReciboVenta
          documento={documento}
        />
      </Card>
    </Layout>
  );
}