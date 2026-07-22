import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import { api } from "../services/api";

import Layout from "../components/Layout";
import Card from "../components/Card";
import Input from "../components/Input";
import Select from "../components/Select";
import Tabla from "../components/Tabla";
import Badge from "../components/Badge";
import Loader from "../components/Loader";
import TituloPagina from "../components/TituloPagina";
import BotonPrimario from "../components/BotonPrimario";
import BotonSecundario from "../components/BotonSecundario";
import ModalApartadoExitoso from "../components/ModalApartadoExitoso";

type Cliente = {
  id_cliente: number;
  codigo_cliente: string;
  cliente: string;
  nit: string | null;
  telefono: string | null;
  tipo_cliente: string;
  porcentaje_descuento: number;
};

type Producto = {
  id_variante: number;
  id_producto: number;
  codigo_producto: string;
  producto: string;
  codigo_variante: string;
  color: string | null;
  material: string | null;
  medida: string | null;
  precio_venta: number;
  marca: string;
  categoria: string;
  stock_actual: number;
  stock_reservado: number;
  stock_disponible: number;
};

type MetodoPago = {
  id_metodo_pago: number;
  codigo: string;
  nombre: string;
  requiere_referencia: number;
};

type CarritoItem = Producto & {
  cantidad: number;
};

type CatalogosApartado = {
  sucursal: {
    id_sucursal: number;
    nombre: string;
  };

  turno: {
    id_turno: number;
    id_caja: number;
    caja: string;
  } | null;

  politica: {
    porcentaje_minimo_entrega: number;
  };

  clientes: Cliente[];
  productos: Producto[];
  metodos_pago: MetodoPago[];
};

type ApartadoListado = {
  id_apartado: number;
  codigo_apartado: string;
  fecha_apartado: string;
  fecha_limite: string | null;
  total: number;
  enganche: number;
  saldo_pendiente: number;
  total_pagado: number;
  porcentaje_pagado: number;
  entregado: number;
  fecha_entrega: string | null;
  elegible_entrega: number;
  codigo_estado: string;
  estado: string;
  codigo_cliente: string;
  cliente: string;
  usuario: string;
};

type ApartadoCreado = {
  id_apartado: number;
  codigo_apartado: string;
  total: number;
  enganche: number;
  saldo_pendiente: number;

  cliente: {
    codigo: string;
    nombre: string;
  };
};

type ApartadoExitoso = {
  id_apartado: number;
  codigo_apartado: string;
  cliente: string;
  total: number;
  enganche: number;
  saldo_pendiente: number;
};

const fechaLocalIso = () => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + 30);

  return fecha.toISOString().slice(0, 10);
};

export default function Apartados() {
  const navigate = useNavigate();

  const [catalogos, setCatalogos] =
    useState<CatalogosApartado | null>(null);

  const [apartados, setApartados] =
    useState<ApartadoListado[]>([]);

  const [carrito, setCarrito] =
    useState<CarritoItem[]>([]);

  const [idCliente, setIdCliente] =
    useState(0);

  const [idVariante, setIdVariante] =
    useState(0);

  const [cantidad, setCantidad] =
    useState(1);

  const [idMetodoPago, setIdMetodoPago] =
    useState(0);

  const [enganche, setEnganche] =
    useState("");

  const [fechaLimite, setFechaLimite] =
    useState(fechaLocalIso());

  const [referenciaPago, setReferenciaPago] =
    useState("");

  const [observaciones, setObservaciones] =
    useState("");

  const [busquedaProducto, setBusquedaProducto] =
    useState("");

  const [busquedaApartado, setBusquedaApartado] =
    useState("");

  const [estadoFiltro, setEstadoFiltro] =
    useState("");

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [apartadoExitoso, setApartadoExitoso] =
    useState<ApartadoExitoso | null>(null);

  const [tokenOperacion, setTokenOperacion] =
    useState(() => crypto.randomUUID());

  const cargarCatalogos = async () => {
    const respuesta =
      await api.get<CatalogosApartado>(
        "/apartados/catalogos",
      );

    const datos = respuesta.data;

    setCatalogos(datos);

    setIdCliente((actual) => {
      const existe = datos.clientes.some(
        (cliente) =>
          cliente.id_cliente === actual,
      );

      if (existe) {
        return actual;
      }

      return datos.clientes[0]?.id_cliente || 0;
    });

    setIdMetodoPago((actual) => {
      const existe = datos.metodos_pago.some(
        (metodo) =>
          metodo.id_metodo_pago === actual,
      );

      if (existe) {
        return actual;
      }

      return (
        datos.metodos_pago[0]?.id_metodo_pago ||
        0
      );
    });
  };

  const cargarApartados = async () => {
    const respuesta =
      await api.get<ApartadoListado[]>(
        "/apartados",
        {
          params: {
            estado:
              estadoFiltro.trim() || undefined,
            buscar:
              busquedaApartado.trim() ||
              undefined,
          },
        },
      );

    setApartados(
      Array.isArray(respuesta.data)
        ? respuesta.data
        : [],
    );
  };

  const cargarDatos = async () => {
    try {
      setCargando(true);

      await Promise.all([
        cargarCatalogos(),
        cargarApartados(),
      ]);
    } catch (error: any) {
      console.error(
        "Error al cargar ApartadoYA:",
        error,
      );

      alert(
        error.response?.data?.message ||
          "No fue posible cargar ApartadoYA",
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const clienteSeleccionado = useMemo(
    () =>
      catalogos?.clientes.find(
        (cliente) =>
          cliente.id_cliente === idCliente,
      ) || null,
    [catalogos, idCliente],
  );

  const metodoSeleccionado = useMemo(
    () =>
      catalogos?.metodos_pago.find(
        (metodo) =>
          metodo.id_metodo_pago ===
          idMetodoPago,
      ) || null,
    [catalogos, idMetodoPago],
  );

  const productosFiltrados = useMemo(() => {
    const productos =
      catalogos?.productos || [];

    const buscar = busquedaProducto
      .trim()
      .toLowerCase();

    if (!buscar) {
      return productos;
    }

    return productos.filter((producto) => {
      const valores = [
        producto.codigo_producto,
        producto.producto,
        producto.codigo_variante,
        producto.marca,
        producto.categoria,
        producto.color || "",
        producto.material || "",
        producto.medida || "",
      ];

      return valores.some((valor) =>
        valor.toLowerCase().includes(buscar),
      );
    });
  }, [catalogos, busquedaProducto]);

  const total = useMemo(() => {
    return Number(
      carrito
        .reduce(
          (acumulado, item) =>
            acumulado +
            item.precio_venta *
              item.cantidad,
          0,
        )
        .toFixed(2),
    );
  }, [carrito]);

  const engancheNumero =
    Number(enganche || 0);

  const saldoPendiente = Math.max(
    0,
    Number(
      (total - engancheNumero).toFixed(2),
    ),
  );

  const porcentajeInicial =
    total > 0
      ? Number(
          (
            (engancheNumero / total) *
            100
          ).toFixed(2),
        )
      : 0;

  const agregarProducto = () => {
    const producto =
      catalogos?.productos.find(
        (item) =>
          item.id_variante === idVariante,
      );

    if (!producto) {
      alert("Seleccione un producto");
      return;
    }

    if (
      !Number.isInteger(cantidad) ||
      cantidad <= 0
    ) {
      alert(
        "La cantidad debe ser mayor que cero",
      );
      return;
    }

    const existente = carrito.find(
      (item) =>
        item.id_variante === idVariante,
    );

    const cantidadFinal =
      (existente?.cantidad || 0) + cantidad;

    if (
      cantidadFinal >
      producto.stock_disponible
    ) {
      alert(
        `Solo hay ${producto.stock_disponible} unidades disponibles`,
      );
      return;
    }

    if (existente) {
      setCarrito((actual) =>
        actual.map((item) =>
          item.id_variante === idVariante
            ? {
                ...item,
                cantidad: cantidadFinal,
              }
            : item,
        ),
      );
    } else {
      setCarrito((actual) => [
        ...actual,
        {
          ...producto,
          cantidad,
        },
      ]);
    }

    setIdVariante(0);
    setCantidad(1);
    setBusquedaProducto("");
  };

  const cambiarCantidad = (
    idVarianteItem: number,
    nuevaCantidad: number,
  ) => {
    const producto = carrito.find(
      (item) =>
        item.id_variante ===
        idVarianteItem,
    );

    if (!producto) {
      return;
    }

    if (
      !Number.isInteger(nuevaCantidad) ||
      nuevaCantidad <= 0
    ) {
      setCarrito((actual) =>
        actual.filter(
          (item) =>
            item.id_variante !==
            idVarianteItem,
        ),
      );

      return;
    }

    if (
      nuevaCantidad >
      producto.stock_disponible
    ) {
      alert(
        `Solo hay ${producto.stock_disponible} unidades disponibles`,
      );
      return;
    }

    setCarrito((actual) =>
      actual.map((item) =>
        item.id_variante === idVarianteItem
          ? {
              ...item,
              cantidad: nuevaCantidad,
            }
          : item,
      ),
    );
  };

  const quitarProducto = (
    idVarianteItem: number,
  ) => {
    setCarrito((actual) =>
      actual.filter(
        (item) =>
          item.id_variante !==
          idVarianteItem,
      ),
    );
  };

  const limpiarFormulario = () => {
    setCarrito([]);
    setEnganche("");
    setFechaLimite(fechaLocalIso());
    setReferenciaPago("");
    setObservaciones("");
    setBusquedaProducto("");
    setIdVariante(0);
    setCantidad(1);
  };

  const guardarApartado = async () => {
    if (guardando) {
      return;
    }

    if (!catalogos?.turno) {
      alert(
        "Debes abrir caja antes de registrar un apartado",
      );
      return;
    }

    if (idCliente <= 0) {
      alert("Seleccione un cliente");
      return;
    }

    if (carrito.length === 0) {
      alert(
        "Agregue al menos un producto",
      );
      return;
    }

    if (idMetodoPago <= 0) {
      alert(
        "Seleccione un método de pago",
      );
      return;
    }

    if (
      !Number.isFinite(engancheNumero) ||
      engancheNumero < 0
    ) {
      alert("El enganche es inválido");
      return;
    }

    if (engancheNumero > total) {
      alert(
        "El enganche no puede superar el total",
      );
      return;
    }

    if (
      metodoSeleccionado
        ?.requiere_referencia === 1 &&
      !referenciaPago.trim()
    ) {
      alert(
        "El método de pago requiere referencia",
      );
      return;
    }

    const confirmar = window.confirm(
      `¿Registrar el apartado por Q${total.toFixed(
        2,
      )} con un enganche de Q${engancheNumero.toFixed(
        2,
      )}?`,
    );

    if (!confirmar) {
      return;
    }

    try {
      setGuardando(true);

      const respuesta = await api.post<{
        mensaje: string;
        apartado: ApartadoCreado;
      }>("/apartados", {
        token_operacion: tokenOperacion,
        id_cliente: idCliente,
        id_metodo_pago: idMetodoPago,
        enganche: engancheNumero,
        fecha_limite:
          fechaLimite || null,
        referencia_pago:
          referenciaPago.trim() || null,
        observaciones:
          observaciones.trim() || null,

        detalles: carrito.map((item) => ({
          id_variante: item.id_variante,
          cantidad: item.cantidad,
        })),
      });

      const apartado =
        respuesta.data?.apartado;

      if (!apartado) {
        throw new Error(
          "El backend no devolvió el apartado",
        );
      }

      setApartadoExitoso({
        id_apartado:
          apartado.id_apartado,
        codigo_apartado:
          apartado.codigo_apartado,
        cliente:
          apartado.cliente.nombre,
        total: Number(apartado.total),
        enganche: Number(
          apartado.enganche,
        ),
        saldo_pendiente: Number(
          apartado.saldo_pendiente,
        ),
      });

      limpiarFormulario();

      setTokenOperacion(
        crypto.randomUUID(),
      );

      await Promise.all([
        cargarCatalogos(),
        cargarApartados(),
      ]);
    } catch (error: any) {
      console.error(
        "Error al registrar apartado:",
        error,
      );

      alert(
        error.response?.data?.message ||
          error.message ||
          "No fue posible registrar el apartado",
      );
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <Layout>
        <Card>
          <Loader texto="Cargando ApartadoYA..." />
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <TituloPagina
        titulo="ApartadoYA"
        descripcion="Reserva productos, registra enganches y administra abonos."
      />

      {!catalogos?.turno && (
        <Card className="mb-6 border border-red-200 bg-red-50">
          <p className="font-bold text-red-700">
            No tienes una caja abierta
          </p>

          <p className="mt-1 text-sm text-red-600">
            Es necesario abrir caja para
            registrar enganches y abonos.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <h2 className="mb-4 text-xl font-bold">
              Nuevo apartado
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                label="Cliente"
                value={idCliente}
                disabled={guardando}
                onChange={(e) =>
                  setIdCliente(
                    Number(e.target.value),
                  )
                }
              >
                <option value={0}>
                  Seleccione cliente
                </option>

                {catalogos?.clientes.map(
                  (cliente) => (
                    <option
                      key={cliente.id_cliente}
                      value={cliente.id_cliente}
                    >
                      {cliente.codigo_cliente} -{" "}
                      {cliente.cliente}
                    </option>
                  ),
                )}
              </Select>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Tipo de cliente
                </p>

                <p className="font-bold">
                  {clienteSeleccionado?.tipo_cliente ||
                    "-"}
                </p>

                <p className="text-sm text-blue-600">
                  Cliente seleccionado:{" "}
                  {clienteSeleccionado?.cliente ||
                    "-"}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-xl font-bold">
              Agregar productos
            </h2>

            <Input
              label="Buscar producto"
              value={busquedaProducto}
              disabled={guardando}
              onChange={(e) =>
                setBusquedaProducto(
                  e.target.value,
                )
              }
              placeholder="Código, producto, variante, color..."
            />

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="md:col-span-3">
                <Select
                  label="Producto / variante"
                  value={idVariante}
                  disabled={guardando}
                  onChange={(e) =>
                    setIdVariante(
                      Number(e.target.value),
                    )
                  }
                >
                  <option value={0}>
                    Seleccione producto
                  </option>

                  {productosFiltrados.map(
                    (producto) => (
                      <option
                        key={producto.id_variante}
                        value={
                          producto.id_variante
                        }
                      >
                        {
                          producto.codigo_producto
                        }{" "}
                        - {producto.producto} -{" "}
                        {
                          producto.codigo_variante
                        }{" "}
                        | Disponible:{" "}
                        {
                          producto.stock_disponible
                        }{" "}
                        | Q
                        {producto.precio_venta.toFixed(
                          2,
                        )}
                      </option>
                    ),
                  )}
                </Select>
              </div>

              <Input
                label="Cantidad"
                type="number"
                min={1}
                step={1}
                value={cantidad}
                disabled={guardando}
                onChange={(e) =>
                  setCantidad(
                    Number(e.target.value),
                  )
                }
              />

              <div className="md:col-span-4">
                <BotonPrimario
                  type="button"
                  className="w-full"
                  disabled={
                    guardando ||
                    idVariante <= 0
                  }
                  onClick={agregarProducto}
                >
                  Agregar al apartado
                </BotonPrimario>
              </div>
            </div>
          </Card>

          <Tabla<CarritoItem>
            datos={carrito}
            mensajeVacio="No hay productos agregados"
            columnas={[
              {
                titulo: "Producto",
                render: (item) => (
                  <div>
                    <p className="font-semibold">
                      {item.producto}
                    </p>

                    <p className="text-xs text-slate-500">
                      {item.codigo_variante}
                    </p>
                  </div>
                ),
              },
              {
                titulo: "Precio",
                render: (item) =>
                  `Q${item.precio_venta.toFixed(
                    2,
                  )}`,
              },
              {
                titulo: "Cantidad",
                render: (item) => (
                  <input
                    type="number"
                    min={1}
                    max={
                      item.stock_disponible
                    }
                    value={item.cantidad}
                    disabled={guardando}
                    onChange={(e) =>
                      cambiarCantidad(
                        item.id_variante,
                        Number(e.target.value),
                      )
                    }
                    className="w-20 rounded-lg border px-2 py-1"
                  />
                ),
              },
              {
                titulo: "Subtotal",
                render: (item) =>
                  `Q${(
                    item.precio_venta *
                    item.cantidad
                  ).toFixed(2)}`,
              },
              {
                titulo: "Acción",
                render: (item) => (
                  <button
                    type="button"
                    disabled={guardando}
                    onClick={() =>
                      quitarProducto(
                        item.id_variante,
                      )
                    }
                    className="font-semibold text-red-600 hover:underline"
                  >
                    Quitar
                  </button>
                ),
              },
            ]}
          />
        </div>

        <div>
          <Card className="sticky top-6">
            <h2 className="mb-5 text-xl font-bold">
              Resumen
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">
                  Sucursal
                </span>

                <span className="font-semibold">
                  {catalogos?.sucursal.nombre}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Caja
                </span>

                <span className="font-semibold">
                  {catalogos?.turno?.caja ||
                    "Sin caja"}
                </span>
              </div>

              <hr />

              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>

                <span>
                  Q{total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <Input
                label="Enganche"
                type="number"
                min={0}
                step="0.01"
                value={enganche}
                disabled={guardando}
                onChange={(e) =>
                  setEnganche(e.target.value)
                }
                placeholder="0.00"
              />

              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-sm text-blue-600">
                  Porcentaje inicial pagado
                </p>

                <p className="text-xl font-bold text-blue-700">
                  {porcentajeInicial.toFixed(
                    2,
                  )}
                  %
                </p>
              </div>

              <div className="rounded-xl bg-red-50 p-4">
                <p className="text-sm text-red-600">
                  Saldo pendiente
                </p>

                <p className="text-2xl font-bold text-red-700">
                  Q
                  {saldoPendiente.toFixed(
                    2,
                  )}
                </p>
              </div>

              <Input
                label="Fecha límite"
                type="date"
                value={fechaLimite}
                disabled={guardando}
                onChange={(e) =>
                  setFechaLimite(
                    e.target.value,
                  )
                }
              />

              <Select
                label="Método de pago"
                value={idMetodoPago}
                disabled={guardando}
                onChange={(e) =>
                  setIdMetodoPago(
                    Number(e.target.value),
                  )
                }
              >
                <option value={0}>
                  Seleccione método
                </option>

                {catalogos?.metodos_pago.map(
                  (metodo) => (
                    <option
                      key={
                        metodo.id_metodo_pago
                      }
                      value={
                        metodo.id_metodo_pago
                      }
                    >
                      {metodo.nombre}
                    </option>
                  ),
                )}
              </Select>

              {metodoSeleccionado
                ?.requiere_referencia ===
                1 && (
                <Input
                  label="Referencia del pago"
                  value={referenciaPago}
                  disabled={guardando}
                  onChange={(e) =>
                    setReferenciaPago(
                      e.target.value,
                    )
                  }
                  placeholder="Número de autorización o referencia"
                />
              )}

              <Input
                label="Observaciones"
                value={observaciones}
                disabled={guardando}
                onChange={(e) =>
                  setObservaciones(
                    e.target.value,
                  )
                }
                placeholder="Información adicional"
              />
            </div>

            <BotonPrimario
              type="button"
              className="mt-5 w-full"
              disabled={
                guardando ||
                !catalogos?.turno ||
                carrito.length === 0 ||
                idCliente <= 0 ||
                idMetodoPago <= 0 ||
                engancheNumero > total
              }
              onClick={guardarApartado}
            >
              {guardando
                ? "Procesando..."
                : "Registrar apartado"}
            </BotonPrimario>

            <BotonSecundario
              type="button"
              className="mt-3 w-full"
              disabled={guardando}
              onClick={() =>
                navigate("/dashboard")
              }
            >
              Regresar al menú
            </BotonSecundario>
          </Card>
        </div>
      </div>

      <div className="mt-10">
        <TituloPagina
          titulo="Apartados registrados"
          descripcion="Consulta apartados activos, completados y cancelados."
        />

        <Card className="mb-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <Input
                label="Buscar"
                value={busquedaApartado}
                onChange={(e) =>
                  setBusquedaApartado(
                    e.target.value,
                  )
                }
                placeholder="Código, cliente o NIT"
              />
            </div>

            <Select
              label="Estado"
              value={estadoFiltro}
              onChange={(e) =>
                setEstadoFiltro(
                  e.target.value,
                )
              }
            >
              <option value="">
                Todos los estados
              </option>

              <option value="ACTIVO">
                Activos
              </option>

              <option value="COMPLETADO">
                Completados
              </option>

              <option value="CANCELADO">
                Cancelados
              </option>

              <option value="VENCIDO">
                Vencidos
              </option>
            </Select>

            <div className="flex items-end">
              <BotonPrimario
                type="button"
                className="w-full"
                onClick={cargarApartados}
              >
                Buscar
              </BotonPrimario>
            </div>
          </div>
        </Card>

        <Tabla<ApartadoListado>
          datos={apartados}
          mensajeVacio="No hay apartados registrados"
          columnas={[
            {
              titulo: "Código",
              render: (apartado) =>
                apartado.codigo_apartado,
            },
            {
              titulo: "Cliente",
              render: (apartado) =>
                apartado.cliente,
            },
            {
              titulo: "Total",
              render: (apartado) =>
                `Q${apartado.total.toFixed(
                  2,
                )}`,
            },
            {
              titulo: "Pagado",
              render: (apartado) => (
                <div>
                  <p>
                    Q
                    {apartado.total_pagado.toFixed(
                      2,
                    )}
                  </p>

                  <p className="text-xs text-blue-600">
                    {apartado.porcentaje_pagado.toFixed(
                      2,
                    )}
                    %
                  </p>
                </div>
              ),
            },
            {
              titulo: "Saldo",
              render: (apartado) =>
                `Q${apartado.saldo_pendiente.toFixed(
                  2,
                )}`,
            },
            {
              titulo: "Estado",
              render: (apartado) => (
                <Badge
                  texto={apartado.estado}
                  tipo={
                    apartado.codigo_estado ===
                    "ACTIVO"
                      ? "verde"
                      : apartado.codigo_estado ===
                          "CANCELADO"
                        ? "rojo"
                        : "amarillo"
                  }
                />
              ),
            },
            {
              titulo: "Acción",
              render: (apartado) => (
                <button
                  type="button"
                  className="font-semibold text-blue-600 hover:underline"
                  onClick={() =>
                    navigate(
                      `/apartados/${apartado.id_apartado}`,
                    )
                  }
                >
                  Ver detalle
                </button>
              ),
            },
          ]}
        />
      </div>

      <ModalApartadoExitoso
        abierto={Boolean(apartadoExitoso)}
        codigoApartado={
          apartadoExitoso?.codigo_apartado ||
          ""
        }
        cliente={
          apartadoExitoso?.cliente || ""
        }
        total={apartadoExitoso?.total || 0}
        enganche={
          apartadoExitoso?.enganche || 0
        }
        saldo={
          apartadoExitoso?.saldo_pendiente ||
          0
        }
        onVerDetalle={() => {
          if (!apartadoExitoso) {
            return;
          }

          navigate(
            `/apartados/${apartadoExitoso.id_apartado}`,
          );
        }}
        onNuevoApartado={() =>
          setApartadoExitoso(null)
        }
      />
    </Layout>
  );
}