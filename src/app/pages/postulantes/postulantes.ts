import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { PostulanteService } from '../../services/postulante.service';
import { CiudadService } from '../../services/ciudad.service';

import { PostulanteResponseDto } from '../../models/postulante.model';
import { Ciudad } from '../../models/ciudad.model';

@Component({
  selector: 'app-postulantes',
  standalone: true,
  imports: [
    FormsModule,

    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './postulantes.html',
  styleUrl: './postulantes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Postulantes implements OnInit {
  private readonly postulanteService = inject(PostulanteService);
  private readonly ciudadService = inject(CiudadService);

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  postulantes: PostulanteResponseDto[] = [];
  ciudades: Ciudad[] = [];

  displayedColumns: string[] = ['dni', 'nombreCompleto', 'ciudad', 'email', 'telefono'];

  // Filtros
  search = '';
  ciudadId: number | null = null;

  // Paginación
  page = 1;
  pageSize = 10;
  totalItems = 0;

  readonly pageSizeOptions = [10, 25, 50, 100];

  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.cargarCiudades();
    this.cargarPostulantes();
  }

  cargarPostulantes(): void {
    this.loading = true;
    this.errorMessage = '';

    this.postulanteService
      .getPaged({
        page: this.page,
        pageSize: this.pageSize,
        search: this.search.trim() || null,
        ciudadId: this.ciudadId,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          this.postulantes = response.items;
          this.totalItems = response.totalItems;

          this.cdr.markForCheck();
        },

        error: (error) => {
          console.error(error);

          this.postulantes = [];
          this.totalItems = 0;

          this.errorMessage = 'No se pudo cargar el listado de postulantes.';

          this.cdr.markForCheck();
        },
      });
  }

  cargarCiudades(): void {
    this.ciudadService
      .getCiudades()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (ciudades) => {
          this.ciudades = ciudades;
          this.cdr.markForCheck();
        },

        error: (error) => {
          console.error('No se pudieron cargar las ciudades.', error);
        },
      });
  }

  buscar(): void {
    this.page = 1;
    this.cargarPostulantes();
  }

  cambiarCiudad(): void {
    this.page = 1;
    this.cargarPostulantes();
  }

  limpiarFiltros(): void {
    this.search = '';
    this.ciudadId = null;

    this.page = 1;

    this.cargarPostulantes();
  }

  cambiarPagina(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;

    this.cargarPostulantes();
  }

  get hayFiltros(): boolean {
    return this.search.trim().length > 0 || this.ciudadId !== null;
  }
}
