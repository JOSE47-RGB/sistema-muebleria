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

type Marca = {
  id_marca: number;
  codigo_marca: string;
  nombre: string;
  estado: number;
};

export default function Marcas() {
  const [marcas, setMarcas] = useState<Marca[]>([]);

  const [form, setForm] = useState({
    codigo_marca: "",
    nombre: "",
  });

  const cargarMarcas = async () => {
    const res = await api.get("/marcas");
    setMarcas(res.data);
  };

  useEffect(() => {
    cargarMarcas();
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
      await api.post("/marcas", form);
      alert("Marca creada correctamente");

      setForm({
        codigo_marca: "",
        nombre: "",
      });

      cargarMarcas();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al crear marca");
    }
  };

  const desactivar = async (id: number) => {
    if (!confirm("¿Deseas desactivar esta marca?")) return;

    try {
      await api.patch(`/marcas/${id}/desactivar`);
      cargarMarcas();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al desactivar marca");
    }
  };

  return (
    <Layout>
      <TituloPagina
        titulo="Marcas"
        descripcion="Administra las marcas de productos del sistema."
      />

      <Card className="max-w-4xl mb-6">
        <form onSubmit={guardar} className="grid grid-cols-2 gap-4">
          <Input
            label="Código de marca"
            name="codigo_marca"
            value={form.codigo_marca}
            onChange={cambiar}
            placeholder="SAMSUNG"
            required
          />

          <Input
            label="Nombre"
            name="nombre"
            value={form.nombre}
            onChange={cambiar}
            placeholder="Samsung"
            required
          />

          <div className="col-span-2 flex gap-4 pt-2">
            <BotonPrimario type="submit" className="flex-1">
              Guardar marca
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

      <Tabla<Marca>
        datos={marcas}
        columnas={[
          {
            titulo: "Código",
            render: (m) => m.codigo_marca,
          },
          {
            titulo: "Nombre",
            render: (m) => m.nombre,
          },
          {
            titulo: "Estado",
            render: (m) =>
              m.estado === 1 ? (
                <Badge texto="Activo" tipo="verde" />
              ) : (
                <Badge texto="Inactivo" tipo="rojo" />
              ),
          },
          {
            titulo: "Acción",
            render: (m) =>
              m.estado === 1 ? (
                <button
                  onClick={() => desactivar(m.id_marca)}
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