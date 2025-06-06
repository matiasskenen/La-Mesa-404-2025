import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Router } from '@angular/router';
import { User } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  sb = inject(SupabaseService);
  router = inject(Router);
  nombreUsuario: string = '';
  usuarioActual: User | null = null;

  constructor() {
    /// Saber si el usuario está logueado o no
    this.sb.supabase.auth.onAuthStateChange((event, session) => {
      console.log(event, session);

      // Si el evento es SIGNED_OUT
      if (event === 'SIGNED_OUT') {
        this.usuarioActual = null;
        this.nombreUsuario = '';
        window.location.href = '/login';
      }
      // Si la sesión es nula
      else if (session === null) {
        this.usuarioActual = null;
      }
      // Si hay sesión
      else {
        this.usuarioActual = session.user;
        this.nombreUsuario =
          this.usuarioActual.user_metadata?.['nombre_usuario'];
        this.router.navigateByUrl('/principal'); // Redirige a la ruta /principal si hay sesión
      }
    });
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

  //iniciar sesion
  async iniciarSesion(
    correo: string,
    contraseña: string
  ): Promise<{ success: boolean; error?: string }> {
    this.usuarioActual = null;
    this.nombreUsuario = '';

    const { data, error } = await this.sb.supabase.auth.signInWithPassword({
      email: correo,
      password: contraseña,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  async cerrarSesion() {
    const { error } = await this.sb.supabase.auth.signOut();
  }
}
