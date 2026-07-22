import { useEffect, useState } from "react";
import { api } from "../services/api";

import Layout from "../components/Layout";
import Card from "../components/Card";
import Input from "../components/Input";
import Select from "../components/Select";
import TituloPagina from "../components/TituloPagina";
import BotonPrimario from "../components/BotonPrimario";
import BotonSecundario from "../components/BotonSecundario";
import Tabla from "../components/Tabla";

type Sucursal = {
  id_sucursal: number;
  nombre: string;
};

type Variante = {
  id_variante: number;
  codigo_variante: string;
  codigo_producto: string;
  producto: string;
};

type Proveedor = {
  id_proveedor: number;
  nombre: string;
};

type Entrada = {
  id_movimiento: number;
  fecha: string;
  sucursal: string;
  producto: string;
  codigo_variante: string;
  cantidad: number;
  referencia: string | null;
  descripcion: string | null;
  usuario: string;
};

export default function EntradasInventario() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [variantes, setVariantes] = useState<Variante[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [entradas, setEntradas] = useState<Entrada[]>([]);

  const [form, setForm] = useState({
    id_sucursal: 1,
    id_variante: 0,
    id_proveedor: 0,
    cantidad: "",
    stock_minimo: "",
    referencia: "",
    descripcion: "",
  });

  const cargarCatalogos = async () => {
    const res = await api.get("/entradas-inventario/catalogos");
    setSucursales(res.data.sucursales);
    setVariantes(res.data.variantes);
    setProveedores(res.data.proveedores);
  };

  const cargarEntradas = async () => {
    const res = await api.get("/entradas-inventario");
    setEntradas(res.data);
  };

  useEffect(() => {
    cargarCatalogos();
    cargarEntradas();
  }, []);

  const cambiar = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: [
        "id_sucursal",
        "id_variante",
        "id_proveedor",
      ].includes(e.target.name)
        ? Number(e.target.value)
        : e.target.value,
    });
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.post("/entradas-inventario", {
        ...form,
        id_proveedor: form.id_proveedor === 0 ? null : form.id_proveedor,
        cantidad: Number(form.cantidad),
        stock_minimo: Number(form.stock_minimo || 0),
      });

      alert("Entrada registrada correctamente");

      setForm({
        id_sucursal: 1,
        id_variante: 0,
        id_proveedor: 0,
        cantidad: "",
        stock_minimo: "",
        referencia: "",
        descripcion: "",
      });

      cargarEntradas();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al registrar entrada");
    }
  };

  return (
    <Layout>
      <TituloPagina
        titulo="Entradas de inventario"
        descripcion="Registra ingresos de mercadería al inventario."
      />

      <Card className="mb-6">
        <form onSubmit={guardar} className="grid grid-cols-3 gap-4">
          <Select
            label="Sucursal"
            name="id_sucursal"
            value={form.id_sucursal}
            onChange={cambiar}
            required
          >
            {sucursales.map((s) => (
              <option key={s.id_sucursal} value={s.id_sucursal}>
                {s.nombre}
              </option>
            ))}
          </Select>

          <Select
            label="Producto / Variante"
            name="id_variante"
            value={form.id_variante}
            onChange={cambiar}
            required
          >
            <option value={0}>Seleccione producto</option>
            {variantes.map((v) => (
              <option key={v.id_variante} value={v.id_variante}>
                {v.producto} - {v.codigo_variante}
              </option>
            ))}
          </Select>

          <Select
            label="Proveedor"
            name="id_proveedor"
            value={form.id_proveedor}
            onChange={cambiar}
          >
            <option value={0}>Sin proveedor</option>
            {proveedores.map((p) => (
              <option key={p.id_proveedor} value={p.id_proveedor}>
                {p.nombre}
              </option>
            ))}
          </Select>

          <Input
            label="Cantidad"
            type="number"
            name="cantidad"
            value={form.cantidad}
            onChange={cambiar}
            placeholder="10"
            required
          />

          <Input
            label="Stock mínimo"
            type="number"
            name="stock_minimo"
            value={form.stock_minimo}
            onChange={cambiar}
            placeholder="5"
          />

          <Input
            label="Referencia / Factura"
            name="referencia"
            value={form.referencia}
            onChange={cambiar}
            placeholder="FAC-001"
          />

          <Input
            label="Descripción"
            name="descripcion"
            value={form.descripcion}
            onChange={cambiar}
            placeholder="Entrada por compra"
          />

          <div className="col-span-3 flex gap-4">
            <BotonPrimario type="submit" className="flex-1">
              Guardar entrada
            </BotonPrimario>

            <BotonSecundario
              type="button"
              className="flex-1"
              onClick={() => {
                window.location.href = "/inventario";
              }}
            >
              Regresar a inventario
            </BotonSecundario>
          </div>
        </form>
      </Card>

      <TituloPagina
        titulo="Últimas entradas"
        descripcion="Historial reciente de entradas de inventario."
      />

      <Tabla<Entrada>
        datos={entradas}
        columnas={[
          {
            titulo: "Fecha",
            render: (e) => new Date(e.fecha).toLocaleString(),
          },
          {
            titulo: "Sucursal",
            render: (e) => e.sucursal,
          },
          {
            titulo: "Producto",
            render: (e) => e.producto,
          },
          {
            titulo: "Variante",
            render: (e) => e.codigo_variante,
          },
          {
            titulo: "Cantidad",
            render: (e) => `+${e.cantidad}`,
          },
          {
            titulo: "Referencia",
            render: (e) => e.referencia || "-",
          },
          {
            titulo: "Usuario",
            render: (e) => e.usuario,
          },
        ]}
      />
    </Layout>
  );
}