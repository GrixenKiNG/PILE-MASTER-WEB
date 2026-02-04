import { useState, useCallback, useMemo } from 'react';

interface InspectionItem {
  id: string;
  name: string;
  required: boolean;
  checklist: Array<{ name: string; checked: boolean }>;
  status: 'pending' | 'completed';
  photoBefore: string | null;
  photoAfter: string | null;
}

/**
 * Custom hook for managing inspection workflow
 * Handles checklist validation, photo capture, and completion tracking
 */
export function useInspection() {
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);

  const INSPECTION_ITEMS = useMemo<Omit<InspectionItem, 'status' | 'checklist' | 'photoBefore' | 'photoAfter'>[]>(() => [
    { id: 'tracks', name: 'Гусеницы', required: true, checklist: ['Натяжение', 'Целостность башмаков', 'Отсутствие загрязнений'] },
    { id: 'hydraulics', name: 'Гидравлические шланги', required: true, checklist: ['Отсутствие утечек', 'Целостность оплетки', 'Надежность соединений'] },
    { id: 'cab', name: 'Кабина оператора', required: true, checklist: ['Чистота стекол', 'Работоспособность приборов', 'Наличие огнетушителя'] },
    { id: 'boom', name: 'Стрела', required: true, checklist: ['Отсутствие трещин', 'Надежность креплений', 'Смазка шарниров'] },
    { id: 'engine', name: 'Двигатель', required: true, checklist: ['Уровень масла', 'Отсутствие утечек', 'Чистота воздушного фильтра'] }
  ], []);

  const initializeInspection = useCallback(() => {
    const items = INSPECTION_ITEMS.map((item: any) => ({
      ...item,
      status: 'pending' as const,
      checklist: item.checklist.map((c: string) => ({ name: c, checked: false })),
      photoBefore: null,
      photoAfter: null
    }));
    setInspectionItems(items);
  }, [INSPECTION_ITEMS]);

  const toggleChecklistItem = useCallback((itemId: string, checklistIndex: number) => {
    setInspectionItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? {
              ...item,
              checklist: item.checklist.map((c, i) =>
                i === checklistIndex ? { ...c, checked: !c.checked } : c
              )
            }
          : item
      )
    );
  }, []);

  const setPhotoBefore = useCallback((itemId: string, photoUri: string) => {
    setInspectionItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, photoBefore: photoUri } : item
      )
    );
  }, []);

  const setPhotoAfter = useCallback((itemId: string, photoUri: string) => {
    setInspectionItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, photoAfter: photoUri, status: 'completed' } : item
      )
    );
  }, []);

  const isItemComplete = useCallback((itemId: string): boolean => {
    const item = inspectionItems.find(i => i.id === itemId);
    if (!item) return false;

    const allChecklistChecked = item.checklist.every(c => c.checked);
    const hasPhotos = !!(item.photoBefore && item.photoAfter);
    return allChecklistChecked && hasPhotos;
  }, [inspectionItems]);

  const isInspectionComplete = useCallback((): boolean => {
    return inspectionItems
      .filter(item => item.required)
      .every(item => isItemComplete(item.id));
  }, [inspectionItems, isItemComplete]);

  const getCompletionPercentage = useCallback((): number => {
    const requiredItems = inspectionItems.filter(item => item.required);
    if (requiredItems.length === 0) return 0;

    const completedItems = requiredItems.filter(item => isItemComplete(item.id));
    return Math.round((completedItems.length / requiredItems.length) * 100);
  }, [inspectionItems, isItemComplete]);

  return {
    inspectionItems,
    initializeInspection,
    toggleChecklistItem,
    setPhotoBefore,
    setPhotoAfter,
    isItemComplete,
    isInspectionComplete,
    getCompletionPercentage,
  };
}
