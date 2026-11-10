import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

import {
  PostulanteAddOrUpdateDto,
  PostulanteResponseDto,
  PostulanteAddOrUpdateResponse,
  PostulanteQueryRequest,
  PagedResponse,
} from '../models/postulante.model';

@Injectable({
  providedIn: 'root',
})
export class PostulanteService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/Postulante`;

  // CREAR O ACTUALIZAR MI POSTULANTE
  addOrUpdate(request: PostulanteAddOrUpdateDto): Observable<PostulanteAddOrUpdateResponse> {
    return this.http.post<PostulanteAddOrUpdateResponse>(`${this.apiUrl}/AddOrUpdate`, request);
  }

  // OBTENER POSTULANTE POR ID - ADMIN
  getById(id: number): Observable<PostulanteResponseDto> {
    return this.http.get<PostulanteResponseDto>(`${this.apiUrl}/GetById/${id}`);
  }

  // OBTENER POSTULANTE DEL USUARIO AUTENTICADO
  getMiPostulante(): Observable<PostulanteResponseDto> {
    return this.http.get<PostulanteResponseDto>(`${this.apiUrl}/GetMiPostulante`);
  }

  getPaged(request: PostulanteQueryRequest): Observable<PagedResponse<PostulanteResponseDto>> {
    let params = new HttpParams()
      .set('page', request.page.toString())
      .set('pageSize', request.pageSize.toString());

    if (request.search?.trim()) {
      params = params.set('search', request.search.trim());
    }

    if (request.ciudadId != null) {
      params = params.set('ciudadId', request.ciudadId.toString());
    }

    return this.http.get<PagedResponse<PostulanteResponseDto>>(`${this.apiUrl}/GetPaged`, {
      params,
    });
  }
}
