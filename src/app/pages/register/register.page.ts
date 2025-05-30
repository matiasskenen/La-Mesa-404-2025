import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

import {
  IonContent,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonText
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonContent,
    IonButton,
    IonInput,
    IonItem,
    IonLabel,
    IonText
  ]
})
export class RegisterPage implements OnInit {
  auth = inject(AuthService);

  formCliente: FormGroup;
  mensajeError = '';
  mensajeOk = '';
  imagenSeleccionada: File | null = null;

  constructor(private router: Router, private fb: FormBuilder) {
    this.formCliente = this.fb.group({
      nombre: [''],
      apellido: [''],
      dni: [''],
      cuil: [''],
      email: [''],
      password: [''],
      confirmar: ['']
    });
  }

  ngOnInit() {}

  volver() {
    this.router.navigateByUrl('/login');
  }

  async guardarCliente() {
    const c = this.formCliente.value;
    this.mensajeError = '';
    this.mensajeOk = '';

    if (c.password !== c.confirmar) {
      this.mensajeError = 'Las contraseñas no coinciden';
      return;
    }

    try {
      await this.auth.crearCuenta(c.email, c.password, c.nombre);

      const { error } = await this.auth.sb.supabase.from('usuarios').insert({
        nombre: c.nombre,
        apellido: c.apellido,
        dni: c.dni,
        cuil: c.cuil,
        email: c.email,
        password: c.password,
        rol: 'cliente',
        tipo: 'cliente'
      });

      if (error) {
        this.mensajeError = 'Error al guardar: ' + error.message;
      } else {
        this.mensajeOk = '¡Cliente registrado con éxito!';
        this.formCliente.reset();
      }
    } catch (err) {
      this.mensajeError = 'Hubo un problema: ' + (err as Error).message;
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.imagenSeleccionada = input.files[0];
    }
  }


}
