<script>
import { onMount } from 'svelte';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';


let { data, height = 400 } = $props();

let chartCanvas = $state();
let chartInstance = $state(null);

let chartData = $derived(() => {
    if (!data?.prices) return null;
    
    return {
        labels: data.prices.map(p => new Date(p.date)),
        datasets: [{
            label: `${data.symbol} Price`,
            data: data.prices.map(p => ({ x: new Date(p.date), y: p.price })),
            borderColor: 'rgb(13, 110, 253)',
            backgroundColor: 'rgba(13, 110, 253, 0.1)',
            tension: 0.1,
            fill: true
        }]
    };
});

// Create/update chart when data changes
$effect(() => {
    if (!chartCanvas || !chartData) return;
    
    // Destroy existing chart
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    // Create new chart
    chartInstance = new Chart(chartCanvas, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        displayFormats: {
                            day: 'MMM dd',
                            week: 'MMM dd',
                            month: 'MMM yyyy'
                        }
                    }
                },
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return new Intl.NumberFormat('de-CH', {
                                style: 'currency',
                                currency: 'CHF',
                                minimumFractionDigits: 2
                            }).format(value);
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return new Intl.NumberFormat('de-CH', {
                                style: 'currency',
                                currency: 'CHF'
                            }).format(context.parsed.y);
                        }
                    }
                }
            }
        }
    });
});

// Cleanup on destroy
onMount(() => {
    return () => {
        if (chartInstance) {
            chartInstance.destroy();
        }
    };
});
</script>

<div class="chart-container" style="height: {height}px;">
    {#if chartData}
        <canvas bind:this={chartCanvas}></canvas>
    {:else}
        <div class="d-flex justify-content-center align-items-center h-100">
            <div class="text-muted">No chart data available</div>
        </div>
    {/if}
</div>

<style>
    .chart-container {
        position: relative;
        width: 100%;
    }
</style>