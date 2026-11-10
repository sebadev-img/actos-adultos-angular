import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

import { ActoDisponibleDto } from '../models/acto-disponible.model';

import {
  ActoResponseDto,
  ActoCreateDto,
  ActoUpdateDto,
  ActoQueryRequest,
  PagedResponse,
  ActoUpdateResponse,
  ApiMessageResponse,
} from '../models/acto.model';

@Injectable({
  providedIn: 'root',
})
export class ActoService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/Acto`;

  // OBTENER ACTO POR ID
  getById(id: number): Observable<ActoResponseDto> {
    return this.http.get<ActoResponseDto>(`${this.apiUrl}/${id}`);
  }

  // OBTENER LISTADO PAGINADO CON FILTROS
  getPaged(request: ActoQueryRequest): Observable<PagedResponse<ActoResponseDto>> {
    let params = new HttpParams()
      .set('page', request.page.toString())
      .set('pageSize', request.pageSize.toString());

    if (request.search?.trim()) {
      params = params.set('search', request.search.trim());
    }

    if (request.fechaDesde) {
      params = params.set('fechaDesde', request.fechaDesde);
    }

    if (request.fechaHasta) {
      params = params.set('fechaHasta', request.fechaHasta);
    }

    // Filtrar por disponibilidad de carga de cargos
    if (request.permiteCargaCargos !== null && request.permiteCargaCargos !== undefined) {
      params = params.set('permiteCargaCargos', request.permiteCargaCargos.toString());
    }

    if (request.puedeCargarCargos !== null && request.puedeCargarCargos !== undefined) {
      params = params.set('puedeCargarCargos', request.puedeCargarCargos.toString());
    }

    return this.http.get<PagedResponse<ActoResponseDto>>(`${this.apiUrl}/paged`, { params });
  }

  // CREAR ACTO
  add(request: ActoCreateDto): Observable<ActoResponseDto> {
    return this.http.post<ActoResponseDto>(this.apiUrl, request);
  }

  // ACTUALIZAR ACTO
  update(id: number, request: ActoUpdateDto): Observable<ActoUpdateResponse> {
    return this.http.put<ActoUpdateResponse>(`${this.apiUrl}/${id}`, request);
  }

  // ELIMINAR ACTO (SOFT DELETE)
  delete(id: number): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(`${this.apiUrl}/${id}`);
  }

  // OBTENER ACTOS DISPONIBLES CON SUS CARGOS
  getDisponibles(): Observable<ActoDisponibleDto[]> {
    return this.http.get<ActoDisponibleDto[]>(`${this.apiUrl}/disponibles`);
  }
}
