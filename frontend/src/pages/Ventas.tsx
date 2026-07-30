import {
  type FormEvent,
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
  dpi: string | null;
  telefono: string | null;
  direccion: string | null;
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

  /*
   * Los clientes ya no se cargan aquí.
   * Se buscan bajo demanda por DPI, NIT o código.
   */
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

const obtenerMensajeError = (
  error: any,
  predeterminado: string,
) => {
  const mensaje = error?.response?.data?.message;

  if (Array.isArray(mensaje)) {
    return mensaje.join("\n");
  }

  if (typeof mensaje === "string") {
    return mensaje;
  }

  if (typeof error?.message === "string") {
    return error.message;
  }

  return predeterminado;
};

export default function Ventas() {
  const navigate = useNavigate();

  const [catalogos, setCatalogos] =
    useState<Catalogos | null>(null);

  const [ventas, setVentas] =
    useState<VentaListado[]>([]);

  const [carrito, setCarrito] =
    useState<CarritoItem[]>([]);

  /*
   * El cliente ya no se selecciona desde una lista completa.
   * Se busca por DPI, NIT o código y se guarda el resultado
   * seleccionado en este estado.
   */
  const [
    clienteSeleccionado,
    setClienteSeleccionado,
  ] = useState<Cliente | null>(null);

  const [busquedaCliente, setBusquedaCliente] =
    useState("");

  const [
    resultadosClientes,
    setResultadosClientes,
  ] = useState<Cliente[]>([]);

  const [buscandoCliente, setBuscandoCliente] =
    useState(false);

  const [
    busquedaClienteRealizada,
    setBusquedaClienteRealizada,
  ] = useState(false);

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
   * El historial ya no se consulta al abrir la pantalla.
   * Solo se carga cuando el usuario presiona el botón.
   */
  const [
    mostrarVentasRecientes,
    setMostrarVentasRecientes,
  ] = useState(false);

  const [ventasCargadas, setVentasCargadas] =
    useState(false);

  const [cargandoVentas, setCargandoVentas] =
    useState(false);

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

  const idCliente =
    clienteSeleccionado?.id_cliente || 0;

  const cargarCatalogos = async () => {
    const respuesta =
      await api.get<Catalogos>("/ventas/catalogos");

    const datos = respuesta.data;

    setCatalogos(datos);

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
    try {
      setCargandoVentas(true);

      const respuesta =
        await api.get<VentaListado[]>("/ventas");

      setVentas(
        Array.isArray(respuesta.data)
          ? respuesta.data
          : [],
      );

      setVentasCargadas(true);
    } finally {
      setCargandoVentas(false);
    }
  };

  const cargarDatos = async () => {
    try {
      setCargando(true);

      /*
       * Ya no se llama cargarVentas() aquí.
       * Esto evita cargar el historial completo
       * cada vez que se abre el módulo.
       */
      await cargarCatalogos();
    } catch (error: any) {
      console.error(
        "Error al cargar ventas:",
        error,
      );

      alert(
        obtenerMensajeError(
          error,
          "Error al cargar el módulo de ventas",
        ),
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const buscarCliente = async (
    event?: FormEvent<HTMLFormElement>,
  ) => {
    event?.preventDefault();

    if (guardando || buscandoCliente) {
      return;
    }

    const valor = busquedaCliente.trim();

    if (valor.length < 3) {
      alert(
        "Ingrese al menos 3 caracteres del DPI, NIT o código del cliente",
      );
      return;
    }

    try {
      setBuscandoCliente(true);
      setBusquedaClienteRealizada(false);
      setResultadosClientes([]);

      const respuesta = await api.get<Cliente[]>(
        "/ventas/clientes/buscar",
        {
          params: {
            valor,
          },
        },
      );

      const clientes = Array.isArray(
        respuesta.data,
      )
        ? respuesta.data
        : [];

      setResultadosClientes(clientes);
      setBusquedaClienteRealizada(true);

      if (clientes.length === 1) {
        setClienteSeleccionado(clientes[0]);
        setResultadosClientes([]);
      }
    } catch (error: any) {
      console.error(
        "Error al buscar cliente:",
        error,
      );

      alert(
        obtenerMensajeError(
          error,
          "No fue posible buscar el cliente",
        ),
      );
    } finally {
      setBuscandoCliente(false);
    }
  };

  const seleccionarCliente = (
    cliente: Cliente,
  ) => {
    setClienteSeleccionado(cliente);
    setBusquedaCliente(
      cliente.dpi ||
        cliente.nit ||
        cliente.codigo_cliente,
    );
    setResultadosClientes([]);
    setBusquedaClienteRealizada(false);
  };

  const limpiarCliente = () => {
    if (guardando) {
      return;
    }

    setClienteSeleccionado(null);
    setBusquedaCliente("");
    setResultadosClientes([]);
    setBusquedaClienteRealizada(false);
  };

  const alternarVentasRecientes = async () => {
    if (mostrarVentasRecientes) {
      setMostrarVentasRecientes(false);
      return;
    }

    try {
      if (!ventasCargadas) {
        await cargarVentas();
      }

      setMostrarVentasRecientes(true);
    } catch (error: any) {
      console.error(
        "Error al cargar ventas recientes:",
        error,
      );

      alert(
        obtenerMensajeError(
          error,
          "No fue posible cargar las ventas recientes",
        ),
      );
    }
  };

  const actualizarVentasRecientes = async () => {
    try {
      await cargarVentas();
    } catch (error: any) {
      console.error(
        "Error al actualizar ventas recientes:",
        error,
      );

      alert(
        obtenerMensajeError(
          error,
          "No fue posible actualizar las ventas recientes",
        ),
      );
    }
  };

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

    /*
     * Se limpia el cliente para evitar registrar
     * accidentalmente la siguiente venta a la misma persona.
     */
    setClienteSeleccionado(null);
    setBusquedaCliente("");
    setResultadosClientes([]);
    setBusquedaClienteRealizada(false);
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
      alert(
        "Busque y seleccione un cliente por DPI o NIT",
      );
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
      [
        `¿Registrar la venta por Q${total.toFixed(
          2,
        )}?`,
        "",
        `Cliente: ${clienteSeleccionado?.cliente}`,
        `DPI: ${clienteSeleccionado?.dpi || "-"}`,
        `NIT: ${clienteSeleccionado?.nit || "C/F"}`,
      ].join("\n"),
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

      /*
       * Se actualiza el inventario.
       * El historial solo se vuelve a consultar si el usuario
       * ya lo había abierto anteriormente.
       */
      await cargarCatalogos();

      if (ventasCargadas) {
        await cargarVentas();
      }
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
        obtenerMensajeError(
          error,
          "Error al registrar la venta",
        ),
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
        obtenerMensajeError(
          error,
          "No fue posible abrir el recibo",
        ),
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
            <h2 className="mb-1 text-xl font-bold">
              Nueva venta
            </h2>

            <p className="mb-4 text-sm text-slate-500">
              Busca al cliente por DPI, NIT o código
              antes de registrar la venta.
            </p>

            <form
              onSubmit={buscarCliente}
              className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]"
            >
              <Input
                label="DPI, NIT o código del cliente"
                value={busquedaCliente}
                disabled={
                  guardando ||
                  buscandoCliente
                }
                onChange={(e) => {
                  setBusquedaCliente(
                    e.target.value,
                  );

                  if (clienteSeleccionado) {
                    setClienteSeleccionado(null);
                  }

                  setResultadosClientes([]);
                  setBusquedaClienteRealizada(false);
                }}
                placeholder="Ejemplo: 281539065 o 1234567890101"
              />

              <div className="flex items-end">
                <BotonPrimario
                  type="submit"
                  className="w-full md:w-auto"
                  disabled={
                    guardando ||
                    buscandoCliente ||
                    busquedaCliente.trim().length < 3
                  }
                >
                  {buscandoCliente
                    ? "Buscando..."
                    : "Buscar cliente"}
                </BotonPrimario>
              </div>
            </form>

            {resultadosClientes.length > 0 && (
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                <div className="border-b bg-slate-50 px-4 py-3">
                  <p className="font-semibold">
                    Seleccione el cliente
                  </p>

                  <p className="text-sm text-slate-500">
                    Se encontraron{" "}
                    {resultadosClientes.length} resultado(s).
                  </p>
                </div>

                <div className="divide-y">
                  {resultadosClientes.map(
                    (cliente) => (
                      <button
                        key={cliente.id_cliente}
                        type="button"
                        disabled={guardando}
                        onClick={() =>
                          seleccionarCliente(
                            cliente,
                          )
                        }
                        className="flex w-full flex-col gap-2 px-4 py-3 text-left transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-800">
                            {cliente.cliente}
                          </p>

                          <p className="text-sm text-slate-500">
                            Código:{" "}
                            {cliente.codigo_cliente}
                          </p>
                        </div>

                        <div className="text-sm md:text-right">
                          <p>
                            DPI:{" "}
                            {cliente.dpi || "-"}
                          </p>

                          <p>
                            NIT:{" "}
                            {cliente.nit || "C/F"}
                          </p>
                        </div>
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}

            {busquedaClienteRealizada &&
              resultadosClientes.length === 0 &&
              !clienteSeleccionado && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="font-semibold text-amber-700">
                    No se encontró el cliente
                  </p>

                  <p className="mt-1 text-sm text-amber-600">
                    Verifica el DPI o NIT ingresado.
                    También puedes buscar por código de
                    cliente.
                  </p>
                </div>
              )}

            {clienteSeleccionado && (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-green-700">
                      Cliente seleccionado
                    </p>

                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {clienteSeleccionado.cliente}
                    </p>

                    <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-1 text-sm text-slate-700 sm:grid-cols-2">
                      <p>
                        <span className="font-semibold">
                          Código:
                        </span>{" "}
                        {
                          clienteSeleccionado.codigo_cliente
                        }
                      </p>

                      <p>
                        <span className="font-semibold">
                          Teléfono:
                        </span>{" "}
                        {
                          clienteSeleccionado.telefono ||
                          "-"
                        }
                      </p>

                      <p>
                        <span className="font-semibold">
                          DPI:
                        </span>{" "}
                        {clienteSeleccionado.dpi || "-"}
                      </p>

                      <p>
                        <span className="font-semibold">
                          NIT:
                        </span>{" "}
                        {
                          clienteSeleccionado.nit ||
                          "C/F"
                        }
                      </p>

                      <p>
                        <span className="font-semibold">
                          Tipo:
                        </span>{" "}
                        {
                          clienteSeleccionado.tipo_cliente
                        }
                      </p>

                      <p>
                        <span className="font-semibold">
                          Descuento:
                        </span>{" "}
                        {
                          clienteSeleccionado.porcentaje_descuento
                        }
                        %
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={guardando}
                    onClick={limpiarCliente}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cambiar cliente
                  </button>
                </div>
              </div>
            )}
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

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">
                  Cliente
                </span>

                <span className="text-right font-semibold">
                  {clienteSeleccionado?.cliente ||
                    "Sin seleccionar"}
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

      <Card className="mt-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold">
              Ventas recientes
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              El historial se carga únicamente cuando
              lo solicitas.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {mostrarVentasRecientes && (
              <BotonSecundario
                type="button"
                disabled={cargandoVentas}
                onClick={
                  actualizarVentasRecientes
                }
              >
                {cargandoVentas
                  ? "Actualizando..."
                  : "Actualizar"}
              </BotonSecundario>
            )}

            <BotonPrimario
              type="button"
              disabled={cargandoVentas}
              onClick={alternarVentasRecientes}
            >
              {cargandoVentas
                ? "Cargando..."
                : mostrarVentasRecientes
                  ? "Ocultar ventas"
                  : "Ver ventas recientes"}
            </BotonPrimario>
          </div>
        </div>

        {mostrarVentasRecientes && (
          <div className="mt-6">
            {cargandoVentas ? (
              <Loader texto="Cargando ventas recientes..." />
            ) : (
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
                          abrirReciboVenta(
                            venta,
                          )
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
            )}
          </div>
        )}
      </Card>

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