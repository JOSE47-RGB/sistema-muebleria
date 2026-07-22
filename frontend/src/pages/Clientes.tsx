import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../services/api";

import Layout from "../components/Layout";
import Card from "../components/Card";
import Input from "../components/Input";
import Select from "../components/Select";
import TituloPagina from "../components/TituloPagina";
import BotonPrimario from "../components/BotonPrimario";
import BotonSecundario from "../components/BotonSecundario";
import Tabla from "../components/Tabla";
import Badge from "../components/Badge";
import Loader from "../components/Loader";

type TipoCliente = {
  id_tipo_cliente: number;
  codigo: string;
  nombre: string;
  porcentaje_descuento: number;
};

type Cliente = {
  id_cliente: number;
  codigo_cliente: string;
  id_tipo_cliente: number;
  codigo_tipo_cliente: string;
  tipo_cliente: string;
  porcentaje_descuento: number;
  nombres: string;
  apellidos: string | null;
  cliente: string;
  telefono: string | null;
  nit: string | null;
  dpi: string | null;
  direccion: string | null;
  observaciones: string | null;
  estado: number;
  total_compras: number | string;
  cantidad_compras: number;
  ultima_compra: string | null;
};

type FormCliente = {
  id_tipo_cliente: number;
  nombres: string;
  apellidos: string;
  telefono: string;
  nit: string;
  dpi: string;
  direccion: string;
  observaciones: string;
};

const formularioInicial: FormCliente = {
  id_tipo_cliente: 0,
  nombres: "",
  apellidos: "",
  telefono: "",
  nit: "",
  dpi: "",
  direccion: "",
  observaciones: "",
};

export default function Clientes() {
  const navigate = useNavigate();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tiposCliente, setTiposCliente] = useState<TipoCliente[]>([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState<FormCliente>(formularioInicial);

  const cargarClientes = async () => {
    const respuesta = await api.get<Cliente[]>("/clientes");

    setClientes(
      Array.isArray(respuesta.data) ? respuesta.data : [],
    );
  };

  const cargarTiposCliente = async () => {
    const respuesta =
      await api.get<TipoCliente[]>("/clientes/tipos");

    const tipos = Array.isArray(respuesta.data)
      ? respuesta.data
      : [];

    setTiposCliente(tipos);

    if (tipos.length > 0) {
      setForm((actual) => ({
        ...actual,
        id_tipo_cliente:
          actual.id_tipo_cliente ||
          tipos[0].id_tipo_cliente,
      }));
    }
  };

  const cargarDatos = async () => {
    try {
      setCargando(true);

      await Promise.all([
        cargarClientes(),
        cargarTiposCliente(),
      ]);
    } catch (error: any) {
      console.error("Error al cargar clientes:", error);

      alert(
        error.response?.data?.message ||
          "Error al cargar clientes",
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cambiar = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    setForm((actual) => ({
      ...actual,
      [name]:
        name === "id_tipo_cliente"
          ? Number(value)
          : value,
    }));
  };

  const limpiarFormulario = () => {
    setForm({
      ...formularioInicial,
      id_tipo_cliente:
        tiposCliente.length > 0
          ? tiposCliente[0].id_tipo_cliente
          : 0,
    });
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.id_tipo_cliente <= 0) {
      alert("Debes seleccionar un tipo de cliente");
      return;
    }

    if (!form.nombres.trim()) {
      alert("Debes ingresar el nombre del cliente");
      return;
    }

    try {
      setGuardando(true);

      const datosCliente = {
        id_tipo_cliente: form.id_tipo_cliente,
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim() || null,
        telefono: form.telefono.trim() || null,
        nit: form.nit.trim() || null,
        dpi: form.dpi.trim() || null,
        direccion: form.direccion.trim() || null,
        observaciones:
          form.observaciones.trim() || null,
      };

      await api.post("/clientes", datosCliente);

      alert("Cliente creado correctamente");

      limpiarFormulario();

      await cargarClientes();
    } catch (error: any) {
      console.error("Error al crear cliente:", error);

      alert(
        error.response?.data?.message ||
          "Error al crear cliente",
      );
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (cliente: Cliente) => {
    const accion =
      cliente.estado === 1
        ? "desactivar"
        : "activar";

    const confirmar = window.confirm(
      `¿Deseas ${accion} al cliente ${cliente.cliente}?`,
    );

    if (!confirmar) {
      return;
    }

    try {
      await api.patch(
        `/clientes/${cliente.id_cliente}/${accion}`,
      );

      await cargarClientes();
    } catch (error: any) {
      console.error(
        `Error al ${accion} cliente:`,
        error,
      );

      alert(
        error.response?.data?.message ||
          `Error al ${accion} cliente`,
      );
    }
  };

  return (
    <Layout>
      <TituloPagina
        titulo="Clientes"
        descripcion="Administra los clientes y tipos de cliente del sistema."
      />

      <Card className="mb-6">
        <form
          onSubmit={guardar}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-sm font-semibold text-blue-700">
              Código automático
            </p>

            <p className="mt-1 text-sm text-blue-600">
              EL CODIGO DEL CLIENTE SE GENERA EN AUTOMATICO
              
            </p>
          </div>

          <Select
            label="Tipo de cliente"
            name="id_tipo_cliente"
            value={form.id_tipo_cliente}
            onChange={cambiar}
            required
          >
            <option value={0} disabled>
              Seleccione un tipo de cliente
            </option>

            {tiposCliente.map((tipo) => (
              <option
                key={tipo.id_tipo_cliente}
                value={tipo.id_tipo_cliente}
              >
                {tipo.nombre} -{" "}
                {Number(
                  tipo.porcentaje_descuento,
                ).toFixed(2)}
                % descuento
              </option>
            ))}
          </Select>

          <Input
            label="Nombres"
            name="nombres"
            value={form.nombres}
            onChange={cambiar}
            placeholder="Juan"
            required
          />

          <Input
            label="Apellidos"
            name="apellidos"
            value={form.apellidos}
            onChange={cambiar}
            placeholder="Pérez López"
          />

          <Input
            label="Teléfono"
            name="telefono"
            value={form.telefono}
            onChange={cambiar}
            placeholder="55555555"
          />

          <Input
            label="NIT"
            name="nit"
            value={form.nit}
            onChange={cambiar}
            placeholder="1234567-8"
          />

          <Input
            label="DPI"
            name="dpi"
            value={form.dpi}
            onChange={cambiar}
            placeholder="1234567890101"
          />

          <Input
            label="Dirección"
            name="direccion"
            value={form.direccion}
            onChange={cambiar}
            placeholder="Flores Costa Cuca"
          />

          <div className="md:col-span-2">
            <Input
              label="Observaciones"
              name="observaciones"
              value={form.observaciones}
              onChange={cambiar}
              placeholder="Información adicional del cliente"
            />
          </div>

          <div className="flex flex-col gap-4 pt-2 md:col-span-2 md:flex-row">
            <BotonPrimario
              type="submit"
              className="flex-1"
              disabled={
                guardando ||
                cargando ||
                tiposCliente.length === 0
              }
            >
              {guardando
                ? "Guardando..."
                : "Guardar cliente"}
            </BotonPrimario>

            <BotonSecundario
              type="button"
              className="flex-1"
              onClick={() => navigate("/dashboard")}
            >
              Regresar al menú
            </BotonSecundario>
          </div>
        </form>
      </Card>

      {cargando ? (
        <Card>
          <Loader texto="Cargando clientes..." />
        </Card>
      ) : (
        <Tabla<Cliente>
          datos={clientes}
          mensajeVacio="No hay clientes registrados"
          columnas={[
            {
              titulo: "Código",
              render: (cliente) =>
                cliente.codigo_cliente,
            },
            {
              titulo: "Cliente",
              render: (cliente) =>
                cliente.cliente ||
                `${cliente.nombres} ${
                  cliente.apellidos || ""
                }`.trim(),
            },
            {
              titulo: "Tipo",
              render: (cliente) => (
                <div>
                  <p className="font-semibold">
                    {cliente.tipo_cliente}
                  </p>

                  <p className="text-xs text-slate-500">
                    {Number(
                      cliente.porcentaje_descuento,
                    ).toFixed(2)}
                    % descuento
                  </p>
                </div>
              ),
            },
            {
              titulo: "NIT",
              render: (cliente) =>
                cliente.nit || "C/F",
            },
            {
              titulo: "Teléfono",
              render: (cliente) =>
                cliente.telefono || "-",
            },
            {
              titulo: "Compras",
              render: (cliente) => (
                <div>
                  <p>
                    {Number(
                      cliente.cantidad_compras || 0,
                    )}
                  </p>

                  <p className="text-xs text-slate-500">
                    Q{" "}
                    {Number(
                      cliente.total_compras || 0,
                    ).toFixed(2)}
                  </p>
                </div>
              ),
            },
            {
              titulo: "Estado",
              render: (cliente) =>
                cliente.estado === 1 ? (
                  <Badge
                    texto="Activo"
                    tipo="verde"
                  />
                ) : (
                  <Badge
                    texto="Inactivo"
                    tipo="rojo"
                  />
                ),
            },
            {
              titulo: "Acción",
              render: (cliente) => (
                <button
                  type="button"
                  onClick={() =>
                    cambiarEstado(cliente)
                  }
                  className={
                    cliente.estado === 1
                      ? "font-semibold text-red-600 hover:underline"
                      : "font-semibold text-green-600 hover:underline"
                  }
                >
                  {cliente.estado === 1
                    ? "Desactivar"
                    : "Activar"}
                </button>
              ),
            },
          ]}
        />
      )}
    </Layout>
  );
}