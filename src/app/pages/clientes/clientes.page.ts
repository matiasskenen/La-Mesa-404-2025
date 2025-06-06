import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.page.html',
  styleUrls: ['./clientes.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule, // ✅ incluye todos los ion-button, ion-content, ion-icon, etc.
  ],
})
export class ClientesPage {
  auth = inject(AuthService);
  alertCtrl = inject(AlertController);

  async escanearQR() {
    try {
      const { barcodes } = await BarcodeScanner.scan();
      const claveQR = barcodes[0]?.rawValue;

      if (!claveQR) {
        this.mostrarAlerta('Error', 'No se detectó un código QR válido.');
        return;
      }

      const { data: claveData, error: claveError } = await this.auth.sb.supabase
        .from('claves_validas')
        .select('*')
        .eq('clave', claveQR)
        .eq('activa', true)
        .maybeSingle();

      if (claveError || !claveData) {
        this.mostrarAlerta(
          'Clave inválida',
          'Este código QR no es válido o ya fue usado.'
        );
        return;
      }

      const { data: maxData } = await this.auth.sb.supabase
        .from('fila')
        .select('numero')
        .order('numero', { ascending: false })
        .limit(1)
        .maybeSingle();

      const siguienteNumero = (maxData?.numero || 0) + 1;

      const { error: insertarError } = await this.auth.sb.supabase
        .from('fila')
        .insert({
          numero: siguienteNumero,
          clave: claveQR,
          email:
            (await this.auth.sb.supabase.auth.getUser()).data?.user?.email ||
            'anonimo',
        });

      if (insertarError) {
        this.mostrarAlerta('Error', 'No se pudo ingresar a la fila.');
        return;
      }

      await this.auth.sb.supabase
        .from('claves_validas')
        .update({ activa: false })
        .eq('clave', claveQR);

      this.mostrarAlerta(
        '✅ Ingreso exitoso',
        `Tu número en la fila es: ${siguienteNumero}`
      );
    } catch (err) {
      console.error(err);
      this.mostrarAlerta('Error', 'Hubo un problema al escanear el código.');
    }
  }

  async mostrarAlerta(titulo: string, mensaje: string) {
    const alert = await this.alertCtrl.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
