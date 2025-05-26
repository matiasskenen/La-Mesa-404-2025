import { Component, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonContent, IonButton, IonInput, IonItem, IonLabel, IonAvatar,
  IonCard, IonCardContent, IonCardHeader, IonInputPasswordToggle, AlertController, IonAlert, IonList, IonIcon} from '@ionic/angular/standalone';
  import { AuthService } from 'src/app/services/auth.service';
  import { addIcons } from 'ionicons';
  import { gridSharp, star } from 'ionicons/icons';


@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent,CommonModule, ReactiveFormsModule, IonInput, IonButton, IonLabel, IonItem,
    IonAvatar,IonCard, IonCardHeader, IonCardContent, IonInputPasswordToggle, IonAlert, IonList, IonIcon]
})
export class LoginPage {
  auth = inject(AuthService);
  fb = inject(FormBuilder);
  alertCtrl = inject(AlertController);

  constructor(){
    addIcons({star, gridSharp})
  }
  
  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  async loguearse() {
  if (this.loginForm.invalid) {
    this.loginForm.markAllAsTouched();
    return;
  }

  const { email, password } = this.loginForm.value;
  const resultado = await this.auth.iniciarSesion(email, password);

  if (!resultado.success && resultado.error === "Invalid login credentials") {
    this.mostrarAlerta('Error', '¡Usuario y/o contraseña incorrectos!');
  }
}

  autocompletar(email: string, password: string) {
    this.loginForm.patchValue({ email, password });
  }

  async mostrarAlerta(titulo: string, mensaje: string) {
  const alert = await this.alertCtrl.create({
    header: titulo,
    message: mensaje,
    buttons: ['OK'],
  });

  await alert.present();
}

}

