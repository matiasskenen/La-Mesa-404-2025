import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AlertController, IonicModule } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { Haptics } from '@capacitor/haptics';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { addIcons } from 'ionicons';
import {qrCodeOutline} from 'ionicons/icons';

@Component({
  selector: 'app-mesa',
  templateUrl: './mesa.page.html',
  styleUrls: ['./mesa.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule,IonicModule]
})
export class MesaPage implements OnInit {
  auth = inject(AuthService);
  alertCtrl = inject(AlertController);
  mesaAsignada:string = '';
  procesando = false;
  mesaVerificada = false;
  constructor(private route: ActivatedRoute) { 
    addIcons({qrCodeOutline});
  }

  ngOnInit() {
  this.route.queryParams.subscribe(params => {
    this.mesaAsignada = params['mesa'];
  });

  //Alerta de prueba para ver si al entrar a /mesa salta la alerta desde el celu (no me salta)
  this.mostrarAlerta('prueba alerta', 'texto de prueba desde ngOnInit');
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

      //En el texto que retorna claveQr, voy a donde dice qr y agarro solo los caracteres numericos (\d+)

      const match = claveQR.match(/qr(\d+)$/);
      const numeroQR = match ? match[1] : null;

      if (numeroQR) {
        if (this.mesaAsignada === numeroQR) {
          this.mostrarAlerta('Éxito', 'QR correcto, estás en tu mesa.');
          this.mesaVerificada = true;
        } else {
          this.mostrarAlerta('Error', 'Este QR no corresponde a tu mesa.');
        }
      } else {
        this.mostrarAlerta('Error', 'Formato de QR no válido.');
      }
      
    } catch (err) {
      console.error(err);
      this.mostrarAlerta('Error', 'Hubo un problema al escanear el QR.');
    } finally {
      this.procesando = false;
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

  salir() {
    this.auth.cerrarSesion();
  }

}
