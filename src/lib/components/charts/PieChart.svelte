<script>
import LineChart from '$lib/components/charts/LineChart.svelte';

let { data } = $props();
</script>

<LineChart {data} height={350} />