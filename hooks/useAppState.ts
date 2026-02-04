import { useState, useCallback, useRef } from 'react';

interface Operator {
  id: string;
  name: string;
  pin: string;
}

interface Rig {
  id: number;
  name: string;
  location: string;
  type: string;
  serial: string | null;
  configuration: string | null;
  telematicsId: string;
  modelId: string;
}

interface EventLogEntry {
  id: string;
  timestamp: string;
  type: string;
  operator: string;
  rig: number | null;
  eventData: any;
  hash: string;
  previousHash: string;
  syncStatus: 'pending' | 'synced';
  deviceId: string;
}

/**
 * Custom hook for managing application-wide state
 * Consolidates multiple useState calls into a single reducer-like interface
 */
export function useAppState() {
  const [currentStep, setCurrentStep] = useState(0);
  const [operator, setOperator] = useState<Operator>({ id: '1', name: 'Оператор 1', pin: '1234' });
  const [selectedRig, setSelectedRig] = useState<Rig | null>(null);
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
  const [offlineMode, setOfflineMode] = useState(false);
  const [syncQueue, setSyncQueue] = useState<EventLogEntry[]>([]);
  const [systemLocked, setSystemLocked] = useState(false);
  const [shiftActive, setShiftActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [appReady, setAppReady] = useState(false);

  const goToNextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, 7));
  }, []);

  const goToPreviousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(0, Math.min(step, 7)));
  }, []);

  const resetWorkflow = useCallback(() => {
    setCurrentStep(0);
    setSelectedRig(null);
    setShiftActive(false);
    setError(null);
  }, []);

  return {
    // State
    currentStep,
    operator,
    selectedRig,
    eventLog,
    offlineMode,
    syncQueue,
    systemLocked,
    shiftActive,
    error,
    loading,
    appReady,

    // Setters
    setCurrentStep,
    setOperator,
    setSelectedRig,
    setEventLog,
    setOfflineMode,
    setSyncQueue,
    setSystemLocked,
    setShiftActive,
    setError,
    setLoading,
    setAppReady,

    // Actions
    goToNextStep,
    goToPreviousStep,
    goToStep,
    resetWorkflow,
  };
}
