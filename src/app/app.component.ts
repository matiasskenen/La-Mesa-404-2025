import { Component, inject, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet, Platform } from '@ionic/angular/standalone';
import { StatusBar } from '@capacitor/status-bar';
import { NotificationsService } from './services/notifications.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private notiService = inject(NotificationsService);
  private platform: Platform = inject(Platform);
  constructor() {}

  ngOnInit(): void {
    this.platform.ready().then(()=>{
      this.notiService.init();
    })

    this.configurarStatusBar();
  }

  async configurarStatusBar() {
    try {
      await StatusBar.setOverlaysWebView({ overlay: false });
    } catch (err) {
      console.warn('No se pudo configurar StatusBar', err);
    }
  }
}
