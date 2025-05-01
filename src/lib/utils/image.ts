import axiosInstance from "$lib/api/axios";
import { get } from 'svelte/store';
import { imageCache } from '$lib/stores/imageCache';

export async function getImage(fileName: string | undefined | boolean): Promise<string> {
  if (!fileName || typeof fileName !== 'string') return '';

  try {
    // ตรวจสอบแคชก่อน
    const cache = get(imageCache);
    if (cache[fileName]) {
      return cache[fileName];
    }

    const response = await axiosInstance.get(`/File/${fileName}`, {
      responseType: 'arraybuffer'
    });
    const contentType = response.headers['content-type'] || 'image/jpeg';
    const base64 = btoa(
      new Uint8Array(response.data)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    const imageData = `data:${contentType};base64,${base64}`;
    
    // เก็บในแคช
    imageCache.update(cache => ({
      ...cache,
      [fileName]: imageData
    }));
    return imageData;
  } catch (error) {
    console.error('Error loading image:', error);
    return '';
  }
}

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axiosInstance.post('/File/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data.fileName;
}
