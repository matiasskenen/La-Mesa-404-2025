import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Howl } from 'howler';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule]
})
export class SplashPage implements OnInit {
  sonidoIntro = new Howl({ src: ['../assets/audios/sonido_intro.mp3'], volume: 1.0, });


  constructor(public router:Router) { 
    setTimeout(() => {
      this.router.navigateByUrl('/login');
      
    }, 5500);
  }

  ngOnInit() {
     setTimeout(() => {
      this.sonidoIntro.play();
      
    }, 1000);
  }

}
