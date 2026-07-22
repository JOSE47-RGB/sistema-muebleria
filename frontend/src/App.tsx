import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Usuarios from "./pages/Usuarios";
import Categorias from "./pages/Categorias";
import Proveedores from "./pages/Proveedores";
import Marcas from "./pages/Marcas";
import UnidadesMedida from "./pages/UnidadesMedida";
import Productos from "./pages/Productos";
import Inventario from "./pages/Inventario";
import EntradasInventario from "./pages/EntradasInventario";
import Kardex from "./pages/Kardex";
import Clientes from "./pages/Clientes";

import RutaPrivada from "./routes/RutaPrivada";
import Ventas from "./pages/Ventas";

import Documentos from "./pages/Documentos";
import DocumentoDetalle from "./pages/DocumentoDetalle";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <RutaPrivada>
              <Dashboard />
            </RutaPrivada>
          }
        />

        <Route
          path="/usuarios"
          element={
            <RutaPrivada permisoRuta="/usuarios">
              <Usuarios />
            </RutaPrivada>
          }
        />

        <Route
          path="/categorias"
          element={
            <RutaPrivada permisoRuta="/categorias">
              <Categorias />
            </RutaPrivada>
          }
        />

        <Route
          path="/proveedores"
          element={
            <RutaPrivada permisoRuta="/proveedores">
              <Proveedores />
            </RutaPrivada>
          }
        />

        <Route
          path="/marcas"
          element={
            <RutaPrivada permisoRuta="/marcas">
              <Marcas />
            </RutaPrivada>
          }
        />

        <Route
          path="/unidades-medida"
          element={
            <RutaPrivada permisoRuta="/unidades-medida">
              <UnidadesMedida />
            </RutaPrivada>
          }
        />

        <Route
          path="/productos"
          element={
            <RutaPrivada permisoRuta="/productos">
              <Productos />
            </RutaPrivada>
          }
        />

        <Route
          path="/inventario"
          element={
            <RutaPrivada permisoRuta="/inventario">
              <Inventario />
            </RutaPrivada>
          }
        />

        <Route
          path="/entradas-inventario"
          element={
            <RutaPrivada permisoRuta="/entradas-inventario">
              <EntradasInventario />
            </RutaPrivada>
          }
        />

        <Route
          path="/kardex"
          element={
            <RutaPrivada permisoRuta="/kardex">
              <Kardex />
            </RutaPrivada>
          }
        />

        <Route
          path="/clientes"
          element={
            <RutaPrivada permisoRuta="/clientes">
              <Clientes />
            </RutaPrivada>
            
          }
          
        />
        <Route
  path="/ventas"
  element={
    <RutaPrivada permisoRuta="/ventas">
      <Ventas />
    </RutaPrivada>
  }
/>

<Route
  path="/documentos"
  element={
    <RutaPrivada permisoRuta="/documentos">
      <Documentos />
    </RutaPrivada>
  }
/>

<Route
  path="/documentos/:id"
  element={
    <RutaPrivada permisoRuta="/documentos">
      <DocumentoDetalle />
    </RutaPrivada>
  }
/>







      </Routes>
    </BrowserRouter>
  );
}

export default App;