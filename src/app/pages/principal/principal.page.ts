import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonButtons,
} from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';

@Component({
  selector: 'app-principal',
  templateUrl: './principal.page.html',
  styleUrls: ['./principal.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon, // ← AGREGÁ ESTE
  ],
})
export class PrincipalPage implements OnInit {
  auth = inject(AuthService);

  constructor(private router: Router) {
    console.log(this.auth.nombreUsuario);
  }

  ngOnInit() {}

  accionExtra() {
    this.router.navigateByUrl('/administrador');
  }

  salir() {
    this.auth.cerrarSesion();
  }
}
