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
import TituloPagina from "../components/TituloPagina";
import BotonPrimario from "../components/BotonPrimario";
import BotonSecundario from "../components/BotonSecundario";
import Tabla from "../components/Tabla";
import Badge from "../components/Badge";
import Loader from "../components/Loader";
import ModalVentaExitosa from "../components/ModalVentaExitosa";

import type {
  DocumentoVenta,
} from "../components/ReciboVenta";

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

type VentaListado = {
  id_venta: number;
  codigo_venta: string;
  fecha: string;
  subtotal: number;
  descuento: number;
  total: number;
  estado: string;
  codigo_estado: string;
  cliente: string;
  usuario: string;
  sucursal: string;
};

type Catalogos = {
  sucursal: {
    id_sucursal: number;
    nombre: string;
  };

  turno: {
    id_turno: number;
    id_caja: number;
    codigo_caja: string;
    caja: string;
  } | null;

  clientes: Cliente[];
  productos: Producto[];
  metodos_pago: MetodoPago[];

  resumen_inventario?: {
    productos_disponibles: number;
    mensaje: string | null;
  };
};

type VentaRegistrada = {
  id_venta: number;
  codigo_venta: string;
  total: number;
  cambio: number;
  ya_registrada?: boolean;
};

type ResumenVentaExitosa = {
  id_venta: number;
  codigo_venta: string;
  total: number;
  cambio: number;
  monto_recibido: number;
};

export default function Ventas() {
  const navigate = useNavigate();

  const [catalogos, setCatalogos] =
    useState<Catalogos | null>(null);

  const [ventas, setVentas] =
    useState<VentaListado[]>([]);

  const [carrito, setCarrito] =
    useState<CarritoItem[]>([]);

  const [idCliente, setIdCliente] =
    useState(0);

  const [idMetodoPago, setIdMetodoPago] =
    useState(0);

  const [idVariante, setIdVariante] =
    useState(0);

  const [cantidad, setCantidad] =
    useState(1);

  const [montoPagado, setMontoPagado] =
    useState("");

  const [busquedaProducto, setBusquedaProducto] =
    useState("");

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [abriendoRecibo, setAbriendoRecibo] =
    useState<number | null>(null);

  /*
   * Datos del comprobante generado después
   * de registrar correctamente una venta.
   */
  const [documentoVenta, setDocumentoVenta] =
    useState<DocumentoVenta | null>(null);

  const [ventaExitosa, setVentaExitosa] =
    useState<ResumenVentaExitosa | null>(null);

  /*
   * El token hace que la operación sea idempotente.
   * Si se reintenta la misma venta, el backend no
   * debe descontar nuevamente el inventario.
   */
  const [tokenOperacion, setTokenOperacion] =
    useState<string>(() => crypto.randomUUID());

  const cargarCatalogos = async () => {
    const respuesta =
      await api.get<Catalogos>("/ventas/catalogos");

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

      return datos.clientes.length > 0
        ? datos.clientes[0].id_cliente
        : 0;
    });

    setIdMetodoPago((actual) => {
      const existe = datos.metodos_pago.some(
        (metodo) =>
          metodo.id_metodo_pago === actual,
      );

      if (existe) {
        return actual;
      }

      return datos.metodos_pago.length > 0
        ? datos.metodos_pago[0].id_metodo_pago
        : 0;
    });
  };

  const cargarVentas = async () => {
    const respuesta =
      await api.get<VentaListado[]>("/ventas");

    setVentas(
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
        cargarVentas(),
      ]);
    } catch (error: any) {
      console.error(
        "Error al cargar ventas:",
        error,
      );

      alert(
        error.response?.data?.message ||
          "Error al cargar el módulo de ventas",
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

  const productosFiltrados = useMemo(() => {
    const productos =
      catalogos?.productos || [];

    const busqueda = busquedaProducto
      .trim()
      .toLowerCase();

    if (!busqueda) {
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
        valor
          .toLowerCase()
          .includes(busqueda),
      );
    });
  }, [catalogos, busquedaProducto]);

  const subtotal = useMemo(() => {
    return carrito.reduce(
      (acumulado, item) =>
        acumulado +
        item.precio_venta * item.cantidad,
      0,
    );
  }, [carrito]);

  const porcentajeDescuento =
    clienteSeleccionado?.porcentaje_descuento ||
    0;

  const descuento = useMemo(() => {
    return Number(
      (
        subtotal *
        (porcentajeDescuento / 100)
      ).toFixed(2),
    );
  }, [subtotal, porcentajeDescuento]);

  const total = Number(
    (subtotal - descuento).toFixed(2),
  );

  const montoIngresado =
    Number(montoPagado || 0);

  const cambio = Math.max(
    0,
    Number(
      (montoIngresado - total).toFixed(2),
    ),
  );

  const agregarProducto = () => {
    if (guardando) {
      return;
    }

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
        "La cantidad debe ser un número entero mayor que cero",
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

  const cambiarCantidadCarrito = (
    idVarianteItem: number,
    nuevaCantidad: number,
  ) => {
    if (guardando) {
      return;
    }

    const item = carrito.find(
      (producto) =>
        producto.id_variante ===
        idVarianteItem,
    );

    if (!item) {
      return;
    }

    if (
      !Number.isInteger(nuevaCantidad) ||
      nuevaCantidad <= 0
    ) {
      setCarrito((actual) =>
        actual.filter(
          (producto) =>
            producto.id_variante !==
            idVarianteItem,
        ),
      );

      return;
    }

    if (
      nuevaCantidad >
      item.stock_disponible
    ) {
      alert(
        `Solo hay ${item.stock_disponible} unidades disponibles`,
      );

      return;
    }

    setCarrito((actual) =>
      actual.map((producto) =>
        producto.id_variante ===
        idVarianteItem
          ? {
              ...producto,
              cantidad: nuevaCantidad,
            }
          : producto,
      ),
    );
  };

  const eliminarProducto = (
    idVarianteItem: number,
  ) => {
    if (guardando) {
      return;
    }

    setCarrito((actual) =>
      actual.filter(
        (producto) =>
          producto.id_variante !==
          idVarianteItem,
      ),
    );
  };

  const limpiarVenta = () => {
    setCarrito([]);
    setMontoPagado("");
    setIdVariante(0);
    setCantidad(1);
    setBusquedaProducto("");
  };

  const obtenerReciboVenta = async (
    idVenta: number,
  ) => {
    const respuesta =
      await api.get<DocumentoVenta>(
        `/documentos/venta/${idVenta}`,
      );

    return respuesta.data;
  };

  const guardarVenta = async () => {
    /*
     * Evita doble clic y solicitudes simultáneas.
     */
    if (guardando) {
      return;
    }

    if (!catalogos?.turno) {
      alert(
        "Debe abrir caja antes de registrar una venta",
      );
      return;
    }

    if (idCliente <= 0) {
      alert("Seleccione un cliente");
      return;
    }

    if (carrito.length === 0) {
      alert(
        "Agregue al menos un producto a la venta",
      );
      return;
    }

    if (idMetodoPago <= 0) {
      alert("Seleccione un método de pago");
      return;
    }

    const monto = Number(montoPagado);

    if (
      !Number.isFinite(monto) ||
      monto <= 0
    ) {
      alert(
        "Ingrese un monto pagado válido",
      );
      return;
    }

    if (monto < total) {
      alert(
        "El monto pagado es menor al total de la venta",
      );
      return;
    }

    const productosInvalidos =
      carrito.filter(
        (item) =>
          !Number.isInteger(item.cantidad) ||
          item.cantidad <= 0 ||
          item.cantidad >
            item.stock_disponible,
      );

    if (productosInvalidos.length > 0) {
      alert(
        "Una o más cantidades del carrito no son válidas",
      );
      return;
    }

    const confirmar = window.confirm(
      `¿Registrar la venta por Q${total.toFixed(
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
        venta: VentaRegistrada | null;
      }>("/ventas", {
        token_operacion: tokenOperacion,
        id_cliente: idCliente,
        id_metodo_pago: idMetodoPago,
        monto_pagado: monto,

        detalles: carrito.map((item) => ({
          id_variante: item.id_variante,
          cantidad: item.cantidad,
        })),
      });

      const venta = respuesta.data?.venta;

      if (!venta) {
        throw new Error(
          "El backend no devolvió los datos de la venta",
        );
      }

      /*
       * Desde este momento la venta ya está confirmada.
       * No debe volver a enviarse con el mismo carrito.
       */
      limpiarVenta();

      setTokenOperacion(
        crypto.randomUUID(),
      );

      setVentaExitosa({
        id_venta: venta.id_venta,
        codigo_venta: venta.codigo_venta,
        total: Number(venta.total),
        cambio: Number(venta.cambio),
        monto_recibido: monto,
      });

      /*
       * Generar o recuperar el recibo.
       * El backend debe devolver el mismo documento
       * cuando ya exista.
       */
      try {
        const documento =
          await obtenerReciboVenta(
            venta.id_venta,
          );

        setDocumentoVenta(documento);
      } catch (errorDocumento: any) {
        console.error(
          "La venta se registró, pero no se pudo obtener el recibo:",
          errorDocumento,
        );

        setDocumentoVenta(null);

        alert(
          `La venta ${venta.codigo_venta} fue registrada correctamente, ` +
            "pero no fue posible generar o cargar el recibo. " +
            "Puedes volver a intentarlo desde Ventas recientes.",
        );
      }

      await Promise.all([
        cargarCatalogos(),
        cargarVentas(),
      ]);
    } catch (error: any) {
      console.error(
        "Error al registrar venta:",
        error,
      );

      /*
       * No se modifica el token cuando la operación
       * no fue confirmada por el backend.
       */
      alert(
        error.response?.data?.message ||
          error.message ||
          "Error al registrar la venta",
      );
    } finally {
      setGuardando(false);
    }
  };

  const abrirReciboVenta = async (
    venta: VentaListado,
  ) => {
    if (abriendoRecibo !== null) {
      return;
    }

    try {
      setAbriendoRecibo(venta.id_venta);

      const documento =
        await obtenerReciboVenta(
          venta.id_venta,
        );

      navigate(
        `/documentos/${documento.id_documento}`,
      );
    } catch (error: any) {
      console.error(
        "Error al abrir el recibo:",
        error,
      );

      alert(
        error.response?.data?.message ||
          "No fue posible abrir el recibo",
      );
    } finally {
      setAbriendoRecibo(null);
    }
  };

  const verRecibo = () => {
    if (!documentoVenta) {
      alert(
        "Todavía no se ha generado el recibo de esta venta",
      );
      return;
    }

    navigate(
      `/documentos/${documentoVenta.id_documento}`,
    );
  };

  const imprimirRecibo = async () => {
    if (!documentoVenta) {
      alert(
        "Todavía no se ha generado el recibo de esta venta",
      );
      return;
    }

    try {
      await api.post(
        `/documentos/${documentoVenta.id_documento}/imprimir`,
      );
    } catch (error) {
      console.error(
        "No se pudo registrar la impresión:",
        error,
      );
    }

    const ventana = window.open(
      `/documentos/${documentoVenta.id_documento}`,
      "_blank",
      "noopener,noreferrer",
    );

    if (!ventana) {
      alert(
        "El navegador bloqueó la ventana del recibo. Permite las ventanas emergentes para imprimir.",
      );
    }
  };

  const nuevaVenta = () => {
    setVentaExitosa(null);
    setDocumentoVenta(null);
  };

  if (cargando) {
    return (
      <Layout>
        <Card>
          <Loader texto="Cargando ventas..." />
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <TituloPagina
        titulo="Ventas"
        descripcion="Registra ventas, pagos y salidas automáticas de inventario."
      />

      {!catalogos?.turno && (
        <Card className="mb-6 border border-red-200 bg-red-50">
          <p className="font-bold text-red-700">
            No tienes una caja abierta
          </p>

          <p className="mt-1 text-sm text-red-600">
            Debes abrir una caja antes de
            registrar ventas.
          </p>
        </Card>
      )}

      {catalogos?.productos.length === 0 && (
        <Card className="mb-6 border border-amber-200 bg-amber-50">
          <p className="font-bold text-amber-700">
            No hay productos disponibles
          </p>

          <p className="mt-1 text-sm text-amber-600">
            Registra una entrada de inventario
            para que los productos aparezcan en
            Ventas.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card className="mb-6">
            <h2 className="mb-4 text-xl font-bold">
              Nueva venta
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
                  Descuento:{" "}
                  {porcentajeDescuento}%
                </p>
              </div>
            </div>
          </Card>

          <Card className="mb-6">
            <h2 className="mb-4 text-xl font-bold">
              Agregar producto
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="md:col-span-4">
                <Input
                  label="Buscar producto"
                  value={busquedaProducto}
                  disabled={guardando}
                  onChange={(e) =>
                    setBusquedaProducto(
                      e.target.value,
                    )
                  }
                  placeholder="Código, producto, variante, marca..."
                />
              </div>

              <div className="md:col-span-3">
                <Select
                  label="Producto / Variante"
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
                        | Stock:{" "}
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
                  onClick={agregarProducto}
                  disabled={
                    guardando ||
                    idVariante <= 0
                  }
                  className="w-full"
                >
                  Agregar al carrito
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
                    step={1}
                    max={
                      item.stock_disponible
                    }
                    value={item.cantidad}
                    disabled={guardando}
                    onChange={(e) =>
                      cambiarCantidadCarrito(
                        item.id_variante,
                        Number(e.target.value),
                      )
                    }
                    className="w-20 rounded-lg border px-2 py-1 disabled:cursor-not-allowed disabled:bg-slate-100"
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
                      eliminarProducto(
                        item.id_variante,
                      )
                    }
                    className="font-semibold text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
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
            <h2 className="mb-4 text-xl font-bold">
              Resumen
            </h2>

            <div className="mb-6 space-y-3">
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

              <div className="flex justify-between">
                <span>Subtotal</span>

                <span>
                  Q{subtotal.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-blue-600">
                <span>
                  Descuento (
                  {porcentajeDescuento}%)
                </span>

                <span>
                  -Q{descuento.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>

                <span>
                  Q{total.toFixed(2)}
                </span>
              </div>
            </div>

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

            <div className="mt-4">
              <Input
                label="Monto pagado"
                type="number"
                min={0}
                step="0.01"
                value={montoPagado}
                disabled={guardando}
                onChange={(e) =>
                  setMontoPagado(
                    e.target.value,
                  )
                }
                placeholder={total.toFixed(2)}
              />
            </div>

            <div className="mt-4 rounded-xl bg-green-50 p-4">
              <p className="text-sm text-green-700">
                Cambio
              </p>

              <p className="text-2xl font-bold text-green-700">
                Q{cambio.toFixed(2)}
              </p>
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
                montoIngresado < total
              }
              onClick={guardarVenta}
            >
              {guardando
                ? "Procesando..."
                : "Registrar venta"}
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

      <div className="mt-8">
        <TituloPagina
          titulo="Ventas recientes"
          descripcion="Historial de ventas registradas en la sucursal."
        />

        <Tabla<VentaListado>
          datos={ventas}
          mensajeVacio="No hay ventas registradas"
          columnas={[
            {
              titulo: "Código",
              render: (venta) =>
                venta.codigo_venta,
            },
            {
              titulo: "Fecha",
              render: (venta) =>
                new Date(
                  venta.fecha,
                ).toLocaleString(),
            },
            {
              titulo: "Cliente",
              render: (venta) =>
                venta.cliente,
            },
            {
              titulo: "Total",
              render: (venta) =>
                `Q${Number(
                  venta.total,
                ).toFixed(2)}`,
            },
            {
              titulo: "Vendedor",
              render: (venta) =>
                venta.usuario,
            },
            {
              titulo: "Estado",
              render: (venta) =>
                venta.codigo_estado ===
                "PAGADA" ? (
                  <Badge
                    texto={venta.estado}
                    tipo="verde"
                  />
                ) : (
                  <Badge
                    texto={venta.estado}
                    tipo="amarillo"
                  />
                ),
            },
            {
              titulo: "Comprobante",
              render: (venta) => (
                <button
                  type="button"
                  disabled={
                    abriendoRecibo ===
                    venta.id_venta
                  }
                  onClick={() =>
                    abrirReciboVenta(venta)
                  }
                  className="font-semibold text-blue-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {abriendoRecibo ===
                  venta.id_venta
                    ? "Abriendo..."
                    : "Ver recibo"}
                </button>
              ),
            },
          ]}
        />
      </div>

      <ModalVentaExitosa
        abierto={
          Boolean(ventaExitosa) &&
          Boolean(documentoVenta)
        }
        codigoVenta={
          ventaExitosa?.codigo_venta || ""
        }
        codigoRecibo={
          documentoVenta?.codigo_documento ||
          ""
        }
        total={ventaExitosa?.total || 0}
        cambio={ventaExitosa?.cambio || 0}
        onVerRecibo={verRecibo}
        onImprimir={imprimirRecibo}
        onNuevaVenta={nuevaVenta}
      />
    </Layout>
  );
}