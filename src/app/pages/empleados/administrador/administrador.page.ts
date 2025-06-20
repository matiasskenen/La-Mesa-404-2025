import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
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
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonSelect,
  IonSelectOption,
  IonCard,
  IonCardContent,
} from '@ionic/angular/standalone';

import { homeOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { NotificationsService } from 'src/app/services/notifications.service';
import { INotification } from 'src/app/interfaces/notification.model';

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
    IonItem,
    IonList,
    IonText,
    IonIcon,
    IonTextarea,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonCard,
    IonCardContent,
  ],
})
export class AdministradorPage implements OnInit {
  ns = inject(NotificationsService);

  public notificacion: INotification = {
    title: '',
    body: '',
    url: '',
  };

  formActivo: 'duenio' | 'empleado' | 'altaClientes' | null = null;
  auth = inject(AuthService);

  formDuenio: FormGroup;
  formEmpleado: FormGroup;

  mensajeError = '';
  mensajeOk = '';

  clientesPendientes: any[] = [];
  modalRechazoVisible = false;
  motivoRechazo = '';
  clienteSeleccionado: any = null;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private location: Location
  ) {
    addIcons({ homeOutline });

    this.formDuenio = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      dni: ['', [Validators.required, Validators.minLength(7)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmar: ['', Validators.required],
      rol: ['', Validators.required],
    });

    this.formEmpleado = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      dni: ['', [Validators.required, Validators.minLength(7)]],
      cuil: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmar: ['', Validators.required],
      rol: ['mozo', Validators.required],
    });
  }

  ngOnInit() {
    this.cargarClientesPendientes();
  }

  ionViewWillEnter() {
    this.cargarClientesPendientes();
  }

  volverAtras() {
    this.auth.cerrarSesion();
  }

  async cargarClientesPendientes() {
    const { data, error } = await this.auth.sb.supabase
      .from('usuarios')
      .select('*')
      .eq('tipo', 'cliente')
      .eq('aprobado', false)
      .order('created_at', { ascending: false });

    if (!error && data) {
      this.clientesPendientes = data;
    }
  }

  async aprobarCliente(cliente: any) {
    const { error } = await this.auth.sb.supabase
      .from('usuarios')
      .update({ aprobado: true })
      .eq('id', cliente.id);

    if (!error) {
      await this.enviarCorreoCliente(cliente.email, cliente.nombre, true);
      this.mensajeOk = 'Cliente aprobado correctamente.';
      this.cargarClientesPendientes();
    } else {
      this.mensajeError = 'Error al aprobar cliente: ' + error.message;
    }
    this.enviarNoti(
      'Cliente Nuevo',
      'Tienes un nuevo cliente por aprobar',
      '/chat'
    );
  }

  enviarNoti(titulo: string, contenido: string, ruta: string) {
    this.notificacion.title = titulo;
    this.notificacion.body = contenido;
    this.notificacion.url = ruta;
    console.log('Antes de enviar la noti desde clientes', this.notificacion);
    this.ns
      .enviarNotificacion(this.notificacion)
      .then((responseStatus: boolean) => {
        if (responseStatus) {
          console.log('Se envió la notificacion');
        } else {
          console.log('No se envió la notificacion');
        }
      })
      .catch((error) => {
        console.log(
          'No se envió la notificacion por error: ' + JSON.stringify(error)
        );
      });
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
      this.mensajeError = 'Debe indicar un motivo para el rechazo.';
      return;
    }

    const cliente = this.clienteSeleccionado;

    const { error } = await this.auth.sb.supabase
      .from('usuarios')
      .delete()
      .eq('id', cliente.id);

    if (!error) {
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
    } else {
      this.mensajeError = 'Error al eliminar cliente: ' + error.message;
    }

    this.cerrarModalRechazo();
  }

  async guardarDuenio() {
    const d = this.formDuenio.value;
    this.mensajeError = '';
    this.mensajeOk = '';

    if (this.formDuenio.invalid || d.password !== d.confirmar) {
      this.mensajeError = 'Complete todos los campos correctamente.';
      return;
    }

    const { data, error: errorAuth } = await this.auth.sb.supabase.auth.signUp({
      email: d.email,
      password: d.password,
    });

    if (errorAuth || !data?.user) {
      this.mensajeError = 'Error en Auth: ' + (errorAuth?.message || '');
      return;
    }

    const userId = data.user.id;

    const { error } = await this.auth.sb.supabase.from('usuarios').insert({
      id: userId,
      nombre: d.nombre,
      apellido: d.apellido,
      dni: d.dni,
      email: d.email,
      rol: d.rol,
      tipo: 'duenio',
      aprobado: true,
    });

    if (!error) {
      this.mensajeOk = 'Dueño o administrador registrado correctamente.';
      this.formDuenio.reset();
      this.formActivo = null;
    } else {
      this.mensajeError = 'Error al guardar en usuarios: ' + error.message;
    }
  }

  async guardarEmpleado() {
    const e = this.formEmpleado.value;
    this.mensajeError = '';
    this.mensajeOk = '';

    if (this.formEmpleado.invalid || e.password !== e.confirmar) {
      this.mensajeError = 'Complete todos los campos correctamente.';
      return;
    }

    const { data, error: errorAuth } = await this.auth.sb.supabase.auth.signUp({
      email: e.email,
      password: e.password,
    });

    if (errorAuth || !data?.user) {
      this.mensajeError = 'Error en Auth: ' + (errorAuth?.message || '');
      return;
    }

    const userId = data.user.id;

    const { error } = await this.auth.sb.supabase.from('usuarios').insert({
      id: userId,
      nombre: e.nombre,
      apellido: e.apellido,
      dni: e.dni,
      cuil: e.cuil,
      email: e.email,
      rol: e.rol,
      tipo: 'empleado',
      aprobado: true,
    });

    if (!error) {
      this.mensajeOk = 'Empleado registrado con éxito.';
      this.formEmpleado.reset();
      this.formActivo = null;
    } else {
      this.mensajeError = 'Error al guardar: ' + error.message;
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

    emailjs.send(
      'service_8xl5hfr',
      'template_eqs9mhe',
      templateParams,
      'ugJXF6nqC7DtIYSSr'
    );
  }

  async migrarUsuariosATablaAuth() {
    this.mensajeError = '';
    this.mensajeOk = 'Migrando usuarios...';

    const { data: usuarios, error } = await this.auth.sb.supabase
      .from('usuarios')
      .select('*');

    if (error || !usuarios) {
      this.mensajeError = 'Error al obtener usuarios: ' + error?.message;
      this.mensajeOk = '';
      return;
    }

    for (const u of usuarios) {
      try {
        const { data, error: errorAuth } =
          await this.auth.sb.supabase.auth.signUp({
            email: u.email,
            password: u.password || 'clave1234',
          });

        if (data?.user?.id) {
          await this.auth.sb.supabase
            .from('usuarios')
            .update({ id: data.user.id })
            .eq('email', u.email);
        }
      } catch (e) {
        console.error('Error en migración de usuario:', u.email);
      }
    }

    this.mensajeOk = 'Migración completada.';
  }
}
