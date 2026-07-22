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

type KardexItem = {
  id_movimiento: number;
  fecha: string;
  sucursal: string;
  codigo_producto: string;
  producto: string;
  codigo_variante: string;
  codigo_movimiento: string;
  tipo_movimiento: string;
  afecta_stock: number;
  cantidad: number;
  cantidad_con_signo: number;
  referencia: string | null;
  descripcion: string | null;
  usuario: string;
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

type TipoMovimiento = {
  id_tipo_movimiento: number;
  codigo: string;
  nombre: string;
};

export default function Kardex() {
  const [datos, setDatos] = useState<KardexItem[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [variantes, setVariantes] = useState<Variante[]>([]);
  const [tipos, setTipos] = useState<TipoMovimiento[]>([]);

  const [filtros, setFiltros] = useState({
    id_sucursal: 0,
    id_variante: 0,
    id_tipo_movimiento: 0,
    fecha_inicio: "",
    fecha_fin: "",
  });

  const cargarCatalogos = async () => {
    const res = await api.get("/kardex/catalogos");
    setSucursales(res.data.sucursales);
    setVariantes(res.data.variantes);
    setTipos(res.data.tipos);
  };

  const cargarKardex = async () => {
    const params = new URLSearchParams();

    if (filtros.id_sucursal > 0) {
      params.append("id_sucursal", String(filtros.id_sucursal));
    }

    if (filtros.id_variante > 0) {
      params.append("id_variante", String(filtros.id_variante));
    }

    if (filtros.id_tipo_movimiento > 0) {
      params.append("id_tipo_movimiento", String(filtros.id_tipo_movimiento));
    }

    if (filtros.fecha_inicio) {
      params.append("fecha_inicio", filtros.fecha_inicio);
    }

    if (filtros.fecha_fin) {
      params.append("fecha_fin", filtros.fecha_fin);
    }

    const res = await api.get(`/kardex?${params.toString()}`);
    setDatos(res.data);
  };

  useEffect(() => {
    cargarCatalogos();
    cargarKardex();
  }, []);

  const cambiar = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFiltros({
      ...filtros,
      [e.target.name]: [
        "id_sucursal",
        "id_variante",
        "id_tipo_movimiento",
      ].includes(e.target.name)
        ? Number(e.target.value)
        : e.target.value,
    });
  };

  return (
    <Layout>
      <TituloPagina
        titulo="Kardex de inventario"
        descripcion="Consulta el historial completo de movimientos de inventario."
      />

      <Card className="mb-6">
        <div className="grid grid-cols-3 gap-4">
          <Select
            label="Sucursal"
            name="id_sucursal"
            value={filtros.id_sucursal}
            onChange={cambiar}
          >
            <option value={0}>Todas</option>
            {sucursales.map((s) => (
              <option key={s.id_sucursal} value={s.id_sucursal}>
                {s.nombre}
              </option>
            ))}
          </Select>

          <Select
            label="Producto / Variante"
            name="id_variante"
            value={filtros.id_variante}
            onChange={cambiar}
          >
            <option value={0}>Todos</option>
            {variantes.map((v) => (
              <option key={v.id_variante} value={v.id_variante}>
                {v.producto} - {v.codigo_variante}
              </option>
            ))}
          </Select>

          <Select
            label="Tipo movimiento"
            name="id_tipo_movimiento"
            value={filtros.id_tipo_movimiento}
            onChange={cambiar}
          >
            <option value={0}>Todos</option>
            {tipos.map((t) => (
              <option key={t.id_tipo_movimiento} value={t.id_tipo_movimiento}>
                {t.nombre}
              </option>
            ))}
          </Select>

          <Input
            label="Fecha inicio"
            type="date"
            name="fecha_inicio"
            value={filtros.fecha_inicio}
            onChange={cambiar}
          />

          <Input
            label="Fecha fin"
            type="date"
            name="fecha_fin"
            value={filtros.fecha_fin}
            onChange={cambiar}
          />

          <div className="flex items-end gap-3">
            <BotonPrimario type="button" onClick={cargarKardex}>
              Buscar
            </BotonPrimario>

            <BotonSecundario
              type="button"
              onClick={() => {
                window.location.href = "/inventario";
              }}
            >
              Inventario
            </BotonSecundario>
          </div>
        </div>
      </Card>

      <Tabla<KardexItem>
        datos={datos}
        columnas={[
          {
            titulo: "Fecha",
            render: (k) => new Date(k.fecha).toLocaleString(),
          },
          {
            titulo: "Sucursal",
            render: (k) => k.sucursal,
          },
          {
            titulo: "Producto",
            render: (k) => `${k.codigo_producto} - ${k.producto}`,
          },
          {
            titulo: "Variante",
            render: (k) => k.codigo_variante,
          },
          {
            titulo: "Movimiento",
            render: (k) => k.tipo_movimiento,
          },
          {
            titulo: "Tipo",
            render: (k) =>
              k.afecta_stock > 0 ? (
                <Badge texto="Entrada" tipo="verde" />
              ) : k.afecta_stock < 0 ? (
                <Badge texto="Salida" tipo="rojo" />
              ) : (
                <Badge texto="Info" tipo="gris" />
              ),
          },
          {
            titulo: "Cantidad",
            render: (k) =>
              k.cantidad_con_signo > 0
                ? `+${k.cantidad_con_signo}`
                : k.cantidad_con_signo,
          },
          {
            titulo: "Referencia",
            render: (k) => k.referencia || "-",
          },
          {
            titulo: "Usuario",
            render: (k) => k.usuario,
          },
        ]}
      />
    </Layout>
  );
}