import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { InscripcionService } from '../../../../services/inscripcion.service';

export interface PostulacionDialogData {
  cargoId: number;
  cargoDescripcion: string;
  institucionNombre: string;
}

@Component({
  selector: 'app-postulacion-dialog',
  standalone: true,

  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],

  templateUrl: './postulacion-dialog.html',
  styleUrl: './postulacion-dialog.scss',
})
export class PostulacionDialog {
  readonly data = inject<PostulacionDialogData>(MAT_DIALOG_DATA);

  private readonly dialogRef =
    inject<MatDialogRef<PostulacionDialog, string | undefined>>(MatDialogRef);

  private readonly inscripcionService = inject(InscripcionService);
  private readonly cdr = inject(ChangeDetectorRef);

  aceptado = false;

  guardando = false;

  errorMessage = '';

  exito = false;

  mensajeExito = '';

  cerrar(): void {
    if (this.guardando) {
      return;
    }

    this.dialogRef.close();
  }

  aceptar(): void {
    if (!this.aceptado || this.guardando) {
      return;
    }

    this.guardando = true;
    this.errorMessage = '';

    this.cdr.markForCheck();

    this.inscripcionService
      .realizarInscripcion(this.data.cargoId)
      .pipe(
        finalize(() => {
          this.guardando = false;

          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          this.mensajeExito = response.message || 'Inscripción realizada correctamente.';

          this.exito = true;

          this.cdr.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          this.errorMessage =
            error.error?.message ?? 'No se pudo realizar la inscripción. Intentá nuevamente.';

          this.cdr.markForCheck();
        },
      });
  }

  cerrarExito(): void {
    this.dialogRef.close(this.mensajeExito || 'Inscripción realizada correctamente.');
  }
}
