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

type UnidadMedida = {
  id_unidad_medida: number;
  codigo_unidad: string;
  nombre: string;
  abreviatura: string;
  estado: number;
};

export default function UnidadesMedida() {
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);

  const [form, setForm] = useState({
    codigo_unidad: "",
    nombre: "",
    abreviatura: "",
  });

  const cargarUnidades = async () => {
    const res = await api.get("/unidades-medida");
    setUnidades(res.data);
  };

  useEffect(() => {
    cargarUnidades();
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
      await api.post("/unidades-medida", form);
      alert("Unidad de medida creada correctamente");

      setForm({
        codigo_unidad: "",
        nombre: "",
        abreviatura: "",
      });

      cargarUnidades();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al crear unidad");
    }
  };

  const desactivar = async (id: number) => {
    if (!confirm("¿Deseas desactivar esta unidad de medida?")) return;

    try {
      await api.patch(`/unidades-medida/${id}/desactivar`);
      cargarUnidades();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al desactivar unidad");
    }
  };

  return (
    <Layout>
      <TituloPagina
        titulo="Unidades de medida"
        descripcion="Administra las unidades usadas en productos e inventario."
      />

      <Card className="max-w-4xl mb-6">
        <form onSubmit={guardar} className="grid grid-cols-3 gap-4">
          <Input
            label="Código"
            name="codigo_unidad"
            value={form.codigo_unidad}
            onChange={cambiar}
            placeholder="UNIDAD"
            required
          />

          <Input
            label="Nombre"
            name="nombre"
            value={form.nombre}
            onChange={cambiar}
            placeholder="Unidad"
            required
          />

          <Input
            label="Abreviatura"
            name="abreviatura"
            value={form.abreviatura}
            onChange={cambiar}
            placeholder="Und"
            required
          />

          <div className="col-span-3 flex gap-4 pt-2">
            <BotonPrimario type="submit" className="flex-1">
              Guardar unidad
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

      <Tabla<UnidadMedida>
        datos={unidades}
        columnas={[
          {
            titulo: "Código",
            render: (u) => u.codigo_unidad,
          },
          {
            titulo: "Nombre",
            render: (u) => u.nombre,
          },
          {
            titulo: "Abreviatura",
            render: (u) => u.abreviatura,
          },
          {
            titulo: "Estado",
            render: (u) =>
              u.estado === 1 ? (
                <Badge texto="Activo" tipo="verde" />
              ) : (
                <Badge texto="Inactivo" tipo="rojo" />
              ),
          },
          {
            titulo: "Acción",
            render: (u) =>
              u.estado === 1 ? (
                <button
                  onClick={() => desactivar(u.id_unidad_medida)}
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