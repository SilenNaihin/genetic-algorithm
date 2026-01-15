import { Chart, ChartConfiguration, registerables } from 'chart.js';

// Register all Chart.js components
Chart.register(...registerables);

export interface CreatureTypeEntry {
  generation: number;
  nodeCountDistribution: Map<number, number>; // nodeCount -> count of creatures
}

export class CreatureTypesPanel {
  private container: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private chart: Chart | null = null;
  private isVisible: boolean = false;

  // Colors for different node counts (2-8+)
  private readonly colors = [
    { bg: 'rgba(239, 68, 68, 0.7)', border: '#ef4444' },   // 2 nodes - red
    { bg: 'rgba(249, 115, 22, 0.7)', border: '#f97316' },  // 3 nodes - orange
    { bg: 'rgba(234, 179, 8, 0.7)', border: '#eab308' },   // 4 nodes - yellow
    { bg: 'rgba(34, 197, 94, 0.7)', border: '#22c55e' },   // 5 nodes - green
    { bg: 'rgba(6, 182, 212, 0.7)', border: '#06b6d4' },   // 6 nodes - cyan
    { bg: 'rgba(99, 102, 241, 0.7)', border: '#6366f1' },  // 7 nodes - indigo
    { bg: 'rgba(168, 85, 247, 0.7)', border: '#a855f7' },  // 8+ nodes - purple
  ];

  constructor() {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'creature-types-panel';
    this.container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 420px;
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
    title.textContent = 'Creature Types (by Node Count)';

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
    this.canvas.id = 'creature-types-chart';

    canvasWrapper.appendChild(this.canvas);
    this.container.appendChild(titleBar);
    this.container.appendChild(canvasWrapper);
    document.body.appendChild(this.container);

    // Initialize chart
    this.initChart();
  }

  private initChart(): void {
    const datasets = [];
    const nodeLabels = ['2 nodes', '3 nodes', '4 nodes', '5 nodes', '6 nodes', '7 nodes', '8+ nodes'];

    for (let i = 0; i < 7; i++) {
      datasets.push({
        label: nodeLabels[i],
        data: [] as number[],
        backgroundColor: this.colors[i].bg,
        borderColor: this.colors[i].border,
        borderWidth: 1,
        fill: true,
        tension: 0.3,
        pointRadius: 0
      });
    }

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: [],
        datasets
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
              boxWidth: 10,
              boxHeight: 10,
              padding: 8,
              font: {
                size: 10,
                weight: 500
              },
              usePointStyle: true,
              pointStyle: 'rect'
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
            boxPadding: 4,
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                return `${context.dataset.label}: ${value.toFixed(1)}%`;
              }
            }
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
            stacked: true,
            title: {
              display: true,
              text: 'Population %',
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
              },
              callback: (value) => `${value}%`
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            border: {
              display: false
            },
            min: 0,
            max: 100
          }
        },
        animation: {
          duration: 300
        }
      }
    };

    this.chart = new Chart(this.canvas, config);
  }

  updateData(history: CreatureTypeEntry[]): void {
    if (!this.chart) return;

    const labels = history.map(h => h.generation.toString());

    // Calculate percentages for each node count category
    const percentages: number[][] = [[], [], [], [], [], [], []]; // 2-8+ nodes

    for (const entry of history) {
      const total = Array.from(entry.nodeCountDistribution.values()).reduce((a, b) => a + b, 0);

      for (let nodeCount = 2; nodeCount <= 8; nodeCount++) {
        const count = entry.nodeCountDistribution.get(nodeCount) || 0;
        const index = nodeCount - 2; // 2 nodes = index 0, etc.

        if (nodeCount === 8) {
          // 8+ nodes: sum all 8 and above
          let eightPlusCount = 0;
          for (const [nc, c] of entry.nodeCountDistribution) {
            if (nc >= 8) eightPlusCount += c;
          }
          percentages[6].push(total > 0 ? (eightPlusCount / total) * 100 : 0);
        } else {
          percentages[index].push(total > 0 ? (count / total) * 100 : 0);
        }
      }
    }

    this.chart.data.labels = labels;
    for (let i = 0; i < 7; i++) {
      this.chart.data.datasets[i].data = percentages[i];
    }

    this.chart.update('none');
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
