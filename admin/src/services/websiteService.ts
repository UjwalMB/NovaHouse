import api from './api';
import { initialWebsiteContent } from '../data/websiteContent';
import { WebsiteContent } from '../types';

const STORAGE_KEY = 'nova_admin_website_content';

function getStoredWebsiteContent(): WebsiteContent {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as WebsiteContent;
    } catch (e) {}
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialWebsiteContent));
  return { ...initialWebsiteContent };
}

function saveStoredWebsiteContent(content: WebsiteContent): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
}

let websiteContentState: WebsiteContent = getStoredWebsiteContent();

export async function getWebsiteContent(): Promise<WebsiteContent> {
  try {
    const remote = await api.get<WebsiteContent>('/website-content');
    if (remote) return remote;
  } catch (err) {}
  return new Promise((resolve) => {
    setTimeout(() => resolve({ ...websiteContentState }), 100);
  });
}

export async function updateWebsiteContent(sectionKey: string, updatedSectionData: any): Promise<WebsiteContent> {
  try {
    const remote = await api.put<WebsiteContent>(`/website-content/${sectionKey}`, updatedSectionData);
    if (remote) return remote;
  } catch (err) {}

  websiteContentState = {
    ...websiteContentState,
    [sectionKey]: {
      ...(websiteContentState as any)[sectionKey],
      ...updatedSectionData,
    },
  };
  saveStoredWebsiteContent(websiteContentState);
  return websiteContentState;
}
