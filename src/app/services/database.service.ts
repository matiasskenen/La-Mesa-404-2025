import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  sb = inject(SupabaseService);
  tablaProductos;
  constructor() {
    //La inicializo acá para organizar el codigo pero no cambia nada
    this.tablaProductos = this.sb.supabase.from("productos");
  }

  async traerTodosLosProductos(){
    const { data, error } = await this.tablaProductos
      .select("id, nombre, descripcion, tiempo, precio, foto_1, foto_2, foto_3");
    if (error) {
      console.error('Error al solicitar productos', error.message);
    }
    return data as any[];
  }
}
