import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

import { api } from "../services/api";
import Loader from "../components/Loader";

type Props = {
  children: ReactNode;
  permisoRuta?: string;
};

type MenuItem = {
  id_modulo: number;
  codigo: string;
  nombre: string;
  ruta: string | null;
  icono: string | null;
  id_modulo_padre: number | null;
  orden_menu: number;
};

type EstadoAcceso =
  | "validando"
  | "permitido"
  | "sin_token"
  | "sin_permiso";

export default function RutaPrivada({
  children,
  permisoRuta,
}: Props) {
  const [estado, setEstado] =
    useState<EstadoAcceso>("validando");

  useEffect(() => {
    let componenteActivo = true;

    const validarAcceso = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        if (componenteActivo) {
          setEstado("sin_token");
        }

        return;
      }

      if (!permisoRuta) {
        if (componenteActivo) {
          setEstado("permitido");
        }

        return;
      }

      try {
        const respuesta = await api.get("/auth/menu");

        const menu: MenuItem[] =
          respuesta.data?.menu || [];

        const rutaNormalizada = permisoRuta
          .trim()
          .toLowerCase();

        const tienePermiso = menu.some((item) => {
          if (!item.ruta) {
            return false;
          }

          return (
            item.ruta.trim().toLowerCase() ===
            rutaNormalizada
          );
        });

        if (!componenteActivo) {
          return;
        }

        if (tienePermiso) {
          setEstado("permitido");
        } else {
          console.warn(
            `Acceso denegado a la ruta: ${permisoRuta}`,
          );

          console.table(
            menu.map((item) => ({
              modulo: item.nombre,
              codigo: item.codigo,
              ruta: item.ruta,
            })),
          );

          setEstado("sin_permiso");
        }
      } catch (error: any) {
        if (!componenteActivo) {
          return;
        }

        const status = error.response?.status;

        console.error(
          "Error validando acceso:",
          status,
          error.response?.data,
        );

        if (status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("usuario");

          setEstado("sin_token");

          return;
        }

        if (status === 403) {
          setEstado("sin_permiso");

          return;
        }

        console.error(
          "No se pudo consultar el menú del usuario",
        );

        setEstado("sin_permiso");
      }
    };

    validarAcceso();

    return () => {
      componenteActivo = false;
    };
  }, [permisoRuta]);

  if (estado === "validando") {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader texto="Validando acceso..." />
      </div>
    );
  }

  if (estado === "sin_token") {
    return <Navigate to="/" replace />;
  }

  if (estado === "sin_permiso") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}