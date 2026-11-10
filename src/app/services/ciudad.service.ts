import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Ciudad } from '../models/ciudad.model';

@Injectable({
  providedIn: 'root',
})
export class CiudadService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/Ciudad`;

  // OBTENER TODAS LAS CIUDADES
  getCiudades(): Observable<Ciudad[]> {
    return this.http.get<Ciudad[]>(`${this.apiUrl}/GetCiudades`);
  }
}
