import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class RedireccionGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}
  primerIngreso = false;

  async canActivate(): Promise<boolean> {
    const supabase = this.auth.sb.supabase;
    const { data: sessionData } = await supabase.auth.getUser();
    const userId = sessionData?.user?.id;

    if (!userId) {
      this.router.navigateByUrl('/login');
      return false;
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', userId)
      .single();

    

    switch (usuario?.rol) {
      case 'cliente':
        this.router.navigateByUrl('/clientes');
        break;
      case 'cocinero':
        this.router.navigateByUrl('/cocinero');
        break;
      case 'dueño_supervisor':
      case 'admin':
        this.router.navigateByUrl('/administrador');
        break;
      case 'mozo':
        this.router.navigateByUrl('/mozo');
        break;
      case 'supervisor':
        this.router.navigateByUrl('/supervisor-home');
        break;
      case 'bartender':
        this.router.navigateByUrl('/bartender-home');
        break;
      case 'meitre':
        this.router.navigateByUrl('/meitre');
        break;
      default:
        this.router.navigateByUrl('/login');
        break;
    }

    return false;
  }
}
