import { ChangeDetectorRef, Component, inject, OnInit, ViewChild } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { MatTableModule } from '@angular/material/table';

import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ActoService } from '../../services/acto.service';
import { ActoResponseDto } from '../../models/acto.model';

import { ActoDialog } from './dialogs/acto-dialog/acto-dialog';

@Component({
  selector: 'app-actos',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './actos.html',
  styleUrl: './actos.scss',
})
export class Actos implements OnInit {
  private readonly actoService = inject(ActoService);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns = [
    'numero',
    'descripcion',
    'inicio',
    'fin',
    'esActivo',
    'permiteCargaCargos',
    'acciones',
  ];

  actos: ActoResponseDto[] = [];

  search = '';
  appliedSearch = '';

  page = 1;
  pageSize = 10;
  totalItems = 0;

  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.cargarActos();
  }

  cargarActos(): void {
    this.loading = true;
    this.errorMessage = '';

    this.actoService
      .getPaged({
        page: this.page,
        pageSize: this.pageSize,
        search: this.appliedSearch,
      })
      .subscribe({
        next: (response) => {
          this.actos = response.items;
          this.totalItems = response.totalItems;
          this.page = response.page;
          this.pageSize = response.pageSize;
          this.loading = false;
          this.cdr.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          this.loading = false;
          this.errorMessage = error.error?.message ?? 'No se pudo cargar el listado de actos.';
          this.cdr.markForCheck();
        },
      });
  }

  buscar(): void {
    this.appliedSearch = this.search.trim();
    this.page = 1;
    this.cargarActos();
  }

  limpiarBusqueda(): void {
    this.search = '';
    this.appliedSearch = '';
    this.page = 1;
    this.cargarActos();
  }

  cambiarPagina(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.cargarActos();
  }

  agregarActo(): void {
    const dialogRef = this.dialog.open(ActoDialog, {
      width: '560px',
      maxWidth: '95vw',
      autoFocus: false,
      data: {
        acto: null,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.page = 1;
        this.cargarActos();
      }
    });
  }

  editarActo(acto: ActoResponseDto): void {
    const dialogRef = this.dialog.open(ActoDialog, {
      width: '560px',
      maxWidth: '95vw',
      autoFocus: false,
      data: {
        acto,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.cargarActos();
      }
    });
  }

  formatearFecha(value: string): string {
    if (!value) return '-';

    const fecha = new Date(value);

    if (Number.isNaN(fecha.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(fecha);
  }
}
