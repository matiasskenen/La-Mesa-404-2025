import {
  Component,
  inject,
  OnInit,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { register } from 'swiper/element/bundle';
import { addIcons } from 'ionicons';
import { removeCircle, addCircle, checkmarkSharp } from 'ionicons/icons';

import { DatabaseService } from 'src/app/services/database.service';
import { AuthService } from 'src/app/services/auth.service';

register();

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, IonicModule],
})
export class MenuPage implements OnInit {
  db = inject(DatabaseService);
  auth = inject(AuthService);

  productos: any[] = [];
  pedido: any[] = [];
  importeTotal: number = 0;
  demora: number = 0;

  // ⚠️ Acá podés poner el número real de mesa como texto (por ejemplo, "1" o "3")
  mesaID: string = '1'; // Esto se puede setear desde escaneo QR o tabla `fila`

  constructor() {
    addIcons({ removeCircle, addCircle, checkmarkSharp });
  }

  async ngOnInit() {
    this.mostrarMenu();

    // Si el cliente está logueado, buscamos su mesa
    if (this.auth.usuarioActual?.email) {
      const mesaAsignada = await this.auth.obtenerMesaAsignada(
        this.auth.usuarioActual.email
      );
      if (mesaAsignada) {
        this.mesaID = mesaAsignada;
        console.log('Mesa asignada:', this.mesaID);
      }
    }
  }

  async mostrarMenu() {
    const todosLosProductos = await this.db.traerTodosLosProductos();
    this.productos = todosLosProductos
      .sort((a, b) => a.id - b.id)
      .map((p) => ({ ...p, cantidad: 0 }));
  }

  aumentarCantidad(producto: any) {
    producto.cantidad++;
  }

  disminuirCantidad(producto: any) {
    if (producto.cantidad > 0) {
      producto.cantidad--;
    }
  }

  agregarProducto(producto: any) {
    if (producto.cantidad <= 0) return;

    const existente = this.pedido.find((p) => p.id === producto.id);
    if (existente) {
      existente.cantidad += producto.cantidad;
    } else {
      this.pedido.push({ ...producto });
    }

    this.recalcularTotales();
    producto.cantidad = 0;
  }

  recalcularTotales() {
    this.importeTotal = this.pedido.reduce(
      (sum, p) => sum + p.precio * p.cantidad,
      0
    );
    this.demora = this.pedido.reduce(
      (sum, p) => sum + p.tiempo * p.cantidad,
      0
    );
  }

  async terminarPedido() {
    if (this.pedido.length === 0) {
      console.warn('No hay productos en el pedido.');
      return;
    }

    const pedidoPendiente = {
      cliente_id: this.auth.idUsuario || null,
      mesa_id: this.mesaID, // ahora es tipo TEXT en la base
      productos: this.pedido.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        cantidad: p.cantidad,
        precio: p.precio,
        tiempo: p.tiempo,
      })),
      importe_total: this.importeTotal,
      demora_total: this.demora,
      estado: 'pendiente_confirmacion',
      timestamp: new Date().toISOString(),
    };

    try {
      await this.auth.guardarPedidoPendiente(pedidoPendiente);
      console.log('Pedido guardado exitosamente');

      // Reiniciar estado local
      this.pedido = [];
      this.importeTotal = 0;
      this.demora = 0;
    } catch (e: any) {
      console.error('Error al guardar el pedido:', e.message);
    }
  }
}
