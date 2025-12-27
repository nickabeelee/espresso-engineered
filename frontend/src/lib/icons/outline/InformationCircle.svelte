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
  <path d="m12 16 0-4"/>
  <path d="m12 8 .01 0"/>
</svg>