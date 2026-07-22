import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

import Layout from "../components/Layout";
import Card from "../components/Card";
import Input from "../components/Input";
import Select from "../components/Select";
import TituloPagina from "../components/TituloPagina";
import BotonPrimario from "../components/BotonPrimario";
import BotonSecundario from "../components/BotonSecundario";

export default function Usuarios() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    codigo_empleado: "",
    id_sucursal: 1,
    nombres: "",
    apellidos: "",
    dpi: "",
    telefono: "",
    direccion: "",
    puesto: "",
    usuario: "",
    email: "",
    password: "",
    id_rol: 3,
  });

  const cambiar = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]:
        e.target.name === "id_rol" || e.target.name === "id_sucursal"
          ? Number(e.target.value)
          : e.target.value,
    });
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.post("/usuarios", form);
      alert("Usuario creado correctamente");

      setForm({
        codigo_empleado: "",
        id_sucursal: 1,
        nombres: "",
        apellidos: "",
        dpi: "",
        telefono: "",
        direccion: "",
        puesto: "",
        usuario: "",
        email: "",
        password: "",
        id_rol: 3,
      });
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al crear usuario");
    }
  };

  return (
    <Layout>
      <TituloPagina
        titulo="Crear usuario"
        descripcion="Crea empleado, usuario y asigna un rol del sistema."
      />

      <Card className="max-w-5xl">
        <form onSubmit={guardar} className="grid grid-cols-2 gap-4">
          <Input
            label="Código de empleado"
            name="codigo_empleado"
            value={form.codigo_empleado}
            onChange={cambiar}
            placeholder="EMP002"
            required
          />

          <Input
            label="DPI"
            name="dpi"
            value={form.dpi}
            onChange={cambiar}
            placeholder="1234567890101"
            required
          />

          <Input
            label="Nombres"
            name="nombres"
            value={form.nombres}
            onChange={cambiar}
            placeholder="Juan"
            required
          />

          <Input
            label="Apellidos"
            name="apellidos"
            value={form.apellidos}
            onChange={cambiar}
            placeholder="López"
            required
          />

          <Input
            label="Teléfono"
            name="telefono"
            value={form.telefono}
            onChange={cambiar}
            placeholder="30417275"
          />

          <Input
            label="Dirección"
            name="direccion"
            value={form.direccion}
            onChange={cambiar}
            placeholder="Flores Costa Cuca"
          />

          <Input
            label="Puesto"
            name="puesto"
            value={form.puesto}
            onChange={cambiar}
            placeholder="Vendedor"
          />

          <Select
            label="Rol"
            name="id_rol"
            value={form.id_rol}
            onChange={cambiar}
          >
            <option value={1}>SUPER_ADMIN</option>
            <option value={2}>ADMIN</option>
            <option value={3}>VENDEDOR</option>
            <option value={4}>CAJERO</option>
            <option value={5}>BODEGA</option>
          </Select>

          <Input
            label="Usuario"
            name="usuario"
            value={form.usuario}
            onChange={cambiar}
            placeholder="vendedor1"
            required
          />

          <Input
            label="Correo"
            type="email"
            name="email"
            value={form.email}
            onChange={cambiar}
            placeholder="vendedor1@muebleria.com"
            required
          />

          <Input
            label="Contraseña"
            type="password"
            name="password"
            value={form.password}
            onChange={cambiar}
            placeholder="********"
            required
          />

          <div className="col-span-2 flex gap-4 pt-4">
            <BotonPrimario type="submit" className="flex-1">
              Guardar usuario
            </BotonPrimario>

            <BotonSecundario
              type="button"
              className="flex-1"
              onClick={() => navigate("/dashboard")}
            >
              Regresar al menú
            </BotonSecundario>
          </div>
        </form>
      </Card>
    </Layout>
  );
}