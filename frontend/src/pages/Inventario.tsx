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

type InventarioItem = {
  id_inventario: number;
  sucursal: string;
  id_variante: number;
  codigo_producto: string;
  codigo_variante: string;
  producto: string;
  categoria: string;
  marca: string;
  stock_actual: number;
  stock_reservado: number;
  stock_minimo: number;
  stock_disponible: number;
  estado_stock: "NORMAL" | "BAJO";
};

type Sucursal = {
  id_sucursal: number;
  nombre: string;
};

type Variante = {
  id_variante: number;
  codigo_variante: string;
  producto: string;
};

type Kardex = {
  id_movimiento: number;
  fecha: string;
  sucursal: string;
  producto: string;
  codigo_variante: string;
  tipo_movimiento: string;
  afecta_stock: number;
  cantidad: number;
  referencia: string | null;
  descripcion: string | null;
  usuario: string;
};

export default function Inventario() {
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [variantes, setVariantes] = useState<Variante[]>([]);
  const [kardex, setKardex] = useState<Kardex[]>([]);

  const [filtro, setFiltro] = useState({
    id_sucursal: 0,
    buscar: "",
  });

  const [movimiento, setMovimiento] = useState({
    id_sucursal: 1,
    id_variante: 0,
    cantidad: "",
    stock_minimo: "",
    referencia: "",
    descripcion: "",
    tipo: "entrada",
  });

  const cargarCatalogos = async () => {
    const res = await api.get("/inventario/catalogos");
    setSucursales(res.data.sucursales);
    setVariantes(res.data.variantes);
  };

  const cargarInventario = async () => {
    const params = new URLSearchParams();

    if (filtro.id_sucursal > 0) {
      params.append("id_sucursal", String(filtro.id_sucursal));
    }

    if (filtro.buscar.trim() !== "") {
      params.append("buscar", filtro.buscar);
    }

    const res = await api.get(`/inventario?${params.toString()}`);
    setInventario(res.data);
  };

  const cargarKardex = async () => {
    const res = await api.get("/inventario/kardex");
    setKardex(res.data);
  };

  useEffect(() => {
    cargarCatalogos();
    cargarInventario();
    cargarKardex();
  }, []);

  const cambiarFiltro = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFiltro({
      ...filtro,
      [e.target.name]:
        e.target.name === "id_sucursal"
          ? Number(e.target.value)
          : e.target.value,
    });
  };

  const cambiarMovimiento = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setMovimiento({
      ...movimiento,
      [e.target.name]:
        e.target.name === "id_sucursal" || e.target.name === "id_variante"
          ? Number(e.target.value)
          : e.target.value,
    });
  };

  const guardarMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      id_sucursal: movimiento.id_sucursal,
      id_variante: movimiento.id_variante,
      cantidad: Number(movimiento.cantidad),
      stock_minimo: Number(movimiento.stock_minimo || 0),
      referencia: movimiento.referencia,
      descripcion: movimiento.descripcion,
    };

    let url = "/inventario/entrada";

    if (movimiento.tipo === "ajuste_positivo") {
      url = "/inventario/ajuste-positivo";
    }

    if (movimiento.tipo === "ajuste_negativo") {
      url = "/inventario/ajuste-negativo";
    }

    try {
      await api.post(url, payload);
      alert("Movimiento registrado correctamente");

      setMovimiento({
        id_sucursal: 1,
        id_variante: 0,
        cantidad: "",
        stock_minimo: "",
        referencia: "",
        descripcion: "",
        tipo: "entrada",
      });

      cargarInventario();
      cargarKardex();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al registrar movimiento");
    }
  };

  return (
    <Layout>
      <TituloPagina
        titulo="Inventario"
        descripcion="Control de existencias, entradas, ajustes y kardex."
      />

      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">Registrar movimiento</h2>

        <form onSubmit={guardarMovimiento} className="grid grid-cols-3 gap-4">
          <Select
            label="Tipo de movimiento"
            name="tipo"
            value={movimiento.tipo}
            onChange={cambiarMovimiento}
          >
            <option value="entrada">Entrada por compra</option>
            <option value="ajuste_positivo">Ajuste positivo</option>
            <option value="ajuste_negativo">Ajuste negativo</option>
          </Select>

          <Select
            label="Sucursal"
            name="id_sucursal"
            value={movimiento.id_sucursal}
            onChange={cambiarMovimiento}
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
            value={movimiento.id_variante}
            onChange={cambiarMovimiento}
            required
          >
            <option value={0}>Seleccione producto</option>
            {variantes.map((v) => (
              <option key={v.id_variante} value={v.id_variante}>
                {v.producto} - {v.codigo_variante}
              </option>
            ))}
          </Select>

          <Input
            label="Cantidad"
            type="number"
            name="cantidad"
            value={movimiento.cantidad}
            onChange={cambiarMovimiento}
            placeholder="10"
            required
          />

          <Input
            label="Stock mínimo"
            type="number"
            name="stock_minimo"
            value={movimiento.stock_minimo}
            onChange={cambiarMovimiento}
            placeholder="5"
          />

          <Input
            label="Referencia"
            name="referencia"
            value={movimiento.referencia}
            onChange={cambiarMovimiento}
            placeholder="COMPRA-001"
          />

          <Input
            label="Descripción"
            name="descripcion"
            value={movimiento.descripcion}
            onChange={cambiarMovimiento}
            placeholder="Entrada inicial de inventario"
          />

          <div className="col-span-3 flex gap-4">
            <BotonPrimario type="submit" className="flex-1">
              Guardar movimiento
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

      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">Filtros</h2>

        <div className="grid grid-cols-3 gap-4">
          <Select
            label="Sucursal"
            name="id_sucursal"
            value={filtro.id_sucursal}
            onChange={cambiarFiltro}
          >
            <option value={0}>Todas las sucursales</option>
            {sucursales.map((s) => (
              <option key={s.id_sucursal} value={s.id_sucursal}>
                {s.nombre}
              </option>
            ))}
          </Select>

          <Input
            label="Buscar"
            name="buscar"
            value={filtro.buscar}
            onChange={cambiarFiltro}
            placeholder="Producto, código o variante"
          />

          <div className="flex items-end">
            <BotonPrimario type="button" onClick={cargarInventario}>
              Buscar
            </BotonPrimario>
          </div>
        </div>
      </Card>

      <TituloPagina titulo="Existencias" />

      <Tabla<InventarioItem>
        datos={inventario}
        columnas={[
          { titulo: "Código", render: (i) => i.codigo_producto },
          { titulo: "Producto", render: (i) => i.producto },
          { titulo: "Variante", render: (i) => i.codigo_variante },
          { titulo: "Sucursal", render: (i) => i.sucursal },
          { titulo: "Stock", render: (i) => i.stock_actual },
          { titulo: "Reservado", render: (i) => i.stock_reservado },
          { titulo: "Disponible", render: (i) => i.stock_disponible },
          { titulo: "Mínimo", render: (i) => i.stock_minimo },
          {
            titulo: "Estado",
            render: (i) =>
              i.estado_stock === "BAJO" ? (
                <Badge texto="Stock bajo" tipo="rojo" />
              ) : (
                <Badge texto="Normal" tipo="verde" />
              ),
          },
        ]}
      />

      <div className="mt-8">
        <TituloPagina
          titulo="Kardex reciente"
          descripcion="Últimos movimientos de inventario."
        />

        <Tabla<Kardex>
          datos={kardex}
          columnas={[
            { titulo: "Fecha", render: (k) => new Date(k.fecha).toLocaleString() },
            { titulo: "Producto", render: (k) => k.producto },
            { titulo: "Variante", render: (k) => k.codigo_variante },
            { titulo: "Sucursal", render: (k) => k.sucursal },
            { titulo: "Movimiento", render: (k) => k.tipo_movimiento },
            {
              titulo: "Cantidad",
              render: (k) =>
                k.afecta_stock < 0 ? `-${k.cantidad}` : `+${k.cantidad}`,
            },
            { titulo: "Referencia", render: (k) => k.referencia || "-" },
            { titulo: "Usuario", render: (k) => k.usuario },
          ]}
        />
      </div>
    </Layout>
  );
}