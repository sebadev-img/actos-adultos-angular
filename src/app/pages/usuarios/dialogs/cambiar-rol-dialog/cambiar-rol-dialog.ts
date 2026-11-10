import { ChangeDetectorRef, Component, inject } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { UserService } from '../../../../services/user.service';

import { UserResponseDto, UserRole } from '../../../../models/user.model';

export interface CambiarRolDialogData {
  usuario: UserResponseDto;
}

@Component({
  selector: 'app-cambiar-rol-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './cambiar-rol-dialog.html',
  styleUrl: './cambiar-rol-dialog.scss',
})
export class CambiarRolDialog {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly dialogRef = inject(MatDialogRef<CambiarRolDialog>);

  readonly data = inject<CambiarRolDialogData>(MAT_DIALOG_DATA);

  saving = false;
  errorMessage = '';
  successMessage = '';

  roles: { value: UserRole; label: string }[] = [
    { value: 'admin', label: 'Administrador' },
    { value: 'institucion', label: 'Institución' },
    { value: 'docente', label: 'Docente' },
  ];

  form = this.fb.nonNullable.group({
    role: [this.data.usuario.role ?? '', Validators.required],
  });

  get rolActual(): string {
    const role = this.data.usuario.role;

    return this.roles.find((r) => r.value === role)?.label ?? 'Sin rol';
  }

  get rolSeleccionado(): string {
    return this.roles.find((r) => r.value === this.form.controls.role.value)?.label ?? '';
  }

  get cambioRol(): boolean {
    return this.form.controls.role.value !== this.data.usuario.role;
  }

  get requiereDesasignar(): boolean {
    return (
      this.data.usuario.role === 'institucion' &&
      this.data.usuario.institucionId !== null &&
      this.form.controls.role.value !== 'institucion'
    );
  }

  guardar(): void {
    if (this.saving) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.cambioRol || this.requiereDesasignar) {
      return;
    }

    const role = this.form.controls.role.value as UserRole;

    if (!this.roles.some((r) => r.value === role)) {
      this.errorMessage = 'Seleccioná un rol válido.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    this.userService
      .changeRole(this.data.usuario.id, { role })
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.cdr.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          const errors = error.error?.errors;

          if (Array.isArray(errors) && errors.length > 0) {
            this.errorMessage = errors.join(' ');
          } else {
            this.errorMessage = error.error?.message ?? 'No se pudo actualizar el rol del usuario.';
          }

          this.cdr.markForCheck();
        },
      });
  }

  aceptar(): void {
    this.dialogRef.close(true);
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}
