import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

import {
  InscripcionCreateDto,
  InscripcionCreateResponse,
  InscripcionListadoDto,
  PagedResponse,
  AsignarInscripcionDto,
  AsignarInscripcionResponse,
} from '../models/inscripcion.model';

@Injectable({
  providedIn: 'root',
})
export class InscripcionService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/Inscripcion`;

  realizarInscripcion(cargoId: number): Observable<InscripcionCreateResponse> {
    const request: InscripcionCreateDto = {
      cargoId,
    };

    return this.http.post<InscripcionCreateResponse>(this.apiUrl, request);
  }

  getMisPostulaciones(page = 1, pageSize = 20): Observable<PagedResponse<InscripcionListadoDto>> {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);

    return this.http.get<PagedResponse<InscripcionListadoDto>>(`${this.apiUrl}/MisPostulaciones`, {
      params,
    });
  }

  getPostulacionesByCargo(
    cargoId: number,
    page = 1,
    pageSize = 20,
  ): Observable<PagedResponse<InscripcionListadoDto>> {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);

    return this.http.get<PagedResponse<InscripcionListadoDto>>(
      `${this.apiUrl}/Cargo/${cargoId}/Postulaciones`,
      {
        params,
      },
    );
  }

  asignarPostulante(inscripcionId: number): Observable<AsignarInscripcionResponse> {
    const request: AsignarInscripcionDto = {
      inscripcionId,
    };

    return this.http.put<AsignarInscripcionResponse>(`${this.apiUrl}/Asignar`, request);
  }

  quitarAsignacion(inscripcionId: number): Observable<AsignarInscripcionResponse> {
    return this.http.put<AsignarInscripcionResponse>(
      `${this.apiUrl}/QuitarAsignacion/${inscripcionId}`,
      null,
    );
  }

  descargarPdfCargo(cargoId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/Cargo/${cargoId}/Pdf`, {
      responseType: 'blob',
    });
  }
}
