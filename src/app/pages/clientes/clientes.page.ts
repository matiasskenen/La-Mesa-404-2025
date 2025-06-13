import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { Haptics } from '@capacitor/haptics';
import { RealtimeChannel } from '@supabase/supabase-js';
import { homeOutline, qrCodeOutline, restaurantOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.page.html',
  styleUrls: ['./clientes.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class ClientesPage {
  auth = inject(AuthService);
  alertCtrl = inject(AlertController);
  router = inject(Router);

  procesando = false;
  canalFila: RealtimeChannel | null = null;
  numeroFila: number | null = null;

  estadoCliente: 'ninguno' | 'esperando' | 'aceptado' = 'ninguno';
  mensajeEstado: string = '';

  constructor(private routerParametro: Router) {
    addIcons({ qrCodeOutline, restaurantOutline, homeOutline });
  }

  ngOnInit() {
    this.escucharFila();
  }

  async escanearQR() {
    this.procesando = true;
    try {
      const { barcodes } = await BarcodeScanner.scan();
      const claveQR = barcodes[0]?.rawValue;

      if (!claveQR) {
        this.mostrarAlerta('Error', 'No se detectó un código QR válido.');
        return;
      }

      const { data: userData } = await this.auth.sb.supabase.auth.getUser();
      const email = userData?.user?.email || 'anonimo';

      const { error } = await this.auth.sb.supabase
        .from('espera_local')
        .insert({
          email,
          clave: claveQR,
          estado: 'pendiente',
        });

      if (error) {
        this.mostrarAlerta(
          'Error',
          'No se pudo registrar en la lista de espera.'
        );
      } else {
        await Haptics.vibrate();
        this.estadoCliente = 'esperando';
        this.mensajeEstado =
          'Estás en lista de espera. Un maître te asignará una mesa.';
      }
    } catch (err) {
      console.error(err);
      this.mostrarAlerta('Error', 'Hubo un problema al escanear el QR.');
    } finally {
      this.procesando = false;
    }
  }

  async escucharFila() {
    const { data: session } = await this.auth.sb.supabase.auth.getUser();
    const email = session?.user?.email;
    if (!email) return;

    this.canalFila = this.auth.sb.supabase
      .channel('canal-fila')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'fila',
          filter: `email=eq.${email}`,
        },
        async (payload) => {
          const numero = payload.new['numero'];
          const mesa = payload.new['mesa'];

          this.estadoCliente = 'aceptado';
          this.numeroFila = numero;

          if (mesa) {
            // ✅ Caso con mesa asignada
            this.mensajeEstado = `🎉 Te asignaron la mesa ${mesa}. ¡Escaneá el menú!`;

            // 🚀 Redirección automática
            this.router.navigate(['/mesa'], {
              queryParams: { mesa },
            });
          } else {
            // 🔄 Obtener toda la fila ordenada
            const { data: fila } = await this.auth.sb.supabase
              .from('fila')
              .select('*')
              .order('numero', { ascending: true });

            let posicion = 0;

            if (fila && Array.isArray(fila)) {
              posicion = fila.findIndex((item) => item.email === email) + 1;
            }

            // 📥 Mensaje dinámico
            this.mensajeEstado =
              posicion > 0
                ? `🎟️ Estás en la fila con el número ${numero}. Tu posición actual es: ${posicion}.`
                : `🎟️ Estás en la fila con el número ${numero}. Posición actual: desconocida.`;
          }
        }
      )
      .subscribe();
  }

  async mostrarAlerta(titulo: string, mensaje: string) {
    const alert = await this.alertCtrl.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK'],
    });
    await alert.present();
  }

  volverAtras() {
    this.auth.cerrarSesion();
  }

  simularEspera() {
    this.estadoCliente = 'esperando';
    this.mensajeEstado = 'Estás en lista de espera (simulado).';
  }

  simularAsignacionMesa() {
    this.estadoCliente = 'aceptado';
    this.mensajeEstado =
      '🎉 Te asignaron la mesa 1 (simulado). ¡Escaneá el menú!';
    this.router.navigate(['/mesa'], {
      queryParams: { mesa: 1 },
    });
  }
}
