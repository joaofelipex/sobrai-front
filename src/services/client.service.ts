import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Client } from '../models/client.model';
import { Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.backendUrl}/api`;

  clients = signal<Client[]>([]);

  constructor() {
    this.loadClientsFromServer();
  }

  private loadClientsFromServer() {
    this.http.get<Client[]>(`${this.apiUrl}/clients`).subscribe({
      next: (data) => {
        this.clients.set(data);
      },
      error: (err) => console.error('Failed to load clients from server', err)
    });
  }

  getClientById(id: string): Client | undefined {
    return this.clients().find(c => c.id === id);
  }

  addClient(clientData: Omit<Client, 'id'>): Observable<Client> {
    return this.http.post<Client>(`${this.apiUrl}/clients`, clientData).pipe(
      tap((newClient) => {
        this.clients.update(clients => [...clients, newClient].sort((a, b) => a.name.localeCompare(b.name)));
      })
    );
  }
}
