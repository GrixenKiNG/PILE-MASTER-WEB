import { useState, useCallback, useMemo } from 'react';

interface SafetyItem {
  id: string;
  title: string;
  content: string;
  read: boolean;
}

/**
 * Custom hook for managing safety briefing workflow
 * Ensures all safety items are read before proceeding
 */
export function useSafetyBriefing() {
  const [safetyItems, setSafetyItems] = useState<SafetyItem[]>([]);
  const [safetyConfirmed, setSafetyConfirmed] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);

  const SAFETY_ITEMS = useMemo<Omit<SafetyItem, 'read'>[]>(() => [
    { id: 'safety1', title: 'Требования к СИЗ', content: 'Обязательное использование каски, защитных очков, перчаток, спецодежды и средств защиты слуха при работе с шумным оборудованием.' },
    { id: 'safety2', title: 'Зона безопасности', content: 'Установите сигнальные ограждения и предупредительные знаки. Не допускайте посторонних в зону работы установки.' },
    { id: 'safety3', title: 'Проверка исправности', content: 'Перед началом работы убедитесь в исправности оборудования, отсутствии утечек масла и повреждений гидравлических шлангов.' },
    { id: 'safety4', title: 'Аварийная остановка', content: 'При возникновении аварийной ситуации немедленно нажмите кнопку аварийной остановки и сообщите мастеру.' },
    { id: 'safety5', title: 'Ограничения по погоде', content: 'Запрещается работа при скорости ветра более 15 м/с, грозе или видимости менее 30 метров.' }
  ], []);

  const initializeSafety = useCallback(() => {
    const items = SAFETY_ITEMS.map(item => ({ ...item, read: false }));
    setSafetyItems(items);
    setSafetyConfirmed(false);
    setSignature(null);
  }, [SAFETY_ITEMS]);

  const markItemAsRead = useCallback((itemId: string) => {
    setSafetyItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, read: true } : item
      )
    );
  }, []);

  const allItemsRead = useCallback((): boolean => {
    return safetyItems.length > 0 && safetyItems.every(item => item.read);
  }, [safetyItems]);

  const getUnreadItems = useCallback((): SafetyItem[] => {
    return safetyItems.filter(item => !item.read);
  }, [safetyItems]);

  const getReadPercentage = useCallback((): number => {
    if (safetyItems.length === 0) return 0;
    const readCount = safetyItems.filter(item => item.read).length;
    return Math.round((readCount / safetyItems.length) * 100);
  }, [safetyItems]);

  const confirmSafety = useCallback((signatureData: string) => {
    if (!allItemsRead()) {
      return false;
    }
    setSignature(signatureData);
    setSafetyConfirmed(true);
    return true;
  }, [allItemsRead]);

  const isSafetyComplete = useCallback((): boolean => {
    return allItemsRead() && safetyConfirmed && signature !== null;
  }, [allItemsRead, safetyConfirmed, signature]);

  return {
    safetyItems,
    safetyConfirmed,
    signature,
    initializeSafety,
    markItemAsRead,
    allItemsRead,
    getUnreadItems,
    getReadPercentage,
    confirmSafety,
    isSafetyComplete,
  };
}
