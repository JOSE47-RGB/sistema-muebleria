import { useState } from "react";
import { api } from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("admin@muebleria.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const respuesta = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", respuesta.data.token);
      localStorage.setItem("usuario", JSON.stringify(respuesta.data.usuario));

      window.location.href = "/dashboard";
    } catch {
      setError("Correo o contraseña incorrectos");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-sky-300 via-blue-500 to-blue-900">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl px-8 py-10 md:px-12">
        <h1 className="text-4xl font-semibold text-blue-500">Sign in</h1>
        <p className="text-sm text-gray-400 mt-2 mb-8">
          POS Mueblería · Flores Costa Cuca
        </p>

        <form onSubmit={handleLogin} className="space-y-5">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-full border border-gray-300 py-4 px-5 outline-none focus:border-blue-500"
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-full border border-gray-300 py-4 px-5 outline-none focus:border-blue-500"
          />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-full bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold py-4 transition disabled:opacity-60"
          >
            {cargando ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-gray-400">
          Ventas · Inventario · Caja · Apartados
        </p>
      </div>
    </div>
  );
}