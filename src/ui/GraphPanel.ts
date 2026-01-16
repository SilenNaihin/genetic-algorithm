import { Chart, ChartConfiguration, registerables } from 'chart.js';
import type { FitnessHistoryEntry } from '../types';

// Register all Chart.js components
Chart.register(...registerables);

export class GraphPanel {
  private container: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private chart: Chart | null = null;
  private isVisible: boolean = false;

  constructor() {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'graph-panel';
    this.container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 380px;
      height: 280px;
      background: rgba(15, 15, 20, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 16px;
      display: none;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(10px);
      z-index: 100;
    `;

    // Create title bar
    const titleBar = document.createElement('div');
    titleBar.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    `;

    const title = document.createElement('span');
    title.style.cssText = `
      color: #f8fafc;
      font-size: 14px;
      font-weight: 600;
    `;
    title.textContent = 'Fitness Over Generations';

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: #7a8494;
      font-size: 20px;
      cursor: pointer;
      padding: 0 4px;
      line-height: 1;
      transition: color 0.2s;
    `;
    closeBtn.addEventListener('mouseenter', () => { closeBtn.style.color = '#f8fafc'; });
    closeBtn.addEventListener('mouseleave', () => { closeBtn.style.color = '#7a8494'; });
    closeBtn.addEventListener('click', () => this.hide());

    titleBar.appendChild(title);
    titleBar.appendChild(closeBtn);

    // Create canvas wrapper
    const canvasWrapper = document.createElement('div');
    canvasWrapper.style.cssText = `
      width: 100%;
      height: calc(100% - 40px);
      position: relative;
    `;

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'fitness-chart';

    canvasWrapper.appendChild(this.canvas);
    this.container.appendChild(titleBar);
    this.container.appendChild(canvasWrapper);
    document.body.appendChild(this.container);

    // Initialize chart
    this.initChart();
  }

  private initChart(): void {
    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Best',
            data: [],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: false,
            tension: 0.3,
            pointRadius: 2,
            pointBackgroundColor: '#10b981',
            borderWidth: 2
          },
          {
            label: 'Average',
            data: [],
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            fill: false,
            tension: 0.3,
            pointRadius: 1.5,
            pointBackgroundColor: '#6366f1',
            borderWidth: 1
          },
          {
            label: 'Avg (10-gen)',
            data: [],
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 3,
            borderDash: []
          },
          {
            label: 'Worst',
            data: [],
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: false,
            tension: 0.3,
            pointRadius: 1.5,
            pointBackgroundColor: '#ef4444',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              color: '#b8c0cc',
              boxWidth: 12,
              boxHeight: 12,
              padding: 12,
              font: {
                size: 11,
                weight: 500
              },
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 15, 20, 0.95)',
            titleColor: '#f8fafc',
            bodyColor: '#b8c0cc',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            displayColors: true,
            boxPadding: 4
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Generation',
              color: '#7a8494',
              font: {
                size: 11,
                weight: 500
              }
            },
            ticks: {
              color: '#7a8494',
              font: {
                size: 10
              }
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            border: {
              display: false
            }
          },
          y: {
            title: {
              display: true,
              text: 'Fitness',
              color: '#7a8494',
              font: {
                size: 11,
                weight: 500
              }
            },
            ticks: {
              color: '#7a8494',
              font: {
                size: 10
              }
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            border: {
              display: false
            },
            beginAtZero: true
          }
        },
        animation: {
          duration: 300
        }
      }
    };

    this.chart = new Chart(this.canvas, config);
  }

  updateData(history: FitnessHistoryEntry[]): void {
    if (!this.chart) return;

    const labels = history.map(h => h.generation.toString());
    const bestData = history.map(h => h.best);
    const avgData = history.map(h => h.average);
    const worstData = history.map(h => h.worst);

    // Compute 10-generation rolling average
    const rollingAvgData = this.computeRollingAverage(avgData, 10);

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = bestData;
    this.chart.data.datasets[1].data = avgData;
    this.chart.data.datasets[2].data = rollingAvgData;
    this.chart.data.datasets[3].data = worstData;

    this.chart.update('none');  // No animation for frequent updates
  }

  private computeRollingAverage(data: number[], windowSize: number): (number | null)[] {
    const result: (number | null)[] = [];

    for (let i = 0; i < data.length; i++) {
      if (i < windowSize - 1) {
        // Not enough data points yet - use partial window
        const slice = data.slice(0, i + 1);
        const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
        result.push(Math.round(avg * 10) / 10);
      } else {
        // Full window available
        const slice = data.slice(i - windowSize + 1, i + 1);
        const avg = slice.reduce((a, b) => a + b, 0) / windowSize;
        result.push(Math.round(avg * 10) / 10);
      }
    }

    return result;
  }

  show(): void {
    this.isVisible = true;
    this.container.style.display = 'block';
  }

  hide(): void {
    this.isVisible = false;
    this.container.style.display = 'none';
  }

  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  isShowing(): boolean {
    return this.isVisible;
  }

  dispose(): void {
    if (this.chart) {
      this.chart.destroy();
    }
    this.container.remove();
  }
}
