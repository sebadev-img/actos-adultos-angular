import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { MainLayoutComponent } from './layouts/main-layout/main-layout';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { ConfirmEmail } from './pages/confirm-email/confirm-email';
import { MiPerfil } from './pages/mi-perfil/mi-perfil';
import { Actos } from './pages/actos/actos';
import { Instituciones } from './pages/instituciones/instituciones';
import { Usuarios } from './pages/usuarios/usuarios';
import { Orientaciones } from './pages/orientaciones/orientaciones';
import { GestionCargos } from './pages/gestion-cargos/gestion-cargos';
import { Inicio } from './pages/inicio/inicio';
import { InscriptosCargo } from './pages/gestion-cargos/inscriptos-cargo/inscriptos-cargo';
import { MisPostulaciones } from './pages/mis-postulaciones/mis-postulaciones';
import { DetallePostulacion } from './pages/mis-postulaciones/detalle-postulacion/detalle-postulacion';
import { Postulantes } from './pages/postulantes/postulantes';
import { GestionCargosAdmin } from './pages/gestion-cargos-admin/gestion-cargos-admin';
import { InscriptosCargoAdmin } from './pages/gestion-cargos-admin/inscriptos-cargo-admin/inscriptos-cargo-admin';
import { ForgotPassword } from './pages/forgot-password/forgot-password';
import { ResetPassword } from './pages/reset-password/reset-password';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  {
    path: 'forgot-password',
    component: ForgotPassword,
  },
  {
    path: 'reset-password',
    component: ResetPassword,
  },
  {
    path: 'confirm-email',
    component: ConfirmEmail,
  },

  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full',
      },
      {
        path: 'inicio',
        component: Inicio,
      },
      {
        path: 'mi-perfil',
        canActivate: [authGuard],
        data: {
          roles: ['admin', 'docente'],
        },
        component: MiPerfil,
      },
      {
        path: 'actos',
        canActivate: [authGuard],
        data: {
          roles: ['admin'],
        },
        component: Actos,
      },
      {
        path: 'instituciones',
        canActivate: [authGuard],
        data: {
          roles: ['admin'],
        },
        component: Instituciones,
      },
      {
        path: 'orientaciones',
        canActivate: [authGuard],
        data: {
          roles: ['admin'],
        },
        component: Orientaciones,
      },
      {
        path: 'postulantes',
        canActivate: [authGuard],
        data: {
          roles: ['admin'],
        },
        component: Postulantes,
      },
      {
        path: 'usuarios',
        canActivate: [authGuard],
        data: {
          roles: ['admin'],
        },
        component: Usuarios,
      },
      {
        path: 'gestion-cargos-admin',
        canActivate: [authGuard],
        data: {
          roles: ['admin'],
        },
        component: GestionCargosAdmin,
      },
      {
        path: 'gestion-cargos-admin/:cargoId/inscriptos',
        canActivate: [authGuard],
        data: {
          roles: ['admin'],
        },
        component: InscriptosCargoAdmin,
      },
      {
        path: 'gestion-cargos',
        canActivate: [authGuard],
        data: {
          roles: ['institucion'],
        },
        component: GestionCargos,
      },
      {
        path: 'gestion-cargos/:cargoId/inscriptos',
        component: InscriptosCargo,
        canActivate: [authGuard],
        data: {
          roles: ['institucion'],
        },
      },
      {
        path: 'mis-postulaciones',
        component: MisPostulaciones,
        canActivate: [authGuard],
        data: {
          roles: ['docente', 'admin'],
        },
      },
      {
        path: 'mis-postulaciones/:inscripcionId',
        component: DetallePostulacion,
        canActivate: [authGuard],
        data: {
          roles: ['docente', 'admin'],
        },
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'inicio',
  },
];
