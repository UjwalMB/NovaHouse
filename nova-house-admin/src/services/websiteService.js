import api from './api';
import { initialWebsiteContent } from '../data/websiteContent';

const STORAGE_KEY = 'nova_admin_website_content';

function getStoredWebsiteContent() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialWebsiteContent));
  return { ...initialWebsiteContent };
}

function saveStoredWebsiteContent(content) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
}

let websiteContentState = getStoredWebsiteContent();

export async function getWebsiteContent() {
  try {
    const remote = await api.get('/website-content');
    if (remote) return remote;
  } catch (err) {}
  return new Promise((resolve) => {
    setTimeout(() => resolve({ ...websiteContentState }), 100);
  });
}

export async function updateWebsiteContent(sectionKey, updatedSectionData) {
  try {
    const remote = await api.put(`/website-content/${sectionKey}`, updatedSectionData);
    if (remote) return remote;
  } catch (err) {}

  websiteContentState = {
    ...websiteContentState,
    [sectionKey]: {
      ...websiteContentState[sectionKey],
      ...updatedSectionData,
    },
  };
  saveStoredWebsiteContent(websiteContentState);
  return websiteContentState;
}
