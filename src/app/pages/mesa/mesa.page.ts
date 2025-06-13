import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AlertController, IonicModule } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { Haptics } from '@capacitor/haptics';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { addIcons } from 'ionicons';
import {checkmarkSharp, qrCodeOutline} from 'ionicons/icons';

@Component({
  selector: 'app-mesa',
  templateUrl: './mesa.page.html',
  styleUrls: ['./mesa.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule,IonicModule, RouterLink]
})
export class MesaPage implements OnInit {
  auth = inject(AuthService);
  alertCtrl = inject(AlertController);
  mesaAsignada:string = '';
  procesando = false;
  mesaVerificada = false;

  //Alerta manual:
  modalAlerta:boolean = false;
  tituloAlerta:string = '';
  mensajeAlerta:string = '';

  constructor(private route: ActivatedRoute) { 
    addIcons({qrCodeOutline, checkmarkSharp});
  }

  ngOnInit() {
  this.route.queryParams.subscribe(params => {
    this.mesaAsignada = params['mesa'];
  });

}

async escanearQR() {
    this.procesando = true;

    try {
      const { barcodes } = await BarcodeScanner.scan();
      const claveQR = barcodes[0]?.rawValue;

      if (!claveQR) {
        this.mostrarModalAlerta(true, 'Error', 'No se detectó un código QR válido.');
        return;
      }

      //En el texto que retorna claveQr, voy a donde dice qr y agarro solo los caracteres numericos (\d+)

      const match = claveQR.match(/qr(\d+)$/);
      const numeroQR = match ? match[1] : null;

      if (numeroQR) {
        if (this.mesaAsignada === numeroQR) {
          this.mostrarModalAlerta(true, 'Éxito', 'QR correcto, estás en tu mesa.');
          this.mesaVerificada = true;
        } else {
          this.mostrarModalAlerta(true, 'Error', 'Este QR no corresponde a tu mesa.');
        }
      } else {
        this.mostrarModalAlerta(true, 'Error', 'Formato de QR no válido.');
      }
      
    } catch (err) {
      console.error(err);
      this.mostrarModalAlerta(true, 'Error', 'Hubo un problema al escanear el QR.');
    } finally {
      this.procesando = false;
    }
  }


  salir() {
    this.auth.cerrarSesion();
  }

//Alerta manual:

mostrarModalAlerta(mostrar:boolean, titulo:string = '', mensaje:string = ''){
  if(mostrar){
    this.mensajeAlerta = mensaje;
    this.tituloAlerta = titulo;
  }

  this.modalAlerta = mostrar;
  return;
}
}
