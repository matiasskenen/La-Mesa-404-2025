import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AlertController, IonicModule } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { addIcons } from 'ionicons';
import { NavController } from '@ionic/angular';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  checkboxOutline,
  checkmarkSharp,
  homeOutline,
  newspaperOutline,
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

  estadoPedido:
    | 'ninguno'
    | 'pagado'
    | 'pendiente'
    | 'confirmado'
    | 'entregado'
    | 'pendiente_elaboracion'
    | 'terminado'
    | 'pago_pendiente_confirmacion'
    | 'elaborado' = 'ninguno';

  pedidoIniciadoLocalmente: boolean = false;

  qrEscaneado: string = '';
  numeroQRextraido: string = '';
  hizoEncuesta: boolean = false;
  logs: string[] = [];

  constructor(private route: ActivatedRoute, private navCtrl: NavController) {
    addIcons({
      qrCodeOutline,
      checkmarkSharp,
      homeOutline,
      checkboxOutline,
      newspaperOutline,
    });
  }

  log(mensaje: string) {
    const ahora = new Date().toLocaleTimeString();
    this.logs.unshift(`[${ahora}] ${mensaje}`);
    if (this.logs.length > 100) this.logs.pop();
    console.log(mensaje);
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.mesaAsignada = params['mesa'];
      this.log('Mesa asignada: ' + this.mesaAsignada);
      if (this.mesaAsignada) {
        this.verificarPedido();
        this.verificarEncuesta();
        this.escucharEstadoPedido();
      }
    });
  }

  ngOnDestroy() {
    this.canalPedido?.unsubscribe();
    this.log('Canal de pedido cerrado');
  }

  async liberarMesaAlPagar() {
    if (!this.mesaAsignada) {
      this.log('liberarMesaAlPagar(): mesa no asignada');
      return;
    }

    this.marcarPagoPendienteConfirmacion();
    // Cambiar el estado de la mesa a disponible
    const { error } = await this.auth.sb.supabase
      .from('mesas')
      .update({ estado: 'disponible' })
      .eq('numero', this.mesaAsignada);

    if (error) {
      this.log('❌ Error al liberar mesa: ' + error.message);
      this.mostrarModalAlerta(true, 'Error', 'No se pudo liberar la mesa.');
      return;
    }

    this.log(`✅ Mesa ${this.mesaAsignada} marcada como disponible`);
    this.mostrarModalAlerta(true, 'Mesa liberada', 'Gracias por tu visita.');
  }

  iniciarPedido() {
    this.estadoPedido = 'pendiente';
    this.pedidoIniciadoLocalmente = true;
    this.log('iniciarPedido(): Estado cambiado a pendiente');
    this.navCtrl.navigateForward('/menu');
  }
  async verificarPedido() {
    const email = this.auth.usuarioActual?.email;
    if (!email || !this.mesaAsignada) {
      this.log('verificarPedido(): Faltan datos para consulta');
      return;
    }

    const { data, error } = await this.auth.sb.supabase
      .from('pedidos_pendientes')
      .select('estado')
      .eq('cliente_id', email)
      .eq('mesa_id', this.mesaAsignada)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // pedidoIniciadoLocalmente is now a class property, not a local variable.

    if (data?.estado === 'entregado') {
      this.estadoPedido = 'entregado';
      this.navCtrl.navigateForward(['/estado-pedido'], {
        queryParams: { mesa: this.mesaAsignada },
      });
    } else if (data?.estado === 'confirmado') {
      this.estadoPedido = 'confirmado';
    } else if (data?.estado === 'pendiente_confirmacion') {
      this.estadoPedido = 'pendiente';
    } else if (data?.estado === 'pendiente_elaboracion') {
      this.estadoPedido = 'pendiente_elaboracion';
    } else if (data?.estado === 'elaborado') {
      this.estadoPedido = 'elaborado';
    } else if (data?.estado === 'pago_pendiente_confirmacion') {
      this.estadoPedido = 'pago_pendiente_confirmacion';
    } else if (data?.estado === 'pagado') {
      this.volverAtras();
      this.estadoPedido = 'pagado';
      
    } else if (data) {
      this.estadoPedido = 'pendiente';
    } else {
      this.log(
        'verificarPedido(): sin datos válidos, se mantiene estado actual: ' +
          this.estadoPedido
      );
      return; // no cambiar estado si no hay datos
    }

    this.log('verificarPedido(): Estado final seteado: ' + this.estadoPedido);
  }

  async marcarPagoPendienteConfirmacion() {
    const { error } = await this.auth.sb.supabase
      .from('pedidos_pendientes')
      .update({ estado: 'pago_pendiente_confirmacion' })
      .eq('mesa_id', this.mesaAsignada);

    if (error) {
      this.log('Error al actualizar estado de la mesa: ' + error.message);
      this.mostrarModalAlerta(
        true,
        'Error',
        'No se pudo cambiar el estado de la mesa.'
      );
      return;
    }

    this.log(
      `✅ Mesa ${this.mesaAsignada} marcada como pago pendiente de confirmación`
    );
    this.mostrarModalAlerta(
      true,
      'Pago pendiente',
      'Se notificó que estás esperando la confirmación del pago.'
    );
  }

  escucharEstadoPedido() {
    // const email = this.auth.usuarioActual?.email;
    const email = 'cliente@resto.com';
    if (!email) return;

    this.canalPedido = this.auth.sb.supabase
      .channel('canal-pedido-cliente')
      .on(
        'postgres_changes',
        {
          event: '*', //Solo escuchas cambios de tipo update
          schema: 'public',
          table: 'pedidos_pendientes',
          filter: `cliente_id=eq.${email}`,
        },
        (payload) => {
          console.log('Evento recibido:', payload);
          let nuevoEstado: string | null = null;

          if (payload.new && 'estado' in payload.new) {
            nuevoEstado = payload.new?.['estado'];
          }

          if (nuevoEstado === 'confirmado') {
            this.estadoPedido = 'confirmado';
            this.mostrarModalAlerta(
              true,
              'Pedido confirmado',
              'Tu pedido fue aceptado por el mozo.'
            );
          } else if (nuevoEstado === 'pendiente_confirmacion') {
            this.mostrarModalAlerta(
              true,
              'Pedido pendiente',
              'Tu pedido está esperando confirmación del mozo.'
            );
            this.estadoPedido = 'pendiente';
          } else if (nuevoEstado === 'entregado') {
            this.estadoPedido = 'entregado';
            this.mostrarModalAlerta(
              true,
              'Pedido entregado',
              'Tu pedido fue entregado. Podés pagar la cuenta.'
            );
            this.navCtrl.navigateForward(['/estado-pedido'], {
              queryParams: { mesa: this.mesaAsignada },
            });
          } else if (nuevoEstado === 'pagado') {
            this.estadoPedido = 'pagado';
            this.mostrarModalAlerta(
              true,
              'Pedido entregado',
              'Gracias por tu visita.'
            );
            this.volverAtras();

          }
          
        }
      )
      .subscribe();
  }

  volverAtras() {
    this.auth.cerrarSesion();
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

        let titulo = 'Mesa verificada';
        let mensaje = 'Bienvenido nuevamente.';

        if (this.estadoPedido === 'confirmado') {
          titulo = 'Pedido confirmado';
          mensaje = 'Tu pedido fue aceptado. En breve llegará a tu mesa.';
        } else if (this.estadoPedido === 'pendiente') {
          titulo = 'Pedido en espera';
          mensaje = 'Tu pedido está esperando confirmación del mozo.';
        } else if (this.estadoPedido === 'entregado') {
          titulo = 'Pedido entregado';

          mensaje = 'Tu pedido ha sido entregado.';
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

  async verEstadoPedidoEscaneandoQR() {
    this.log('Iniciando flujo de verEstadoPedidoEscaneandoQR()');

    this.procesando = true;
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

      const match = claveQR.match(/(?:-)?qr(\d+)/i);
      const numeroQR = match ? match[1] : null;

      if (numeroQR?.toString() === this.mesaAsignada?.toString()) {
        this.log('QR válido para ver estado. Navegando a /estado-pedido...');
        this.navCtrl.navigateForward(['/estado-pedido'], {
          queryParams: { mesa: this.mesaAsignada },
        });
      } else {
        this.mostrarModalAlerta(
          true,
          'QR inválido',
          'Este código QR no corresponde a tu mesa.'
        );
      }
    } catch (err) {
      this.mostrarModalAlerta(
        true,
        'Error',
        'Hubo un problema al escanear el QR.'
      );
    } finally {
      this.procesando = false;
    }
  }

  async verTerminarPedido() {
    this.log('Iniciando flujo de verEstadoPedidoEscaneandoQR()');

    this.procesando = true;
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

      const match = claveQR.match(/(?:-)?qr(\d+)/i);
      const numeroQR = match ? match[1] : null;

      if (numeroQR?.toString() === this.mesaAsignada?.toString()) {
        this.log('QR válido para ver estado. Navegando a /estado-pedido...');
        this.estadoPedido = 'terminado';
      } else {
        this.mostrarModalAlerta(
          true,
          'QR inválido',
          'Este código QR no corresponde a tu mesa.'
        );
      }
    } catch (err) {
      this.mostrarModalAlerta(
        true,
        'Error',
        'Hubo un problema al escanear el QR.'
      );
    } finally {
      this.procesando = false;
    }
  }

  async verificarEncuesta() {
    const email = this.auth.usuarioActual?.email;
    if (!email || !this.mesaAsignada) return;

    const { data } = await this.auth.sb.supabase
      .from('pedidos_pendientes')
      .select('hizo_la_encuesta')
      .eq('cliente_id', email)
      .eq('mesa_id', this.mesaAsignada.toString())
      .limit(1)
      .maybeSingle();

    this.hizoEncuesta = data?.hizo_la_encuesta === true;
    this.log('verificarEncuesta(): hizoEncuesta = ' + this.hizoEncuesta);
  }

  mostrarModalAlerta(
    mostrar: boolean,
    titulo: string = '',
    mensaje: string = ''
  ) {
    if (mostrar) {
      this.mensajeAlerta = mensaje;
      this.tituloAlerta = titulo;
      this.log(`Modal mostrado: ${titulo} - ${mensaje}`);
    }
    this.modalAlerta = mostrar;
  }

  simularCambioEstadoPedido(
    nuevoEstado: 'ninguno' | 'pendiente' | 'confirmado' | 'entregado'
  ) {
    this.estadoPedido = nuevoEstado;
    this.log('simularCambioEstadoPedido(): nuevo estado → ' + nuevoEstado);
    this.mostrarModalAlerta(
      true,
      'Estado simulado',
      'Estado actual: ' + nuevoEstado
    );
  }

  simularQR(correcto: boolean) {
    const numeroQR = correcto ? this.mesaAsignada : '9999';
    this.qrEscaneado = 'Simulado';
    this.numeroQRextraido = numeroQR;

    if (numeroQR === this.mesaAsignada) {
      this.mesaVerificada = true;
      this.log('simularQR(): QR correcto, mesa verificada');
    } else {
      this.log('simularQR(): QR incorrecto');
    }
  }
}
