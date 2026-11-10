import { ChangeDetectorRef, Component, inject } from '@angular/core';

import { HttpErrorResponse } from '@angular/common/http';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { finalize, Observable } from 'rxjs';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { OrientacionService } from '../../../../services/orientacion.service';

import {
  OrientacionResponseDto,
  OrientacionCreateDto,
  OrientacionApiResponse,
} from '../../../../models/orientacion.model';

export interface OrientacionDialogData {
  orientacion: OrientacionResponseDto | null;
}

@Component({
  selector: 'app-orientacion-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './orientacion-dialog.html',
  styleUrl: './orientacion-dialog.scss',
})
export class OrientacionDialog {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(OrientacionService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly dialogRef = inject(MatDialogRef<OrientacionDialog>);

  readonly data = inject<OrientacionDialogData>(MAT_DIALOG_DATA);

  saving = false;
  errorMessage = '';
  successMessage = '';

  get isEditing(): boolean {
    return this.data.orientacion !== null;
  }

  form = this.fb.nonNullable.group({
    descripcion: [
      this.data.orientacion?.descripcion ?? '',
      [Validators.required, Validators.maxLength(200)],
    ],
  });

  guardar(): void {
    if (this.saving) return;

    this.errorMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const descripcion = this.form.controls.descripcion.value.trim();

    if (!descripcion) {
      this.form.controls.descripcion.setErrors({
        required: true,
      });
      return;
    }

    const request: OrientacionCreateDto = {
      descripcion,
    };

    this.saving = true;

    const operation$: Observable<OrientacionApiResponse> = this.data.orientacion
      ? this.service.update(this.data.orientacion.id, request)
      : this.service.add(request);

    operation$
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;

          // La página actualizará la tabla
          this.dialogRef.close(true);
        },

        error: (error: HttpErrorResponse) => {
          const errors = error.error?.errors;

          if (Array.isArray(errors) && errors.length > 0) {
            this.errorMessage = errors.join(' ');
          } else {
            this.errorMessage = error.error?.message ?? 'No se pudo guardar la orientación.';
          }

          this.cdr.markForCheck();
        },
      });
  }

  cancelar(): void {
    if (!this.saving) {
      this.dialogRef.close(false);
    }
  }
}
