import {
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import { api } from "../services/api";

import Layout from "../components/Layout";
import Card from "../components/Card";
import Input from "../components/Input";
import Tabla from "../components/Tabla";
import Badge from "../components/Badge";
import Loader from "../components/Loader";
import TituloPagina from "../components/TituloPagina";
import BotonPrimario from "../components/BotonPrimario";
import BotonSecundario from "../components/BotonSecundario";

type DocumentoListado = {
  id_documento: number;
  codigo_documento: string;
  tipo_documento: string;
  codigo_tipo: string;
  origen: string;
  id_origen: number;
  fecha: string;
  cliente: string;
  nit: string | null;
  total: number;
  vendedor?: string;
  usuario: string;
  sucursal: string;
  estado: string;
  codigo_estado: string;
};

export default function Documentos() {
  const navigate = useNavigate();

  const [documentos, setDocumentos] =
    useState<DocumentoListado[]>([]);

  const [buscar, setBuscar] =
    useState("");

  const [cargando, setCargando] =
    useState(true);

  const cargar = async () => {
    try {
      setCargando(true);

      const respuesta =
        await api.get<DocumentoListado[]>(
          "/documentos",
          {
            params: {
              buscar: buscar.trim() || undefined,
            },
          },
        );

      setDocumentos(respuesta.data);
    } catch (error: any) {
      alert(
        error.response?.data?.message ||
          "Error al cargar documentos",
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  return (
    <Layout>
      <TituloPagina
        titulo="Documentos"
        descripcion="Consulta e imprime recibos, vales y comprobantes."
      />

      <Card className="mb-6">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <Input
              label="Buscar documento"
              value={buscar}
              onChange={(e) =>
                setBuscar(e.target.value)
              }
              placeholder="Código, cliente o NIT"
            />
          </div>

          <div className="flex items-end gap-3">
            <BotonPrimario
              type="button"
              onClick={cargar}
            >
              Buscar
            </BotonPrimario>

            <BotonSecundario
              type="button"
              onClick={() =>
                navigate("/dashboard")
              }
            >
              Regresar
            </BotonSecundario>
          </div>
        </div>
      </Card>

      {cargando ? (
        <Card>
          <Loader texto="Cargando documentos..." />
        </Card>
      ) : (
        <Tabla<DocumentoListado>
          datos={documentos}
          mensajeVacio="No hay documentos registrados"
          columnas={[
            {
              titulo: "Documento",
              render: (documento) => (
                <div>
                  <p className="font-semibold">
                    {
                      documento.codigo_documento
                    }
                  </p>

                  <p className="text-xs text-slate-500">
                    {documento.tipo_documento}
                  </p>
                </div>
              ),
            },
            {
              titulo: "Fecha",
              render: (documento) =>
                new Date(
                  documento.fecha,
                ).toLocaleString(),
            },
            {
              titulo: "Cliente",
              render: (documento) =>
                documento.cliente,
            },
            {
              titulo: "Total",
              render: (documento) =>
                `Q${Number(
                  documento.total,
                ).toFixed(2)}`,
            },
            {
              titulo: "Estado",
              render: (documento) => (
                <Badge
                  texto={documento.estado}
                  tipo={
                    documento.codigo_estado ===
                    "ACTIVO"
                      ? "verde"
                      : "rojo"
                  }
                />
              ),
            },
            {
              titulo: "Acción",
              render: (documento) => (
                <button
                  type="button"
                  className="font-semibold text-blue-600 hover:underline"
                  onClick={() =>
                    navigate(
                      `/documentos/${documento.id_documento}`,
                    )
                  }
                >
                  Ver / imprimir
                </button>
              ),
            },
          ]}
        />
      )}
    </Layout>
  );
}