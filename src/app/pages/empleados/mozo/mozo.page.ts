import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { RouterLink } from '@angular/router';
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
export class MozoPage implements OnInit {
  auth = inject(AuthService);
  supabase = this.auth.sb.supabase;
  canalPedidos: RealtimeChannel | null = null; // canal tiempo real
  pedidos: any[] = [];
  mostrarPedidos: boolean = false; // 🔁 Mostrar u ocultar pedidos

  constructor() {
    addIcons({ homeOutline });
  }

  ngOnInit() {
    this.obtenerPedidosPendientes();
    this.escucharPedidosEnTiempoReal(); // 👈 activá escucha
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

  async obtenerPedidosPendientes() {
    const { data, error } = await this.supabase
      .from('pedidos_pendientes')
      .select('*')
      .eq('estado', 'pendiente_confirmacion');

    if (!error) {
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

  volverAtras() {
    this.auth.cerrarSesion();
  }

  ngOnDestroy() {
    this.canalPedidos?.unsubscribe();
  }
}
