import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

import {
  UserResponseDto,
  UserQueryRequest,
  ChangeUserRoleDto,
  ChangeUserRoleResponse,
  PagedResponse,
} from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/User`;

  // OBTENER USUARIOS PAGINADOS
  getPaged(request: UserQueryRequest): Observable<PagedResponse<UserResponseDto>> {
    let params = new HttpParams()
      .set('page', request.page.toString())
      .set('pageSize', request.pageSize.toString());

    if (request.search?.trim()) {
      params = params.set('search', request.search.trim());
    }

    if (request.role?.trim()) {
      params = params.set('role', request.role.trim());
    }

    if (request.soloDisponiblesInstitucion !== undefined) {
      params = params.set(
        'soloDisponiblesInstitucion',
        request.soloDisponiblesInstitucion.toString(),
      );
    }

    return this.http.get<PagedResponse<UserResponseDto>>(`${this.apiUrl}/paged`, { params });
  }

  // CAMBIAR ROL DE USUARIO
  changeRole(userId: string, request: ChangeUserRoleDto): Observable<ChangeUserRoleResponse> {
    return this.http.put<ChangeUserRoleResponse>(
      `${this.apiUrl}/${encodeURIComponent(userId)}/role`,
      request,
    );
  }
}
