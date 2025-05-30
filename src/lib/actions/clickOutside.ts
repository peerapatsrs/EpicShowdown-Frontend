/// <reference types="svelte" />

export function clickOutside(node: HTMLElement) {
	const handleClick = (event: MouseEvent) => {
		if (!node.contains(event.target as Node)) {
			node.dispatchEvent(new CustomEvent('clickoutside'));
		}
	};

	document.addEventListener('click', handleClick, true);

	return {
		destroy() {
			document.removeEventListener('click', handleClick, true);
		}
	};
}

declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'on:clickoutside'?: (e: CustomEvent) => void;
	}
} 