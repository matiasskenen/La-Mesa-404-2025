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
  templateUrl: './bartender.page.html',
  styleUrls: ['./bartender.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule],
})
export class BartenderPage implements OnInit {
  auth = inject(AuthService);
  supabase = this.auth.sb.supabase;
  constructor() {
    addIcons({ homeOutline });
  }

  ngOnInit() {}

  volverAtras() {
    this.auth.cerrarSesion();
  }
}
