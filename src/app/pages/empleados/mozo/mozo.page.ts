import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { addIcons } from 'ionicons';
import { arrowBackCircleOutline, homeOutline } from 'ionicons/icons';
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
    addIcons({ homeOutline,arrowBackCircleOutline});
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
      .in('estado', ['pendiente_confirmacion', 'confirmado']);

    if (!error && data) {
      for (const pedido of data) {
        // Agrega el resumen por sector (ej: Cocinero: 20min, Bartender: Listo para entregar)
        pedido.resumen_sector = await this.generarResumenPorSector(
          pedido.mesa_id
        );

        // Agrega el detalle individual de cada producto del pedido
        pedido.detalle = await this.obtenerDetallePedido(pedido.mesa_id);
      }

      this.pedidos = data;
    }
  }

  async obtenerDetallePedido(mesa: number) {
    const { data } = await this.supabase
      .from('detalle_pedido_cliente')
      .select('producto_nombre, sector, estado, tiempo_estimado_min, cantidad')
      .eq('mesa', mesa);
    return data || [];
  }

  async generarResumenPorSector(mesa: number) {
    const { data: detalle } = await this.supabase
      .from('detalle_pedido_cliente')
      .select('sector, estado, tiempo_estimado_min')
      .eq('mesa', mesa);

    const sectores: {
      [key: string]: { listos: number; total: number; maxTiempo: number };
    } = {};

    for (const item of detalle || []) {
      const sector = item.sector || 'cocinero';
      if (!sectores[sector]) {
        sectores[sector] = { listos: 0, total: 0, maxTiempo: 0 };
      }

      sectores[sector].total += 1;
      if (item.estado === 'listo') {
        sectores[sector].listos += 1;
      }
      if (
        typeof item.tiempo_estimado_min === 'number' &&
        item.tiempo_estimado_min > 0
      ) {
        sectores[sector].maxTiempo += item.tiempo_estimado_min;
      }
    }

    return Object.entries(sectores).map(([sector, s]) => ({
      sector: sector === 'cocinero' ? ' Cocinero' : ' Bartender',
      mensaje:
        s.listos === s.total ? 'Listo para entregar' : `${s.maxTiempo} min`,
    }));
  }

  async confirmarPedido(pedidoID: string) {
    const { data: pedido, error: errorPedido } = await this.supabase
      .from('pedidos_pendientes')
      .select('productos, mesa_id')
      .eq('id', pedidoID)
      .maybeSingle();

    if (errorPedido || !pedido) return;

    const mesa = parseInt(pedido.mesa_id);

    const inserts = pedido.productos.map((item: any) => ({
      mesa,
      producto_nombre: item.nombre,
      cantidad: item.cantidad,
      sector: item.sector || this.inferirSector(item.nombre),
      estado: 'pendiente',
      tiempo_estimado_min: item.tiempo || 0,
    }));

    const { error: insertError } = await this.supabase
      .from('detalle_pedido_cliente')
      .insert(inserts);

    if (!insertError) {
      await this.supabase
        .from('pedidos_pendientes')
        .update({ estado: 'confirmado' })
        .eq('id', pedidoID);

      this.obtenerPedidosPendientes();
    }
  }

  async entregarPedido(mesaID: number) {
    const { error } = await this.supabase
      .from('detalle_pedido_cliente')
      .update({ estado: 'entregado' })
      .eq('mesa', mesaID);

    if (!error) {
      await this.supabase
        .from('pedidos_pendientes')
        .update({ estado: 'entregado' })
        .eq('mesa_id', mesaID);

      this.obtenerPedidosPendientes();
    }
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

  inferirSector(nombre: string): string {
    const lower = nombre.toLowerCase();
    if (
      lower.includes('cerveza') ||
      lower.includes('vino') ||
      lower.includes('trago') ||
      lower.includes('licor') ||
      lower.includes('gaseosa') ||
      lower.includes('agua')
    ) {
      return 'bartender';
    }
    return 'cocinero';
  }

  volverAtras() {
    this.auth.cerrarSesion();
  }
}
