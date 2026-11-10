import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';

import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { InscripcionService } from '../../services/inscripcion.service';

import { EstadoInscripcion, InscripcionListadoDto } from '../../models/inscripcion.model';

@Component({
  selector: 'app-mis-postulaciones',
  standalone: true,
  imports: [DatePipe, MatButtonModule, MatIconModule, MatPaginatorModule, MatProgressSpinnerModule],
  templateUrl: './mis-postulaciones.html',
  styleUrl: './mis-postulaciones.scss',
})
export class MisPostulaciones implements OnInit {
  private readonly inscripcionService = inject(InscripcionService);

  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  postulaciones: InscripcionListadoDto[] = [];

  page = 1;
  pageSize = 10;
  totalItems = 0;

  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.cargarPostulaciones();
  }

  cargarPostulaciones(): void {
    this.loading = true;
    this.errorMessage = '';

    this.inscripcionService
      .getMisPostulaciones(this.page, this.pageSize)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          this.postulaciones = response.items;
          this.totalItems = response.totalItems;
          this.page = response.page;
          this.pageSize = response.pageSize;

          this.cdr.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          this.postulaciones = [];
          this.totalItems = 0;

          this.errorMessage = error.error?.message ?? 'No se pudieron cargar tus postulaciones.';

          this.cdr.markForCheck();
        },
      });
  }

  cambiarPagina(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;

    this.cargarPostulaciones();
  }

  verDetalle(inscripcion: InscripcionListadoDto): void {
    // Guardamos temporalmente el detalle para soportar
    // incluso una recarga de la página.
    sessionStorage.setItem('detalle_postulacion', JSON.stringify(inscripcion));

    this.router.navigate(['/mis-postulaciones', inscripcion.id]);
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
}
