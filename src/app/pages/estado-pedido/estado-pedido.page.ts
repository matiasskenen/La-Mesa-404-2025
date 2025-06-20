import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';
import { RealtimeChannel } from '@supabase/supabase-js';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackCircleOutline } from 'ionicons/icons';
import { ActivatedRoute } from '@angular/router';
import { RouterLink } from '@angular/router';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

@Component({
  selector: 'app-estado-pedido',
  templateUrl: './estado-pedido.page.html',
  styleUrls: ['./estado-pedido.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterLink],
})
export class EstadoPedidoPage implements OnInit {
  auth = inject(AuthService);
  supabase = this.auth.sb.supabase;
  canalPedidos: RealtimeChannel | null = null;
  pedidos: any[] = [];
  mostrarPedidos: boolean = false;
  mesaRecibida: string = '';
  constructor(private route: ActivatedRoute) {
    addIcons({ arrowBackCircleOutline });
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.mesaRecibida = params['mesa'];
    });

    this.obtenerPedidosPendientes();
  }

  async marcarPagoPendienteConfirmacion() {
    const { error } = await this.auth.sb.supabase
      .from('pedidos_pendientes')
      .update({ estado: 'pago_pendiente_confirmacion' })
      .eq('mesa_id', this.mesaRecibida);

    if (error) {
      this.mostrarModalAlerta(
        true,
        'Error',
        'No se pudo cambiar el estado de la mesa.'
      );
      return;
    }

    this.mostrarModalAlerta(
      true,
      'Pago pendiente',
      'Se notificó que estás esperando la confirmación del pago.'
    );
    window.history.back();
  }

  simularPedidoFalso() {
    const pedidoFalso = {
      mesa_id: '99',
      demora_total: 15,
      estado: 'entregado',
      productos: [
        { nombre: 'Pizza', cantidad: 2 },
        { nombre: 'Agua', cantidad: 1 },
      ],
      detalle: [
        { producto_nombre: 'Pizza', cantidad: 2, estado: 'listo' },
        { producto_nombre: 'Agua', cantidad: 1, estado: 'listo' },
      ],
    };

    this.pedidos.push(pedidoFalso);
  }

  agregarPedidoFalso() {
    this.pedidos.push({
      mesa_id: 9,
      demora_total: 25,
      importe_total: 450,
      estado: 'pedido_listo_pagar',
      detalle: [
        {
          producto_nombre: 'Pizza Muzza',
          cantidad: 1,
          precio_unitario: 250,
          estado: 'listo',
        },
        {
          producto_nombre: 'Cerveza',
          cantidad: 2,
          precio_unitario: 100,
          estado: 'listo',
        },
      ],
    });
  }

  async obtenerPedidosPendientes() {
    const email = this.auth.usuarioActual?.email;
    // const email = "cliente@resto.com"; solo de prueba
    const { data, error } = await this.supabase
      .from('pedidos_pendientes')
      .select('*')
      .eq('cliente_id', email)
      .eq('mesa_id', this.mesaRecibida.toString())
      .in('estado', [
        'pendiente_confirmacion',
        'confirmado',
        'entregado',
        'pedido_listo_pagar',
      ]);

    if (!error && data) {
      for (const pedido of data) {
        // Agrega el detalle individual de cada producto del pedido
        pedido.detalle = await this.obtenerDetallePedido(pedido.mesa_id);
      }

      this.pedidos = data;
    }


  }

  montoPropina: number = 0;
  modalAlerta: boolean = false;
  tituloAlerta: string = '';
  mensajeAlerta: string = '';

  mostrarModalAlerta(
    mostrar: boolean,
    titulo: string = '',
    mensaje: string = ''
  ) {
    if (mostrar) {
      this.mensajeAlerta = mensaje;
      this.tituloAlerta = titulo;
    }
    this.modalAlerta = mostrar;
  }

  async escanearQRPropina() {
    try {
      const { barcodes } = await BarcodeScanner.scan();
      const claveQR = barcodes[0]?.rawValue;

      if (!claveQR) {
        this.mostrarModalAlerta(
          true,
          'Error',
          'No se detectó un código QR válido.'
        );
        return;
      }

      // Esperamos un formato tipo 'propina25'
      const match = claveQR.match(/propina(\d+)/i);
      const valorPropina = match ? parseInt(match[1], 10) : null;

      if (valorPropina !== null) {
        this.montoPropina += valorPropina;
        this.mostrarModalAlerta(
          false,
          '¡Gracias!',
          `Se agregaron $${valorPropina} de propina. Total: $${this.montoPropina}`
        );
      } else {
        this.mostrarModalAlerta(
          true,
          'QR inválido',
          'Este código QR no corresponde a una propina válida.'
        );
      }
    } catch (err) {
      this.mostrarModalAlerta(
        true,
        'Error',
        'Hubo un problema al escanear el QR.'
      );
    } finally {
    }
  }

  confirmarPedido(pedido: any) {
    console.log('Pedido confirmado:', pedido);
    window.history.back();
  }

  rechazarPedido(pedido: any) {
    console.log('Pedido rechazado:', pedido);
  }

  async obtenerDetallePedido(mesa: number) {
    const { data } = await this.supabase
      .from('detalle_pedido_cliente')
      .select(
        'producto_nombre, sector, estado, tiempo_estimado_min, cantidad, precio_unitario'
      )
      .eq('mesa', mesa);
    return data || [];
  }

  volverAtras() {
    window.history.back();
  }
}
