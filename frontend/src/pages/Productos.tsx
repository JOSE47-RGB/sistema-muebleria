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
import Badge from "../components/Badge";

type Producto = {
  id_producto: number;
  codigo_producto: string;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  marca: string | null;
  codigo_variante: string | null;
  precio_venta: number;
  unidad_medida: string | null;
  abreviatura: string | null;
  estado: number;
};

type Categoria = {
  id_categoria: number;
  nombre: string;
};

type Marca = {
  id_marca: number;
  nombre: string;
};

type Unidad = {
  id_unidad_medida: number;
  nombre: string;
  abreviatura: string;
};

export default function Productos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [unidades, setUnidades] = useState<Unidad[]>([]);

  const [form, setForm] = useState({
    codigo_producto: "",
    id_categoria: 0,
    id_marca: 0,
    nombre: "",
    descripcion: "",
    codigo_variante: "",
    id_unidad_medida: 0,
    color: "",
    material: "",
    medida: "",
    precio_venta: "",
  });

  const cargarProductos = async () => {
    const res = await api.get("/productos");
    setProductos(res.data);
  };

  const cargarCatalogos = async () => {
    const res = await api.get("/productos/catalogos");
    setCategorias(res.data.categorias);
    setMarcas(res.data.marcas);
    setUnidades(res.data.unidades);
  };

  useEffect(() => {
    cargarProductos();
    cargarCatalogos();
  }, []);

  const cambiar = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: [
        "id_categoria",
        "id_marca",
        "id_unidad_medida",
      ].includes(e.target.name)
        ? Number(e.target.value)
        : e.target.value,
    });
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.post("/productos", {
        ...form,
        id_marca: form.id_marca === 0 ? null : form.id_marca,
        id_unidad_medida:
          form.id_unidad_medida === 0 ? null : form.id_unidad_medida,
        precio_venta: Number(form.precio_venta),
      });

      alert("Producto creado correctamente");

      setForm({
        codigo_producto: "",
        id_categoria: 0,
        id_marca: 0,
        nombre: "",
        descripcion: "",
        codigo_variante: "",
        id_unidad_medida: 0,
        color: "",
        material: "",
        medida: "",
        precio_venta: "",
      });

      cargarProductos();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al crear producto");
    }
  };

  const desactivar = async (id: number) => {
    if (!confirm("¿Deseas desactivar este producto?")) return;

    try {
      await api.patch(`/productos/${id}/desactivar`);
      cargarProductos();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al desactivar producto");
    }
  };

  return (
    <Layout>
      <TituloPagina
        titulo="Productos"
        descripcion="Administra productos, marcas, categorías y variantes."
      />

      <Card className="mb-6">
        <form onSubmit={guardar} className="grid grid-cols-3 gap-4">
          <Input
            label="Código producto"
            name="codigo_producto"
            value={form.codigo_producto}
            onChange={cambiar}
            placeholder="PROD001"
            required
          />

          <Input
            label="Nombre producto"
            name="nombre"
            value={form.nombre}
            onChange={cambiar}
            placeholder="Sofá Verona"
            required
          />

          <Select
            label="Categoría"
            name="id_categoria"
            value={form.id_categoria}
            onChange={cambiar}
            required
          >
            <option value={0}>Seleccione categoría</option>
            {categorias.map((c) => (
              <option key={c.id_categoria} value={c.id_categoria}>
                {c.nombre}
              </option>
            ))}
          </Select>

          <Select
            label="Marca"
            name="id_marca"
            value={form.id_marca}
            onChange={cambiar}
          >
            <option value={0}>Sin marca</option>
            {marcas.map((m) => (
              <option key={m.id_marca} value={m.id_marca}>
                {m.nombre}
              </option>
            ))}
          </Select>

          <Input
            label="Descripción"
            name="descripcion"
            value={form.descripcion}
            onChange={cambiar}
            placeholder="Descripción del producto"
          />

          <Input
            label="Código variante"
            name="codigo_variante"
            value={form.codigo_variante}
            onChange={cambiar}
            placeholder="PROD001-GRIS"
            required
          />

          <Select
            label="Unidad de medida"
            name="id_unidad_medida"
            value={form.id_unidad_medida}
            onChange={cambiar}
          >
            <option value={0}>Sin unidad</option>
            {unidades.map((u) => (
              <option key={u.id_unidad_medida} value={u.id_unidad_medida}>
                {u.nombre} ({u.abreviatura})
              </option>
            ))}
          </Select>

          <Input
            label="Color"
            name="color"
            value={form.color}
            onChange={cambiar}
            placeholder="Gris"
          />

          <Input
            label="Material"
            name="material"
            value={form.material}
            onChange={cambiar}
            placeholder="Madera / Tela"
          />

          <Input
            label="Medida"
            name="medida"
            value={form.medida}
            onChange={cambiar}
            placeholder="2 metros"
          />

          <Input
            label="Precio venta"
            name="precio_venta"
            type="number"
            value={form.precio_venta}
            onChange={cambiar}
            placeholder="2500"
            required
          />

          <div className="col-span-3 flex gap-4 pt-2">
            <BotonPrimario type="submit" className="flex-1">
              Guardar producto
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

      <Tabla<Producto>
        datos={productos}
        columnas={[
          {
            titulo: "Código",
            render: (p) => p.codigo_producto,
          },
          {
            titulo: "Producto",
            render: (p) => p.nombre,
          },
          {
            titulo: "Categoría",
            render: (p) => p.categoria,
          },
          {
            titulo: "Marca",
            render: (p) => p.marca || "Sin marca",
          },
          {
            titulo: "Variante",
            render: (p) => p.codigo_variante || "Sin variante",
          },
          {
            titulo: "Precio",
            render: (p) => `Q ${p.precio_venta.toFixed(2)}`,
          },
          {
            titulo: "Unidad",
            render: (p) =>
              p.unidad_medida
                ? `${p.unidad_medida} (${p.abreviatura})`
                : "Sin unidad",
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
                  onClick={() => desactivar(p.id_producto)}
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