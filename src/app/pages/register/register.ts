import { ChangeDetectorRef, Component, inject } from '@angular/core';

import { Router, RouterLink } from '@angular/router';

import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { finalize } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';

import { MatDialog } from '@angular/material/dialog';

import { RegisterSuccessDialog } from './dialogs/register-success-dialog/register-success-dialog';

import { AuthService } from '../../services/auth.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
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
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);

  hidePassword = true;
  hideConfirmPassword = true;

  loading = false;
  errorMessage = '';
  successMessage = '';

  form = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.pattern(/^(?=.*[a-z])(?=.*\d).+$/),
        ],
      ],

      confirmPassword: ['', Validators.required],
    },
    {
      validators: passwordsMatch,
    },
  );

  get email() {
    return this.form.controls.email;
  }

  get password() {
    return this.form.controls.password;
  }

  get confirmPassword() {
    return this.form.controls.confirmPassword;
  }

  readonly isConfirmPasswordError: ErrorStateMatcher = {
    isErrorState: (
      control: FormControl | null,
      form: FormGroupDirective | NgForm | null,
    ): boolean => {
      return (
        !!control &&
        (control.invalid || !!control.parent?.hasError('passwordMismatch')) &&
        (control.touched || !!form?.submitted)
      );
    },
  };

  register(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { email, password } = this.form.getRawValue();

    const emailNormalizado = email.trim();

    this.authService
      .register({
        email: emailNormalizado,
        password,
      })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          // Mostrar dialog cuando el registro
          // y el envío del correo fueron exitosos
          this.dialog.open(RegisterSuccessDialog, {
            width: '440px',
            maxWidth: '95vw',
            autoFocus: false,
            data: {
              email: emailNormalizado,
            },
          });
        },

        error: (error) => {
          // El usuario se creó, pero falló el email
          if (error.status === 503) {
            this.successMessage =
              'La cuenta fue creada, pero no se pudo enviar ' +
              'el correo de confirmación. Solicitá un nuevo envío.';

            this.cdr.markForCheck();
            return;
          }

          const errors = error.error?.errors;

          if (Array.isArray(errors) && errors.length > 0) {
            this.errorMessage = errors.join(' ');
          } else {
            this.errorMessage = error.error?.message ?? 'No se pudo registrar la cuenta.';
          }

          this.cdr.markForCheck();
        },
      });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  resendConfirmation(): void {
    if (this.email.invalid || this.loading) {
      this.email.markAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService
      .resendConfirmationEmail({
        email: this.email.value.trim(),
      })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.errorMessage =
            error.error?.message ?? 'No se pudo reenviar el correo de confirmación.';

          this.cdr.markForCheck();
        },
      });
  }
}
