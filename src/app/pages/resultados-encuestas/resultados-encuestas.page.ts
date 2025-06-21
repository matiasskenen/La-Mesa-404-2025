import 'chart.js/auto';
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {arrowBackCircleOutline} from 'ionicons/icons';
import { DatabaseService } from 'src/app/services/database.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { QueryList, ViewChildren } from '@angular/core';

@Component({
  selector: 'app-resultados-encuestas',
  templateUrl: './resultados-encuestas.page.html',
  styleUrls: ['./resultados-encuestas.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, BaseChartDirective]
})
export class ResultadosEncuestasPage implements OnInit {
  @ViewChildren(BaseChartDirective) charts!: QueryList<BaseChartDirective>;
  
  db = inject(DatabaseService);

  chartType: ChartType = 'pie'; // o 'bar' si es tipo feo
  chartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: []
  };

  constructor(){
    addIcons({arrowBackCircleOutline});
  }

  chartOptions: ChartConfiguration['options'] = {}; // se asigna dinámicamente

  async ngOnInit() {
    await this.mostrarGrafico();
  }

 async mostrarGrafico() {
    const encuestas = await this.db.traerTodasLasEncuestas();

    // === 1) Doughnut para atencion ===
    const atencionMap = new Map<number, number>();
    for (let i = 1; i <= 10; i++) atencionMap.set(i, 0);
    encuestas.forEach(e =>
      atencionMap.set(e.atencion, (atencionMap.get(e.atencion) ?? 0) + 1)
    );
    const atLabels = Array.from(atencionMap.keys()).map(n => n.toString());
    const atData   = Array.from(atencionMap.values());
    const doughnutConfig = {
      type: 'doughnut' as ChartType,
      data: {
        labels: atLabels,
        datasets: [{
          data: atData,
          backgroundColor: ['#2ecc71','#3498db','#e74c3c','#f1c40f','#9b59b6']
        }]
      } as ChartConfiguration['data'],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {  color: '#ffffff',          // color blanco de las letras de la rosca
        font: { size: 16 } }
          },
          tooltip: {
            bodyFont: { size: 14 },
            titleFont: { size: 16 }
          }
        }
      } as ChartConfiguration['options']
    };

    // === 2) Pie para calidad_comida ===
    const calidadMap: Record<string, number> = { mala: 0, buena: 0, excelente: 0 };
    encuestas.forEach(e => calidadMap[e.calidad_comida]++);
    const caLabels = Object.keys(calidadMap);
    const caData   = Object.values(calidadMap);
    const pieConfig = {
      type: 'pie' as ChartType,
      data: {
        labels: caLabels,
        datasets: [{
          data: caData,
          backgroundColor: ['#e74c3c','#f1c40f','#2ecc71']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {  color: '#ffffff',          // color blanco de las letras de la rosca
        font: { size: 16 } }
          },
          tooltip: {
            bodyFont: { size: 14 },
            titleFont: { size: 16 }
          }
        }
      }
    };

    // === 3) Bar para medio_de_pago ===
    const medioMap: Record<string, number> = { efectivo: 0, tarjeta: 0, cripto: 0 };
    encuestas.forEach(e => medioMap[e.medio_de_pago]++);
    const meLabels = Object.keys(medioMap);
    const meData   = Object.values(medioMap);
    const barConfig = {
      type: 'bar' as ChartType,
      data: {
        labels: meLabels,
        datasets: [{
          label: 'Votos',
          data: meData,
          backgroundColor: '#d22f19'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {  color: '#ffffff',          // color blanco de las letras de la rosca
        font: { size: 16 } }
          },
          tooltip: {
            bodyFont: { size: 14 },
            titleFont: { size: 16 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              color: '#FFFFFF', 
              font: { size: 20 } //tamaño escala vertical
            }
          },
          x: {
            ticks: {
              color: '#FFFFFF', 
              font: { size: 20 } //tamaño escala horizontal
            }
          }
        }
      }
    };

    // === 4) Bubble para higiene_local ===
    const higMap: Record<string, number> = { sucio: 0, normal: 0, limpio: 0 };
    encuestas.forEach(e => higMap[e.higiene_local]++);
    const bubbleConfig = {
      type: 'bubble' as ChartType,
      data: {
        datasets: [
          { label: 'Sucio',  data: [{ x: 1, y: 1, r: higMap['sucio'] * 1 }],  backgroundColor: '#e74c3c' },
          { label: 'Normal', data: [{ x: 2, y: 1, r: higMap['normal'] * 1 }], backgroundColor: '#f1c40f' },
          { label: 'Limpio', data: [{ x: 3, y: 1, r: higMap['limpio'] * 1 }], backgroundColor: '#2ecc71' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {  color: '#ffffff',          // color blanco de las letras de la rosca
            font: { size: 16 } }
          },
          tooltip: {
            bodyFont: { size: 14 },
            titleFont: { size: 16 }
          }
        },
        scales: {
          x: { ticks: { color: '#FFFFFF',font: { size: 16 } } },
          y: { ticks: { color: '#FFFFFF',font: { size: 16 } } }
        }
      }
    };

    const configs = [doughnutConfig, pieConfig, barConfig, bubbleConfig];

    // Espera a que Angular instancie los BaseChartDirective
    setTimeout(() => {
      this.charts.forEach((chartDir, i) => {
        const cfg = configs[i];
        if (chartDir.chart?.config) {
          Object.assign(chartDir.chart.config, {
            type:    cfg.type,
            data:    cfg.data,
            options: cfg.options
          });
          chartDir.update();
        }
      });
    });
  }


  volverAtras() {
    window.history.back();
  }
}