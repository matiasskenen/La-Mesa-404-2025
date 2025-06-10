import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

import {
  IonContent,
  IonButton,
  IonIcon,
  IonImg,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonInput,
  IonItem,
  IonText,
  IonButtons, // ← ESTE TE FALTA
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-meitre',
  templateUrl: './meitre.page.html',
  styleUrls: ['./meitre.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonInput,
    IonItem,
    IonText,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons, // ← ESTE TE FALTA
  ],
})
export class MeitrePage implements OnInit {
  formClienteActivo = false;
  mensajeError = '';
  mensajeOk = '';
  formCliente: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    this.formCliente = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      dni: ['', Validators.required],
      cuil: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmar: ['', Validators.required],
    });
  }

  ngOnInit() {}

  auth = inject(AuthService);
  supabase = this.auth.sb.supabase;

  async guardarCliente() {
    const c = this.formCliente.value;
    this.mensajeError = '';
    this.mensajeOk = '';

    if (c.password !== c.confirmar) {
      this.mensajeError = 'Las contraseñas no coinciden';
      return;
    }

    // Por ahora simula que se guarda
    console.log('Cliente a guardar:', c);

    this.mensajeOk = '¡Cliente registrado con éxito!';
    this.formCliente.reset();
    this.formClienteActivo = false;
  }

  salir() {
    this.auth.cerrarSesion();
    this.router.navigateByUrl('/login');
  }
}
