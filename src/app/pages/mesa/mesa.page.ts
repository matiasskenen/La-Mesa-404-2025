import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AlertController, IonicModule } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { addIcons } from 'ionicons';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  checkboxOutline,
  checkmarkSharp,
  homeOutline,
  qrCodeOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-mesa',
  templateUrl: './mesa.page.html',
  styleUrls: ['./mesa.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterLink],
})
export class MesaPage implements OnInit, OnDestroy {
  canalPedido: RealtimeChannel | null = null;
  auth = inject(AuthService);
  alertCtrl = inject(AlertController);
  mesaAsignada: string = '';
  procesando = false;
  mesaVerificada = false;

  modalAlerta: boolean = false;
  tituloAlerta: string = '';
  mensajeAlerta: string = '';

  estadoPedido: 'ninguno' | 'pendiente' | 'confirmado' | 'entregado' =
    'ninguno';

  qrEscaneado: string = '';
  numeroQRextraido: string = '';

  constructor(private route: ActivatedRoute) {
    addIcons({ qrCodeOutline, checkmarkSharp, homeOutline, checkboxOutline });
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.mesaAsignada = params['mesa'];
    });

    this.escucharEstadoPedido();
  }

  async ionViewWillEnter() {
    const estadoGuardado = localStorage.getItem('estadoPedido');
    if (estadoGuardado) {
      this.estadoPedido = estadoGuardado as
        | 'pendiente'
        | 'confirmado'
        | 'ninguno';
    }

    await this.verificarPedido();
  }

  ngOnDestroy() {
    this.canalPedido?.unsubscribe();
  }

  async verificarPedido() {
    const email = this.auth.usuarioActual?.email;
    if (!email) return;

    const { data, error } = await this.auth.sb.supabase
      .from('pedidos_pendientes')
      .select('estado')
      .eq('cliente_id', email)
      .eq('mesa_id', this.mesaAsignada)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.estado === 'entregado') {
      this.estadoPedido = 'entregado';
    } else if (data?.estado === 'confirmado') {
      this.estadoPedido = 'confirmado';
    } else if (data?.estado === 'pendiente_confirmacion') {
      this.estadoPedido = 'pendiente';
    } else if (data) {
      this.estadoPedido = 'pendiente';
    } else {
      this.estadoPedido = 'ninguno';
    }
  }
  escucharEstadoPedido() {
    const email = this.auth.usuarioActual?.email;
    if (!email) return;

    this.canalPedido = this.auth.sb.supabase
      .channel('canal-pedido-cliente')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos_pendientes',
          filter: `cliente_id=eq.${email}`,
        },
        (payload) => {
          const nuevoEstado = payload.new['estado'];

          if (nuevoEstado === 'confirmado') {
            this.estadoPedido = 'confirmado';
            this.mostrarModalAlerta(
              true,
              'Pedido confirmado',
              'Tu pedido fue aceptado por el mozo.'
            );
          } else if (nuevoEstado === 'pendiente_confirmacion') {
            this.estadoPedido = 'pendiente';
            this.mostrarModalAlerta(
              true,
              'Pedido pendiente',
              'Tu pedido está esperando confirmación del mozo.'
            );
          } else if (nuevoEstado === 'entregado') {
            this.estadoPedido = 'entregado';
            this.mostrarModalAlerta(
              true,
              'Pedido entregado',
              'Tu pedido fue entregado. Podés pagar la cuenta.'
            );
          }
        }
      )
      .subscribe();
  }

  async escanearQR() {
    this.procesando = true;

    try {
      const { barcodes } = await BarcodeScanner.scan();
      const claveQR = barcodes[0]?.rawValue;
      this.qrEscaneado = claveQR || '';

      if (!claveQR) {
        this.mostrarModalAlerta(
          true,
          'Error',
          'No se detectó un código QR válido.'
        );
        return;
      }

      const match = claveQR.match(/(?:-)?qr(\d+)/i);
      const numeroQR = match ? match[1] : null;
      this.numeroQRextraido = numeroQR || '';

      if (numeroQR?.toString() === this.mesaAsignada?.toString()) {
        this.mesaVerificada = true;
        await this.verificarPedido();

        let titulo = 'Mesa verificada';
        let mensaje = 'Bienvenido nuevamente.';

        if (this.estadoPedido === 'confirmado') {
          titulo = 'Pedido confirmado';
          mensaje = 'Tu pedido fue aceptado. En breve llegará a tu mesa.';
        } else if (this.estadoPedido === 'pendiente') {
          titulo = 'Pedido en espera';
          mensaje = 'Tu pedido está esperando confirmación del mozo.';
        } else {
          mensaje = 'Podés comenzar tu pedido desde el menú.';
        }

        this.mostrarModalAlerta(true, titulo, mensaje);
      } else {
        this.mostrarModalAlerta(
          true,
          'Error',
          'Este QR no corresponde a tu mesa.'
        );
      }
    } catch (err) {
      console.error(err);
      this.mostrarModalAlerta(
        true,
        'Error',
        'Hubo un problema al escanear el QR.'
      );
    } finally {
      this.procesando = false;
    }
  }

  async verEstadoDelPedido() {
    const email = this.auth.usuarioActual?.email;
    if (!email) return;

    const { data: pedido, error } = await this.auth.sb.supabase
      .from('pedidos_pendientes')
      .select('id')
      .eq('cliente_id', email)
      .eq('mesa_id', this.mesaAsignada)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!pedido || error) {
      this.mostrarModalAlerta(
        true,
        'Sin pedido',
        'No hay pedidos activos para mostrar.'
      );
      return;
    }

    const { data: detalle, error: errorDetalle } = await this.auth.sb.supabase
      .from('pedido_detalle_estado')
      .select('sector, estado, tiempo_estimado_min')
      .eq('pedido_id', pedido.id);

    if (errorDetalle || !detalle || detalle.length === 0) {
      this.mostrarModalAlerta(
        true,
        'Sin detalles',
        'No hay información disponible del pedido.'
      );
      return;
    }

    const resumen: {
      [key: string]: { listos: number; total: number; maxTiempo: number };
    } = {};

    for (const item of detalle) {
      const sector = item.sector;
      if (!resumen[sector]) {
        resumen[sector] = { listos: 0, total: 0, maxTiempo: 0 };
      }

      resumen[sector].total++;
      if (item.estado === 'listo') resumen[sector].listos++;
      if (item.tiempo_estimado_min > resumen[sector].maxTiempo) {
        resumen[sector].maxTiempo = item.tiempo_estimado_min;
      }
    }

    let mensajeFinal = '';

    for (const sector in resumen) {
      const datos = resumen[sector];
      const nombre = sector.charAt(0).toUpperCase() + sector.slice(1);
      const mensaje =
        datos.listos === datos.total
          ? 'Listo para entregar'
          : `${datos.maxTiempo} min`;

      mensajeFinal += `${nombre}: ${mensaje}\n`;
    }

    this.mostrarModalAlerta(true, 'Estado del pedido', mensajeFinal.trim());
  }

  volverAtras() {
    this.auth.cerrarSesion();
  }

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

  simularCambioEstadoPedido(
    nuevoEstado: 'ninguno' | 'pendiente' | 'confirmado'
  ) {
    this.estadoPedido = nuevoEstado;

    if (nuevoEstado === 'confirmado') {
      this.mostrarModalAlerta(
        true,
        'Pedido confirmado',
        'Tu pedido fue aceptado por el mozo.'
      );
    } else if (nuevoEstado === 'pendiente') {
      this.mostrarModalAlerta(
        true,
        'Pedido pendiente',
        'Tu pedido está esperando confirmación.'
      );
    } else {
      this.mostrarModalAlerta(false);
    }
  }

  async escanearEstadoDelPedido() {
    this.procesando = true;

    try {
      const { barcodes } = await BarcodeScanner.scan();
      const claveQR = barcodes[0]?.rawValue;
      if (!claveQR) {
        this.mostrarModalAlerta(true, 'Error', 'QR inválido.');
        return;
      }

      const match = claveQR.match(/(?:-)?qr(\d+)/i);
      const numeroQR = match ? match[1] : null;

      if (numeroQR?.toString() !== this.mesaAsignada?.toString()) {
        this.mostrarModalAlerta(
          true,
          'Error',
          'Este QR no corresponde a tu mesa.'
        );
        return;
      }

      this.consultarEstadoDespuesDeEscanear();
    } catch (err) {
      console.error(err);
      this.mostrarModalAlerta(true, 'Error', 'Problema al escanear QR.');
    } finally {
      this.procesando = false;
    }
  }

  iniciarPedido() {
    this.estadoPedido = 'pendiente';
    localStorage.setItem('estadoPedido', 'pendiente');
  }

  async consultarEstadoDespuesDeEscanear() {
    const { data: detalle } = await this.auth.sb.supabase
      .from('detalle_pedido_cliente')
      .select('sector, estado, tiempo_estimado_min')
      .eq('mesa', this.mesaAsignada);

    if (!detalle || detalle.length === 0) {
      this.mostrarModalAlerta(
        true,
        'Sin detalles',
        'No hay productos asignados aún.'
      );
      return;
    }

    const resumen: {
      [key: string]: { listos: number; total: number; maxTiempo: number };
    } = {};

    for (const item of detalle) {
      const sector = item.sector || 'cocinero';
      if (!resumen[sector]) {
        resumen[sector] = { listos: 0, total: 0, maxTiempo: 0 };
      }

      resumen[sector].total++;
      if (item.estado === 'listo') resumen[sector].listos++;

      if (
        typeof item.tiempo_estimado_min === 'number' &&
        item.tiempo_estimado_min > resumen[sector].maxTiempo
      ) {
        resumen[sector].maxTiempo = item.tiempo_estimado_min;
      }
    }

    let mensajeFinal = '';
    for (const sector in resumen) {
      const datos = resumen[sector];
      const nombre = sector === 'cocinero' ? 'Cocinero' : 'Bartender';
      const mensaje =
        datos.listos === datos.total
          ? 'Listo para entregar'
          : `${datos.maxTiempo} min`;

      mensajeFinal += `${nombre}: ${mensaje}\n`;
    }

    this.mostrarModalAlerta(true, 'Estado del pedido', mensajeFinal.trim());
  }

  simularQR(correcto: boolean) {
    const numeroQR = correcto ? this.mesaAsignada : '9999';
    this.qrEscaneado = 'Simulado';
    this.numeroQRextraido = numeroQR;

    if (numeroQR === this.mesaAsignada) {
      this.mesaVerificada = true;
      this.mostrarModalAlerta(true, 'Éxito', 'QR correcto, estás en tu mesa.');
    } else {
      this.mostrarModalAlerta(
        true,
        'Error',
        'Este QR no corresponde a tu mesa.'
      );
    }
  }
}
