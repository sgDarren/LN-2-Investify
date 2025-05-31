<!-- src/lib/components/PieChart.svelte -->

<script>
  import { onMount, onDestroy } from 'svelte';
  import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';

  // Props über $props() entnehmen
  const { 
    labels = [],    // z. B. ['Tech', 'Health', 'Finance']
    values = [],    // z. B. [40, 25, 35]
    colors = [],    // z. B. ['#FF6384','#36A2EB','#FFCE56']
    options = {}    // optionale Chart.js-Optionen
  } = $props();


  Chart.register(ArcElement, Tooltip, Legend);

  let canvasEl;
  let chartInstance;

  onMount(() => {
    const ctx = canvasEl.getContext('2d');
    chartInstance = new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors,
            hoverOffset: 8
          }
        ]
      },
      options: {
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, padding: 10 }
          }
        },
        maintainAspectRatio: false,
        ...options
      }
    });
  });

  onDestroy(() => {
    if (chartInstance) chartInstance.destroy();
  });
</script>

<div style="position: relative; width: 100%; height: 300px;">
  <canvas bind:this={canvasEl}></canvas>
</div>
