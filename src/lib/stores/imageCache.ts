import { writable } from 'svelte/store';

interface ImageCache {
  [fileName: string]: string;
}

export const imageCache = writable<ImageCache>({}); 