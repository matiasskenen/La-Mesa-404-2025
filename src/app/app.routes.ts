import { Routes } from '@angular/router';
import { RedireccionGuard } from './guards/redireccion.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full',
  },
  {
    path: 'splash',
    loadComponent: () =>
      import('./pages/splash/splash.page').then((m) => m.SplashPage),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'principal',
    canActivate: [RedireccionGuard],
    loadComponent: () =>
      import('./pages/principal/principal.page').then((m) => m.PrincipalPage),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'meitre',
    loadComponent: () =>
      import('./pages/empleados/meitre/meitre.page').then((m) => m.MeitrePage),
  },
  {
    path: 'mozo',
    loadComponent: () =>
      import('./pages/empleados/mozo/mozo.page').then((m) => m.MozoPage),
  },
  {
    path: 'cocinero',
    loadComponent: () =>
      import('./pages/empleados/cocinero/cocinero.page').then(
        (m) => m.CocineroPage
      ),
  },
  {
    path: 'bartender',
    loadComponent: () =>
      import('./pages/empleados/bartender/bartender.page').then(
        (m) => m.BartenderPage
      ),
  },
  {
    path: 'administrador',
    loadComponent: () =>
      import('./pages/empleados/administrador/administrador.page').then(
        (m) => m.AdministradorPage
      ),
  },
  {
    path: 'clientes',
    loadComponent: () =>
      import('./pages/clientes/clientes.page').then((m) => m.ClientesPage),
  },
  {
    path: 'menu',
    loadComponent: () =>
      import('./pages/menu/menu.page').then((m) => m.MenuPage),
  },
  {
    path: 'mesa',
    loadComponent: () => import('./pages/mesa/mesa.page').then( m => m.MesaPage)
  },
  {
    path: 'chat',
    loadComponent: () => import('./pages/chat/chat.page').then( m => m.ChatPage)
  },
  {
    path: 'resultados-encuestas',
    loadComponent: () => import('./pages/resultados-encuestas/resultados-encuestas.page').then( m => m.ResultadosEncuestasPage)
  },
  {
    path: 'encuesta',
    loadComponent: () => import('./pages/encuesta/encuesta.page').then( m => m.EncuestaPage)
  },
  {
    path: 'estado-pedido',
    loadComponent: () => import('./pages/estado-pedido/estado-pedido.page').then( m => m.EstadoPedidoPage)
  },
  {
    path: 'pagar',
    loadComponent: () => import('./pages/pagar/pagar.page').then( m => m.PagarPage)
  },  {
    path: 'juegos',
    loadComponent: () => import('./pages/juegos/juegos.page').then( m => m.JuegosPage)
  },


];
