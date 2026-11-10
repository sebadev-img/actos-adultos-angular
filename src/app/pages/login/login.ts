import { ChangeDetectorRef, Component, inject } from '@angular/core';

import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  hidePassword = true;
  loading = false;
  errorMessage = '';
  emailNotConfirmed = false;

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  get email() {
    return this.form.controls.email;
  }

  get password() {
    return this.form.controls.password;
  }

  login(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.emailNotConfirmed = false;

    this.authService
      .login(this.form.getRawValue())
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Sesión iniciada correctamente.', 'Cerrar', { duration: 3000 });

          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

          const destination =
            returnUrl?.startsWith('/') &&
            !returnUrl.startsWith('//') &&
            !returnUrl.startsWith('/\\')
              ? returnUrl
              : '/home';

          this.router.navigateByUrl(destination);
        },
        error: (error) => {
          const code = error.error?.code;

          switch (code) {
            case 'INVALID_EMAIL':
              this.errorMessage = 'El correo electrónico no está registrado.';
              break;

            case 'INVALID_PASSWORD':
              this.errorMessage = 'La contraseña ingresada es incorrecta.';
              break;

            case 'EMAIL_NOT_CONFIRMED':
              this.errorMessage = 'Debés confirmar tu correo electrónico para iniciar sesión.';
              this.emailNotConfirmed = true;
              break;

            case 'ACCOUNT_LOCKED':
              this.errorMessage = 'Tu cuenta se encuentra bloqueada.';
              break;

            default:
              this.errorMessage =
                error.error?.message ?? 'No se pudo iniciar sesión. Intentá nuevamente.';
          }

          this.cdr.markForCheck();
        },
      });
  }

  resendConfirmation(): void {
    if (this.email.invalid || this.loading) {
      this.email.markAsTouched();
      return;
    }

    this.loading = true;

    this.authService
      .resendConfirmationEmail({
        email: this.email.value,
      })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          this.emailNotConfirmed = false;
          this.errorMessage = '';

          this.snackBar.open(response.message, 'Cerrar', { duration: 6000 });
        },
        error: (error) => {
          this.errorMessage = error.error?.message ?? 'No se pudo reenviar el correo.';
          this.cdr.markForCheck();
        },
      });
  }
}
