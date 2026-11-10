import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';

import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ActoService } from '../../services/acto.service';
import { CargoService } from '../../services/cargo.service';
import { InstitucionService } from '../../services/institucion.service';

import { ActoQueryRequest, ActoResponseDto } from '../../models/acto.model';

import { CargoResponseDto, Turno } from '../../models/cargo.model';

import { InstitucionSelectDto } from '../../models/institucion.model';

@Component({
  selector: 'app-gestion-cargos-admin',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './gestion-cargos-admin.html',
  styleUrl: './gestion-cargos-admin.scss',
})
export class GestionCargosAdmin implements OnInit {
  private readonly actoService = inject(ActoService);

  private readonly cargoService = inject(CargoService);

  private readonly institucionService = inject(InstitucionService);

  private readonly router = inject(Router);

  private readonly cdr = inject(ChangeDetectorRef);

  private readonly destroyRef = inject(DestroyRef);

  displayedColumns = ['numero', 'descripcion', 'inicio', 'fin', 'acciones'];

  displayedCargoColumns = [
    'institucion',
    'descripcion',
    'orientacion',
    'turno',
    'codigo',
    'curso',
    'division',
    'cargaHoraria',
    'acciones',
  ];

  actos: ActoResponseDto[] = [];
  actoSeleccionado: ActoResponseDto | null = null;

  search = '';
  appliedSearch = '';

  page = 1;
  pageSize = 10;
  totalItems = 0;

  loading = false;
  errorMessage = '';

  cargos: CargoResponseDto[] = [];

  cargoPage = 1;
  cargoPageSize = 50;
  cargoTotalItems = 0;

  loadingCargos = false;
  cargoErrorMessage = '';

  instituciones: InstitucionSelectDto[] = [];

  institucionId: number | null = null;

  private requestVersion = 0;
  private cargoRequestVersion = 0;

  ngOnInit(): void {
    this.cargarActos();
    this.cargarInstituciones();
  }

  cargarActos(): void {
    const version = ++this.requestVersion;

    this.loading = true;
    this.errorMessage = '';

    const request: ActoQueryRequest = {
      page: this.page,
      pageSize: this.pageSize,
      search: this.appliedSearch,
    };

    this.actoService
      .getPaged(request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          if (version === this.requestVersion) {
            this.loading = false;
            this.cdr.markForCheck();
          }
        }),
      )
      .subscribe({
        next: (response) => {
          if (version !== this.requestVersion) {
            return;
          }

          this.actos = response.items;
          this.totalItems = response.totalItems;

          this.page = response.page;
          this.pageSize = response.pageSize;

          this.cdr.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          if (version !== this.requestVersion) {
            return;
          }

          this.actos = [];
          this.totalItems = 0;

          this.errorMessage = error.error?.message ?? 'No se pudo cargar el listado de actos.';

          this.cdr.markForCheck();
        },
      });
  }

  cargarInstituciones(): void {
    this.institucionService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.instituciones = response;

          this.cdr.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          console.error('No se pudo cargar el listado de instituciones.', error);

          this.instituciones = [];

          this.cdr.markForCheck();
        },
      });
  }

  buscar(): void {
    this.appliedSearch = this.search.trim();

    this.page = 1;
    this.cerrarSeleccion();

    this.cargarActos();
  }

  limpiarFiltros(): void {
    this.search = '';
    this.buscar();
  }

  cambiarPagina(event: PageEvent): void {
    this.page = event.pageIndex + 1;

    this.pageSize = event.pageSize;

    this.cargarActos();
  }

  verCargos(acto: ActoResponseDto): void {
    this.actoSeleccionado = acto;

    this.institucionId = null;

    this.cargoPage = 1;
    this.cargoPageSize = 50;

    this.cargos = [];
    this.cargoTotalItems = 0;

    this.cargarCargos();
  }

  cargarCargos(): void {
    if (!this.actoSeleccionado) {
      return;
    }

    const version = ++this.cargoRequestVersion;

    this.loadingCargos = true;
    this.cargoErrorMessage = '';

    this.cargoService
      .getPagedAdmin({
        page: this.cargoPage,
        pageSize: this.cargoPageSize,

        actoId: this.actoSeleccionado.id,

        institucionId: this.institucionId,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          if (version === this.cargoRequestVersion) {
            this.loadingCargos = false;
            this.cdr.markForCheck();
          }
        }),
      )
      .subscribe({
        next: (response) => {
          if (version !== this.cargoRequestVersion) {
            return;
          }

          this.cargos = response.items;

          this.cargoTotalItems = response.totalItems;

          this.cargoPage = response.page;

          this.cargoPageSize = response.pageSize;

          this.cdr.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          if (version !== this.cargoRequestVersion) {
            return;
          }

          this.cargos = [];

          this.cargoErrorMessage =
            error.error?.message ?? 'No se pudo cargar el listado de cargos.';

          this.cdr.markForCheck();
        },
      });
  }

  cambiarInstitucion(): void {
    this.cargoPage = 1;
    this.cargarCargos();
  }

  cambiarPaginaCargos(event: PageEvent): void {
    this.cargoPage = event.pageIndex + 1;

    this.cargoPageSize = event.pageSize;

    this.cargarCargos();
  }

  cerrarSeleccion(): void {
    ++this.cargoRequestVersion;

    this.actoSeleccionado = null;

    this.cargos = [];
    this.cargoTotalItems = 0;

    this.institucionId = null;

    this.cargoErrorMessage = '';
    this.loadingCargos = false;
  }

  verInscriptos(cargo: CargoResponseDto): void {
    this.router.navigate(['/gestion-cargos-admin', cargo.id, 'inscriptos'], {
      state: {
        cargo,
        acto: this.actoSeleccionado,
      },
    });
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
}
