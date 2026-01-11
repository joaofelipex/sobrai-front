import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Client } from '../models/client.model';
import { Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';

/**
 * Serviço para gerenciar os dados de clientes.
 *
 * Responsável por carregar, buscar, adicionar e manipular
 * informações de clientes, interagindo com a API backend
 * e mantendo o estado dos clientes sincronizado.
 */
@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.backendUrl}/api`;

  /**
   * Sinal (Signal) que armazena a lista de clientes.
   * A lista é reativa e os componentes que a utilizam são
   * atualizados automaticamente quando seu valor muda.
   */
  clients = signal<Client[]>([]);

  /**
   * Construtor do serviço.
   * Inicia o carregamento dos clientes do servidor assim que o serviço é instanciado.
   */
  constructor() {
    this.loadClientsFromServer();
  }

  /**
   * Carrega a lista de clientes a partir do servidor.
   * Faz uma requisição GET para a API e atualiza o `signal` de clientes.
   * @private
   */
  private loadClientsFromServer() {
    this.http.get<Client[]>(`${this.apiUrl}/clients`).subscribe({
      next: (data) => {
        this.clients.set(data);
      },
      error: (err) => console.error('Failed to load clients from server', err)
    });
  }

  /**
   * Busca um cliente pelo seu ID.
   * @param id O ID do cliente a ser buscado.
   * @returns O objeto do cliente se encontrado, caso contrário, `undefined`.
   */
  getClientById(id: string): Client | undefined {
    return this.clients().find(c => c.id === id);
  }

  /**
   * Adiciona um novo cliente.
   * Envia os dados do novo cliente para a API via POST e, em caso de sucesso,
   * atualiza a lista de clientes local.
   * @param clientData Os dados do cliente a serem adicionados, sem o campo `id`.
   * @returns Um `Observable` que emite o cliente recém-criado pelo backend.
   */
  addClient(clientData: Omit<Client, 'id'>): Observable<Client> {
    return this.http.post<Client>(`${this.apiUrl}/clients`, clientData).pipe(
      tap((newClient) => {
        this.clients.update(clients => [...clients, newClient].sort((a, b) => a.name.localeCompare(b.name)));
      })
    );
  }
}
