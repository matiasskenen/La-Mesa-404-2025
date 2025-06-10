import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { StatusBar } from '@capacitor/status-bar';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {
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
