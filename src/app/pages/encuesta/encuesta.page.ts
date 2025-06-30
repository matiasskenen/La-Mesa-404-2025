import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { arrowBackCircleOutline, cardOutline, cashOutline, logoBitcoin, pushOutline } from 'ionicons/icons';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { DatabaseService } from 'src/app/services/database.service';
import { AuthService } from 'src/app/services/auth.service';
import { IonLabel, IonRange, IonSegment, IonSegmentButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-encuesta',
  templateUrl: './encuesta.page.html',
  styleUrls: ['./encuesta.page.scss'],
  standalone: true,
<<<<<<< HEAD
  imports: [CommonModule, FormsModule, IonicModule, IonRange, IonLabel, IonSegment, IonSegmentButton]
=======
  imports: [CommonModule, FormsModule, IonicModule, IonRange,IonLabel, IonSegment, IonSegmentButton]
>>>>>>> 5bfa6991da2ff9b9cc773ea79648661fdcaaae6b
})
export class EncuestaPage implements OnInit {
  db = inject(DatabaseService);
  auth = inject(AuthService);
  mesaRecibida: string = '';

  modalAlerta: boolean = false;
  tituloAlerta: string = '';
  mensajeAlerta: string = '';

  atencion: number = 1;
  calidad_comida: 'mala' | 'buena' | 'excelente' = 'buena';
  medio_de_pago: 'efectivo' | 'tarjeta' | 'cripto' = 'efectivo';
  higiene_local: 'sucio' | 'normal' | 'limpio' = 'normal';

  constructor(private route: ActivatedRoute) {
    addIcons({ arrowBackCircleOutline, cashOutline, cardOutline, logoBitcoin, pushOutline });
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.mesaRecibida = params['mesa'];
    });
  }

  volverAtras() {
    window.history.back();
  }

  async enviarEncuesta() {
    const encuesta = {
      cliente_id: this.auth.usuarioActual?.email || 'cliente@resto.com',
      mesa_id: this.mesaRecibida || '4',
      atencion: this.atencion,
      calidad_comida: this.calidad_comida,
      medio_de_pago: this.medio_de_pago,
      higiene_local: this.higiene_local
    };
    console.log(encuesta);
    const guardoEncuesta = await this.db.guardarEncuesta(encuesta);
<<<<<<< HEAD

    if (guardoEncuesta) {
=======
    window.history.back();
    
    if(guardoEncuesta){
>>>>>>> 5bfa6991da2ff9b9cc773ea79648661fdcaaae6b
      this.db.cambiarEstadoEncuensta(encuesta.cliente_id, encuesta.mesa_id);
      this.mostrarModalAlerta(
        true,
        'Encuesta',
        'Respuestas guardadas correctamente.'
      );
    }

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

  salirDeEncuesta() {
    this.modalAlerta = false;
    window.history.back();
  }
}
