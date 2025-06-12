import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { Haptics } from '@capacitor/haptics';
import { RealtimeChannel } from '@supabase/supabase-js';
import {qrCodeOutline} from 'ionicons/icons';
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

  // Estados posibles: ninguno, esperando, aceptado
  estadoCliente: 'ninguno' | 'esperando' | 'aceptado' = 'ninguno';
  mensajeEstado: string = '';

  //Para pasar mesa por parametro (ver escucharFila() === 'aceptado')
  constructor(private routerParametro: Router){
    addIcons({qrCodeOutline});
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
          '📥 Estás en lista de espera. Un maître te asignará una mesa.';
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
        (payload) => {
          const numero = payload.new['numero'];
          const mesa = payload.new['mesa'];

          this.estadoCliente = 'aceptado';
          this.numeroFila = numero;

          this.mensajeEstado = mesa
            ? `🎉 Te asignaron la mesa ${mesa}. ¡Escaneá el menú!`
            : `🎟️ Estás en la fila con el número ${numero}. Esperá a que se te asigne una mesa.`;

            // Voy a /mesa si estadoCliente es 'aceptado' y hay mesa asignada
          if (this.estadoCliente === 'aceptado' && mesa) {
            this.router.navigate(['/mesa'], {
              queryParams: { mesa }
            });
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

  salir() {
    this.auth.cerrarSesion();
  }
}
