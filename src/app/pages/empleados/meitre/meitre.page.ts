import { Component, inject, OnInit } from '@angular/core';

import { StatusBar } from '@capacitor/status-bar';

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
  IonButtons,
  ActionSheetController,
} from '@ionic/angular/standalone';

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

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
    IonButtons,
  ],
})
export class MeitrePage implements OnInit {
  formClienteActivo = false;
  mensajeError = '';
  mensajeOk = '';
  formCliente: FormGroup;

  auth = inject(AuthService);
  supabase = this.auth.sb.supabase;
  actionSheetCtrl = inject(ActionSheetController);

  imagenSeleccionada: File | null = null;
  imagenPreviewUrl: string | null = null;
  subiendoImagen = false;

  constructor(private fb: FormBuilder, private router: Router) {
    this.configurarStatusBar();
    this.formCliente = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      dni: ['', [Validators.required, Validators.minLength(7)]],
      cuil: ['', [Validators.required, Validators.minLength(11)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmar: ['', Validators.required],
    });
  }

  async configurarStatusBar() {
    try {
      await StatusBar.setOverlaysWebView({ overlay: false }); // 🔴 ← IMPORTANTE
    } catch (error) {
      console.log('No se pudo configurar StatusBar:', error);
    }
  }

  formularioValido(): boolean {
    return this.formCliente.valid && this.imagenSeleccionada !== null;
  }

  ngOnInit() {}

  async seleccionarFuenteImagen() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Seleccionar imagen',
      buttons: [
        {
          text: '📷 Tomar foto',
          handler: () => this.tomarFoto(),
        },
        {
          text: '🖼️ Elegir de galería',
          handler: () => this.abrirGaleria(),
        },
        {
          text: 'Cancelar',
          role: 'cancel',
        },
      ],
    });
    await actionSheet.present();
  }

  async tomarFoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 70,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      const blob = await fetch(image.dataUrl!).then((res) => res.blob());
      this.imagenSeleccionada = new File([blob], `cliente_${Date.now()}.jpg`, {
        type: blob.type,
      });
      this.imagenPreviewUrl = image.dataUrl!;
    } catch {
      this.mensajeError = '❌ No se pudo tomar la foto.';
    }
  }

  abrirGaleria() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => this.onFileSelected(e);
    input.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.imagenSeleccionada = input.files[0];
      this.imagenPreviewUrl = URL.createObjectURL(this.imagenSeleccionada);
    }
  }

  borrarImagen() {
    this.imagenSeleccionada = null;
    this.imagenPreviewUrl = null;
  }

  async guardarCliente() {
    const c = this.formCliente.value;
    this.mensajeError = '';
    this.mensajeOk = '';

    if (c.password !== c.confirmar) {
      this.mensajeError = '❌ Las contraseñas no coinciden.';
      return;
    }

    if (!this.imagenSeleccionada) {
      this.mensajeError = '❌ Debe subir una imagen del cliente.';
      return;
    }

    this.subiendoImagen = true;
    const nombreArchivo = `cliente_${Date.now()}.jpg`;
    const ruta = `clientes/${nombreArchivo}`;

    const { error: errorImagen, publicUrl } =
      await this.auth.subirImagenArchivo(this.imagenSeleccionada, ruta);
    this.subiendoImagen = false;

    if (errorImagen) {
      this.mensajeError = '❌ Error al subir imagen.';
      return;
    }

    try {
      const { data, error: errorAuth } = await this.supabase.auth.signUp({
        email: c.email,
        password: c.password,
      });

      if (errorAuth || !data?.user) {
        this.mensajeError =
          '❌ Error en Auth: ' + (errorAuth?.message || 'Usuario no creado');
        return;
      }

      const userId = data.user.id;

      const { error } = await this.supabase.from('usuarios').insert({
        id: userId,
        nombre: c.nombre,
        apellido: c.apellido,
        dni: c.dni,
        cuil: c.cuil,
        email: c.email,
        rol: 'cliente',
        tipo: 'cliente',
        imagen_url: publicUrl,
        aprobado: false,
      });

      if (error) {
        this.mensajeError = '❌ Error en tabla usuarios: ' + error.message;
      } else {
        this.mensajeOk = '✅ Cliente registrado correctamente.';
        this.formCliente.reset();
        this.formClienteActivo = false;
        this.imagenSeleccionada = null;
        this.imagenPreviewUrl = null;
      }
    } catch (err) {
      this.mensajeError = '❌ Error inesperado: ' + (err as Error).message;
    }
  }

  salir() {
    this.auth.cerrarSesion();
    this.router.navigateByUrl('/login');
  }
}
