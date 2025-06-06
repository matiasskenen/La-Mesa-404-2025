import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import {
  IonContent,
  IonButton,
  IonInput,
  IonItem,
  IonText,
  IonIcon,
  ActionSheetController,
  IonSpinner,
} from '@ionic/angular/standalone';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

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
    IonText,
    IonIcon,
    IonSpinner,
  ],
})
export class RegisterPage implements OnInit {
  auth = inject(AuthService);
  actionSheetCtrl = inject(ActionSheetController);

  formCliente: FormGroup;
  mensajeError = '';
  mensajeOk = '';
  imagenSeleccionada: File | null = null;
  imagenPreviewUrl: string | null = null;
  subiendoImagen = false;

  constructor(private router: Router, private fb: FormBuilder) {
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

  ngOnInit() {}

  formularioValido(): boolean {
    return this.formCliente.valid && this.imagenSeleccionada !== null;
  }

  volver() {
    this.router.navigateByUrl('/login');
  }

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
      const file = new File([blob], `foto_${Date.now()}.jpg`, {
        type: blob.type,
      });

      this.imagenSeleccionada = file;
      this.imagenPreviewUrl = image.dataUrl!; // 👈 esto faltaba
    } catch (err) {
      this.mensajeError = 'No se pudo tomar la foto.';
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
      this.mensajeError = 'Las contraseñas no coinciden';
      return;
    }

    let urlImagen = null;

    if (this.imagenSeleccionada) {
      this.subiendoImagen = true;

      const nombreArchivo = `cliente_${Date.now()}.jpg`;
      const ruta = `clientes/${nombreArchivo}`;

      const { error, publicUrl } = await this.auth.subirImagenArchivo(
        this.imagenSeleccionada,
        ruta
      );

      this.subiendoImagen = false;

      if (error) {
        this.mensajeError = 'Error al subir imagen.';
        return;
      }

      urlImagen = publicUrl;
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
        tipo: 'cliente',
        imagen_url: urlImagen,
      });

      if (error) {
        this.mensajeError = 'Error al guardar: ' + error.message;
      } else {
        this.mensajeOk = '¡Cliente registrado con éxito!';
        this.formCliente.reset();
        this.imagenSeleccionada = null;
        this.imagenPreviewUrl = null;
      }
    } catch (err) {
      this.mensajeError = 'Hubo un problema: ' + (err as Error).message;
    }
  }
}
