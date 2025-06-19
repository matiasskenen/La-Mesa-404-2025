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
  templateUrl: './bartender.page.html',
  styleUrls: ['./bartender.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule],
})
export class BartenderPage implements OnInit {
  auth = inject(AuthService);
  supabase = this.auth.sb.supabase;
  pedidos: any[] = [];
  mostrarPedidosPendientes: boolean = false;
  constructor() {
    addIcons({ homeOutline,arrowBackCircleOutline});
  }

  ngOnInit() {
    this.obtenerPedidosPendientes();
  }

  volverAtras() {
    this.auth.cerrarSesion();
  }

  async obtenerPedidosPendientes() {
    // const rol = this.auth.rolUsuario;
    const rol = "bartender"; // esto es solo de prueba
    if (!rol) return;

    const { data, error } = await this.supabase
      .from('detalle_pedido_cliente')
      .select('*')
      .eq('sector', rol)
      .eq('estado', 'pendiente')

    if (!error && data) {
      console.log("data desde obtenerPedidos ", data);
      this.pedidos = data;
    }
  }

  async prepararProducto(productoID: string) {
    const { error } = await this.supabase
      .from('detalle_pedido_cliente')
      .update({ estado: 'listo' })
      .eq('id', productoID);

    if (!error) {
      await this.supabase
      this.obtenerPedidosPendientes();
    }
  }
}
