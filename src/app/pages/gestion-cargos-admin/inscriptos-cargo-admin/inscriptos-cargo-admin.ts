import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';

import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

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

@Component({
  selector: 'app-inscriptos-cargo-admin',
  standalone: true,

  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],

  templateUrl: './inscriptos-cargo-admin.html',
  styleUrl: './inscriptos-cargo-admin.scss',
})
export class InscriptosCargoAdmin implements OnInit {
  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly inscripcionService = inject(InscripcionService);

  private readonly cdr = inject(ChangeDetectorRef);

  private readonly destroyRef = inject(DestroyRef);

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
  ];

  page = 1;
  pageSize = 20;
  totalItems = 0;

  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.cargoId = Number(this.route.snapshot.paramMap.get('cargoId'));

    if (!this.cargoId || this.cargoId <= 0) {
      this.router.navigate(['/gestion-cargos-admin']);

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

    this.inscripcionService;
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
           * Si el usuario accede directamente
           * por URL y no existe history.state,
           * obtenemos los datos del cargo desde
           * la primera inscripción.
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
    this.router.navigate(['/gestion-cargos-admin']);
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
}
