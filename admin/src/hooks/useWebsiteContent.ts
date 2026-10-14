import { useState, useEffect, useCallback } from 'react';
import { getWebsiteContent, updateWebsiteContent } from '../services/websiteService';
import { WebsiteContent } from '../types';

export function useWebsiteContent() {
  const [content, setContent] = useState<WebsiteContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWebsiteContent();
      setContent(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load website content');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleUpdate = async (sectionKey: string, updatedSectionData: any): Promise<WebsiteContent> => {
    const updated = await updateWebsiteContent(sectionKey, updatedSectionData);
    setContent(updated);
    return updated;
  };

  return {
    content,
    loading,
    error,
    refresh: fetchContent,
    updateSection: handleUpdate,
  };
}
