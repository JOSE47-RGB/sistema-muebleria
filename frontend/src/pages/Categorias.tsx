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

type Categoria = {
  id_categoria: number;
  id_tipo_categoria: number;
  codigo_categoria: string;
  nombre: string;
  estado: number;
};

export default function Categorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const [form, setForm] = useState({
    id_tipo_categoria: 1,
    codigo_categoria: "",
    nombre: "",
  });

  const cargarCategorias = async () => {
    const res = await api.get("/categorias");
    setCategorias(res.data);
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  const cambiar = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]:
        e.target.name === "id_tipo_categoria"
          ? Number(e.target.value)
          : e.target.value,
    });
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.post("/categorias", form);
      alert("Categoría creada correctamente");

      setForm({
        id_tipo_categoria: 1,
        codigo_categoria: "",
        nombre: "",
      });

      cargarCategorias();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al crear categoría");
    }
  };

  const desactivar = async (id: number) => {
    if (!confirm("¿Deseas desactivar esta categoría?")) return;

    try {
      await api.patch(`/categorias/${id}/desactivar`);
      cargarCategorias();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al desactivar categoría");
    }
  };

  return (
    <Layout>
      <TituloPagina
        titulo="Categorías"
        descripcion="Administra las categorías de productos del sistema."
      />

      <Card className="max-w-4xl mb-6">
        <form onSubmit={guardar} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Tipo de categoría
            </label>

            <select
              name="id_tipo_categoria"
              value={form.id_tipo_categoria}
              onChange={cambiar}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value={1}>Muebles</option>
              <option value={2}>Electrodomésticos</option>
            </select>
          </div>

          <Input
            label="Código de categoría"
            name="codigo_categoria"
            value={form.codigo_categoria}
            onChange={cambiar}
            placeholder="SALAS"
            required
          />

          <Input
            label="Nombre"
            name="nombre"
            value={form.nombre}
            onChange={cambiar}
            placeholder="Salas"
            required
          />

          <div className="col-span-2 flex gap-4 pt-2">
            <BotonPrimario type="submit" className="flex-1">
              Guardar categoría
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

      <Tabla<Categoria>
        datos={categorias}
        columnas={[
          {
            titulo: "Código",
            render: (c) => c.codigo_categoria,
          },
          {
            titulo: "Nombre",
            render: (c) => c.nombre,
          },
          {
            titulo: "Estado",
            render: (c) =>
              c.estado === 1 ? (
                <Badge texto="Activo" tipo="verde" />
              ) : (
                <Badge texto="Inactivo" tipo="rojo" />
              ),
          },
          {
            titulo: "Acción",
            render: (c) =>
              c.estado === 1 ? (
                <button
                  onClick={() => desactivar(c.id_categoria)}
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