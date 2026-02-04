import { useState, useCallback, useMemo } from 'react';

interface WarehouseItem {
  id: string;
  name: string;
  modelId: string;
  quantity: number;
  critical: number;
  unit: string;
}

/**
 * Custom hook for managing warehouse inventory
 * Handles stock checking and critical level alerts
 */
export function useWarehouse() {
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [blockedByWarehouse, setBlockedByWarehouse] = useState(false);

  const WAREHOUSE_ITEMS = useMemo<WarehouseItem[]>(() => [
    { id: 'grease_pve', name: 'Смазка SuperLube', modelId: 'PVE-50PR', quantity: 5, critical: 2, unit: 'л' },
    { id: 'hydraulic_oil_pve', name: 'Гидравлическое масло', modelId: 'PVE-50PR', quantity: 3, critical: 1, unit: 'л' },
    { id: 'filter_pve', name: 'Фильтр гидравлики', modelId: 'PVE-50PR', quantity: 2, critical: 1, unit: 'шт' },
    { id: 'dd45_hammer', name: 'Молот DD45 запчасти', modelId: 'LIEBH-LRH100-DD45', quantity: 4, critical: 2, unit: 'шт' },
    { id: 'drill_bit_liebh', name: 'Буровая коронка', modelId: 'LIEBH-LRH100', quantity: 8, critical: 3, unit: 'шт' },
    { id: 'track_pads_kb16', name: 'Гусеничные башмаки', modelId: 'KBURG-16', quantity: 12, critical: 4, unit: 'шт' },
    { id: 'grease_liebh', name: 'Смазка SuperLube', modelId: 'LIEBH-LRH100', quantity: 10, critical: 3, unit: 'л' },
    { id: 'grease_kb', name: 'Смазка для КБУРГ', modelId: 'KBURG-16', quantity: 8, critical: 2, unit: 'л' },
    { id: 'grease_kb02', name: 'Смазка для КБУРГ', modelId: 'KBURG-16-02', quantity: 8, critical: 2, unit: 'л' }
  ], []);

  const initializeWarehouse = useCallback(() => {
    setWarehouseItems(WAREHOUSE_ITEMS);
  }, [WAREHOUSE_ITEMS]);

  const checkInventoryForModel = useCallback((modelId: string): boolean => {
    const modelItems = warehouseItems.filter(item => item.modelId === modelId);
    
    // Check if any critical items are out of stock or below critical level
    const hasCriticalIssue = modelItems.some(item => item.quantity < item.critical);
    
    setBlockedByWarehouse(hasCriticalIssue);
    return !hasCriticalIssue;
  }, [warehouseItems]);

  const getCriticalItems = useCallback((): WarehouseItem[] => {
    return warehouseItems.filter(item => item.quantity <= item.critical);
  }, [warehouseItems]);

  const getLowStockItems = useCallback((): WarehouseItem[] => {
    return warehouseItems.filter(item => item.quantity < item.critical * 2 && item.quantity >= item.critical);
  }, [warehouseItems]);

  const getItemsForModel = useCallback((modelId: string): WarehouseItem[] => {
    return warehouseItems.filter(item => item.modelId === modelId);
  }, [warehouseItems]);

  const updateItemQuantity = useCallback((itemId: string, quantity: number) => {
    setWarehouseItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity: Math.max(0, quantity) } : item
      )
    );
  }, []);

  const consumeItem = useCallback((itemId: string, amount: number) => {
    setWarehouseItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity - amount) } : item
      )
    );
  }, []);

  const getTotalInventoryValue = useCallback((): number => {
    return warehouseItems.length;
  }, [warehouseItems]);

  return {
    warehouseItems,
    blockedByWarehouse,
    initializeWarehouse,
    checkInventoryForModel,
    getCriticalItems,
    getLowStockItems,
    getItemsForModel,
    updateItemQuantity,
    consumeItem,
    getTotalInventoryValue,
  };
}
