import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { catchError, finalize, forkJoin, of, throwError } from 'rxjs';

import { HttpErrorResponse } from '@angular/common/http';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CiudadService } from '../../services/ciudad.service';
import { PostulanteService } from '../../services/postulante.service';

import { Ciudad } from '../../models/ciudad.model';
import { PostulanteResponseDto, PostulanteAddOrUpdateDto } from '../../models/postulante.model';

import { MatDialog } from '@angular/material/dialog';

import {
  PerfilResultDialog,
  PerfilResultDialogData,
} from './dialogs/perfil-result-dialog/perfil-result-dialog';

import { AbstractControl, ValidationErrors } from '@angular/forms';

function requiredTrimmed(control: AbstractControl): ValidationErrors | null {
  const value = control.value;

  return typeof value === 'string' && !value.trim() ? { required: true } : null;
}

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.scss',
})
export class MiPerfil implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ciudadService = inject(CiudadService);
  private readonly postulanteService = inject(PostulanteService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);

  ciudades: Ciudad[] = [];

  postulante: PostulanteResponseDto | null = null;

  loading = false;
  saving = false;
  errorMessage = '';

  form = this.fb.nonNullable.group({
    dni: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],

    nombres: ['', [Validators.required, requiredTrimmed, Validators.maxLength(150)]],

    apellidos: ['', [Validators.required, requiredTrimmed, Validators.maxLength(150)]],

    email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],

    telefono: ['', [Validators.required, requiredTrimmed, Validators.maxLength(30)]],

    direccion: ['', [Validators.required, requiredTrimmed, Validators.maxLength(200)]],

    altura: ['', [Validators.required, requiredTrimmed, Validators.maxLength(20)]],

    depto: ['', [Validators.maxLength(50)]],

    ciudadId: [0, [Validators.required, Validators.min(1)]],
  });

  get f() {
    return this.form.controls;
  }

  get isEditing(): boolean {
    return this.postulante !== null;
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  // CARGAR CIUDADES Y DATOS PERSONALES
  cargarDatos(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      ciudades: this.ciudadService.getCiudades(),

      postulante: this.postulanteService.getMiPostulante().pipe(
        catchError((error: HttpErrorResponse) => {
          // El usuario todavía no cargó sus datos.
          if (error.status === 404) {
            return of(null);
          }

          return throwError(() => error);
        }),
      ),
    })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: ({ ciudades, postulante }) => {
          this.ciudades = ciudades;
          this.postulante = postulante;

          if (postulante) {
            this.form.patchValue({
              dni: postulante.dni.toString(),
              nombres: postulante.nombres,
              apellidos: postulante.apellidos,
              email: postulante.email ?? '',
              telefono: postulante.telefono ?? '',
              direccion: postulante.direccion ?? '',
              altura: postulante.altura ?? '',
              depto: postulante.depto ?? '',
              ciudadId: postulante.ciudadId,
            });
          }

          this.cdr.markForCheck();
        },

        error: (error) => {
          this.errorMessage = error.error?.message ?? 'No se pudieron cargar los datos del perfil.';

          this.cdr.markForCheck();
        },
      });
  }

  // GUARDAR O ACTUALIZAR

  guardar(): void {
    if (this.form.invalid || this.saving || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    const request: PostulanteAddOrUpdateDto = {
      dni: Number(value.dni),
      nombres: value.nombres.trim(),
      apellidos: value.apellidos.trim(),
      email: value.email.trim() || null,
      telefono: value.telefono.trim() || null,
      direccion: value.direccion.trim() || null,
      altura: value.altura.trim() || null,
      depto: value.depto.trim() || null,
      ciudadId: value.ciudadId,
    };

    // VALIDACIONES ADICIONALES
    if (
      !Number.isSafeInteger(request.dni) ||
      request.dni <= 0 ||
      !request.nombres ||
      !request.apellidos ||
      !request.email ||
      !request.telefono ||
      !request.direccion ||
      !request.altura
    ) {
      this.mostrarDialog(
        'error',
        'Datos incompletos',
        'Verificá que todos los campos obligatorios estén completos.',
      );

      return;
    }

    this.saving = true;
    this.errorMessage = '';

    this.postulanteService
      .addOrUpdate(request)
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          this.postulante = response.postulante;

          this.form.markAsPristine();

          this.mostrarDialog('success', 'Datos guardados', response.message);

          this.cdr.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          let message = '';

          if (error.error?.code === 'DNI_ALREADY_EXISTS') {
            message = 'Ya existe un postulante registrado con ese DNI.';
          } else {
            message = error.error?.message ?? 'No se pudieron guardar los datos personales.';
          }

          this.mostrarDialog('error', 'Error al guardar', message);

          this.cdr.markForCheck();
        },
      });
  }

  private mostrarDialog(type: 'success' | 'error', title: string, message: string): void {
    const data: PerfilResultDialogData = {
      type,
      title,
      message,
    };

    this.dialog.open(PerfilResultDialog, {
      width: '420px',
      maxWidth: '95vw',
      autoFocus: false,
      data,
    });
  }
}
