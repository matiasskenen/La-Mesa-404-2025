import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';
import { RealtimeChannel } from '@supabase/supabase-js';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackCircleOutline } from 'ionicons/icons';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-estado-pedido',
  templateUrl: './estado-pedido.page.html',
  styleUrls: ['./estado-pedido.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class EstadoPedidoPage implements OnInit {
  auth = inject(AuthService);
  supabase = this.auth.sb.supabase;
  canalPedidos: RealtimeChannel | null = null;
  pedidos: any[] = [];
  mostrarPedidos: boolean = false;
  mesaRecibida: string = '';
  constructor(private route: ActivatedRoute) { 
     addIcons({arrowBackCircleOutline});
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.mesaRecibida = params['mesa'];
    });

    this.obtenerPedidosPendientes();
  }

   async obtenerPedidosPendientes() {
    const email = this.auth.usuarioActual?.email;
    // const email = "cliente@resto.com"; solo de prueba
    const { data, error } = await this.supabase
      .from('pedidos_pendientes')
      .select('*')
      .eq('cliente_id', email)
      .eq('mesa_id', this.mesaRecibida.toString())
      .in('estado', ['pendiente_confirmacion', 'confirmado']);

    if (!error && data) {
      for (const pedido of data) {
        
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

  volverAtras() {
    window.history.back();
  }

}
