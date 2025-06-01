import { Component, inject, OnInit, CUSTOM_ELEMENTS_SCHEMA  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonList,IonCard, 
IonCardContent, IonCardHeader, IonCardTitle} from '@ionic/angular/standalone';
import { DatabaseService } from 'src/app/services/database.service';
import { register } from 'swiper/element/bundle';

register();


@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: true,
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,
      IonList, IonCard, IonCardHeader,IonCardTitle, IonCardContent]
})
export class MenuPage implements OnInit {
  db = inject(DatabaseService);
  productos: any[] = [];
  constructor() { }

  ngOnInit() {
    this.mostrarMenu();
  }

  async mostrarMenu(){
    const todosLosProductos = await this.db.traerTodosLosProductos();
    this.productos = todosLosProductos;
  }


}
