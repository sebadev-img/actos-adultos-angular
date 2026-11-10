import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, map, Observable } from 'rxjs';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { InstitucionService } from '../../../../services/institucion.service';
import { CiudadService } from '../../../../services/ciudad.service';
import { Ciudad } from '../../../../models/ciudad.model';

import { InstitucionResponseDto, InstitucionCreateDto } from '../../../../models/institucion.model';

export interface InstitucionDialogData {
  institucion: InstitucionResponseDto | null;
}

@Component({
  selector: 'app-institucion-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './institucion-dialog.html',
  styleUrl: './institucion-dialog.scss',
})
export class InstitucionDialog implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly institucionService = inject(InstitucionService);
  private readonly ciudadService = inject(CiudadService);
  private readonly dialogRef = inject(MatDialogRef<InstitucionDialog>);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly data = inject<InstitucionDialogData>(MAT_DIALOG_DATA);

  ciudades: Ciudad[] = [];
  loadingCiudades = false;
  saving = false;
  errorMessage = '';

  get isEditing(): boolean {
    return this.data.institucion !== null;
  }

  form = this.fb.nonNullable.group({
    descripcion: [
      this.data.institucion?.descripcion ?? '',
      [Validators.required, Validators.maxLength(200)],
    ],
    ciudadId: [this.data.institucion?.ciudadId ?? 0, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.loadingCiudades = true;

    this.ciudadService
      .getCiudades()
      .pipe(
        finalize(() => {
          this.loadingCiudades = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (ciudades) => {
          this.ciudades = ciudades;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'No se pudieron cargar las ciudades.';
          this.cdr.markForCheck();
        },
      });
  }

  guardar(): void {
    if (this.saving || this.loadingCiudades) return;

    this.errorMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    const request: InstitucionCreateDto = {
      descripcion: value.descripcion.trim(),
      ciudadId: value.ciudadId,
    };

    if (!request.descripcion) {
      this.form.controls.descripcion.setErrors({ required: true });
      return;
    }

    this.saving = true;

    const operation$: Observable<unknown> = this.data.institucion
      ? this.institucionService.update(this.data.institucion.id, request)
      : this.institucionService.add(request);

    operation$
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (error: HttpErrorResponse) => {
          this.errorMessage = error.error?.message ?? 'No se pudo guardar la institución.';
          this.cdr.markForCheck();
        },
      });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}
