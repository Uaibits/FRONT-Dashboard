import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {Client} from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class ClientKeyService {
  private readonly AVAILABLE_CLIENTS_STORAGE = 'available_clients';

  private availableClientsSubject = new BehaviorSubject<Client[]>([]);
  public availableClients$ = this.availableClientsSubject.asObservable();

  constructor() {
    this.initializeClients();
  }

  /**
   * Inicializa os clientes disponíveis a partir do localStorage
   */
  private initializeClients(): void {
    try {
      const storedClients = localStorage.getItem(this.AVAILABLE_CLIENTS_STORAGE);
      if (storedClients) {
        this.availableClientsSubject.next(JSON.parse(storedClients));
      }
    } catch (error) {
      console.error('Erro ao inicializar clientes:', error);
    }
  }

  /**
   * Define a lista de clientes disponíveis para o usuário
   */
  setAvailableClients(clients: Client[]): void {
    try {
      localStorage.setItem(this.AVAILABLE_CLIENTS_STORAGE, JSON.stringify(clients));
      this.availableClientsSubject.next(clients);
    } catch (error) {
      console.error('Erro ao salvar clientes disponíveis:', error);
    }
  }

  /**
   * Obtém a lista de clientes disponíveis
   */
  getAvailableClients(): Client[] {
    return this.availableClientsSubject.value;
  }

  /**
   * Limpa os clientes disponíveis (usado no logout)
   */
  clearClients(): void {
    try {
      localStorage.removeItem(this.AVAILABLE_CLIENTS_STORAGE);
      this.availableClientsSubject.next([]);
    } catch (error) {
      console.error('Erro ao limpar clientes:', error);
    }
  }
}
