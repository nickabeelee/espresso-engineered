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
  <circle cx="12" cy="12" r="10"/>
  <path d="m8 12 8 0"/>
  <path d="m12 8 0 8"/>
</svg>