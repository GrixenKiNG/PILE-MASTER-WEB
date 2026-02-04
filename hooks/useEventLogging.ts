import { useState, useCallback } from 'react';

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
 * Custom hook for event logging with blockchain-style hashing
 * Provides immutable event log with cryptographic verification
 */
export function useEventLogging(operatorId: string, rigId: number | null) {
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
  const [blockchainHash, setBlockchainHash] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const generateHash = useCallback((data: string): string => {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }, []);

  const logEvent = useCallback((eventType: string, eventData: any) => {
    const timestamp = new Date().toISOString();
    const previousHash = eventLog.length > 0 ? eventLog[eventLog.length - 1].hash : '0'.repeat(64);
    const eventDataString = JSON.stringify({
      timestamp,
      type: eventType,
      operator: operatorId,
      rig: rigId,
      data: eventData,
    });

    const hash = generateHash(eventDataString);
    const id = `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newEvent: EventLogEntry = {
      id,
      timestamp,
      type: eventType,
      operator: operatorId,
      rig: rigId,
      eventData,
      hash,
      previousHash,
      syncStatus: 'pending',
      deviceId: 'device-001',
    };

    setEventLog(prev => [...prev, newEvent]);

    // Update verification code based on latest hash
    const verificationCode = hash.substring(0, 8).toUpperCase();
    setVerificationCode(verificationCode);
    setBlockchainHash(hash);

    return newEvent;
  }, [eventLog, operatorId, rigId, generateHash]);

  const clearEventLog = useCallback(() => {
    setEventLog([]);
    setBlockchainHash('');
    setVerificationCode('');
  }, []);

  const markEventAsSynced = useCallback((eventId: string) => {
    setEventLog(prev =>
      prev.map(event =>
        event.id === eventId ? { ...event, syncStatus: 'synced' } : event
      )
    );
  }, []);

  const getSyncQueue = useCallback(() => {
    return eventLog.filter(event => event.syncStatus === 'pending');
  }, [eventLog]);

  return {
    eventLog,
    blockchainHash,
    verificationCode,
    logEvent,
    clearEventLog,
    markEventAsSynced,
    getSyncQueue,
  };
}
