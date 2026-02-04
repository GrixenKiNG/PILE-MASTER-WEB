import { useState, useCallback, useMemo } from 'react';

interface LubricationItem {
  id: string;
  name: string;
  required: boolean;
  greaseRequired: number;
  greaseType: string;
  modelIds: string[];
  status?: 'pending' | 'completed';
  photo?: string | null;
  greaseUsed?: number;
}

/**
 * Custom hook for managing lubrication workflow
 * Handles model-specific lubrication points and grease tracking
 */
export function useLubrication() {
  const [lubricationItems, setLubricationItems] = useState<LubricationItem[]>([]);

  const LUBRICATION_POINTS = useMemo<LubricationItem[]>(() => [
    { id: 'rotary', name: 'Поворотный узел', required: true, greaseRequired: 0.5, greaseType: 'Смазка SuperLube', modelIds: ['PVE-50PR', 'KOP-SD20', 'LIEBH-LRH100'] },
    { id: 'mast', name: 'Мачта', required: true, greaseRequired: 0.3, greaseType: 'Смазка SuperLube', modelIds: ['LIEBH-LRH100', 'KBURG-16', 'KBURG-16-02'] },
    { id: 'winch', name: 'Лебедка', required: true, greaseRequired: 0.4, greaseType: 'Смазка SuperLube', modelIds: ['PVE-50PR', 'KOP-SD20', 'LIEBH-LRH100', 'KBURG-16', 'KBURG-16-02'] },
    { id: 'hammer', name: 'Ударный узел', required: true, greaseRequired: 0.6, greaseType: 'Смазка для КБУРГ', modelIds: ['KBURG-16', 'KBURG-16-02'] },
    { id: 'dd45_joint', name: 'Узел DD45', required: true, greaseRequired: 0.7, greaseType: 'Смазка SuperLube', modelIds: ['LIEBH-LRH100-DD45'] }
  ], []);

  const initializeLubrication = useCallback((modelId: string) => {
    const items = LUBRICATION_POINTS
      .filter(point => point.modelIds.includes(modelId))
      .map(item => ({
        ...item,
        status: 'pending' as const,
        photo: null,
        greaseUsed: 0
      }));
    setLubricationItems(items);
  }, [LUBRICATION_POINTS]);

  const setLubricationPhoto = useCallback((itemId: string, photoUri: string) => {
    setLubricationItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, photo: photoUri, status: 'completed', greaseUsed: item.greaseRequired }
          : item
      )
    );
  }, []);

  const setGreaseUsed = useCallback((itemId: string, amount: number) => {
    setLubricationItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, greaseUsed: amount } : item
      )
    );
  }, []);

  const isItemComplete = useCallback((itemId: string): boolean => {
    const item = lubricationItems.find(i => i.id === itemId);
    if (!item) return false;

    const hasPhoto = !!item.photo;
    const hasEnoughGrease = (item.greaseUsed || 0) >= item.greaseRequired;
    return hasPhoto && hasEnoughGrease;
  }, [lubricationItems]);

  const isLubricationComplete = useCallback((): boolean => {
    return lubricationItems
      .filter(item => item.required)
      .every(item => isItemComplete(item.id));
  }, [lubricationItems, isItemComplete]);

  const getCompletionPercentage = useCallback((): number => {
    const requiredItems = lubricationItems.filter(item => item.required);
    if (requiredItems.length === 0) return 0;

    const completedItems = requiredItems.filter(item => isItemComplete(item.id));
    return Math.round((completedItems.length / requiredItems.length) * 100);
  }, [lubricationItems, isItemComplete]);

  const getTotalGreaseRequired = useCallback((): number => {
    return lubricationItems
      .filter(item => item.required)
      .reduce((sum, item) => sum + item.greaseRequired, 0);
  }, [lubricationItems]);

  const getTotalGreaseUsed = useCallback((): number => {
    return lubricationItems
      .filter(item => item.required)
      .reduce((sum, item) => sum + (item.greaseUsed || 0), 0);
  }, [lubricationItems]);

  return {
    lubricationItems,
    initializeLubrication,
    setLubricationPhoto,
    setGreaseUsed,
    isItemComplete,
    isLubricationComplete,
    getCompletionPercentage,
    getTotalGreaseRequired,
    getTotalGreaseUsed,
  };
}
