import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { AuthService } from 'src/app/services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { Haptics } from '@capacitor/haptics';
import { RealtimeChannel } from '@supabase/supabase-js';
import { homeOutline, newspaperOutline, qrCodeOutline, restaurantOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { NotificationsService } from 'src/app/services/notifications.service';
import { INotification } from 'src/app/interfaces/notification.model';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.page.html',
  styleUrls: ['./clientes.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink],
})
export class ClientesPage {

  auth = inject(AuthService);
  alertCtrl = inject(AlertController);
  router = inject(Router);

  procesando = false;
  canalFila: RealtimeChannel | null = null;
  numeroFila: number | null = null;

  estadoCliente: 'ninguno' | 'esperando' | 'aceptado' = 'ninguno';
  mensajeEstado: string = '';

  modalAlerta: boolean = false;
  tituloAlerta: string = '';
  mensajeAlerta: string = '';

  //notificaciones-----------
  ns = inject(NotificationsService);

  public notificacion: INotification = {
    title: '',
    body: '',
    url: ''
  }
  //-------------------------
  constructor(private routerParametro: Router) {
    addIcons({ qrCodeOutline, restaurantOutline, homeOutline, newspaperOutline});
  }

  ngOnInit() {
    this.escucharFila();
  }

  async escanearQR() {
    this.procesando = true;
    try {
      const { barcodes } = await BarcodeScanner.scan();
      const claveQR = barcodes[0]?.rawValue;

      if (!claveQR) {
        this.mostrarModalAlerta(true, 'Error', 'No se detectó un código QR válido.')
        return;
      }

      // si el codigo es correcto
      if(claveQR.toString() === 'ingreso-mesa404-01'){

        this.enviarNoti(
          'Nuevo Cliente en espera',
          'Tienes un nuevo cliente por Asignar',
          '/meitre'
        );
        const { data: userData } = await this.auth.sb.supabase.auth.getUser();
        const email = userData?.user?.email || 'anonimo';
  
        const { error } = await this.auth.sb.supabase
          .from('espera_local')
          .insert({
            email,
            clave: claveQR,
            estado: 'pendiente',
          });
  
        if (error) {
          this.mostrarModalAlerta(true, 'Error', 'No se pudo registrar en la lista de espera.')
        } else {
          await Haptics.vibrate();
          this.estadoCliente = 'esperando';
          this.mensajeEstado =
            'Estás en lista de espera. Un maítre te asignará una mesa.';
        }
      }
      else{
        this.mostrarModalAlerta(true, 'Error', 'Este QR no corresponde al ingreso del local.')
      }

    } catch (err) {
      console.error(err);

      this.mostrarModalAlerta(true, 'Error', 'Hubo un problema al escanear el QR.')
    } finally {
      this.procesando = false;
    }
  }

  async escucharFila() {
    const { data: session } = await this.auth.sb.supabase.auth.getUser();
    const email = session?.user?.email;
    if (!email) return;

    this.canalFila = this.auth.sb.supabase
      .channel('canal-fila')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'fila',
          filter: `email=eq.${email}`,
        },
        async (payload) => {
          const numero = payload.new['numero'];
          const mesa = payload.new['mesa'];

          this.estadoCliente = 'aceptado';
          this.numeroFila = numero;

          if (mesa) {
            // ✅ Caso con mesa asignada
            this.mensajeEstado = `🎉 Te asignaron la mesa ${mesa}. ¡Escaneá el menú!`;

            // 🚀 Redirección automática
            this.router.navigate(['/mesa'], {
              queryParams: { mesa },
            });
          } else {
            // 🔄 Obtener toda la fila ordenada
            const { data: fila } = await this.auth.sb.supabase
              .from('fila')
              .select('*')
              .order('numero', { ascending: true });

            let posicion = 0;

            if (fila && Array.isArray(fila)) {
              posicion = fila.findIndex((item) => item.email === email) + 1;
            }

            // 📥 Mensaje dinámico
            this.mensajeEstado =
              posicion > 0
                ? `🎟️ Estás en la fila con el número ${numero}. Tu posición actual es: ${posicion}.`
                : `🎟️ Estás en la fila con el número ${numero}. Posición actual: desconocida.`;
          }
        }
      )
      .subscribe();
  }

  async mostrarAlerta(titulo: string, mensaje: string) {
    const alert = await this.alertCtrl.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK'],
    });
    await alert.present();
  }

  volverAtras() {
    this.auth.cerrarSesion();
  }

  simularEspera() {
    this.estadoCliente = 'esperando';
    this.mensajeEstado = 'Estás en lista de espera (simulado).';
  }

  simularAsignacionMesa() {
    this.estadoCliente = 'aceptado';
    this.mensajeEstado =
      '🎉 Te asignaron la mesa 1 (simulado). ¡Escaneá el menú!';
    this.router.navigate(['/mesa'], {
      queryParams: { mesa: 1 },
    });
  }


  enviarNoti(titulo:string, contenido:string, ruta:string){
    this.notificacion.title = titulo;
    this.notificacion.body = contenido;
    this.notificacion.url = ruta;
    console.log( "Antes de enviar la noti desde clientes",this.notificacion)
    this.ns.enviarNotificacion(this.notificacion).then((responseStatus:boolean) =>{
      if(responseStatus){
        console.log("Se envió la notificacion");
      }else{
        console.log("No se envió la notificacion");
      }
    }).catch(error =>{
      console.log("No se envió la notificacion por error: " + JSON.stringify(error));
    })
  }

 mostrarModalAlerta(
    mostrar: boolean,
    titulo: string = '',
    mensaje: string = ''
  ) {
    if (mostrar) {
      this.mensajeAlerta = mensaje;
      this.tituloAlerta = titulo;
    }
    this.modalAlerta = mostrar;
  }
}
