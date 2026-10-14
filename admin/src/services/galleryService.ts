import api from './api';
import { initialGallery } from '../data/gallery';
import { GalleryItem } from '../types';

const STORAGE_KEY = 'nova_admin_gallery';

function getStoredGallery(): GalleryItem[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as GalleryItem[];
    } catch (e) {}
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialGallery));
  return [...initialGallery];
}

function saveStoredGallery(gallery: GalleryItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(gallery));
}

let galleryState: GalleryItem[] = getStoredGallery();

export async function getGallery(): Promise<GalleryItem[]> {
  try {
    const remote = await api.get<GalleryItem[]>('/gallery');
    if (remote) return remote;
  } catch (err) {}
  return new Promise((resolve) => {
    setTimeout(() => resolve([...galleryState]), 100);
  });
}

export async function uploadGalleryImage(newImage: Partial<GalleryItem>): Promise<GalleryItem> {
  try {
    const remote = await api.post<GalleryItem>('/gallery', newImage);
    if (remote) return remote;
  } catch (err) {}

  const created: GalleryItem = {
    id: `gal-${Date.now()}`,
    title: newImage.title || 'Gallery Photograph',
    category: newImage.category || 'Exterior',
    image: newImage.image || '',
    order: galleryState.length + 1,
    featured: newImage.featured || false,
    ...newImage,
  };

  galleryState = [created, ...galleryState];
  saveStoredGallery(galleryState);
  return created;
}

export async function updateGalleryItem(id: string, updatedFields: Partial<GalleryItem>): Promise<GalleryItem | undefined> {
  try {
    const remote = await api.put<GalleryItem>(`/gallery/${id}`, updatedFields);
    if (remote) return remote;
  } catch (err) {}

  galleryState = galleryState.map((item) => (item.id === id ? { ...item, ...updatedFields } : item));
  saveStoredGallery(galleryState);
  return galleryState.find((item) => item.id === id);
}

export async function deleteGalleryItem(id: string): Promise<boolean> {
  try {
    await api.delete(`/gallery/${id}`);
  } catch (err) {}

  galleryState = galleryState.filter((item) => item.id !== id);
  saveStoredGallery(galleryState);
  return true;
}
