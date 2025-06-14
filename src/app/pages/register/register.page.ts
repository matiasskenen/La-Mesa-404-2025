import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonButton,
  IonInput,
  IonItem,
  IonText,
  IonIcon,
  ActionSheetController,
  IonHeader,
  IonButtons,
  IonToolbar,
} from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { arrowBackCircleOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

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
    IonHeader,
    IonToolbar,
    IonButtons,
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
  qrActivo = false;

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

    addIcons({ arrowBackCircleOutline });
  }

  ngOnInit() {}

  volverAtras() {
    window.history.back();
  }

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
        { text: '📷 Tomar foto', handler: () => this.tomarFoto() },
        { text: '🖼️ Elegir de galería', handler: () => this.abrirGaleria() },
        { text: 'Cancelar', role: 'cancel' },
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
      this.imagenPreviewUrl = image.dataUrl!;
    } catch {
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

    if (!c.email || !c.password || c.password.length < 6) {
      this.mensajeError = '❌ Email o contraseña inválidos.';
      return;
    }

    if (c.password !== c.confirmar) {
      this.mensajeError = '❌ Las contraseñas no coinciden.';
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
        this.mensajeError = '❌ Error al subir imagen.';
        return;
      }

      urlImagen = publicUrl;
    }

    try {
      const { data, error: errorAuth } =
        await this.auth.sb.supabase.auth.signUp({
          email: c.email,
          password: c.password,
        });

      if (errorAuth || !data?.user) {
        this.mensajeError =
          '❌ Error al registrar en Auth: ' +
          (errorAuth?.message || 'Usuario no creado');
        return;
      }

      await this.auth.sb.supabase.auth.signOut();

      const userId = data.user.id;

      const { error } = await this.auth.sb.supabase.from('usuarios').insert({
        id: userId,
        nombre: c.nombre,
        apellido: c.apellido,
        dni: c.dni,
        cuil: c.cuil,
        email: c.email,
        password: c.password,
        rol: 'cliente',
        tipo: 'cliente',
        imagen_url: urlImagen,
        aprobado: false,
      });

      if (error) {
        this.mensajeError = '❌ Error al guardar en usuarios: ' + error.message;
      } else {
        this.tituloAlerta = 'Registro exitoso';
        this.mensajeAlerta =
          'Cliente registrado correctamente. Esperando aprobación.';
        this.modalAlerta = true;
        this.formCliente.reset();
        this.imagenSeleccionada = null;
        this.imagenPreviewUrl = null;
      }
    } catch (err) {
      this.mensajeError = '❌ Hubo un problema: ' + (err as Error).message;
    }
  }

  modalAlerta = false;
  tituloAlerta = '';
  mensajeAlerta = '';

  mostrarModalTest() {
    this.tituloAlerta = 'Test exitoso';
    this.mensajeAlerta = 'El sistema está respondiendo correctamente.';
    this.modalAlerta = true;
  }

  mostrarModalAlerta(valor: boolean) {
    this.modalAlerta = valor;
  }

  async leerQrDni() {
    this.qrActivo = true;
    this.mensajeError = '';

    try {
      const permiso = await BarcodeScanner.checkPermission({ force: true });
      if (!permiso.granted) {
        this.mensajeError = 'No se otorgó permiso a la cámara.';
        return;
      }

      BarcodeScanner.hideBackground();
      document.body.classList.add('qr-activo');

      const resultado = await BarcodeScanner.startScan();

      BarcodeScanner.showBackground();
      document.body.classList.remove('qr-activo');

      if (resultado.hasContent) {
        const datos = resultado.content.split('@');
        if (datos.length > 5) {
          this.formCliente.patchValue({
            apellido: datos[1],
            nombre: datos[2],
            dni: datos[4],
          });
        } else {
          this.mensajeError = '❌ QR no válido o incompleto.';
        }
      } else {
        this.mensajeError = '❌ No se detectó ningún código.';
      }
    } catch {
      this.mensajeError = '❌ Escaneo cancelado o error inesperado.';
      BarcodeScanner.showBackground();
      document.body.classList.remove('qr-activo');
    }

    this.qrActivo = false;
  }

  cancelarQr() {
    BarcodeScanner.showBackground();
    BarcodeScanner.stopScan();
    this.qrActivo = false;
  }
}
