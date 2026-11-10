import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';

import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { InscripcionService } from '../../../services/inscripcion.service';

import {
  Caracter,
  EstadoInscripcion,
  InscripcionListadoDto,
  CargoInscripcionDto,
} from '../../../models/inscripcion.model';

import { CargoResponseDto, Revista, Turno } from '../../../models/cargo.model';

import { ActoResponseDto } from '../../../models/acto.model';

interface CargoDetalle {
  id: number;

  actoId: number;
  actoNumero: string;
  actoDescripcion: string;

  institucionNombre: string;
  orientacionDescripcion: string;

  descripcion: string;

  codigo: number;
  numeroLlamado: number;

  turno: Turno;
  revista: Revista;

  curso: number;
  division: string;

  cargaHoraria: string;
}

interface ResultadoAsignacionDialogData {
  exito: boolean;
  titulo: string;
  mensaje: string;
}

interface ConfirmarDesasignacionDialogData {
  nombreCompleto: string;
}

@Component({
  selector: 'app-confirmar-desasignacion-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Confirmar desasignación</h2>

    <mat-dialog-content>
      <p>
        ¿Está seguro de quitar la asignación de
        <strong>{{ data.nombreCompleto }}</strong
        >?
      </p>

      <p>
        La inscripción volverá al estado
        <strong>Inscripto</strong>.
      </p>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button type="button" [mat-dialog-close]="false">Cancelar</button>

      <button mat-flat-button type="button" [mat-dialog-close]="true">Desasignar</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmarDesasignacionDialog {
  readonly data = inject<ConfirmarDesasignacionDialogData>(MAT_DIALOG_DATA);
}

@Component({
  selector: 'app-resultado-asignacion-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="resultado-dialog">
      <div class="resultado-icon" [class.exito]="data.exito" [class.error]="!data.exito">
        <mat-icon>
          {{ data.exito ? 'check_circle' : 'error' }}
        </mat-icon>
      </div>

      <h2 mat-dialog-title>
        {{ data.titulo }}
      </h2>

      <mat-dialog-content>
        <p>{{ data.mensaje }}</p>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-flat-button type="button" mat-dialog-close>Aceptar</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: `
    .resultado-dialog {
      min-width: 320px;
      padding-top: 16px;
      text-align: center;
    }

    .resultado-icon {
      display: flex;
      justify-content: center;
      margin-bottom: 4px;
    }

    .resultado-icon mat-icon {
      width: 48px;
      height: 48px;
      font-size: 48px;
    }

    .resultado-icon.exito {
      color: #166534;
    }

    .resultado-icon.error {
      color: var(--mat-sys-error);
    }

    h2 {
      text-align: center;
    }

    mat-dialog-content p {
      margin: 0;
      text-align: center;
    }
  `,
})
export class ResultadoAsignacionDialog {
  readonly data = inject<ResultadoAsignacionDialogData>(MAT_DIALOG_DATA);
}

@Component({
  selector: 'app-inscriptos-cargo',
  standalone: true,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './inscriptos-cargo.html',
  styleUrl: './inscriptos-cargo.scss',
})
export class InscriptosCargo implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly inscripcionService = inject(InscripcionService);

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);

  cargoId = 0;

  cargo: CargoDetalle | null = null;

  inscripciones: InscripcionListadoDto[] = [];

  displayedColumns: string[] = [
    'dni',
    'nombreCompleto',
    'telefono',
    'email',
    'puntajeJunta',
    'caracter',
    'estado',
    'acciones',
  ];

  page = 1;
  pageSize = 20;
  totalItems = 0;

  loading = false;
  errorMessage = '';

  asignandoInscripcionId: number | null = null;
  desasignandoInscripcionId: number | null = null;
  descargandoPdf = false;

  ngOnInit(): void {
    this.cargoId = Number(this.route.snapshot.paramMap.get('cargoId'));

    if (!this.cargoId || this.cargoId <= 0) {
      this.router.navigate(['/gestion-cargos']);
      return;
    }

    this.obtenerCargoDesdeNavegacion();

    this.cargarInscriptos();
  }

  private obtenerCargoDesdeNavegacion(): void {
    const state = history.state as {
      cargo?: CargoResponseDto;
      acto?: ActoResponseDto;
    };

    if (!state.cargo) {
      return;
    }

    this.cargo = {
      id: state.cargo.id,

      actoId: state.cargo.actoId,
      actoNumero: state.acto?.numero ?? '',
      actoDescripcion: state.acto?.descripcion ?? state.cargo.actoDescripcion,

      institucionNombre: state.cargo.institucionNombre,

      orientacionDescripcion: state.cargo.orientacionDescripcion,

      descripcion: state.cargo.descripcion,

      codigo: state.cargo.codigo,

      numeroLlamado: state.cargo.numeroLLamado,

      turno: state.cargo.turno,

      revista: state.cargo.revista,

      curso: state.cargo.curso,

      division: state.cargo.division,

      cargaHoraria: state.cargo.cargaHoraria,
    };
  }

  cargarInscriptos(): void {
    this.loading = true;
    this.errorMessage = '';

    this.inscripcionService
      .getPostulacionesByCargo(this.cargoId, this.page, this.pageSize)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          this.inscripciones = response.items;

          this.totalItems = response.totalItems;
          this.page = response.page;
          this.pageSize = response.pageSize;

          /*
           * Si se ingresó directamente por URL y no tenemos
           * el cargo en history.state, obtenemos la información
           * desde la primera inscripción.
           */
          if (!this.cargo && response.items.length > 0) {
            this.cargo = this.mapCargo(response.items[0].cargo);
          }

          this.cdr.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          this.inscripciones = [];
          this.totalItems = 0;

          this.errorMessage = error.error?.message ?? 'No se pudo cargar el listado de inscriptos.';

          this.cdr.markForCheck();
        },
      });
  }

  cambiarPagina(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;

    this.cargarInscriptos();
  }

  volver(): void {
    this.router.navigate(['/gestion-cargos']);
  }

  getNombreCaracter(caracter: Caracter | null): string {
    if (caracter === null || caracter === undefined) {
      return 'Sin datos';
    }

    switch (caracter) {
      case Caracter.DOCENTE:
        return 'Docente';

      case Caracter.HABILITANTE:
        return 'Habilitante';

      case Caracter.SUPLETORIO:
        return 'Supletorio';

      case Caracter.EXCLUSION:
        return 'Exclusión';

      default:
        return 'Sin datos';
    }
  }

  getNombreEstado(estado: EstadoInscripcion): string {
    switch (estado) {
      case EstadoInscripcion.INSCRIPCION:
        return 'Inscripto';

      case EstadoInscripcion.ASIGNADO:
        return 'Asignado';

      default:
        return 'Desconocido';
    }
  }

  getNombreTurno(turno: Turno): string {
    switch (turno) {
      case Turno.MANANA:
        return 'Mañana';

      case Turno.TARDE:
        return 'Tarde';

      case Turno.VESPERTINO:
        return 'Vespertino';

      default:
        return 'Sin especificar';
    }
  }

  getNombreRevista(revista: Revista): string {
    switch (revista) {
      case Revista.TITULAR:
        return 'Titular';

      case Revista.INTERINO:
        return 'Interino';

      case Revista.SUPLENTE:
        return 'Suplente';

      default:
        return 'Sin especificar';
    }
  }

  private mapCargo(cargo: CargoInscripcionDto): CargoDetalle {
    return {
      id: cargo.id,

      actoId: cargo.actoId,
      actoNumero: cargo.actoNumero,
      actoDescripcion: cargo.actoDescripcion,

      institucionNombre: cargo.institucionNombre,

      orientacionDescripcion: cargo.orientacionDescripcion,

      descripcion: cargo.descripcion,

      codigo: cargo.codigo,

      numeroLlamado: cargo.numeroLlamado,

      turno: cargo.turno,

      revista: cargo.revista,

      curso: cargo.curso,

      division: cargo.division,

      cargaHoraria: cargo.cargaHoraria,
    };
  }

  get existeAsignado(): boolean {
    return this.inscripciones.some((i) => i.estadoInscripcion === EstadoInscripcion.ASIGNADO);
  }

  esAsignado(inscripcion: InscripcionListadoDto): boolean {
    return inscripcion.estadoInscripcion === EstadoInscripcion.ASIGNADO;
  }

  asignar(inscripcion: InscripcionListadoDto): void {
    if (
      this.asignandoInscripcionId !== null ||
      this.esAsignado(inscripcion) ||
      this.existeAsignado
    ) {
      return;
    }

    this.asignandoInscripcionId = inscripcion.id;

    this.inscripcionService
      .asignarPostulante(inscripcion.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),

        finalize(() => {
          this.asignandoInscripcionId = null;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          this.abrirResultadoAsignacion(
            true,
            'Asignación realizada',
            response.message ?? 'El postulante fue asignado correctamente.',
          );

          // Actualizar el listado para mostrar
          // el nuevo estado ASIGNADO.
          this.cargarInscriptos();
        },

        error: (error: HttpErrorResponse) => {
          const mensaje = error.error?.message ?? 'No se pudo asignar el postulante al cargo.';

          this.abrirResultadoAsignacion(false, 'No se pudo realizar la asignación', mensaje);
        },
      });
  }

  private abrirResultadoAsignacion(exito: boolean, titulo: string, mensaje: string): void {
    this.dialog.open(ResultadoAsignacionDialog, {
      width: '420px',
      maxWidth: '92vw',
      autoFocus: false,

      data: {
        exito,
        titulo,
        mensaje,
      },
    });
  }

  confirmarDesasignar(inscripcion: InscripcionListadoDto): void {
    if (!this.esAsignado(inscripcion) || this.desasignandoInscripcionId !== null) {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmarDesasignacionDialog, {
      width: '430px',
      maxWidth: '92vw',
      autoFocus: false,

      data: {
        nombreCompleto: inscripcion.postulante.nombreCompleto,
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmado: boolean) => {
        if (!confirmado) {
          return;
        }

        this.desasignar(inscripcion);
      });
  }

  private desasignar(inscripcion: InscripcionListadoDto): void {
    if (this.desasignandoInscripcionId !== null || !this.esAsignado(inscripcion)) {
      return;
    }

    this.desasignandoInscripcionId = inscripcion.id;

    this.inscripcionService
      .quitarAsignacion(inscripcion.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),

        finalize(() => {
          this.desasignandoInscripcionId = null;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          this.abrirResultadoAsignacion(
            true,
            'Asignación quitada',
            response.message ?? 'La asignación fue quitada correctamente.',
          );

          this.cargarInscriptos();
        },

        error: (error: HttpErrorResponse) => {
          const mensaje = error.error?.message ?? 'No se pudo quitar la asignación.';

          this.abrirResultadoAsignacion(false, 'No se pudo quitar la asignación', mensaje);
        },
      });
  }

  descargarPdf(): void {
    if (this.descargandoPdf) {
      return;
    }

    this.descargandoPdf = true;

    this.inscripcionService
      .descargarPdfCargo(this.cargoId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),

        finalize(() => {
          this.descargandoPdf = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);

          const link = document.createElement('a');

          link.href = url;
          link.download = `resultado-cargo-${this.cargoId}.pdf`;

          document.body.appendChild(link);

          link.click();

          document.body.removeChild(link);

          setTimeout(() => {
            URL.revokeObjectURL(url);
          }, 100);
        },

        error: async (error: HttpErrorResponse) => {
          // El backend devuelve 409 cuando todavía
          // no existe un postulante asignado.
          if (error.status === 409) {
            this.abrirResultadoAsignacion(
              false,
              'PDF no disponible',
              'No se puede generar el PDF porque el cargo todavía no tiene un postulante asignado.',
            );

            return;
          }

          const mensaje = await this.obtenerMensajeErrorPdf(error);

          this.abrirResultadoAsignacion(false, 'No se pudo generar el PDF', mensaje);
        },
      });
  }

  private async obtenerMensajeErrorPdf(error: HttpErrorResponse): Promise<string> {
    const mensajeDefault = 'No se pudo generar el PDF del cargo.';

    if (error.error instanceof Blob) {
      try {
        const texto = await error.error.text();

        if (!texto) {
          return mensajeDefault;
        }

        const json = JSON.parse(texto);

        return json?.message ?? mensajeDefault;
      } catch {
        return mensajeDefault;
      }
    }

    return error.error?.message ?? mensajeDefault;
  }
}
