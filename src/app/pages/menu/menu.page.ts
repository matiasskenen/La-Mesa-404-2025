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
import {
  removeCircle,
  addCircle,
  checkmarkSharp,
  homeOutline,
  arrowBack,
  arrowBackOutline,
  arrowBackCircleOutline,
} from 'ionicons/icons';
import { Router } from '@angular/router';
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
  routerLink = inject(Router);
  productos: any[] = [];
  pedido: any[] = [];
  importeTotal: number = 0;
  demora: number = 0;
  mesaID: string = '1'; // Se puede actualizar desde QR o base

  // Alerta flotante
  modalAlerta: boolean = false;
  tituloAlerta: string = '';
  mensajeAlerta: string = '';

  constructor(private router: Router) {
    addIcons({
      removeCircle,
      addCircle,
      checkmarkSharp,
      arrowBackCircleOutline,
    });
  }

  async ngOnInit() {
    this.mostrarMenu();

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
    //siempre la demora va a ser igual a la demora mayor
    this.demora = this.pedido.reduce((max, p) => Math.max(max, p.tiempo), 0);
  }

  async terminarPedido() {
    if (this.pedido.length === 0) {
      this.mostrarModalAlerta(true, 'Error', 'No hay productos en el pedido.');
      return;
    }

    const pedidoPendiente = {
      cliente_id: this.auth.usuarioActual?.email || 'anónimo',
      mesa_id: this.mesaID,
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
      localStorage.setItem('estadoPedido', 'pendiente');
      this.mostrarModalAlerta(
        true,
        'Pedido enviado',
        'Tu pedido fue guardado correctamente.'
      );

      this.pedido = [];
      this.importeTotal = 0;
      this.demora = 0;
    } catch (e: any) {
      console.error('Error al guardar el pedido:', e.message);
      this.mostrarModalAlerta(
        true,
        'Error',
        'Hubo un problema al guardar el pedido.'
      );
    }
  }

  mostrarModalAlerta(
    mostrar: boolean,
    titulo: string = '',
    mensaje: string = ''
  ) {
    if (mostrar) {
      this.tituloAlerta = titulo;
      this.mensajeAlerta = mensaje;
      this.modalAlerta = true;
    } else {
      this.modalAlerta = false;
      // window.history.back(); // 🔁 Vuelve atrás (mati)
      const mesa = this.mesaID;
      setTimeout(() => {
        this.router.navigate(['/mesa'], {
          queryParams: { mesa },
        });
      }, 1000);
    }
  }

  volverAtras() {
    window.history.back();
  }
}
