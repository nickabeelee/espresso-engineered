<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/shadcn/utils";
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";
	import { type VariantProps, tv } from "tailwind-variants";

	export const buttonVariants = tv({
		base: "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-accent/30 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		variants: {
			variant: {
				default: "bg-accent text-ink-inverted hover:bg-accent-dark shadow-xs",
				destructive:
					"bg-accent-dark text-ink-inverted hover:bg-accent shadow-xs",
				outline:
					"border border-[var(--border-subtle)] bg-bg-surface-paper text-ink-primary hover:bg-bg-surface-paper-secondary shadow-xs",
				secondary:
					"bg-bg-surface-paper-secondary text-ink-secondary hover:bg-bg-surface-paper shadow-xs",
				ghost: "text-ink-secondary hover:bg-bg-surface-paper-secondary",
				link: "text-accent underline-offset-4 hover:underline",
				"ee-base": "",
			},
			size: {
				default: "h-9 px-4 py-2 has-[>svg]:px-3",
				sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
				lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
				icon: "size-9",
				"icon-sm": "size-8",
				"icon-lg": "size-10",
				"ee-base": "",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	});

	export type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
	export type ButtonSize = VariantProps<typeof buttonVariants>["size"];

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: ButtonVariant;
			size?: ButtonSize;
		};
</script>

<script lang="ts">
	import { createEventDispatcher } from "svelte";

	let {
		class: className,
		variant = "default",
		size = "default",
		ref = $bindable(null),
		href = undefined,
		type = "button",
		disabled,
		children,
		...restProps
	}: ButtonProps = $props();

	const dispatch = createEventDispatcher<{ click: MouseEvent }>();

	function handleClick(event: MouseEvent) {
		if (disabled) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}

		dispatch("click", event);
	}
</script>

{#if href}
	<a
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		href={disabled ? undefined : href}
		aria-disabled={disabled}
		role={disabled ? "link" : undefined}
		tabindex={disabled ? -1 : undefined}
		on:click={handleClick}
		{...restProps}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		{type}
		{disabled}
		on:click={handleClick}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}
