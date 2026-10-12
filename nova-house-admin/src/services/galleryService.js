import api from './api';
import { initialGallery } from '../data/gallery';

const STORAGE_KEY = 'nova_admin_gallery';

function getStoredGallery() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialGallery));
  return [...initialGallery];
}

function saveStoredGallery(gallery) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(gallery));
}

let galleryState = getStoredGallery();

export async function getGallery() {
  try {
    const remote = await api.get('/gallery');
    if (remote) return remote;
  } catch (err) {}
  return new Promise((resolve) => {
    setTimeout(() => resolve([...galleryState]), 100);
  });
}

export async function uploadGalleryImage(newImage) {
  try {
    const remote = await api.post('/gallery', newImage);
    if (remote) return remote;
  } catch (err) {}

  const created = {
    ...newImage,
    id: `gal-${Date.now()}`,
    order: galleryState.length + 1,
    featured: newImage.featured || false
  };

  galleryState = [created, ...galleryState];
  saveStoredGallery(galleryState);
  return created;
}

export async function updateGalleryItem(id, updatedFields) {
  try {
    const remote = await api.put(`/gallery/${id}`, updatedFields);
    if (remote) return remote;
  } catch (err) {}

  galleryState = galleryState.map((item) => (item.id === id ? { ...item, ...updatedFields } : item));
  saveStoredGallery(galleryState);
  return galleryState.find((item) => item.id === id);
}

export async function deleteGalleryItem(id) {
  try {
    await api.delete(`/gallery/${id}`);
  } catch (err) {}

  galleryState = galleryState.filter((item) => item.id !== id);
  saveStoredGallery(galleryState);
  return true;
}
