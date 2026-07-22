import { useEffect, useState } from "react";
import { api } from "../services/api";

type MenuItem = {
  id_modulo: number;
  codigo: string;
  nombre: string;
  ruta: string;
  icono: string;
  id_modulo_padre: number | null;
  orden_menu: number;
};

export default function Dashboard() {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cargandoMenu, setCargandoMenu] = useState(true);

  useEffect(() => {
    const cargarMenu = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        window.location.href = "/";
        return;
      }

      try {
        const respuesta = await api.get("/auth/menu", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setMenu(respuesta.data.menu || []);
      } catch (error: any) {
        console.error("ERROR COMPLETO:", error);
        alert(`Error cargando menú: ${error.response?.status || "sin status"}`);
      } finally {
        setCargandoMenu(false);
      }
    };

    cargarMenu();
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    window.location.href = "/";
  };

  const iconos: Record<string, string> = {
    dashboard: "",
    "shopping-cart": "",
    "calendar-check": "",
    users: "",
    box: "",
    warehouse: "",
    truck: "",
    "cash-register": "",
    "file-text": "",
    "bar-chart": "",
    "user-cog": "",
    shield: "",
    settings: "",
    "credit-card": "",
  };

  return (
    <div className="min-h-screen bg-slate-100 flex text-slate-900">
      <aside className="w-72 bg-gradient-to-b from-sky-950 to-blue-950 text-white p-5 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="text-4xl"></div>
          <div>
            <h1 className="text-2xl font-bold">ROBLES MADERA</h1>
            <p className="text-3xl font-bold text-blue-300">POS</p>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          {cargandoMenu ? (
            <p className="text-blue-200">Cargando menú...</p>
          ) : (
            menu.map((item, index) => (
              <button
                key={item.id_modulo}
                onClick={() => {
                  window.location.href = item.ruta;
                }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition ${
                  index === 0 ? "bg-blue-500 shadow-lg" : "hover:bg-white/10"
                }`}
              >
                <span className="text-xl">{iconos[item.icono] || ""}</span>
                <span className="text-lg">{item.nombre}</span>
              </button>
            ))
          )}
        </nav>

        <div className="bg-white/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl">
            
          </div>

          <div className="flex-1">
            <p className="font-semibold">{usuario.usuario || "Administrador"}</p>
            <p className="text-xs text-blue-200">
              {usuario.email || "admin@muebleria.com"}
            </p>
          </div>

          <button onClick={cerrarSesion} title="Cerrar sesión">
            ⏻
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button className="text-3xl">☰</button>
            <div>
              <h2 className="text-3xl font-bold">Dashboard</h2>
              <p>Bienvenido, {usuario.usuario || "Administrador"} 👋</p>
            </div>
          </div>

          <div className="bg-white rounded-full px-5 py-3 shadow flex items-center gap-3">
            <input
              placeholder="Buscar..."
              className="outline-none bg-transparent w-64"
            />
            <span></span>
          </div>
        </header>

        <section className="grid grid-cols-4 gap-5 mb-6">
          <Card icon="" titulo="Ventas de hoy" valor="Q 12,450.00" texto="↑ 15.3% vs ayer" color="bg-blue-500" />
          <Card icon="" titulo="Productos en inventario" valor="320" texto="Total productos" color="bg-green-500" />
          <Card icon="" titulo="Apartados activos" valor="18" texto="Clientes con apartados" color="bg-violet-500" />
          <Card icon="" titulo="Efectivo en caja" valor="Q 4,890.50" texto="Actual" color="bg-orange-500" />
        </section>
      </main>
    </div>
  );
}

function Card({
  icon,
  titulo,
  valor,
  texto,
  color,
}: {
  icon: string;
  titulo: string;
  valor: string;
  texto: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 flex items-center gap-5">
      <div
        className={`${color} w-16 h-16 rounded-full flex items-center justify-center text-3xl text-white`}
      >
        {icon}
      </div>
      <div>
        <p className="text-slate-500">{titulo}</p>
        <h3 className="text-2xl font-bold">{valor}</h3>
        <p className="text-sm text-slate-500">{texto}</p>
      </div>
    </div>
  );
}