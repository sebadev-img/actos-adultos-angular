import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';

import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { HttpErrorResponse } from '@angular/common/http';
import { finalize, Observable } from 'rxjs';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CargoService } from '../../../../services/cargo.service';
import { OrientacionService } from '../../../../services/orientacion.service';

import { ActoResponseDto } from '../../../../models/acto.model';

import { CodigoJuntaDto } from '../../../../models/codigo-junta.model';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  CargoCreateDto,
  CargoResponseDto,
  CargoHorarioDto,
  Turno,
  Revista,
} from '../../../../models/cargo.model';

import { OrientacionResponseDto } from '../../../../models/orientacion.model';

export interface CargoDialogData {
  acto: ActoResponseDto;
  cargo: CargoResponseDto | null;
}

@Component({
  selector: 'app-cargo-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './cargo-dialog.html',
  styleUrl: './cargo-dialog.scss',
})
export class CargoDialog implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly cargoService = inject(CargoService);
  private readonly orientacionService = inject(OrientacionService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly dialogRef = inject(MatDialogRef<CargoDialog>);

  readonly data = inject<CargoDialogData>(MAT_DIALOG_DATA);

  private readonly destroyRef = inject(DestroyRef);

  codigosJunta: CodigoJuntaDto[] = [];

  loadingCodigosJunta = false;
  errorCodigosJunta = false;

  orientaciones: OrientacionResponseDto[] = [];

  turnos = [
    { value: Turno.MANANA, label: 'Mañana' },
    { value: Turno.TARDE, label: 'Tarde' },
    { value: Turno.VESPERTINO, label: 'Vespertino' },
  ];

  revistas = [
    //{ value: Revista.TITULAR, label: 'Titular' },
    { value: Revista.INTERINO, label: 'Interino' },
    { value: Revista.SUPLENTE, label: 'Suplente' },
  ];

  loadingOrientaciones = false;
  orientacionesError = false;
  saving = false;
  errorMessage = '';

  diasSemana = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
  ];

  get isEditing(): boolean {
    return this.data.cargo !== null;
  }

  get puedeGuardar(): boolean {
    return (
      this.data.acto.puedeCargarCargos &&
      !this.loadingOrientaciones &&
      !this.orientacionesError &&
      !this.loadingCodigosJunta &&
      !this.errorCodigosJunta &&
      !this.saving
    );
  }

  form = this.fb.nonNullable.group({
    orientacionId: [this.data.cargo?.orientacionId ?? 0, [Validators.required, Validators.min(1)]],

    turno: [this.data.cargo?.turno ?? Turno.MANANA, [Validators.required]],

    descripcion: [
      this.data.cargo?.descripcion ?? '',
      [Validators.required, Validators.maxLength(500)],
    ],

    codigo: [this.data.cargo?.codigo ?? 0, [Validators.required, Validators.min(1)]],

    numeroLLamado: [this.data.cargo?.numeroLLamado ?? 0, [Validators.required, Validators.min(1)]],

    revista: [this.data.cargo?.revista ?? Revista.TITULAR, [Validators.required]],

    curso: [this.data.cargo?.curso ?? 0, [Validators.required, Validators.min(0)]],

    division: [this.data.cargo?.division ?? '', Validators.required],

    plazaSUNA: [this.data.cargo?.plazaSUNA ?? '', Validators.required],

    cargaHoraria: [this.data.cargo?.cargaHoraria ?? '', Validators.required],

    codigoJunta: [this.data.cargo?.codigoJunta ?? '', Validators.required],

    horarios: this.fb.array<ReturnType<CargoDialog['crearHorario']>>([]),
  });

  get f() {
    return this.form.controls;
  }

  get horarios(): FormArray {
    return this.form.controls.horarios;
  }

  ngOnInit(): void {
    this.cargarOrientaciones();
    this.cargarCodigosJunta();

    if (this.data.cargo?.horarios?.length) {
      for (const horario of this.data.cargo.horarios) {
        this.agregarHorario(horario);
      }
    } else {
      this.agregarHorario();
    }
  }

  cargarOrientaciones(): void {
    this.loadingOrientaciones = true;
    this.orientacionesError = false;

    this.orientacionService
      .getPaged({
        page: 1,
        pageSize: 100,
      })
      .pipe(
        finalize(() => {
          this.loadingOrientaciones = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          this.orientaciones = response.items;
          this.cdr.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          this.orientacionesError = true;
          this.errorMessage = error.error?.message ?? 'No se pudieron cargar las orientaciones.';
          this.cdr.markForCheck();
        },
      });
  }

  crearHorario(horario?: CargoHorarioDto) {
    return this.fb.nonNullable.group({
      diaSemana: [horario?.diaSemana ?? 1, Validators.required],

      horaInicio: [horario?.horaInicio?.slice(0, 5) ?? '', Validators.required],

      horaFin: [horario?.horaFin?.slice(0, 5) ?? '', Validators.required],
    });
  }

  agregarHorario(horario?: CargoHorarioDto): void {
    this.horarios.push(this.crearHorario(horario));
  }

  quitarHorario(index: number): void {
    if (this.horarios.length <= 1) return;

    this.horarios.removeAt(index);
  }

  private validarHorarios(horarios: CargoHorarioDto[]): string | null {
    if (horarios.length === 0) {
      return 'Debés agregar al menos un horario.';
    }

    for (const horario of horarios) {
      if (!horario.horaInicio || !horario.horaFin) {
        return 'Completá todos los horarios.';
      }

      if (horario.horaInicio >= horario.horaFin) {
        return 'La hora de inicio debe ser anterior a la de fin.';
      }
    }

    // Validar superposiciones entre horarios del mismo día
    for (const dia of this.diasSemana) {
      const delDia = horarios
        .filter((h) => h.diaSemana === dia.value)
        .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

      for (let i = 1; i < delDia.length; i++) {
        if (delDia[i].horaInicio < delDia[i - 1].horaFin) {
          return `Hay horarios superpuestos el día ${dia.label}.`;
        }
      }
    }

    return null;
  }

  guardar(): void {
    if (!this.puedeGuardar) return;

    this.errorMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    if (
      !this.turnos.some((t) => t.value === value.turno) ||
      !this.revistas.some((r) => r.value === value.revista)
    ) {
      this.errorMessage = 'Seleccioná un turno y una revista válidos.';
      return;
    }

    const horarios: CargoHorarioDto[] = value.horarios.map((h) => ({
      diaSemana: h.diaSemana,
      horaInicio: h.horaInicio,
      horaFin: h.horaFin,
    }));

    const errorHorarios = this.validarHorarios(horarios);

    if (errorHorarios) {
      this.errorMessage = errorHorarios;
      return;
    }

    const codigoJuntaValido = this.codigosJunta.some(
      (codigo) => codigo.codEspacio === value.codigoJunta,
    );

    if (!codigoJuntaValido) {
      this.errorMessage = 'Seleccioná un código de Junta válido.';
      return;
    }

    const request: CargoCreateDto = {
      actoId: this.data.acto.id,
      orientacionId: value.orientacionId,
      turno: value.turno,
      descripcion: value.descripcion.trim(),
      codigo: value.codigo,
      numeroLLamado: value.numeroLLamado,
      revista: value.revista,
      curso: value.curso,
      division: value.division.trim(),
      plazaSUNA: value.plazaSUNA.trim(),
      cargaHoraria: value.cargaHoraria.trim(),
      codigoJunta: value.codigoJunta.trim(),
      horarios,
    };

    if (
      !request.descripcion ||
      !request.division ||
      !request.plazaSUNA ||
      !request.cargaHoraria ||
      !request.codigoJunta
    ) {
      this.errorMessage = 'Completá todos los campos obligatorios.';
      return;
    }

    this.saving = true;

    const operation$: Observable<unknown> = this.data.cargo
      ? this.cargoService.update(this.data.cargo.id, request)
      : this.cargoService.add(request);

    operation$
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.dialogRef.close(true);
        },

        error: (error: HttpErrorResponse) => {
          const errors = error.error?.errors;

          if (Array.isArray(errors)) {
            this.errorMessage = errors.join(' ');
          } else if (errors && typeof errors === 'object') {
            this.errorMessage = Object.values(errors).flat().join(' ');
          } else {
            this.errorMessage = error.error?.message ?? 'No se pudo guardar el cargo.';
          }

          this.cdr.markForCheck();
        },
      });
  }

  cargarCodigosJunta(): void {
    this.loadingCodigosJunta = true;
    this.errorCodigosJunta = false;

    this.cargoService
      .getCodigoJunta()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loadingCodigosJunta = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (codigos) => {
          this.codigosJunta = codigos
            .filter((codigo) => codigo.codEspacio?.trim() && codigo.desEspacio?.trim())
            .sort((a, b) => a.codEspacio.localeCompare(b.codEspacio, undefined, { numeric: true }));

          this.cdr.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          this.errorCodigosJunta = true;

          this.errorMessage = error.error?.message ?? 'No se pudieron cargar los códigos de Junta.';

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
