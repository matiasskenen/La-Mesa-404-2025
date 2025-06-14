import { Component, inject, OnInit } from '@angular/core';
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
export class MesaPage implements OnInit {
  canalPedido: RealtimeChannel | null = null;
  auth = inject(AuthService);
  alertCtrl = inject(AlertController);
  mesaAsignada: string = '';
  procesando = false;
  mesaVerificada = false;

  modalAlerta: boolean = false;
  tituloAlerta: string = '';
  mensajeAlerta: string = '';
  tienePedidoPendiente: boolean = false;

  qrEscaneado: string = '';
  numeroQRextraido: string = '';

  constructor(private route: ActivatedRoute) {
    addIcons({ qrCodeOutline, checkmarkSharp, homeOutline, checkboxOutline });
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.mesaAsignada = params['mesa'];
      this.verificarPedidoPendiente();
    });

    this.escucharEstadoPedido();
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
            this.mostrarModalAlerta(
              true,
              'Pedido confirmado',
              'Tu pedido fue aceptado por el mozo.'
            );
          }
        }
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.canalPedido?.unsubscribe();
  }

  async verificarPedidoPendiente() {
    const email = this.auth.usuarioActual?.email;
    if (!email) return;

    const { data, error } = await this.auth.sb.supabase
      .from('pedidos_pendientes')
      .select('*')
      .eq('cliente_id', email)
      .eq('estado', 'pendiente_confirmacion')
      .maybeSingle();

    this.tienePedidoPendiente = !!data && !error;
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
        this.mostrarModalAlerta(
          true,
          'Éxito',
          'QR correcto, estás en tu mesa.'
        );
        this.mesaVerificada = true;
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

  simularQR(correcto: boolean) {
    const numeroQR = correcto ? this.mesaAsignada : '9999';
    this.qrEscaneado = 'Simulado';
    this.numeroQRextraido = numeroQR;

    if (numeroQR === this.mesaAsignada) {
      this.mostrarModalAlerta(true, 'Éxito', 'QR correcto, estás en tu mesa.');
      this.mesaVerificada = true;
    } else {
      this.mostrarModalAlerta(
        true,
        'Error',
        'Este QR no corresponde a tu mesa.'
      );
    }
  }
}
