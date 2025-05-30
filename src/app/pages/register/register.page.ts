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
  IonList,
  IonRadioGroup,
  IonRadio,
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
    IonList,
    IonRadioGroup,
    IonRadio,
    IonText 
  ]
})
export class RegisterPage implements OnInit {
  formActivo: 'duenio' | 'empleado' | null = null;
  auth = inject(AuthService);

  formDuenio: FormGroup;
  formEmpleado: FormGroup;

  mensajeError = '';
  mensajeOk = '';

  constructor(private router: Router, private fb: FormBuilder) {
    this.formDuenio = this.fb.group({
      apellido: [''],
      nombre: [''],
      dni: [''],
      cuil: [''],
      email: [''],
      password: [''],
      confirmar: [''],
      rol: ['dueño']
    });

    this.formEmpleado = this.fb.group({
      nombre: [''],
      apellido: [''],
      dni: [''],
      cuil: [''],
      email: [''],
      password: [''],
      confirmar: [''],
      rol: ['mozo']
    });
  }

  ngOnInit() {}

  volver() {
    this.router.navigateByUrl('/login');
  }

  async guardarDuenio() {
    const d = this.formDuenio.value;
    this.mensajeError = '';
    this.mensajeOk = '';

    if (d.password !== d.confirmar) {
      this.mensajeError = 'Las contraseñas no coinciden';
      return;
    }

    try {
      await this.auth.crearCuenta(d.email, d.password, d.nombre);

      const { error } = await this.auth.sb.supabase.from('usuarios').insert({
        nombre: d.nombre,
        apellido: d.apellido,
        dni: d.dni,
        cuil: d.cuil,
        email: d.email,
        password: d.password,
        rol: d.rol,
        tipo: 'dueño_supervisor'
      });

      if (error) {
        this.mensajeError = 'Error al guardar: ' + error.message;
      } else {
        this.mensajeOk = '¡Registro exitoso!';
        this.formDuenio.reset();
        this.formActivo = null;
      }
    } catch (err) {
      this.mensajeError = 'Hubo un problema: ' + (err as Error).message;
    }
  }

  async guardarEmpleado() {
    const e = this.formEmpleado.value;
    this.mensajeError = '';
    this.mensajeOk = '';

    if (e.password !== e.confirmar) {
      this.mensajeError = 'Las contraseñas no coinciden';
      return;
    }

    try {
      await this.auth.crearCuenta(e.email, e.password, e.nombre);

      const { error } = await this.auth.sb.supabase.from('usuarios').insert({
        nombre: e.nombre,
        apellido: e.apellido,
        dni: e.dni,
        cuil: e.cuil,
        email: e.email,
        password: e.password,
        rol: e.rol,
        tipo: 'empleado'
      });

      if (error) {
        this.mensajeError = 'Error al guardar: ' + error.message;
      } else {
        this.mensajeOk = '¡Empleado registrado con éxito!';
        this.formEmpleado.reset();
        this.formActivo = null;
      }
    } catch (err) {
      this.mensajeError = 'Hubo un problema: ' + (err as Error).message;
    }
  }
}
