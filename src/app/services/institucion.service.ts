import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

import {
  InstitucionResponseDto,
  InstitucionCreateDto,
  InstitucionUpdateDto,
  InstitucionQueryRequest,
  PagedResponse,
  InstitucionUpdateResponse,
  InstitucionMessageResponse,
  MiInstitucionResponseDto,
  AsignarUsuarioDto,
  InstitucionSelectDto,
} from '../models/institucion.model';

@Injectable({
  providedIn: 'root',
})
export class InstitucionService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/Institucion`;

  // OBTENER INSTITUCIÓN POR ID - ADMIN
  getById(id: number): Observable<InstitucionResponseDto> {
    return this.http.get<InstitucionResponseDto>(`${this.apiUrl}/${id}`);
  }

  // LISTADO PAGINADO CON FILTROS - ADMIN
  getPaged(request: InstitucionQueryRequest): Observable<PagedResponse<InstitucionResponseDto>> {
    let params = new HttpParams()
      .set('page', request.page.toString())
      .set('pageSize', request.pageSize.toString());

    if (request.search?.trim()) {
      params = params.set('search', request.search.trim());
    }

    if (request.ciudadId != null) {
      params = params.set('ciudadId', request.ciudadId.toString());
    }

    if (request.tieneUsuario != null) {
      params = params.set('tieneUsuario', request.tieneUsuario.toString());
    }

    return this.http.get<PagedResponse<InstitucionResponseDto>>(`${this.apiUrl}/paged`, { params });
  }

  // CREAR INSTITUCIÓN - ADMIN
  add(request: InstitucionCreateDto): Observable<InstitucionResponseDto> {
    return this.http.post<InstitucionResponseDto>(this.apiUrl, request);
  }

  // ACTUALIZAR INSTITUCIÓN - ADMIN
  update(id: number, request: InstitucionUpdateDto): Observable<InstitucionUpdateResponse> {
    return this.http.put<InstitucionUpdateResponse>(`${this.apiUrl}/${id}`, request);
  }

  // ELIMINAR INSTITUCIÓN - ADMIN
  delete(id: number): Observable<InstitucionMessageResponse> {
    return this.http.delete<InstitucionMessageResponse>(`${this.apiUrl}/${id}`);
  }

  // ASIGNAR USUARIO A INSTITUCIÓN - ADMIN
  asignarUsuario(id: number, request: AsignarUsuarioDto): Observable<InstitucionMessageResponse> {
    return this.http.put<InstitucionMessageResponse>(`${this.apiUrl}/${id}/usuario`, request);
  }

  // QUITAR USUARIO DE INSTITUCIÓN - ADMIN
  quitarUsuario(id: number): Observable<InstitucionMessageResponse> {
    return this.http.delete<InstitucionMessageResponse>(`${this.apiUrl}/${id}/usuario`);
  }

  // OBTENER MI INSTITUCIÓN - ROL INSTITUCION
  getMiInstitucion(): Observable<MiInstitucionResponseDto> {
    return this.http.get<MiInstitucionResponseDto>(`${this.apiUrl}/mi-institucion`);
  }

  // TODO EL LISTADO
  getAll(): Observable<InstitucionSelectDto[]> {
    return this.http.get<InstitucionSelectDto[]>(`${this.apiUrl}/all`);
  }
}
