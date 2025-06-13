import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService } from 'src/app/services/database.service';
import { SupabaseService } from 'src/app/services/supabase.service';
import { AuthService } from 'src/app/services/auth.service';
import { IonicModule } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { person, schoolSharp, send,homeOutline} from 'ionicons/icons';

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
  nombreUser:string = '';

  constructor() { 
    this.nombreUser = this.auth.nombreUsuario;
    addIcons({send, person, schoolSharp, homeOutline});
  }

  ngOnInit() {
    this.db.traerTodosMensajes().then((data) => {
      this.mensajes.set([...data]);
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
        cambios.new.usuarios = { nombre: data![0].nombre}
        
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
    this.db.guardarMensaje(this.mensaje, this.auth.idUsuario);
    // Limpiar el input
    this.mensaje = '';
  }

}
