import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';

import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../services/auth.service';

type ConfirmationStatus = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-confirm-email',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './confirm-email.html',
  styleUrl: './confirm-email.scss',
})
export class ConfirmEmail implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  status: ConfirmationStatus = 'loading';

  message = '';
  resending = false;
  resendSuccess = false;
  resendMessage = '';

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  get email() {
    return this.form.controls.email;
  }

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;

    const userId = params.get('userId');
    const token = params.get('token');

    // El enlace original no incluye email,
    // pero permite precargarlo si está presente.
    const emailParam = params.get('email');

    if (emailParam) {
      this.email.setValue(emailParam);
    }

    if (!userId || !token) {
      this.status = 'error';
      this.message = 'El enlace de confirmación está incompleto o no es válido.';
      return;
    }

    this.authService
      .confirmEmail(userId, token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.status = 'success';
          this.message = response.message;
          this.cdr.markForCheck();
        },

        error: (error) => {
          this.status = 'error';
          this.message =
            error.error?.message ??
            'No se pudo confirmar tu correo electrónico. ' + 'El enlace puede haber expirado.';
          this.cdr.markForCheck();
        },
      });
  }

  resendConfirmation(): void {
    if (this.form.invalid || this.resending) {
      this.form.markAllAsTouched();
      return;
    }

    this.resending = true;
    this.resendSuccess = false;
    this.resendMessage = '';

    this.authService
      .resendConfirmationEmail({
        email: this.email.value.trim(),
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.resending = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          this.resendSuccess = true;
          this.resendMessage = response.message;
          this.cdr.markForCheck();
        },

        error: (error) => {
          this.resendSuccess = false;
          this.resendMessage =
            error.error?.message ?? 'No se pudo reenviar el correo. Intentá nuevamente.';
          this.cdr.markForCheck();
        },
      });
  }
}
