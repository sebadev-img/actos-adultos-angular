import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

import {
  OrientacionResponseDto,
  OrientacionCreateDto,
  OrientacionUpdateDto,
  OrientacionQueryRequest,
  OrientacionApiResponse,
  OrientacionDeleteResponse,
  PagedResponse,
} from '../models/orientacion.model';

@Injectable({
  providedIn: 'root',
})
export class OrientacionService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/Orientacion`;

  // OBTENER ORIENTACIONES PAGINADAS
  getPaged(request: OrientacionQueryRequest): Observable<PagedResponse<OrientacionResponseDto>> {
    let params = new HttpParams()
      .set('page', request.page.toString())
      .set('pageSize', request.pageSize.toString());

    if (request.search?.trim()) {
      params = params.set('search', request.search.trim());
    }

    return this.http.get<PagedResponse<OrientacionResponseDto>>(`${this.apiUrl}/paged`, { params });
  }

  // AGREGAR ORIENTACION
  add(request: OrientacionCreateDto): Observable<OrientacionApiResponse> {
    return this.http.post<OrientacionApiResponse>(this.apiUrl, request);
  }

  // EDITAR ORIENTACION
  update(id: number, request: OrientacionUpdateDto): Observable<OrientacionApiResponse> {
    return this.http.put<OrientacionApiResponse>(`${this.apiUrl}/${id}`, request);
  }

  // ELIMINAR ORIENTACION
  delete(id: number): Observable<OrientacionDeleteResponse> {
    return this.http.delete<OrientacionDeleteResponse>(`${this.apiUrl}/${id}`);
  }
}
