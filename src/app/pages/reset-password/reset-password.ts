import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';

import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { ActivatedRoute, RouterLink } from '@angular/router';

import { HttpErrorResponse } from '@angular/common/http';

import { finalize } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../services/auth.service';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('newPassword')?.value;

  const confirmPassword = control.get('confirmPassword')?.value;

  if (!password || !confirmPassword) {
    return null;
  }

  return password === confirmPassword
    ? null
    : {
        passwordsMismatch: true,
      };
}

@Component({
  selector: 'app-reset-password',
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
  ],

  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword implements OnInit {
  private readonly fb = inject(FormBuilder);

  private readonly route = inject(ActivatedRoute);

  private readonly authService = inject(AuthService);

  private readonly cdr = inject(ChangeDetectorRef);

  userId = '';
  token = '';

  loading = false;

  success = false;

  invalidLink = false;

  errorMessage = '';

  hidePassword = true;

  hideConfirmPassword = true;

  form = this.fb.nonNullable.group(
    {
      newPassword: ['', Validators.required],

      confirmPassword: ['', Validators.required],
    },
    {
      validators: passwordsMatchValidator,
    },
  );

  ngOnInit(): void {
    this.userId = this.route.snapshot.queryParamMap.get('userId') ?? '';

    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';

    if (!this.userId || !this.token) {
      this.invalidLink = true;
    }
  }

  get newPassword() {
    return this.form.controls.newPassword;
  }

  get confirmPassword() {
    return this.form.controls.confirmPassword;
  }

  cambiarPassword(): void {
    if (this.invalidLink || this.loading) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.errorMessage = '';

    const values = this.form.getRawValue();

    this.authService
      .resetPassword({
        userId: this.userId,

        token: this.token,

        newPassword: values.newPassword,

        confirmPassword: values.confirmPassword,
      })
      .pipe(
        finalize(() => {
          this.loading = false;

          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.success = true;

          this.form.reset();

          this.cdr.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          const errors = error.error?.errors;

          if (Array.isArray(errors) && errors.length > 0) {
            this.errorMessage = errors.join(' ');
          } else {
            this.errorMessage =
              error.error?.message ??
              'No se pudo restablecer la contraseña. El enlace puede haber expirado.';
          }

          this.cdr.markForCheck();
        },
      });
  }
}
