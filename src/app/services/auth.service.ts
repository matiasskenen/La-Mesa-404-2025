import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Router } from '@angular/router';
import { User } from '@supabase/supabase-js';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  sb = inject(SupabaseService);
  db = inject(DatabaseService);
  router = inject(Router);
  usuarioObj: any = null;
  idUsuario:string = '';
  rolUsuario:string = '';
  usuarioActual: User | null = null;
  primerInicio: boolean = false;

  constructor() {
    
    /// Saber si el usuario está logueado o no
    this.sb.supabase.auth.onAuthStateChange((event, session) => {
      console.log(event, session);

      // Si el evento es SIGNED_OUT
      if (event === 'SIGNED_OUT') {
        this.usuarioActual = null;
        
        this.primerInicio = false;
        window.location.href = '/login';
      }
      // Si la sesión es nula
      else if (session === null) {
        this.usuarioActual = null;
      }
      // Si hay sesión
      else {
        this.usuarioActual = session.user;
        
        this.idUsuario = this.usuarioActual.id;
        
        if (event === 'SIGNED_IN' && !this.primerInicio) {
          this.router.navigateByUrl('/principal'); // Redirige a la ruta /principal si hay sesión y solo si es el primer ingreso
          this.primerInicio = true;
        }
        if (this.rolUsuario === '') {
          this.db.tablaUsuarios
            .select('rol')
            .eq('email', this.usuarioActual.email)
            .single()
            .then(({ data, error }) => {
              if (error) {
                console.error('Error al obtener rol del usuario:', error.message);
                return;
              }

              this.rolUsuario = data.rol;
            });
        }
      }
    });
  }

  //iniciar sesion
  async iniciarSesion(
    correo: string,
    contraseña: string
  ): Promise<{ success: boolean; error?: string }> {
    this.usuarioActual = null;
    
    this.idUsuario = '';
    this.primerInicio = false;
    const { data, error } = await this.sb.supabase.auth.signInWithPassword({
      email: correo,
      password: contraseña,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    //Prueba para setear this.usuarioObj y poder acceder a las propiedades ej: this.usuarioObj.nombre

    // const { data: sessionData } = await this.sb.supabase.auth.getUser();
    // const userId = sessionData?.user?.id;
    // if(userId){
    //   const objetoUsuario = await this.db.traerUsuario(userId);
    //   console.log('objeto usuario desde iniciar sesion:', objetoUsuario);
    //   this.usuarioObj = objetoUsuario;
    // }

    return { success: true };
  }


  async subirImagenArchivo(
    file: File,
    ruta: string
  ): Promise<{ error: any; publicUrl: string | null }> {
    const { data, error } = await this.sb.supabase.storage
      .from('imagenes') // tu bucket
      .upload(ruta, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) return { error, publicUrl: null };

    const { data: urlData } = this.sb.supabase.storage
      .from('imagenes')
      .getPublicUrl(ruta);

    return { error: null, publicUrl: urlData.publicUrl };
  }

  //Registrarse
  async crearCuenta(correo: string, contraseña: string, nombreUsuario: string) {
    const { data, error } = await this.sb.supabase.auth.signUp({
      email: correo,
      password: contraseña,
      options: {
        data: {
          nombre_usuario: nombreUsuario, //Guardo el nombre dentro de la session para no consultarlo en la tabla usuarios
        },
      },
    });

    // console.log(data, error);
  }

  async cerrarSesion() {
    const { error } = await this.sb.supabase.auth.signOut();
  }
}
