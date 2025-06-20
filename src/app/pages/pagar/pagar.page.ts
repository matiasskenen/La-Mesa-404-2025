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

import { arrowBackCircleOutline, homeOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-pagar',
  templateUrl: './pagar.page.html',
  styleUrls: ['./pagar.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonHeader,
    IonToolbar,
    IonButtons,
  ],
})
export class PagarPage implements OnInit {
  auth = inject(AuthService);
  constructor() {
    addIcons({ arrowBackCircleOutline });
  }

  ngOnInit() {}

  volverAtras() {
    window.history.back();
  }

  pagarConTarjeta() {
    this.auth.cerrarSesion();
  }

  pagarEnEfectivo() {
    this.auth.cerrarSesion();
    // lógica tuya
  }
}
