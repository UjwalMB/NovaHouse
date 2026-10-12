import { useState, useEffect, useCallback } from 'react';
import { getWebsiteContent, updateWebsiteContent } from '../services/websiteService';

export function useWebsiteContent() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWebsiteContent();
      setContent(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load website content');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleUpdate = async (sectionKey, updatedSectionData) => {
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
