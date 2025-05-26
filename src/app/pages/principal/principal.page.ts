import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-principal',
  templateUrl: './principal.page.html',
  styleUrls: ['./principal.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonButton]
})
export class PrincipalPage implements OnInit {

  auth = inject(AuthService);

  constructor() { }

  ngOnInit() {
  }

  salir(){
    this.auth.cerrarSesion();
  }

}
