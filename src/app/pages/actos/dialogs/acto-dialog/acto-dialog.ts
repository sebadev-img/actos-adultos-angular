import { ChangeDetectorRef, Component, inject } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { HttpErrorResponse } from '@angular/common/http';
import { Observable, finalize } from 'rxjs';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { ActoService } from '../../../../services/acto.service';

import { ActoResponseDto, ActoCreateDto, ActoUpdateResponse } from '../../../../models/acto.model';

export interface ActoDialogData {
  acto: ActoResponseDto | null;
}

@Component({
  selector: 'app-acto-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
  ],
  templateUrl: './acto-dialog.html',
  styleUrl: './acto-dialog.scss',
})
export class ActoDialog {
  private readonly fb = inject(FormBuilder);
  private readonly actoService = inject(ActoService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly dialogRef = inject(MatDialogRef<ActoDialog>);
  readonly data = inject<ActoDialogData>(MAT_DIALOG_DATA);

  saving = false;
  errorMessage = '';

  get isEditing(): boolean {
    return this.data.acto !== null;
  }

  form = this.fb.nonNullable.group({
    numero: [this.data.acto?.numero ?? '', [Validators.required, Validators.maxLength(100)]],

    descripcion: [
      this.data.acto?.descripcion ?? '',
      [Validators.required, Validators.maxLength(500)],
    ],

    inicio: [this.toDateTimeLocal(this.data.acto?.inicio), Validators.required],

    fin: [this.toDateTimeLocal(this.data.acto?.fin), Validators.required],

    esActivo: [this.data.acto?.esActivo ?? true],

    permiteCargaCargos: [this.data.acto?.permiteCargaCargos ?? true],
  });

  get f() {
    return this.form.controls;
  }

  // CONVERTIR FECHA DE API PARA INPUT DATETIME-LOCAL
  private toDateTimeLocal(value?: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const pad = (n: number) => n.toString().padStart(2, '0');

    return (
      `${date.getFullYear()}-` +
      `${pad(date.getMonth() + 1)}-` +
      `${pad(date.getDate())}T` +
      `${pad(date.getHours())}:` +
      `${pad(date.getMinutes())}`
    );
  }

  // VALIDAR FECHAS
  private validarFechas(): boolean {
    const inicio = new Date(this.f.inicio.value);
    const fin = new Date(this.f.fin.value);

    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
      this.errorMessage = 'Ingresá fechas válidas.';
      return false;
    }

    if (fin <= inicio) {
      this.errorMessage = 'La fecha de finalización debe ser posterior a la de inicio.';
      return false;
    }

    return true;
  }

  guardar(): void {
    if (this.saving) return;

    this.errorMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.validarFechas()) {
      this.cdr.markForCheck();
      return;
    }

    const value = this.form.getRawValue();

    const request: ActoCreateDto = {
      numero: value.numero.trim(),
      descripcion: value.descripcion.trim(),
      inicio: value.inicio,
      fin: value.fin,
      esActivo: value.esActivo,
      permiteCargaCargos: value.permiteCargaCargos,
    };

    if (!request.numero || !request.descripcion) {
      this.errorMessage = 'El número y la descripción son obligatorios.';
      return;
    }

    this.saving = true;
    this.form.disable();

    const operation$: Observable<ActoResponseDto | ActoUpdateResponse> = this.data.acto
      ? this.actoService.update(this.data.acto.id, request)
      : this.actoService.add(request);

    operation$
      .pipe(
        finalize(() => {
          this.saving = false;
          this.form.enable();
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.dialogRef.close(true);
        },

        error: (error: HttpErrorResponse) => {
          const errors = error.error?.errors;

          if (Array.isArray(errors) && errors.length > 0) {
            this.errorMessage = errors.join(' ');
          } else {
            this.errorMessage = error.error?.message ?? 'No se pudo guardar el acto.';
          }

          this.cdr.markForCheck();
        },
      });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}
