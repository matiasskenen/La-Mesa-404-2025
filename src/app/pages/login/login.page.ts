import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

import {
  IonContent,
  IonButton,
  IonInput,
  IonItem,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonIcon,
  IonText,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonLoading,
} from '@ionic/angular/standalone';

import { AuthService } from 'src/app/services/auth.service';
import { addIcons } from 'ionicons';
import { gridSharp, star, eye, eyeOff, logInOutline } from 'ionicons/icons';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonInput,
    IonButton,
    IonItem,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonIcon,
    IonText,
  ],
})
export class LoginPage {
  auth = inject(AuthService);
  fb = inject(FormBuilder);


  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  verPassword = false;
  mostrarUsuarios = false;

  mensajeError = '';

  cargando = false;

  usuarios = [
    {
      nombre: 'Administrador',
      email: 'admin@resto.com',
      pass: '123456',
      img: 'assets/login/avatar_admin.png',
    },
    {
      nombre: 'Meitre',
      email: 'metre@resto.com',
      pass: '123456',
      img: 'assets/login/avatar_metre.png',
    },
    {
      nombre: 'Bartender',
      email: 'bartender@resto.com',
      pass: '123456',
      img: 'assets/login/avatar_anonimo.png',
    },
    {
      nombre: 'Mozo',
      email: 'mozo@resto.com',
      pass: '123456',
      img: 'assets/login/avatar_mozo.png',
    },
    {
      nombre: 'Cocinero',
      email: 'cocinero@resto.com',
      pass: '123456',
      img: 'assets/login/avatar_cocinero.png',
    },
    {
      nombre: 'Cliente',
      email: 'cliente@resto.com',
      pass: '123456',
      img: 'assets/login/avatar_cliente.png',
    },
    {
      nombre: 'Dueño',
      email: 'cliente@resto.com',
      pass: '123456',
      img: 'assets/login/avatar_dueño.png',
    },
  ];

  constructor(private router: Router) {
    addIcons({ star, eye, eyeOff, logInOutline });
  }

  async loguearse() {
    this.mensajeError = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.value;

    // Verificamos si el usuario existe
    const { data: usuario, error } = await this.auth.sb.supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !usuario) {
      this.mensajeError = '❌ Tu cuenta fue rechazada o eliminada.';
      return;
    }

    if (!usuario.aprobado) {
      this.mensajeError =
        '⚠️ Tu cuenta aún no fue aprobada por el administrador.';
      return;
    }

    const resultado = await this.auth.iniciarSesion(email, password);

    if (!resultado.success) {
      if (resultado.error === 'Invalid login credentials') {
        this.mensajeError = '❌ Usuario o contraseña incorrectos.';
      }
      return;
    }

    setTimeout(() => {
      this.router.navigateByUrl('/principal');
    }, 1000);
  }

  autocompletar(email: string, pass: string) {
    this.loginForm.patchValue({ email, password: pass });
    this.mostrarUsuarios = false;
  }

  irARegistro() {
    this.router.navigateByUrl('/register');
  }

  async ingresoAnonimo() {
    this.cargando = true;
    this.mensajeError = '';

    const email = 'anonimo@gmail.com';
    const password = '123456';

    // Esperamos 2 segundos con el spinner visible
    setTimeout(async () => {
      const resultado = await this.auth.iniciarSesion(email, password);

      if (!resultado.success) {
        this.cargando = false;
        this.mensajeError = '❌ Error al ingresar como anónimo.';
        return;
      }

      // 🔁 Esperamos un poco más con el spinner para no mostrar el login otra vez
      setTimeout(() => {
        this.cargando = false;
        this.router.navigateByUrl('/principal');
      }, 500); // medio segundo más, opcional
    }, 2000);
  }
}
