import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService } from 'src/app/services/database.service';
import { SupabaseService } from 'src/app/services/supabase.service';
import { AuthService } from 'src/app/services/auth.service';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { addIcons } from 'ionicons'; //Funcion para agregar iconos en el constructor
import { send,homeOutline} from 'ionicons/icons'; //nombre de los iconos
import { NotificationsService } from 'src/app/services/notifications.service';
import { INotification } from 'src/app/interfaces/notification.model';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLink]
})
export class ChatPage implements OnInit {
  db = inject(DatabaseService);
  sb = inject(SupabaseService);
  auth = inject(AuthService);
  mensajes = signal<any>([]);
  mensaje = "";
  mostrarMensajes = false;

   //solo para pasarle por parametro la mesa
  mesaRecibida:string = '';

  //notificaciones-----------
    ns = inject(NotificationsService);
  
    public notificacion: INotification = {
      title: '',
      body: '',
      url: ''
    }
    //-------------------------

  
  //solo para pasarle por parametro la mesa
  constructor(private route: ActivatedRoute) { 
    
    addIcons({send, homeOutline});//nombre de los iconos en el constructor
  }

  ngOnInit() {
     //solo para pasarle por parametro la mesa
    this.route.queryParams.subscribe(params => {
    this.mesaRecibida = params['mesa'];
  });

    this.db.traerTodosMensajes().then((data) => {
      this.mensajes.set([...data]);
        for (let m of data) {
    }
       setTimeout(() => {
    this.mostrarMensajes = true;
  }, 500); // Espera 1 segundo antes de mostrar con animación
    });
    // schema-db-changes -> schema public
    // table-db-changes -> tabla mensajes
    const canal = this.sb.supabase.channel('table-db-changes');
    canal.on(
      'postgres_changes',
      {
        // event: * (todos), INSERT, UPDATE, DELETE
        event: 'INSERT',
        schema: 'public',
        table: 'mensajes',
      },
      async (cambios: any) => {
        console.log(cambios);
        const {data} = await this.sb.supabase.from("usuarios").select("nombre").eq("id", cambios.new["id_usuario"]);
        cambios.new.usuarios = { nombre: data![0].nombre};
        

        
        this.mensajes.update((valor_anterior) => {
          valor_anterior.push(cambios.new);
          return valor_anterior;
        })
      }
    );
    canal.subscribe();
  }

  enviarMensaje() {
    if (this.mensaje.trim() === '') {
      return; // No envía mensajes vacíos
    }
    if(this.auth.rolUsuario === 'mozo')
    {
      this.db.guardarMensaje(this.mensaje, this.auth.idUsuario, 'Mozo');
    }else{
      //Si es cliente
      const emisor = `Mesa ${this.mesaRecibida}`
      this.db.guardarMensaje(this.mensaje, this.auth.idUsuario, emisor);
      this.enviarNoti('Nueva Consulta', `Tienes una consulta de la mesa ${this.mesaRecibida}`, '/chat');
    }
    // Limpiar el input
    this.mensaje = '';
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

}
