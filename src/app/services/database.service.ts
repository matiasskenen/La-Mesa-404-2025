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
      .select("id, created_at, id_usuario, tipo, foto_url, nombre_usuario, likes, dislikes");
    if (error) {
      console.error('Error al solicitar fotos', error.message);
    }
    return data as any[];
  }
}
