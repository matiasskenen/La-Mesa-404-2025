import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { addIcons } from 'ionicons';
import { arrowBackCircleOutline, homeOutline, receiptOutline } from 'ionicons/icons';
import { RealtimeChannel } from '@supabase/supabase-js';
import { NotificationsService } from 'src/app/services/notifications.service';
import { INotification } from 'src/app/interfaces/notification.model';

@Component({
  selector: 'app-mozo',
  templateUrl: './bartender.page.html',
  styleUrls: ['./bartender.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule],
})
export class BartenderPage implements OnInit {
  ns = inject(NotificationsService);

  public notificacion: INotification = {
    title: '',
    body: '',
    url: '',
  };
  auth = inject(AuthService);
  supabase = this.auth.sb.supabase;
  pedidos: any[] = [];
  mostrarPedidosPendientes: boolean = false;
  constructor() {
    addIcons({ homeOutline, arrowBackCircleOutline, receiptOutline});
  }

  ngOnInit() {
    this.obtenerPedidosPendientes();
  }

  volverAtras() {
    this.auth.cerrarSesion();
  }

  async obtenerPedidosPendientes() {
    // const rol = this.auth.rolUsuario;
    const rol = 'bartender'; // esto es solo de prueba
    if (!rol) return;

    const { data, error } = await this.supabase
      .from('detalle_pedido_cliente')
      .select('*')
      .eq('sector', rol)
      .eq('estado', 'pendiente');

    if (!error && data) {
      console.log('data desde obtenerPedidos ', data);
      this.pedidos = data;
    }
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

  async prepararProducto(productoID: string, numeroMesa : string) {
    const { error } = await this.supabase
      .from('detalle_pedido_cliente')
      .update({ estado: 'listo' })
      .eq('id', productoID);

    if (!error) {
      await this.supabase;
      this.obtenerPedidosPendientes();
    }

    this.enviarNoti(
      'Pedido Terminado',
      `Pedido de la mesa ${numeroMesa}, Terminado`,
      '/chat'
    );
  }
}
