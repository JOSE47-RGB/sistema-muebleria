import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { CategoriasModule } from './categorias/categorias.module';
import { ProveedoresModule } from './proveedores/proveedores.module';

import { MarcasModule } from './marcas/marcas.module';
import { UnidadesMedidaModule } from './unidades-medida/unidades-medida.module';
import { ProductosModule } from './productos/productos.module';
import { InventarioModule } from './inventario/inventario.module';
import { EntradasInventarioModule } from './entradas-inventario/entradas-inventario.module';
import { KardexModule } from './kardex/kardex.module';
import { ClientesModule } from './clientes/clientes.module';
import { JwtConfigModule } from './config/jwt.module';
import { CommonModule } from './common/common.module';
import { VentasModule } from './ventas/ventas.module';
import { DocumentosModule } from './documentos/documentos.module';

@Module({
  imports: [
    JwtConfigModule,
    PrismaModule,
    CommonModule,
    AuthModule,
    UsuariosModule,
    CategoriasModule,
    ProveedoresModule,
    MarcasModule,
    UnidadesMedidaModule,
    ProductosModule,
    InventarioModule,
    EntradasInventarioModule,
    KardexModule,
    ClientesModule,
    VentasModule,
    DocumentosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}