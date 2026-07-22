import { useEffect, useState } from "react";
import { api } from "../services/api";

import Layout from "../components/Layout";
import Card from "../components/Card";
import Input from "../components/Input";
import TituloPagina from "../components/TituloPagina";
import BotonPrimario from "../components/BotonPrimario";
import BotonSecundario from "../components/BotonSecundario";
import Tabla from "../components/Tabla";
import Badge from "../components/Badge";

type Proveedor = {
  id_proveedor: number;
  codigo_proveedor: string;
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  estado: number;
};

export default function Proveedores() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  const [form, setForm] = useState({
    codigo_proveedor: "",
    nombre: "",
    telefono: "",
    direccion: "",
  });

  const cargarProveedores = async () => {
    const res = await api.get("/proveedores");
    setProveedores(res.data);
  };

  useEffect(() => {
    cargarProveedores();
  }, []);

  const cambiar = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.post("/proveedores", form);
      alert("Proveedor creado correctamente");

      setForm({
        codigo_proveedor: "",
        nombre: "",
        telefono: "",
        direccion: "",
      });

      cargarProveedores();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al crear proveedor");
    }
  };

  const desactivar = async (id: number) => {
    if (!confirm("¿Deseas desactivar este proveedor?")) return;

    try {
      await api.patch(`/proveedores/${id}/desactivar`);
      cargarProveedores();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al desactivar proveedor");
    }
  };

  return (
    <Layout>
      <TituloPagina
        titulo="Proveedores"
        descripcion="Administra los proveedores del sistema."
      />

      <Card className="max-w-5xl mb-6">
        <form onSubmit={guardar} className="grid grid-cols-2 gap-4">
          <Input
            label="Código proveedor"
            name="codigo_proveedor"
            value={form.codigo_proveedor}
            onChange={cambiar}
            placeholder="PROV001"
            required
          />

          <Input
            label="Nombre"
            name="nombre"
            value={form.nombre}
            onChange={cambiar}
            placeholder="Proveedor principal"
            required
          />

          <Input
            label="Teléfono"
            name="telefono"
            value={form.telefono}
            onChange={cambiar}
            placeholder="30417275"
          />

          <Input
            label="Dirección"
            name="direccion"
            value={form.direccion}
            onChange={cambiar}
            placeholder="Quetzaltenango"
          />

          <div className="col-span-2 flex gap-4 pt-2">
            <BotonPrimario type="submit" className="flex-1">
              Guardar proveedor
            </BotonPrimario>

            <BotonSecundario
              type="button"
              className="flex-1"
              onClick={() => {
                window.location.href = "/dashboard";
              }}
            >
              Regresar al menú
            </BotonSecundario>
          </div>
        </form>
      </Card>

      <Tabla<Proveedor>
        datos={proveedores}
        columnas={[
          {
            titulo: "Código",
            render: (p) => p.codigo_proveedor,
          },
          {
            titulo: "Nombre",
            render: (p) => p.nombre,
          },
          {
            titulo: "Teléfono",
            render: (p) => p.telefono || "Sin teléfono",
          },
          {
            titulo: "Dirección",
            render: (p) => p.direccion || "Sin dirección",
          },
          {
            titulo: "Estado",
            render: (p) =>
              p.estado === 1 ? (
                <Badge texto="Activo" tipo="verde" />
              ) : (
                <Badge texto="Inactivo" tipo="rojo" />
              ),
          },
          {
            titulo: "Acción",
            render: (p) =>
              p.estado === 1 ? (
                <button
                  onClick={() => desactivar(p.id_proveedor)}
                  className="text-red-600 font-semibold hover:underline"
                >
                  Desactivar
                </button>
              ) : (
                <span className="text-slate-400">Sin acción</span>
              ),
          },
        ]}
      />
    </Layout>
  );
}