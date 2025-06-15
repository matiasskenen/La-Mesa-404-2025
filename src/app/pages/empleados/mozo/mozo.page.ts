import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { addIcons } from 'ionicons';
import { homeOutline } from 'ionicons/icons';
import { RealtimeChannel } from '@supabase/supabase-js';

@Component({
  selector: 'app-mozo',
  templateUrl: './mozo.page.html',
  styleUrls: ['./mozo.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterLink,
  ],
})
export class MozoPage implements OnInit, OnDestroy {
  auth = inject(AuthService);
  supabase = this.auth.sb.supabase;
  canalPedidos: RealtimeChannel | null = null;
  pedidos: any[] = [];
  mostrarPedidos: boolean = false;

  constructor() {
    addIcons({ homeOutline });
  }

  ngOnInit() {
    this.obtenerPedidosPendientes();
    this.escucharPedidosEnTiempoReal();
  }

  ngOnDestroy() {
    this.canalPedidos?.unsubscribe();
  }

  async obtenerPedidosPendientes() {
    const { data, error } = await this.supabase
      .from('pedidos_pendientes')
      .select('*')
      .eq('estado', 'pendiente_confirmacion');

    if (!error && data) {
      this.pedidos = data;
    }
  }

  async confirmarPedido(pedidoID: string) {
    await this.supabase
      .from('pedidos_pendientes')
      .update({ estado: 'confirmado' })
      .eq('id', pedidoID);

    this.obtenerPedidosPendientes();
  }

  async rechazarPedido(pedidoID: string) {
    await this.supabase
      .from('pedidos_pendientes')
      .update({ estado: 'rechazado' })
      .eq('id', pedidoID);

    this.obtenerPedidosPendientes();
  }

  escucharPedidosEnTiempoReal() {
    this.canalPedidos = this.supabase
      .channel('pedidos-pendientes-canal')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pedidos_pendientes',
        },
        (payload) => {
          const nuevo = payload.new;
          if (nuevo['estado'] === 'pendiente_confirmacion') {
            this.pedidos.unshift(nuevo);
          }
        }
      )
      .subscribe();
  }

  volverAtras() {
    this.auth.cerrarSesion();
  }
}
