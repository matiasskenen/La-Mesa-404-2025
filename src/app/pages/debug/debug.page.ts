import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import emailjs from 'emailjs-com';

@Component({
  selector: 'app-debug',
  templateUrl: './debug.page.html',
  styleUrls: ['./debug.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule
  ]
})
export class DebugPage implements OnInit {

  emailDestino: string = '';
  nombre: string = '';
  esRechazo: boolean = false;
  motivo: string = '';

  constructor() {}

  ngOnInit() {}

  async enviarCorreo(): Promise<void> {
    if (!this.emailDestino || !this.nombre) {
      alert('Completa nombre y correo.');
      return;
    }

    if (this.esRechazo && !this.motivo.trim()) {
      alert('Por favor ingresa el motivo del rechazo.');
      return;
    }

    const templateParams = {
      to_name: this.nombre,
      to_email: this.emailDestino,
      estado: this.esRechazo ? 'rechazado' : 'aceptado',
      motivo: this.esRechazo ? `Motivo del rechazo: ${this.motivo}` : '',
      empresa: 'MESA 404',
      logo_url: 'https://i.imgur.com/G6Zwxv1.png',
    };

    try {
      const response = await emailjs.send(
        'service_8xl5hfr',
        'template_eqs9mhe',
        templateParams,
        'ugJXF6nqC7DtIYSSr'
      );
      console.log('Correo enviado correctamente', response.status);
      alert('Correo enviado correctamente');
      this.limpiarCampos();
    } catch (error) {
      console.error('Error al enviar correo:', error);
      alert('Ocurrió un error al enviar el correo.');
    }
  }

  limpiarCampos() {
    this.emailDestino = '';
    this.nombre = '';
    this.esRechazo = false;
    this.motivo = '';
  }
}
