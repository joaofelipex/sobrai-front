import { Injectable, signal, effect } from '@angular/core';
import { Client } from '../models/client.model';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private storageKey = 'sobrai_clients_v1';
  clients = signal<Client[]>([]);

  constructor() {
    this.loadClientsFromStorage();
    effect(() => {
      localStorage.setItem(this.storageKey, JSON.stringify(this.clients()));
    });
  }

  private loadClientsFromStorage() {
    const data = localStorage.getItem(this.storageKey);
    if (data) {
      this.clients.set(JSON.parse(data));
    } else {
      // Add a sample client on first run
      const sampleClient: Client = { id: self.crypto.randomUUID(), name: 'Cliente Exemplo Ltda', document: '12.345.678/0001-90' };
      this.clients.set([sampleClient]);
    }
  }

  getClientById(id: string): Client | undefined {
    return this.clients().find(c => c.id === id);
  }

  addClient(clientData: Omit<Client, 'id'>): Client {
    const newClient: Client = { ...clientData, id: self.crypto.randomUUID() };
    this.clients.update(clients => [...clients, newClient].sort((a, b) => a.name.localeCompare(b.name)));
    return newClient;
  }
}
