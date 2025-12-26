<script lang="ts">
  export let size: number = 24;
  export let strokeWidth: number = 1.5;
</script>

<svg 
  width={size} 
  height={size} 
  viewBox="0 0 24 24" 
  fill="none" 
  stroke="currentColor" 
  stroke-width={strokeWidth} 
  stroke-linecap="round" 
  stroke-linejoin="round"
>
  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
  <polyline points="22,4 12,14.01 9,11.01"/>
</svg>