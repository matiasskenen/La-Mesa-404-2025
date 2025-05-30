import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import {
  IonContent, IonButton, IonInput, IonItem,
  IonCard, IonCardHeader, IonCardContent, IonIcon
} from '@ionic/angular/standalone';

import { AlertController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { addIcons } from 'ionicons';
import { gridSharp, star, eye, eyeOff } from 'ionicons/icons';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent, IonInput, IonButton, IonItem,
    IonCard, IonCardHeader, IonCardContent,
    IonIcon
  ]
})
export class LoginPage {
  auth = inject(AuthService);
  fb = inject(FormBuilder);
  alertCtrl = inject(AlertController);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  verPassword = false;
  mostrarUsuarios = false;

  usuarios = [
    { nombre: 'Administrador', email: 'admin@resto.com', pass: 'admin123', img: 'assets/login/avatar_admin.png' },
    { nombre: 'Meitre', email: 'metre@resto.com', pass: 'metre123', img: 'assets/login/avatar_metre.png' },
    { nombre: 'Bartender', email: 'mozo@resto.com', pass: 'mozo123', img: 'assets/login/avatar_mozo.png' },
    { nombre: 'Cocinero', email: 'cocinero@resto.com', pass: 'cocinero123', img: 'assets/login/avatar_cocinero.png' },
    { nombre: 'Cliente', email: 'bartender@resto.com', pass: 'bart123', img: 'assets/login/avatar_cliente.png' },
    { nombre: 'Dueño', email: 'cliente@resto.com', pass: 'cliente123', img: 'assets/login/avatar_dueño.png' }
  ];

  constructor(private router: Router ) {
    addIcons({ star, gridSharp, eye, eyeOff });
  }

  async loguearse() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.value;
    const resultado = await this.auth.iniciarSesion(email, password);

    if (!resultado.success && resultado.error === 'Invalid login credentials') {
      this.mostrarAlerta('Error', '¡Usuario y/o contraseña incorrectos!');
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

  autocompletar(email: string, pass: string) {
    this.loginForm.patchValue({ email, password: pass });
    this.mostrarUsuarios = false;
  }

  irARegistro() {
    this.router.navigateByUrl('/register');
  }

}


