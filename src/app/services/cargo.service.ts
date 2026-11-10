import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { CodigoJuntaDto } from '../models/codigo-junta.model';

import {
  CargoCreateDto,
  CargoUpdateDto,
  CargoResponseDto,
  CargoQueryRequest,
  CargoCreateResponse,
  CargoUpdateResponse,
  PagedResponse,
} from '../models/cargo.model';

@Injectable({
  providedIn: 'root',
})
export class CargoService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/Cargo`;

  // OBTENER CARGOS PAGINADOS
  getPaged(request: CargoQueryRequest): Observable<PagedResponse<CargoResponseDto>> {
    let params = new HttpParams()
      .set('page', request.page.toString())
      .set('pageSize', request.pageSize.toString());

    if (request.search?.trim()) {
      params = params.set('search', request.search.trim());
    }

    if (request.actoId != null) {
      params = params.set('actoId', request.actoId.toString());
    }

    if (request.orientacionId != null) {
      params = params.set('orientacionId', request.orientacionId.toString());
    }

    if (request.turno != null) {
      params = params.set('turno', request.turno.toString());
    }

    return this.http.get<PagedResponse<CargoResponseDto>>(`${this.apiUrl}/paged`, { params });
  }

  // AGREGAR CARGO
  add(request: CargoCreateDto): Observable<CargoCreateResponse> {
    return this.http.post<CargoCreateResponse>(this.apiUrl, request);
  }

  // EDITAR CARGO
  update(id: number, request: CargoUpdateDto): Observable<CargoUpdateResponse> {
    return this.http.put<CargoUpdateResponse>(`${this.apiUrl}/${id}`, request);
  }

  // OBTENER CÓDIGOS DE JUNTA
  getCodigoJunta(): Observable<CodigoJuntaDto[]> {
    return this.http.get<CodigoJuntaDto[]>(`${this.apiUrl}/getCodigoJunta`);
  }

  getPagedAdmin(request: CargoQueryRequest): Observable<PagedResponse<CargoResponseDto>> {
    let params = new HttpParams().set('page', request.page).set('pageSize', request.pageSize);

    if (request.search?.trim()) {
      params = params.set('search', request.search.trim());
    }

    if (request.actoId != null) {
      params = params.set('actoId', request.actoId);
    }

    if (request.institucionId != null) {
      params = params.set('institucionId', request.institucionId);
    }

    if (request.orientacionId != null) {
      params = params.set('orientacionId', request.orientacionId);
    }

    if (request.turno != null) {
      params = params.set('turno', request.turno);
    }

    return this.http.get<PagedResponse<CargoResponseDto>>(
      `${environment.apiUrl}/AdminCargo/paged`,
      { params },
    );
  }
}
