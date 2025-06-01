import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full',
  },
  {
    path: 'splash',
    loadComponent: () => import('./pages/splash/splash.page').then( m => m.SplashPage)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },  {
    path: 'principal',
    loadComponent: () => import('./pages/principal/principal.page').then( m => m.PrincipalPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then( m => m.RegisterPage)
  },
  {
    path: 'meitre',
    loadComponent: () => import('./pages/empleados/meitre/meitre.page').then( m => m.MeitrePage)
  },
  {
    path: 'mozo',
    loadComponent: () => import('./pages/empleados/mozo/mozo.page').then( m => m.MozoPage)
  },
  {
    path: 'cocinero',
    loadComponent: () => import('./pages/empleados/cocinero/cocinero.page').then( m => m.CocineroPage)
  },
  {
    path: 'bartender',
    loadComponent: () => import('./pages/empleados/bartender/bartender.page').then( m => m.BartenderPage)
  },
  {
    path: 'administrador',
    loadComponent: () => import('./pages/empleados/administrador/administrador.page').then( m => m.AdministradorPage)
  },
  {
    path: 'menu',
    loadComponent: () => import('./pages/menu/menu.page').then( m => m.MenuPage)
  },

];
