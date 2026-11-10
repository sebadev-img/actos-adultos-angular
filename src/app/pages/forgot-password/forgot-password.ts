import { ChangeDetectorRef, Component, inject } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { finalize } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
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

  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword {
  private readonly fb = inject(FormBuilder);

  private readonly authService = inject(AuthService);

  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;

  emailSent = false;

  errorMessage = '';

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  get email() {
    return this.form.controls.email;
  }

  enviar(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService
      .forgotPassword({
        email: this.email.value,
      })
      .pipe(
        finalize(() => {
          this.loading = false;

          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          /*
           * No mostramos si el correo realmente
           * existe. El backend devuelve una
           * respuesta genérica.
           */
          this.emailSent = true;

          this.cdr.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          this.errorMessage =
            error.error?.message ?? 'No se pudo procesar la solicitud. Intentá nuevamente.';

          this.cdr.markForCheck();
        },
      });
  }

  volverAIntentar(): void {
    this.emailSent = false;
    this.errorMessage = '';

    this.cdr.markForCheck();
  }
}
