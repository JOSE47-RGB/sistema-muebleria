import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

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
import BarraProgresoApartado from "../components/BarraProgresoApartado";

type DetalleApartado = {
  id_apartado: number;
  codigo_apartado: string;
  fecha_apartado: string;
  fecha_limite: string | null;
  total: number;
  enganche: number;
  saldo_pendiente: number;
  total_pagado: number;
  porcentaje_pagado: number;
  elegible_entrega: boolean;
  entregado: number;
  fecha_entrega: string | null;
  observaciones: string | null;
  codigo_estado: string;
  estado: string;
  usuario: string;
  sucursal: string;

  cliente: {
    codigo: string;
    nombre: string;
    nit: string | null;
    telefono: string | null;
    direccion: string | null;
  };

  detalles: Array<{
    id_apartado_detalle: number;
    id_variante: number;
    codigo_producto: string;
    producto: string;
    codigo_variante: string;
    color: string | null;
    material: string | null;
    medida: string | null;
    cantidad: number;
    precio_unitario: number;
    descuento: number;
    subtotal: number;
  }>;

  pagos: Array<{
    id_pago: number;
    token_operacion: string | null;
    id_metodo_pago: number;
    codigo_metodo: string;
    metodo_pago: string;
    monto: number;
    referencia: string | null;
    fecha: string;
  }>;
};

type MetodoPago = {
  id_metodo_pago: number;
  codigo: string;
  nombre: string;
  requiere_referencia: number;
};

type CatalogosApartado = {
  metodos_pago: MetodoPago[];
};

export default function ApartadoDetalle() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [apartado, setApartado] =
    useState<DetalleApartado | null>(null);

  const [metodosPago, setMetodosPago] =
    useState<MetodoPago[]>([]);

  const [idMetodoPago, setIdMetodoPago] =
    useState(0);

  const [monto, setMonto] =
    useState("");

  const [referencia, setReferencia] =
    useState("");

  const [motivoCancelacion, setMotivoCancelacion] =
    useState("");

  const [cargando, setCargando] =
    useState(true);

  const [procesando, setProcesando] =
    useState(false);

  const [tokenAbono, setTokenAbono] =
    useState(() => crypto.randomUUID());

  const cargar = async () => {
    try {
      setCargando(true);

      const [
        respuestaApartado,
        respuestaCatalogos,
      ] = await Promise.all([
        api.get<DetalleApartado>(
          `/apartados/${id}`,
        ),

        api.get<CatalogosApartado>(
          "/apartados/catalogos",
        ),
      ]);

      setApartado(respuestaApartado.data);

      const metodos =
        respuestaCatalogos.data.metodos_pago ||
        [];

      setMetodosPago(metodos);

      setIdMetodoPago((actual) => {
        const existe = metodos.some(
          (metodo) =>
            metodo.id_metodo_pago === actual,
        );

        return existe
          ? actual
          : metodos[0]?.id_metodo_pago || 0;
      });
    } catch (error: any) {
      alert(
        error.response?.data?.message ||
          "No fue posible cargar el apartado",
      );

      navigate("/apartados");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [id]);

  const metodoSeleccionado = useMemo(
    () =>
      metodosPago.find(
        (metodo) =>
          metodo.id_metodo_pago ===
          idMetodoPago,
      ) || null,
    [metodosPago, idMetodoPago],
  );

  const registrarAbono = async () => {
    if (!apartado || procesando) {
      return;
    }

    const montoNumero = Number(monto);

    if (
      !Number.isFinite(montoNumero) ||
      montoNumero <= 0
    ) {
      alert(
        "El monto del abono debe ser mayor que cero",
      );
      return;
    }

    if (
      montoNumero >
      apartado.saldo_pendiente
    ) {
      alert(
        `El abono no puede superar el saldo de Q${apartado.saldo_pendiente.toFixed(
          2,
        )}`,
      );
      return;
    }

    if (
      metodoSeleccionado
        ?.requiere_referencia === 1 &&
      !referencia.trim()
    ) {
      alert(
        "El método de pago requiere referencia",
      );
      return;
    }

    const confirmar = window.confirm(
      `¿Registrar un abono de Q${montoNumero.toFixed(
        2,
      )}?`,
    );

    if (!confirmar) {
      return;
    }

    try {
      setProcesando(true);

      await api.post(
        `/apartados/${apartado.id_apartado}/abonos`,
        {
          token_operacion: tokenAbono,
          id_metodo_pago: idMetodoPago,
          monto: montoNumero,
          referencia:
            referencia.trim() || null,
        },
      );

      setMonto("");
      setReferencia("");

      setTokenAbono(
        crypto.randomUUID(),
      );

      await cargar();

      alert(
        "Abono registrado correctamente",
      );
    } catch (error: any) {
      alert(
        error.response?.data?.message ||
          "No fue posible registrar el abono",
      );
    } finally {
      setProcesando(false);
    }
  };

  const entregar = async () => {
    if (!apartado || procesando) {
      return;
    }

    const confirmar = window.confirm(
      "¿Confirmas que los productos serán entregados al cliente?",
    );

    if (!confirmar) {
      return;
    }

    try {
      setProcesando(true);

      await api.patch(
        `/apartados/${apartado.id_apartado}/entregar`,
      );

      await cargar();

      alert(
        "Productos entregados correctamente",
      );
    } catch (error: any) {
      alert(
        error.response?.data?.message ||
          "No fue posible entregar los productos",
      );
    } finally {
      setProcesando(false);
    }
  };

  const cancelar = async () => {
    if (!apartado || procesando) {
      return;
    }

    const motivo =
      motivoCancelacion.trim();

    if (motivo.length < 5) {
      alert(
        "Indique un motivo de cancelación",
      );
      return;
    }

    const confirmar = window.confirm(
      "¿Cancelar el apartado y liberar los productos reservados?",
    );

    if (!confirmar) {
      return;
    }

    try {
      setProcesando(true);

      await api.patch(
        `/apartados/${apartado.id_apartado}/cancelar`,
        {
          motivo,
        },
      );

      setMotivoCancelacion("");

      await cargar();

      alert(
        "Apartado cancelado correctamente",
      );
    } catch (error: any) {
      alert(
        error.response?.data?.message ||
          "No fue posible cancelar el apartado",
      );
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) {
    return (
      <Layout>
        <Card>
          <Loader texto="Cargando apartado..." />
        </Card>
      </Layout>
    );
  }

  if (!apartado) {
    return null;
  }

  const estaActivo =
    apartado.codigo_estado === "ACTIVO";

  const puedeEntregar =
    estaActivo &&
    apartado.elegible_entrega &&
    apartado.entregado === 0;

  return (
    <Layout>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <TituloPagina
          titulo={`Apartado ${apartado.codigo_apartado}`}
          descripcion="Detalle, pagos, productos reservados y entrega."
        />

        <BotonSecundario
          type="button"
          onClick={() =>
            navigate("/apartados")
          }
        >
          Regresar
        </BotonSecundario>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">
                  Estado
                </p>

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
              </div>

              {apartado.entregado === 1 && (
                <Badge
                  texto="Entregado"
                  tipo="verde"
                />
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">
                  Cliente
                </p>

                <p className="font-bold">
                  {apartado.cliente.nombre}
                </p>

                <p className="text-sm">
                  {apartado.cliente.codigo}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  NIT
                </p>

                <p className="font-semibold">
                  {apartado.cliente.nit ||
                    "C/F"}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Fecha de apartado
                </p>

                <p className="font-semibold">
                  {new Date(
                    apartado.fecha_apartado,
                  ).toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Fecha límite
                </p>

                <p className="font-semibold">
                  {apartado.fecha_limite
                    ? new Date(
                        `${apartado.fecha_limite}T00:00:00`,
                      ).toLocaleDateString()
                    : "Sin fecha límite"}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Sucursal
                </p>

                <p className="font-semibold">
                  {apartado.sucursal}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Registrado por
                </p>

                <p className="font-semibold">
                  {apartado.usuario}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <BarraProgresoApartado
              porcentaje={
                apartado.porcentaje_pagado
              }
              entregado={
                apartado.entregado === 1
              }
            />
          </Card>

          <div>
            <h2 className="mb-3 text-xl font-bold">
              Productos reservados
            </h2>

            <Tabla
              datos={apartado.detalles}
              mensajeVacio="No hay productos"
              columnas={[
                {
                  titulo: "Producto",
                  render: (detalle) => (
                    <div>
                      <p className="font-semibold">
                        {detalle.producto}
                      </p>

                      <p className="text-xs text-slate-500">
                        {
                          detalle.codigo_variante
                        }
                      </p>
                    </div>
                  ),
                },
                {
                  titulo: "Cantidad",
                  render: (detalle) =>
                    detalle.cantidad,
                },
                {
                  titulo: "Precio",
                  render: (detalle) =>
                    `Q${detalle.precio_unitario.toFixed(
                      2,
                    )}`,
                },
                {
                  titulo: "Subtotal",
                  render: (detalle) =>
                    `Q${detalle.subtotal.toFixed(
                      2,
                    )}`,
                },
              ]}
            />
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold">
              Historial de abonos
            </h2>

            <Tabla
              datos={apartado.pagos}
              mensajeVacio="No existen abonos registrados"
              columnas={[
                {
                  titulo: "Fecha",
                  render: (pago) =>
                    new Date(
                      pago.fecha,
                    ).toLocaleString(),
                },
                {
                  titulo: "Método",
                  render: (pago) =>
                    pago.metodo_pago,
                },
                {
                  titulo: "Monto",
                  render: (pago) =>
                    `Q${pago.monto.toFixed(
                      2,
                    )}`,
                },
                {
                  titulo: "Referencia",
                  render: (pago) =>
                    pago.referencia || "-",
                },
              ]}
            />
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-5 text-xl font-bold">
              Resumen
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Total</span>

                <span className="font-bold">
                  Q{apartado.total.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-blue-700">
                <span>Pagado</span>

                <span className="font-bold">
                  Q
                  {apartado.total_pagado.toFixed(
                    2,
                  )}
                </span>
              </div>

              <div className="flex justify-between border-t pt-4 text-lg text-red-700">
                <span className="font-bold">
                  Saldo
                </span>

                <span className="font-bold">
                  Q
                  {apartado.saldo_pendiente.toFixed(
                    2,
                  )}
                </span>
              </div>
            </div>
          </Card>

          {estaActivo &&
            apartado.saldo_pendiente > 0 && (
              <Card>
                <h2 className="mb-4 text-xl font-bold">
                  Registrar abono
                </h2>

                <div className="space-y-4">
                  <Input
                    label="Monto"
                    type="number"
                    min={0.01}
                    step="0.01"
                    value={monto}
                    disabled={procesando}
                    onChange={(e) =>
                      setMonto(e.target.value)
                    }
                    placeholder="0.00"
                  />

                  <Select
                    label="Método de pago"
                    value={idMetodoPago}
                    disabled={procesando}
                    onChange={(e) =>
                      setIdMetodoPago(
                        Number(
                          e.target.value,
                        ),
                      )
                    }
                  >
                    {metodosPago.map(
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
                      label="Referencia"
                      value={referencia}
                      disabled={procesando}
                      onChange={(e) =>
                        setReferencia(
                          e.target.value,
                        )
                      }
                    />
                  )}

                  <BotonPrimario
                    type="button"
                    className="w-full"
                    disabled={
                      procesando ||
                      !monto ||
                      Number(monto) <= 0
                    }
                    onClick={registrarAbono}
                  >
                    {procesando
                      ? "Procesando..."
                      : "Registrar abono"}
                  </BotonPrimario>
                </div>
              </Card>
            )}

          {puedeEntregar && (
            <Card className="border border-green-200 bg-green-50">
              <h2 className="text-lg font-bold text-green-800">
                Listo para entrega
              </h2>

              <p className="mt-2 text-sm text-green-700">
                El cliente alcanzó al menos
                el 85% del total.
              </p>

              <BotonPrimario
                type="button"
                className="mt-4 w-full"
                disabled={procesando}
                onClick={entregar}
              >
                Entregar productos
              </BotonPrimario>
            </Card>
          )}

          {estaActivo &&
            apartado.entregado === 0 && (
              <Card className="border border-red-200">
                <h2 className="mb-4 text-lg font-bold text-red-700">
                  Cancelar apartado
                </h2>

                <Input
                  label="Motivo"
                  value={motivoCancelacion}
                  disabled={procesando}
                  onChange={(e) =>
                    setMotivoCancelacion(
                      e.target.value,
                    )
                  }
                  placeholder="Motivo de cancelación"
                />

                <button
                  type="button"
                  disabled={procesando}
                  onClick={cancelar}
                  className="mt-4 w-full rounded-xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Cancelar apartado
                </button>
              </Card>
            )}
        </div>
      </div>
    </Layout>
  );
}