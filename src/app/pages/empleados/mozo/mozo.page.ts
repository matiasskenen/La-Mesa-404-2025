import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { addIcons } from 'ionicons';
import { arrowBackCircleOutline, homeOutline } from 'ionicons/icons';
import { RealtimeChannel } from '@supabase/supabase-js';
import { NotificationsService } from 'src/app/services/notifications.service';
import { INotification } from 'src/app/interfaces/notification.model';

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
  ns = inject(NotificationsService);

  public notificacion: INotification = {
    title: '',
    body: '',
    url: '',
  };

  auth = inject(AuthService);
  supabase = this.auth.sb.supabase;
  canalPedidos: RealtimeChannel | null = null;
  pedidos: any[] = [];
  mostrarPedidos: boolean = false;

  constructor() {
    addIcons({ homeOutline, arrowBackCircleOutline });
  }

  ngOnInit() {
    this.obtenerPedidosPendientes();
    this.escucharPedidosEnTiempoReal();
  }
  enviarNoti(titulo: string, contenido: string, ruta: string) {
    this.notificacion.title = titulo;
    this.notificacion.body = contenido;
    this.notificacion.url = ruta;
    console.log('Antes de enviar la noti desde clientes', this.notificacion);
    this.ns
      .enviarNotificacion(this.notificacion)
      .then((responseStatus: boolean) => {
        if (responseStatus) {
          console.log('Se envió la notificacion');
        } else {
          console.log('No se envió la notificacion');
        }
      })
      .catch((error) => {
        console.log(
          'No se envió la notificacion por error: ' + JSON.stringify(error)
        );
      });
  }

  ngOnDestroy() {
    this.canalPedidos?.unsubscribe();
  }

  async obtenerPedidosPendientes() {
    const { data, error } = await this.supabase
      .from('pedidos_pendientes')
      .select('*')
      .in('estado', [
        'pendiente_confirmacion',
        'confirmado',
        'pago_pendiente_confirmacion',
      ]);

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

  async confirmarPago(mesaID: string) {
    const { error } = await this.supabase
      .from('pedidos_pendientes')
      .update({ estado: 'pagado' })
      .eq('mesa_id', mesaID);

    if (!error) {
      this.obtenerPedidosPendientes();
    }
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
      precio_unitario: item.precio,
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

    this.enviarNoti('Pedido Pendiente', 'Hay un nuevo pedido por armar', '/chat');
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


  async simularEstado(nuevoEstado: string) {
    if (this.pedidos.length === 0) {
      console.warn('No hay pedidos para simular');
      return;
    }
  
    const pedido = this.pedidos[0]; // Cambia el primero de la lista
  
    const { error } = await this.supabase
      .from('pedidos_pendientes')
      .update({ estado: nuevoEstado })
      .eq('id', pedido.id);
  
    if (!error) {
      console.log(`Estado simulado: ${nuevoEstado}`);
      this.obtenerPedidosPendientes();
    } else {
      console.error('Error al simular estado:', error);
    }
  }
  
  async simularNuevoPedido() {
    const nuevoPedido = {
      mesa_id: Math.floor(Math.random() * 100) + 1, // mesa del 1 al 100
      productos: [
        {
          nombre: 'Pizza Margarita',
          cantidad: 1,
          precio: 1500,
          tiempo: 15,
          sector: 'cocinero',
        },
        {
          nombre: 'Cerveza IPA',
          cantidad: 2,
          precio: 800,
          tiempo: 5,
          sector: 'bartender',
        },
      ],
      demora_total: 20,
      importe_total: 3100,
      estado: 'pendiente_confirmacion',
    };
  
    const { error } = await this.supabase
      .from('pedidos_pendientes')
      .insert(nuevoPedido);
  
    if (!error) {
      console.log('Pedido de prueba creado');
      this.obtenerPedidosPendientes();
    } else {
      console.error('Error al crear pedido de prueba:', error);
    }
  }
  escucharPedidosEnTiempoReal() {
    this.canalPedidos = this.supabase
      .channel('pedidos-pendientes-canal')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedidos_pendientes',
        },
        (payload) => {
          const nuevoEstado =
            payload.new && typeof payload.new === 'object' && 'estado' in payload.new
              ? (payload.new as any).estado
              : undefined;
  
          if (
            ['pendiente_confirmacion', 'pago_pendiente_confirmacion', 'confirmado'].includes(nuevoEstado)
          ) {
            this.obtenerPedidosPendientes(); // ✅ Recarga la lista evitando duplicados
          }
        }
      )
      .subscribe();
  }
  
  async simularPedidoListo() {
    if (this.pedidos.length === 0) {
      console.warn('No hay pedidos para simular');
      return;
    }
  
    const pedido = this.pedidos[0]; // Tomamos el primero para testeo
  
    const { error } = await this.supabase
      .from('detalle_pedido_cliente')
      .update({ estado: 'listo' })
      .eq('mesa', pedido.mesa_id);
  
    if (!error) {
      console.log('Todos los productos del pedido fueron marcados como "listo"');
      this.obtenerPedidosPendientes();
    } else {
      console.error('Error al marcar como listo:', error);
    }
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
