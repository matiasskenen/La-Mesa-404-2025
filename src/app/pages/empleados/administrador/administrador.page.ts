import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import emailjs from 'emailjs-com';

import {
  IonContent,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonRadioGroup,
  IonRadio,
  IonText,
  IonIcon,
  IonTextarea,
  IonModal,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-administrador',
  templateUrl: './administrador.page.html',
  styleUrls: ['./administrador.page.scss'],
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
    IonText,
    IonIcon,
    IonTextarea,
    IonModal,
  ],
})
export class AdministradorPage implements OnInit {
  formActivo: 'duenio' | 'empleado' | 'altaClientes' | null = null;
  auth = inject(AuthService);

  formDuenio: FormGroup;
  formEmpleado: FormGroup;

  mensajeError = '';
  mensajeOk = '';

  clientesPendientes: any[] = [];

  // Modal rechazo
  modalRechazoVisible = false;
  motivoRechazo = '';
  clienteSeleccionado: any = null;

  constructor(private router: Router, private fb: FormBuilder) {
    this.formDuenio = this.fb.group({
      apellido: [''],
      nombre: [''],
      dni: [''],
      cuil: [''],
      email: [''],
      password: [''],
      confirmar: [''],
      rol: ['dueño'],
    });

    this.formEmpleado = this.fb.group({
      nombre: [''],
      apellido: [''],
      dni: [''],
      cuil: [''],
      email: [''],
      password: [''],
      confirmar: [''],
      rol: ['mozo'],
    });
  }

  ngOnInit() {
    this.cargarClientesPendientes();
  }

  ionViewWillEnter() {
    this.cargarClientesPendientes();
  }

  volver() {
    this.router.navigateByUrl('/login');
  }

  async cargarClientesPendientes() {
    const { data, error } = await this.auth.sb.supabase
      .from('usuarios')
      .select('*')
      .eq('tipo', 'cliente')
      .eq('aprobado', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al traer clientes pendientes:', error.message);
    } else {
      this.clientesPendientes = data;
    }
  }

  async aprobarCliente(cliente: any) {
    const { error } = await this.auth.sb.supabase
      .from('usuarios')
      .update({ aprobado: true })
      .eq('id', cliente.id);

    if (error) {
      this.mensajeError = 'Error al aprobar cliente: ' + error.message;
    } else {
      await this.enviarCorreoCliente(cliente.email, cliente.nombre, true);
      this.mensajeOk = 'Cliente aprobado correctamente.';
      this.cargarClientesPendientes();
    }
  }

  abrirModalRechazo(cliente: any) {
    this.clienteSeleccionado = cliente;
    this.motivoRechazo = '';
    this.modalRechazoVisible = true;
  }

  cerrarModalRechazo() {
    this.modalRechazoVisible = false;
    this.clienteSeleccionado = null;
    this.motivoRechazo = '';
  }

  async confirmarRechazo() {
    if (!this.motivoRechazo.trim()) {
      this.mensajeError = 'Tenés que escribir un motivo para rechazar.';
      return;
    }

    const cliente = this.clienteSeleccionado;

    const { error } = await this.auth.sb.supabase
      .from('usuarios')
      .delete()
      .eq('id', cliente.id);

    if (error) {
      this.mensajeError = 'Error al eliminar cliente: ' + error.message;
    } else {
      await this.enviarCorreoCliente(
        cliente.email,
        cliente.nombre,
        false,
        this.motivoRechazo
      );
      this.clientesPendientes = this.clientesPendientes.filter(
        (c) => c.id !== cliente.id
      );
      this.mensajeOk = 'Cliente rechazado correctamente.';
    }

    this.cerrarModalRechazo();
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
        tipo: 'dueño_supervisor',
        aprobado: true,
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
        tipo: 'empleado',
        aprobado: true,
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

  enviarCorreoCliente(
    emailDestino: string,
    nombre: string,
    aprobado: boolean,
    motivoTexto: string = ''
  ) {
    const templateParams = {
      to_name: nombre,
      to_email: emailDestino,
      estado: aprobado ? 'aceptado' : 'rechazado',
      motivo: aprobado ? '' : `Motivo del rechazo: ${motivoTexto}`,
      empresa: 'MESA 404',
      logo_url: 'https://i.imgur.com/G6Zwxv1.png',
    };

    emailjs
      .send(
        'service_8xl5hfr',
        'template_eqs9mhe',
        templateParams,
        'ugJXF6nqC7DtIYSSr'
      )
      .then((result) => {
        console.log('Correo enviado ✅', result.text);
      })
      .catch((error) => {
        console.error('Error al enviar correo ❌', error.text);
      });
  }
}
