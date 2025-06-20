import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChildren,
  QueryList,
  ElementRef,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import {
  IonContent,
  IonButton,
  IonItem,
  IonList,
  IonText,
  IonIcon,
  IonTextarea,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonCard,
  IonCardContent,
} from '@ionic/angular/standalone';

import {
  arrowBackCircleOutline,
  homeOutline,
  checkmarkSharp,
} from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-juegos',
  templateUrl: './juegos.page.html',
  styleUrls: ['./juegos.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonContent,
    IonButton,
    IonText,
    IonIcon,
    IonHeader,
    IonToolbar,
    IonButtons,
  ],
})
export class JuegosPage implements OnInit, AfterViewInit {
  @ViewChildren('scratchCanvas') canvasList!: QueryList<
    ElementRef<HTMLCanvasElement>
  >;

  cajas = [0, 1, 2];
  cajaGanadora: number = 0;
  cajaSeleccionada: number | null = null;
  ctxs: CanvasRenderingContext2D[] = [];
  premiosMostrados: boolean[] = [];
  resultadoMensaje = '';
  isDrawing: boolean[] = [];
  vidas = 5;

  constructor() {
    addIcons({ arrowBackCircleOutline, homeOutline, checkmarkSharp });
  }

  ngOnInit() {
    this.cajaGanadora = Math.floor(Math.random() * this.cajas.length);
    this.premiosMostrados = this.cajas.map(() => false);
    this.isDrawing = this.cajas.map(() => false);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.canvasList.forEach((canvasRef, index) => {
        const canvas = canvasRef.nativeElement;
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
        this.ctxs[index] = ctx;

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        ctx.fillStyle = '#aaa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        canvas.addEventListener('pointerdown', (e) => this.startDraw(e, index));
        canvas.addEventListener('pointermove', (e) => this.draw(e, index));
        canvas.addEventListener('pointerup', () => this.stopDraw(index));
      });
    }, 0);
  }

  startDraw(e: PointerEvent, index: number) {
    if (this.cajaSeleccionada === null) {
      this.cajaSeleccionada = index;
    }

    if (this.cajaSeleccionada !== index || this.resultadoMensaje) return;

    this.isDrawing[index] = true;
    this.draw(e, index);
  }

  draw(e: PointerEvent, index: number) {
    if (!this.isDrawing[index] || this.premiosMostrados[index]) return;

    const canvas = this.canvasList.get(index)!.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = this.ctxs[index];
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, 2 * Math.PI);
    ctx.fill();

    this.verificarRaspado(index);
  }

  stopDraw(index: number) {
    this.isDrawing[index] = false;
  }

  verificarRaspado(index: number) {
    const canvas = this.canvasList.get(index)!.nativeElement;
    const imgData = this.ctxs[index].getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );
    let borrados = 0;

    for (let i = 0; i < imgData.data.length; i += 4) {
      if (imgData.data[i + 3] === 0) borrados++;
    }

    const porcentaje = (borrados / (imgData.data.length / 4)) * 100;

    if (porcentaje > 50 && !this.premiosMostrados[index]) {
      this.premiosMostrados[index] = true;

      if (index === this.cajaGanadora) {
        this.resultadoMensaje = '¡Ganaste un 10% de descuento!';
      } else {
        this.resultadoMensaje =
          'Perdiste. Probá nuevamente.';
        this.vidas--;
      }
    }
  }

  reintentarJuego() {
    this.resultadoMensaje = '';
    this.cajaSeleccionada = null;
    this.vidas--;

    this.premiosMostrados = this.cajas.map(() => false);
    this.isDrawing = this.cajas.map(() => false);
    this.cajaGanadora = Math.floor(Math.random() * this.cajas.length);

    // Restaurar visualmente los canvas
    this.canvasList.forEach((canvasRef, index) => {
      const canvas = canvasRef.nativeElement;
      const ctx = canvas.getContext('2d')!;
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Volver a cubrir con gris
      ctx.fillStyle = '#aaa';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
  }

  volverAtras() {
    window.history.back();
  }
}
