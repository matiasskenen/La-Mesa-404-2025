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
      .select("id, mensaje, created_at, id_usuario, emisor ,usuarios (nombre)");
    if (error) {
      console.error('Error al solicitar mensajes', error.message);
    }
    return data as any[];
  }

  async guardarMensaje(mensaje: string, id_usuario: string, emisor:string) {
    const { data } = await this.sb.supabase.from("mensajes").insert({
      mensaje: mensaje, id_usuario: id_usuario, emisor: emisor
    })
  }

  async guardarEncuesta(encuesta:any){
    const {data, error} = await this.sb.supabase.from('encuestas').insert([encuesta]);
    if (error) {
    console.error('Error al guardar encuesta:', error);
    return false;
  } else {
    console.log('Encuesta guardada correctamente:', data);
    return true;
  }
  }

  async cambiarEstadoEncuensta(id_cliente:string, id_mesa:string){
    const {data, error} = await this.sb.supabase.from('pedidos_pendientes')
                                                .update({ hizo_la_encuesta: true })
                                                .eq('cliente_id', id_cliente)
                                                .eq('mesa_id', id_mesa)
    if (error) {
    console.error('Error al cambiar estado encuesta:', error);
  } else {
    console.log('Estado encuesta guardada correctamente:', data);
  }
}

}
