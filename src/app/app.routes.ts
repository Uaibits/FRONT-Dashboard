import { Routes } from '@angular/router';
import { FormPage } from './pages/form/form.page';
import { UsersPage } from './pages/users/users.page';
import { HomePage } from './pages/home/home.page';
import { ProfilePage } from './pages/profile/profile.page';
import { LoginPage } from './pages/auth/login/login.page';
import { RegisterPage } from './pages/auth/register/register.page';
import { AuthGuard } from './security/auth.guard';
import {NavbarComponent} from './layout/navbar/navbar.component';
import {PortalsPage} from './pages/portals/portals.page';
import {DepartmentsPage} from './pages/departments/departments.page';
import {ManageDepartmentPage} from './pages/departments/manage/manage-department.page';

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      {
        path: 'logar',
        component: LoginPage,
      },
      {
        path: 'registrar',
        component: RegisterPage,
      },
    ],
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
  {
    path: '',
    canActivate: [AuthGuard],
    component: NavbarComponent,
    children: [
      {
        path: 'home',
        component: HomePage,
      },
      {
        path: 'perfil',
        component: ProfilePage,
      },
      {
        path: 'departamentos',
        children: [
          {
            path: "",
            component: DepartmentsPage
          },
          {
            path: "gerenciar",
            component: ManageDepartmentPage
          },
          {
            path: "gerenciar/:id",
            component: ManageDepartmentPage
          }
        ]
      }
    ],
  },
  // {
  //   path: '**',
  //   component: NotFoundComponent,
  // },
];
