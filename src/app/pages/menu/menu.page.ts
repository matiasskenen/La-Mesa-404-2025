import { Component, inject, OnInit, CUSTOM_ELEMENTS_SCHEMA  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService } from 'src/app/services/database.service';
import { register } from 'swiper/element/bundle';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {removeCircle, addCircle, checkmarkSharp} from 'ionicons/icons';

register();


@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: true,
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule,IonicModule]
})
export class MenuPage implements OnInit {
  db = inject(DatabaseService);
  productos: any[] = [];
  importeTotal:number = 0;
  demora:number = 0;
  cantidad:number = 0;
  
  constructor() { 
    addIcons({removeCircle, addCircle, checkmarkSharp});
  }

  ngOnInit() {
    this.mostrarMenu();
  }

  async mostrarMenu(){
    const todosLosProductos = await this.db.traerTodosLosProductos();
    this.productos = todosLosProductos.sort((a, b) => a.id - b.id);
  }

  terminarPedido(){}
  agregarProducto(){}
  aumentarCantidad(){}
  disminuirCantidad(){}

}
