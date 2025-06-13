import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  sb = inject(SupabaseService);
  tablaUsuarios;
  tablaProductos;
  constructor() {
    //La inicializo acá para organizar el codigo pero no cambia nada
    this.tablaProductos = this.sb.supabase.from("productos");
    this.tablaUsuarios = this.sb.supabase.from("usuarios");
  }
  async traerUsuario(id: string) {
  const { data, error } = await this.tablaUsuarios
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error('Error al solicitar usuario', error.message);
    return null;
  }

  return data; //Devuelvo un objeto para se acceda objeto.id, objeto.apellido
}

  async traerTodosLosProductos(){
    const { data, error } = await this.tablaProductos
      .select("id, nombre, descripcion, tiempo, precio, foto_1, foto_2, foto_3");
    if (error) {
      console.error('Error al solicitar productos', error.message);
    }
    return data as any[];
  }


  // Chat
  async traerTodosMensajes() {
    const { data, error } = await this.sb.supabase.from("mensajes")
      .select("id, mensaje, created_at, id_usuario (nombre)");
    if (error) {
      console.error('Error al solicitar mensajes', error.message);
    }
    return data as any[];
  }

  async guardarMensaje(mensaje: string, id_usuario: string) {
    const { data } = await this.sb.supabase.from("mensajes").insert({
      mensaje: mensaje, id_usuario: id_usuario
    })
  }


}
