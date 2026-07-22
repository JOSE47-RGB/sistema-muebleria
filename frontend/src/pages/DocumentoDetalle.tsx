import { useEffect, useState } from "react";
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

  const { id } = useParams<{
    id: string;
  }>();

  const [documento, setDocumento] =
    useState<DocumentoVenta | null>(null);

  const [cargando, setCargando] =
    useState(true);

  useEffect(() => {
    const cargarDocumento = async () => {
      if (!id) {
        alert(
          "El identificador del documento no es válido",
        );

        navigate("/documentos");
        return;
      }

      try {
        const respuesta =
          await api.get<DocumentoVenta>(
            `/documentos/${id}`,
          );

        setDocumento(respuesta.data);
      } catch (error: any) {
        console.error(
          "ERROR AL CARGAR DOCUMENTO:",
          error,
        );

        alert(
          error.response?.data?.message ||
            "Error al cargar el documento",
        );

        navigate("/documentos");
      } finally {
        setCargando(false);
      }
    };

    cargarDocumento();
  }, [id, navigate]);

  const registrarImpresion = async () => {
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
  };

  const imprimir = async () => {
    await registrarImpresion();

    window.print();
  };

  const guardarComoPdf = async () => {
    await registrarImpresion();

    alert(
      'En la ventana de impresión selecciona "Guardar como PDF".',
    );

    window.print();
  };

  const regresar = () => {
    navigate("/documentos");
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
    return (
      <Layout>
        <Card>
          <div className="text-center">
            <p className="mb-4 text-slate-500">
              No se encontró el documento.
            </p>

            <BotonSecundario
              type="button"
              onClick={regresar}
            >
              Regresar
            </BotonSecundario>
          </div>
        </Card>
      </Layout>
    );
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
          onClick={guardarComoPdf}
        >
          Guardar como PDF
        </BotonPrimario>

        <BotonSecundario
          type="button"
          onClick={regresar}
        >
          Regresar
        </BotonSecundario>
      </div>

      <Card className="print:rounded-none print:p-0 print:shadow-none">
        <ReciboVenta documento={documento} />
      </Card>
    </Layout>
  );
}