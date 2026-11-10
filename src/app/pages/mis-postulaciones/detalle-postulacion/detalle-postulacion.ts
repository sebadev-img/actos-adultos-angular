import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';

import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  Caracter,
  EstadoInscripcion,
  InscripcionListadoDto,
} from '../../../models/inscripcion.model';

import { Revista, Turno } from '../../../models/cargo.model';

import { InscripcionService } from '../../../services/inscripcion.service';

@Component({
  selector: 'app-detalle-postulacion',
  standalone: true,
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './detalle-postulacion.html',
  styleUrl: './detalle-postulacion.scss',
})
export class DetallePostulacion implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  inscripcion: InscripcionListadoDto | null = null;

  private readonly inscripcionService = inject(InscripcionService);

  private readonly cdr = inject(ChangeDetectorRef);

  private readonly destroyRef = inject(DestroyRef);

  inscriptos: InscripcionListadoDto[] = [];

  displayedColumns: string[] = ['nombreCompleto', 'puntajeJunta'];

  page = 1;
  pageSize = 20;
  totalItems = 0;

  loadingInscriptos = false;
  inscriptosErrorMessage = '';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('inscripcionId'));

    const state = history.state as {
      inscripcion?: InscripcionListadoDto;
    };

    if (state.inscripcion && state.inscripcion.id === id) {
      this.inscripcion = state.inscripcion;

      this.cargarInscriptos();

      return;
    }

    const guardado = sessionStorage.getItem('detalle_postulacion');

    if (guardado) {
      try {
        const inscripcion = JSON.parse(guardado) as InscripcionListadoDto;

        if (inscripcion.id === id) {
          this.inscripcion = inscripcion;

          this.cargarInscriptos();

          return;
        }
      } catch {
        // Ignorar JSON inválido.
      }
    }

    this.volver();
  }

  volver(): void {
    this.router.navigate(['/mis-postulaciones']);
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

  cargarInscriptos(): void {
    if (!this.inscripcion) {
      return;
    }

    this.loadingInscriptos = true;
    this.inscriptosErrorMessage = '';

    this.inscripcionService
      .getPostulacionesByCargo(this.inscripcion.cargo.id, this.page, this.pageSize)
      .pipe(
        takeUntilDestroyed(this.destroyRef),

        finalize(() => {
          this.loadingInscriptos = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          this.inscriptos = response.items;

          this.totalItems = response.totalItems;
          this.page = response.page;
          this.pageSize = response.pageSize;

          this.cdr.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          this.inscriptos = [];
          this.totalItems = 0;

          this.inscriptosErrorMessage =
            error.error?.message ?? 'No se pudo cargar el listado de inscriptos.';

          this.cdr.markForCheck();
        },
      });
  }

  cambiarPagina(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;

    this.cargarInscriptos();
  }
}
