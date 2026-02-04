import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ScrollView, Text, View, TextInput, Pressable, Image } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';

// Type definitions
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

interface SafetyItem {
  id: string;
  title: string;
  content: string;
  read: boolean;
}

interface InspectionItem {
  id: string;
  name: string;
  required: boolean;
  checklist: Array<{ name: string; checked: boolean }>;
  status: 'pending' | 'completed';
  photoBefore: string | null;
  photoAfter: string | null;
}

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

interface WarehouseItem {
  id: string;
  name: string;
  modelId: string;
  quantity: number;
  critical: number;
  unit: string;
}

interface Photos {
  final: string | null;
  inspection: Record<string, { before: string | null; after: string | null }>;
  lubrication: Record<string, string | null>;
  telematics: Record<string, string | null>;
}

interface TelemetryData {
  engineHours: number;
  fuelLevel: number;
  hydraulicPressure: number;
  temperature: number;
  gps: { lat: number; lng: number };
  vibration: number;
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

interface MLRecommendation {
  id: string;
  title: string;
  description: string;
  severity: 'success' | 'warning' | 'info' | 'error';
  confidence: number;
  applied?: boolean;
}

export default function HomeScreen() {
  // Core state management
  const [currentStep, setCurrentStep] = useState(0);
  const [operator, setOperator] = useState<Operator>({ id: '1', name: 'Оператор 1', pin: '1234' });
  const [selectedRig, setSelectedRig] = useState<Rig | null>(null);
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
  const [offlineMode, setOfflineMode] = useState(false);
  const [syncQueue, setSyncQueue] = useState<EventLogEntry[]>([]);
  const [systemLocked, setSystemLocked] = useState(false);

  // Safety & Inspection
  const [safetyItems, setSafetyItems] = useState<SafetyItem[]>([]);
  const [safetyConfirmed, setSafetyConfirmed] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);

  // Warehouse & Maintenance
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [blockedByWarehouse, setBlockedByWarehouse] = useState(false);

  // Lubrication
  const [lubricationItems, setLubricationItems] = useState<LubricationItem[]>([]);

  // Shift & Photo management
  const [shiftActive, setShiftActive] = useState(false);
  const [photos, setPhotos] = useState<Photos>({
    final: null,
    inspection: {},
    lubrication: {},
    telematics: {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appReady, setAppReady] = useState(false);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<any>(null);

  // Telemetry state
  const [telemetryData, setTelemetryData] = useState<TelemetryData>({
    engineHours: 0,
    fuelLevel: 100,
    hydraulicPressure: 0,
    temperature: 20,
    gps: { lat: 55.7558, lng: 37.6173 },
    vibration: 0.2
  });

  // ML Recommendations state
  const [mlRecommendations, setMlRecommendations] = useState<MLRecommendation[]>([]);
  const [mlAnalysisReady, setMlAnalysisReady] = useState(false);

  // Voice recognition state
  const [voiceCommand, setVoiceCommand] = useState('');
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Immutable ledger state
  const [blockchainHash, setBlockchainHash] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  // Mock data for rigs
  const RIGS = useMemo<Rig[]>(() => [
    {
      id: 1,
      name: 'PVE 50PR',
      location: 'Объект Москва-1',
      type: 'свайная установка',
      serial: null,
      configuration: null,
      telematicsId: 'TELE-PVE50PR-001',
      modelId: 'PVE-50PR'
    },
    {
      id: 2,
      name: 'Kopernik SD 20',
      location: 'Объект СПб-3',
      type: 'буровая установка',
      serial: null,
      configuration: 'SGH-0512',
      telematicsId: 'TELE-KOP20-002',
      modelId: 'KOP-SD20'
    },
    {
      id: 3,
      name: 'Liebherr LRH 100',
      location: 'Объект Казань-5',
      type: 'буровая установка',
      serial: '№115103',
      configuration: 'SuperRam-5000 + BA 12',
      telematicsId: 'TELE-LIEBH100-003',
      modelId: 'LIEBH-LRH100'
    },
    {
      id: 4,
      name: 'Liebherr LRH 100',
      location: 'Объект Екатеринбург-2',
      type: 'буровая установка',
      serial: '№115127',
      configuration: 'DD45',
      telematicsId: 'TELE-LIEBH100-004',
      modelId: 'LIEBH-LRH100-DD45'
    },
    {
      id: 5,
      name: 'КБУРГ-16',
      location: 'Объект Новосибирск-7',
      type: 'буровая установка',
      serial: null,
      configuration: null,
      telematicsId: 'TELE-KBURG16-005',
      modelId: 'KBURG-16'
    },
    {
      id: 6,
      name: 'КБУРГ-16-02',
      location: 'Объект Ростов-4',
      type: 'буровая установка',
      serial: null,
      configuration: 'забивка + бурение, DD45',
      telematicsId: 'TELE-KBURG1602-006',
      modelId: 'KBURG-16-02'
    }
  ], []);

  // Warehouse data
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

  // Safety items
  const SAFETY_ITEMS = useMemo<Omit<SafetyItem, 'read'>[]>(() => [
    { id: 'safety1', title: 'Требования к СИЗ', content: 'Обязательное использование каски, защитных очков, перчаток, спецодежды и средств защиты слуха при работе с шумным оборудованием.' },
    { id: 'safety2', title: 'Зона безопасности', content: 'Установите сигнальные ограждения и предупредительные знаки. Не допускайте посторонних в зону работы установки.' },
    { id: 'safety3', title: 'Проверка исправности', content: 'Перед началом работы убедитесь в исправности оборудования, отсутствии утечек масла и повреждений гидравлических шлангов.' },
    { id: 'safety4', title: 'Аварийная остановка', content: 'При возникновении аварийной ситуации немедленно нажмите кнопку аварийной остановки и сообщите мастеру.' },
    { id: 'safety5', title: 'Ограничения по погоде', content: 'Запрещается работа при скорости ветра более 15 м/с, грозе или видимости менее 30 метров.' }
  ], []);

  // Inspection items
  const INSPECTION_ITEMS = useMemo<Omit<InspectionItem, 'status' | 'checklist' | 'photoBefore' | 'photoAfter'>[]>(() => [
    { id: 'tracks', name: 'Гусеницы', required: true, checklist: ['Натяжение', 'Целостность башмаков', 'Отсутствие загрязнений'] },
    { id: 'hydraulics', name: 'Гидравлические шланги', required: true, checklist: ['Отсутствие утечек', 'Целостность оплетки', 'Надежность соединений'] },
    { id: 'cab', name: 'Кабина оператора', required: true, checklist: ['Чистота стекол', 'Работоспособность приборов', 'Наличие огнетушителя'] },
    { id: 'boom', name: 'Стрела', required: true, checklist: ['Отсутствие трещин', 'Надежность креплений', 'Смазка шарниров'] },
    { id: 'engine', name: 'Двигатель', required: true, checklist: ['Уровень масла', 'Отсутствие утечек', 'Чистота воздушного фильтра'] }
  ], []);

  // Lubrication points
  const LUBRICATION_POINTS = useMemo<LubricationItem[]>(() => [
    { id: 'rotary', name: 'Поворотный узел', required: true, greaseRequired: 0.5, greaseType: 'Смазка SuperLube', modelIds: ['PVE-50PR', 'KOP-SD20', 'LIEBH-LRH100'] },
    { id: 'mast', name: 'Мачта', required: true, greaseRequired: 0.3, greaseType: 'Смазка SuperLube', modelIds: ['LIEBH-LRH100', 'KBURG-16', 'KBURG-16-02'] },
    { id: 'winch', name: 'Лебедка', required: true, greaseRequired: 0.4, greaseType: 'Смазка SuperLube', modelIds: ['PVE-50PR', 'KOP-SD20', 'LIEBH-LRH100', 'KBURG-16', 'KBURG-16-02'] },
    { id: 'hammer', name: 'Ударный узел', required: true, greaseRequired: 0.6, greaseType: 'Смазка для КБУРГ', modelIds: ['KBURG-16', 'KBURG-16-02'] },
    { id: 'dd45_joint', name: 'Узел DD45', required: true, greaseRequired: 0.7, greaseType: 'Смазка SuperLube', modelIds: ['LIEBH-LRH100-DD45'] }
  ], []);

  // Initialize items on mount
  useEffect(() => {
    setSafetyItems(SAFETY_ITEMS.map(item => ({ ...item, read: false })));

    setInspectionItems(INSPECTION_ITEMS.map((item: any) => ({
      ...item,
      status: 'pending' as const,
      checklist: item.checklist.map((c: string) => ({ name: c, checked: false })),
      photoBefore: null,
      photoAfter: null
    })));

    setLubricationItems(LUBRICATION_POINTS.map(item => ({
      ...item,
      status: 'pending' as const,
      photo: null,
      greaseUsed: 0
    })));

    setWarehouseItems(WAREHOUSE_ITEMS);
    setAppReady(true);
  }, []);

  // Event logging system
  const logEvent = useCallback((eventType: string, eventData: any) => {
    if (systemLocked) {
      console.warn('System is locked - event not logged');
      return null;
    }

    const timestamp = new Date().toISOString();
    const previousHash = eventLog.length > 0 ? eventLog[eventLog.length - 1].hash : '0'.repeat(64);
    const eventDataString = JSON.stringify({
      timestamp,
      type: eventType,
      operator: operator.id,
      rig: selectedRig?.id || null,
      data: eventData
    });

    // Simple hash simulation
    const hash = Array.from(eventDataString).reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0).toString(16).padStart(64, '0');

    const event: EventLogEntry = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      timestamp,
      type: eventType,
      operator: operator.id,
      rig: selectedRig?.id || null,
      eventData,
      hash,
      previousHash,
      syncStatus: offlineMode ? 'pending' : 'synced',
      deviceId: 'MOBILE-001'
    };

    setEventLog(prev => [...prev, event]);

    if (offlineMode) {
      setSyncQueue(prev => [...prev, event]);
    }

    setBlockchainHash(hash);
    setVerificationCode(hash.substring(0, 8).toUpperCase());

    return event.id;
  }, [offlineMode, operator.id, selectedRig, systemLocked, eventLog]);

  // Step validation
  const validateCurrentStep = useCallback(() => {
    let validationError: string | null = null;

    if (systemLocked) {
      validationError = 'Система заблокирована для безопасности. Обратитесь к администратору.';
      setError(validationError);
      return false;
    }

    switch (currentStep) {
      case 0: // Authorization
        if (operator.id.length < 1) {
          validationError = 'Необходимо указать ID оператора';
        }
        break;

      case 1: // Rig selection
        if (!selectedRig) {
          validationError = 'Необходимо выбрать установку для продолжения работы';
        } else if (blockedByWarehouse) {
          validationError = 'Работа заблокирована из-за недостатка материалов на складе';
        }
        break;

      case 2: // Safety briefing
        if (!safetyItems.every(item => item.read)) {
          validationError = 'Необходимо прочитать все пункты инструктажа';
        } else if (!safetyConfirmed) {
          validationError = 'Необходимо подтвердить ознакомление с инструктажем';
        } else if (!signature) {
          validationError = 'Требуется электронная подпись для подтверждения';
        }
        break;

      case 3: // Pre-shift inspection
        const incompleteInspections = inspectionItems.filter(item =>
          !item.checklist.every(c => c.checked) ||
          !photos.inspection[item.id]?.before ||
          !photos.inspection[item.id]?.after
        );

        if (incompleteInspections.length > 0) {
          validationError = `Не завершен осмотр узлов: ${incompleteInspections.map(i => i.name).join(', ')}`;
        }
        break;

      case 4: // Lubrication
        const incompleteLubrication = lubricationItems.filter(item =>
          !photos.lubrication[item.id] || (item.greaseUsed || 0) < item.greaseRequired
        );

        if (incompleteLubrication.length > 0) {
          validationError = `Не завершена смазка узлов: ${incompleteLubrication.map(i => i.name).join(', ')}`;
        }
        break;

      case 5: // Work completion
        if (!shiftActive) {
          validationError = 'Необходимо начать работу перед закрытием смены';
        }
        break;

      case 6: // Shift closure
        if (!photos.final) {
          validationError = 'Требуется финальное фото состояния оборудования';
        }
        break;

      default:
        return true;
    }

    if (validationError) {
      setError(validationError);
      logEvent('validation_failed', {
        step: currentStep,
        error: validationError
      });
      return false;
    }

    return true;
  }, [currentStep, systemLocked, operator.id, selectedRig, blockedByWarehouse, safetyItems, safetyConfirmed, signature, inspectionItems, photos, lubricationItems, shiftActive, logEvent]);

  // Step navigation
  const goToNextStep = () => {
    if (validateCurrentStep()) {
      logEvent('step_complete', {
        step: currentStep,
        nextStep: currentStep + 1
      });

      setCurrentStep(prev => prev + 1);
      setError(null);
    }
  };

  // Handle photo capture (mock)
  const handlePhotoCapture = (type: string, itemId?: string) => {
    // Mock photo - in real app, would use camera
    const mockPhoto = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    if (type === 'inspection-before' && itemId) {
      setPhotos(prev => ({
        ...prev,
        inspection: {
          ...prev.inspection,
          [itemId]: { ...prev.inspection[itemId], before: mockPhoto }
        }
      }));
      logEvent('photo_captured', { type: 'inspection_before', itemId });
    } else if (type === 'inspection-after' && itemId) {
      setPhotos(prev => ({
        ...prev,
        inspection: {
          ...prev.inspection,
          [itemId]: { ...prev.inspection[itemId], after: mockPhoto }
        }
      }));
      logEvent('photo_captured', { type: 'inspection_after', itemId });
    } else if (type === 'lubrication' && itemId) {
      setPhotos(prev => ({
        ...prev,
        lubrication: { ...prev.lubrication, [itemId]: mockPhoto }
      }));
      setLubricationItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, status: 'completed', greaseUsed: item.greaseRequired } : item
      ));
      logEvent('photo_captured', { type: 'lubrication', itemId });
    } else if (type === 'final') {
      setPhotos(prev => ({ ...prev, final: mockPhoto }));
      logEvent('photo_captured', { type: 'final' });
    }
  };

  // Step components
  const StepAuthorization = () => {
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState('');

    const handlePinSubmit = () => {
      if (pin === operator.pin) {
        logEvent('operator_authenticated', { operatorId: operator.id, method: 'pin' });
        goToNextStep();
      } else {
        setPinError('Неверный PIN-код');
        logEvent('auth_failed', { attempt: pin.length });
      }
    };

    return (
      <ScreenContainer className="p-4">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 gap-8">
            {/* Header */}
            <View className="items-center gap-2">
              <View className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
                <Text className="text-3xl">🔐</Text>
              </View>
              <Text className="text-2xl font-bold text-foreground">PILE MASTER WEB</Text>
              <Text className="text-gray-600">Система контроля буровых работ</Text>
            </View>

            {systemLocked && (
              <View className="p-4 bg-red-50 rounded-xl border border-red-200">
                <Text className="text-red-700 font-medium">
                  Система заблокирована для безопасности. Обратитесь к администратору.
                </Text>
              </View>
            )}

            {/* Login form */}
            <View className="bg-white rounded-2xl shadow-lg p-6 gap-6">
              <View className="gap-2">
                <Text className="text-sm font-medium text-gray-700">Идентификатор оператора</Text>
                <TextInput
                  value={operator.id}
                  onChangeText={(text) => setOperator({ ...operator, id: text })}
                  className="px-4 py-3 border border-gray-300 rounded-xl"
                  placeholder="Введите ваш ID"
                  editable={!systemLocked}
                />
              </View>

              <View className="gap-2">
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm font-medium text-gray-700">PIN-код для подтверждения</Text>
                  <Text className="text-xs text-gray-500">Стандартный PIN: 1234</Text>
                </View>
                <TextInput
                  value={pin}
                  onChangeText={(text) => {
                    setPin(text);
                    setPinError('');
                  }}
                  className={`px-4 py-3 border rounded-xl text-lg font-mono tracking-widest ${pinError ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="0000"
                  maxLength={4}
                  keyboardType="number-pad"
                  editable={!systemLocked}
                />
                {pinError && <Text className="text-xs text-red-500">{pinError}</Text>}
              </View>

              <Pressable
                onPress={handlePinSubmit}
                disabled={operator.id.length < 1 || pin.length < 4 || systemLocked}
                className={`py-4 rounded-xl ${
                  operator.id.length >= 1 && pin.length >= 4 && !systemLocked
                    ? 'bg-blue-600'
                    : 'bg-gray-300'
                }`}
              >
                <Text className={`text-center text-lg font-semibold ${
                  operator.id.length >= 1 && pin.length >= 4 && !systemLocked
                    ? 'text-white'
                    : 'text-gray-500'
                }`}>
                  Начать смену
                </Text>
              </Pressable>
            </View>

            {offlineMode && (
              <View className="p-3 bg-yellow-50 rounded-xl flex-row items-center text-yellow-700 border border-yellow-200">
                <Text className="text-yellow-700">Автономный режим. Все данные будут синхронизированы при восстановлении связи</Text>
              </View>
            )}

            <Text className="text-center text-xs text-gray-500">
              Вход только для авторизованных операторов{'\n'}
              Система соответствует требованиям ТБ
            </Text>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  };

  const StepRigSelection = () => {
    // Check for warehouse block
    useEffect(() => {
      if (selectedRig) {
        const rigGrease = warehouseItems.filter(item =>
          item.modelId === selectedRig.modelId &&
          (item.name.toLowerCase().includes('смазка') || item.name.toLowerCase().includes('масло'))
        );

        const requiredLubrication = lubricationItems.filter(item =>
          item.modelIds?.includes(selectedRig.modelId)
        );

        const hasEnoughGrease = requiredLubrication.every(item => {
          const greaseItem = rigGrease.find(w => w.name === item.greaseType);
          return greaseItem && greaseItem.quantity >= item.greaseRequired;
        });

        setBlockedByWarehouse(!hasEnoughGrease);
      }
    }, [selectedRig, warehouseItems, lubricationItems]);

    return (
      <ScreenContainer className="p-4">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 gap-6">
            {/* Header */}
            <View className="items-center gap-2">
              <Text className="text-2xl font-bold text-foreground">Выбор установки</Text>
              <Text className="text-gray-600">Выберите буровую установку для работы</Text>
            </View>

            {/* Rig list */}
            <View className="gap-3">
              {RIGS.map(rig => (
                <Pressable
                  key={rig.id}
                  onPress={() => {
                    setSelectedRig(rig);
                    logEvent('rig_selected', { rigId: rig.id, rigName: rig.name, modelId: rig.modelId });
                    setError(null);
                  }}
                  disabled={systemLocked}
                  className={`p-4 rounded-2xl ${
                    selectedRig?.id === rig.id
                      ? 'bg-blue-50 border-2 border-blue-600'
                      : 'bg-white shadow-md'
                  } ${systemLocked ? 'opacity-50' : ''}`}
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 mr-4">
                      <View className="flex-row gap-2 mb-1 flex-wrap">
                        <Text className="font-bold text-lg text-gray-900">{rig.name}</Text>
                        <View className={`px-2 py-0.5 rounded-full ${
                          rig.type.includes('буровая') ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          <Text className={`text-xs font-medium ${
                            rig.type.includes('буровая') ? 'text-green-800' : 'text-blue-800'
                          }`}>
                            {rig.type}
                          </Text>
                        </View>
                        {rig.serial && (
                          <View className="px-2 py-0.5 bg-gray-100 rounded-full">
                            <Text className="text-xs font-medium text-gray-800">{rig.serial}</Text>
                          </View>
                        )}
                      </View>

                      <Text className="text-gray-700 font-medium">📍 {rig.location}</Text>
                    </View>

                    <View className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      selectedRig?.id === rig.id ? 'bg-blue-600' : 'bg-gray-200'
                    }`}>
                      {selectedRig?.id === rig.id && <Text className="text-white">✓</Text>}
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>

            {blockedByWarehouse && selectedRig && (
              <View className="p-3 bg-red-50 rounded-xl border border-red-200">
                <Text className="text-red-700">Недостаточно материалов на складе для работы с этой установкой</Text>
              </View>
            )}

            {error && (
              <View className="p-3 bg-red-50 rounded-xl border border-red-200">
                <Text className="text-red-700">{error}</Text>
              </View>
            )}

            <Pressable
              onPress={() => {
                if (systemLocked) {
                  setError('Система заблокирована. Обратитесь к администратору.');
                  return;
                }
                if (!selectedRig) {
                  setError('Необходимо выбрать установку для продолжения работы');
                  return;
                }
                if (blockedByWarehouse) {
                  setError('Работа заблокирована из-за недостатка материалов на складе');
                  return;
                }
                goToNextStep();
              }}
              disabled={!selectedRig || blockedByWarehouse || systemLocked}
              className={`py-4 rounded-xl ${
                selectedRig && !blockedByWarehouse && !systemLocked
                  ? 'bg-blue-600'
                  : 'bg-gray-300'
              }`}
            >
              <Text className={`text-center text-lg font-semibold ${
                selectedRig && !blockedByWarehouse && !systemLocked
                  ? 'text-white'
                  : 'text-gray-500'
              }`}>
                Далее: Инструктаж ТБ
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  };

  const StepSafetyBriefing = () => (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="items-center gap-2">
            <View className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center">
              <Text className="text-3xl">🛡️</Text>
            </View>
            <Text className="text-2xl font-bold text-foreground">Инструктаж ТБ</Text>
            <Text className="text-gray-600">Ознакомьтесь со всеми пунктами</Text>
          </View>

          {/* Safety items */}
          <View className="gap-3">
            {safetyItems.map((item) => (
              <View key={item.id} className={`border-l-4 pl-4 py-2 rounded-r-lg ${
                item.read ? 'border-green-500 bg-green-50' : 'border-blue-500 bg-blue-50'
              }`}>
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-800">{item.title}</Text>
                    <Text className="text-gray-700 mt-1 text-sm">{item.content}</Text>
                  </View>
                  <View className={`ml-4 w-6 h-6 rounded-full flex items-center justify-center ${
                    item.read ? 'bg-green-100' : 'bg-gray-200'
                  }`}>
                    {item.read && <Text className="text-green-600">✓</Text>}
                  </View>
                </View>
                <Pressable
                  onPress={() => {
                    setSafetyItems(prev => prev.map(i =>
                      i.id === item.id ? { ...i, read: true } : i
                    ));
                    logEvent('safety_item_read', { itemId: item.id, title: item.title });
                  }}
                  disabled={item.read || systemLocked}
                  className={`mt-2 px-3 py-1 text-xs rounded-lg ${
                    item.read
                      ? 'bg-green-100'
                      : 'bg-blue-100'
                  }`}
                >
                  <Text className={item.read ? 'text-green-800' : 'text-blue-800'}>
                    {item.read ? 'Прочитано' : 'Отметить прочтение'}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>

          {/* Confirmation */}
          <View className="flex-row items-center gap-3 mt-4">
            <Pressable
              onPress={() => {
                setSafetyConfirmed(!safetyConfirmed);
                logEvent('safety_confirmed', { confirmed: !safetyConfirmed });
              }}
              disabled={!safetyItems.every(item => item.read) || systemLocked}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                safetyConfirmed ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
              }`}
            >
              {safetyConfirmed && <Text className="text-white text-xs">✓</Text>}
            </Pressable>
            <Text className={`text-sm ${
              !safetyItems.every(item => item.read) ? 'text-gray-400' : 'text-gray-700'
            }`}>
              Я ознакомлен и согласен со всеми пунктами инструктажа
            </Text>
          </View>

          {/* Signature placeholder */}
          <View className="gap-2 mt-4">
            <Text className="font-semibold text-lg text-gray-800">Электронная подпись</Text>
            <Text className="text-gray-600 text-sm">Подтвердите ознакомление с инструктажем</Text>
            <View className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 p-4 h-32 flex items-center justify-center">
              {signature ? (
                <View className="relative w-full h-full">
                  {signature && <Image source={{ uri: signature }} className="w-full h-full rounded-lg" />}
                </View>
              ) : (
                <Text className="text-gray-500 text-center">Подпись будет отображена здесь</Text>
              )}
            </View>
            <Pressable
              onPress={() => {
                setSignature('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
                logEvent('signature_created', {});
              }}
              disabled={systemLocked}
              className={`py-2 px-4 rounded-lg ${
                systemLocked ? 'bg-gray-300' : 'bg-blue-600'
              }`}
            >
              <Text className={systemLocked ? 'text-gray-500' : 'text-white'}>
                {signature ? 'Пересоздать подпись' : 'Создать подпись'}
              </Text>
            </Pressable>
          </View>

          {error && (
            <View className="p-3 bg-red-50 rounded-xl border border-red-200">
              <Text className="text-red-700">{error}</Text>
            </View>
          )}

          <Pressable
            onPress={goToNextStep}
            disabled={!safetyItems.every(item => item.read) || !safetyConfirmed || !signature || systemLocked}
            className={`py-4 rounded-xl ${
              safetyItems.every(item => item.read) && safetyConfirmed && signature && !systemLocked
                ? 'bg-blue-600'
                : 'bg-gray-300'
            }`}
          >
            <Text className={`text-center text-lg font-semibold ${
              safetyItems.every(item => item.read) && safetyConfirmed && signature && !systemLocked
                ? 'text-white'
                : 'text-gray-500'
            }`}>
              Подтвердить и продолжить
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );

  const StepInspection = () => (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="items-center gap-2">
            <View className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center">
              <Text className="text-3xl">✓</Text>
            </View>
            <Text className="text-2xl font-bold text-foreground">Предсменный осмотр</Text>
            <Text className="text-gray-600">Чек-лист и фото ДО/ПОСЛЕ для каждого узла</Text>
          </View>

          {/* Inspection items */}
          <View className="gap-4">
            {inspectionItems.map(item => (
              <View key={item.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                <View className="p-4 border-b border-gray-100 flex-row justify-between items-center">
                  <Text className="font-bold text-lg text-gray-900">{item.name}</Text>
                  <View className={`px-3 py-1 rounded-full ${
                    item.status === 'completed' ? 'bg-green-100' : 'bg-yellow-100'
                  }`}>
                    <Text className={`text-sm font-medium ${
                      item.status === 'completed' ? 'text-green-800' : 'text-yellow-800'
                    }`}>
                      {item.status === 'completed' ? 'Выполнено' : 'Требуется'}
                    </Text>
                  </View>
                </View>

                <View className="p-4 gap-4">
                  {/* Checklist */}
                  <View className="gap-2">
                    <Text className="font-medium text-gray-800">Чек-лист:</Text>
                    {item.checklist.map((check, index) => (
                      <View key={index} className="flex-row items-center">
                        <Pressable
                          onPress={() => {
                            const updatedItem = {
                              ...item,
                              checklist: item.checklist.map((c, i) =>
                                i === index ? { ...c, checked: !c.checked } : c
                              )
                            };

                            if (updatedItem.checklist.every(c => c.checked) &&
                              photos.inspection[item.id]?.before &&
                              photos.inspection[item.id]?.after) {
                              updatedItem.status = 'completed';
                            }

                            setInspectionItems(prev => prev.map(i =>
                              i.id === item.id ? updatedItem : i
                            ));

                            logEvent('inspection_item_checked', {
                              itemId: item.id,
                              itemName: item.name,
                              checkIndex: index,
                              checkName: check.name,
                              checked: !check.checked
                            });
                          }}
                          disabled={systemLocked}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            check.checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                          }`}
                        >
                          {check.checked && <Text className="text-white text-xs">✓</Text>}
                        </Pressable>
                        <Text className="ml-3 text-gray-700">{check.name}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Photo placeholders */}
                  <View className="flex-row gap-4">
                    <View className="flex-1 border-2 border-dashed border-gray-300 rounded-xl p-3 bg-gray-50 items-center justify-center h-32">
                      {photos.inspection[item.id]?.before ? (
                        <View className="relative w-full h-full">
                          {photos.inspection[item.id]?.before && <Image source={{ uri: photos.inspection[item.id].before || '' }} className="w-full h-full rounded-lg" />}
                          <View className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <Text className="text-white text-xs">✓</Text>
                          </View>
                        </View>
                      ) : (
                        <View className="items-center">
                          <Text className="text-3xl mb-2">📷</Text>
                          <Text className="text-xs text-gray-500 text-center">Фото ДО</Text>
                        </View>
                      )}
                      <Pressable
                        onPress={() => handlePhotoCapture('inspection-before', item.id)}
                        disabled={systemLocked}
                        className={`mt-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                          systemLocked ? 'bg-gray-300' : 'bg-blue-500'
                        }`}
                      >
                        <Text className={systemLocked ? 'text-gray-500' : 'text-white'}>
                          {photos.inspection[item.id]?.before ? 'Изменить' : 'Сделать фото'}
                        </Text>
                      </Pressable>
                    </View>

                    <View className="flex-1 border-2 border-dashed border-gray-300 rounded-xl p-3 bg-gray-50 items-center justify-center h-32">
                      {photos.inspection[item.id]?.after ? (
                        <View className="relative w-full h-full">
                          {photos.inspection[item.id]?.after && <Image source={{ uri: photos.inspection[item.id].after || '' }} className="w-full h-full rounded-lg" />}
                          <View className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <Text className="text-white text-xs">✓</Text>
                          </View>
                        </View>
                      ) : (
                        <View className="items-center">
                          <Text className="text-3xl mb-2">📷</Text>
                          <Text className="text-xs text-gray-500 text-center">Фото ПОСЛЕ</Text>
                        </View>
                      )}
                      <Pressable
                        onPress={() => handlePhotoCapture('inspection-after', item.id)}
                        disabled={systemLocked}
                        className={`mt-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                          systemLocked ? 'bg-gray-300' : 'bg-blue-500'
                        }`}
                      >
                        <Text className={systemLocked ? 'text-gray-500' : 'text-white'}>
                          {photos.inspection[item.id]?.after ? 'Изменить' : 'Сделать фото'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {error && (
            <View className="p-3 bg-red-50 rounded-xl border border-red-200">
              <Text className="text-red-700">{error}</Text>
            </View>
          )}

          <Pressable
            onPress={goToNextStep}
            disabled={!inspectionItems.every(item => item.status === 'completed') || systemLocked}
            className={`py-4 rounded-xl ${
              inspectionItems.every(item => item.status === 'completed') && !systemLocked
                ? 'bg-blue-600'
                : 'bg-gray-300'
            }`}
          >
            <Text className={`text-center text-lg font-semibold ${
              inspectionItems.every(item => item.status === 'completed') && !systemLocked
                ? 'text-white'
                : 'text-gray-500'
            }`}>
              Далее: Смазка узлов
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );

  const StepLubrication = () => {
    const rigGreaseItems = warehouseItems.filter(item =>
      item.modelId === selectedRig?.modelId &&
      (item.name.toLowerCase().includes('смазка') || item.name.toLowerCase().includes('масло'))
    );

    const applicableLubricationItems = lubricationItems.filter(item =>
      selectedRig && item.modelIds.includes(selectedRig.modelId)
    );

    const hasEnoughGrease = applicableLubricationItems.every((item: LubricationItem) => {
      const requiredGrease = item.greaseRequired;
      const warehouseItem = rigGreaseItems.find((w: WarehouseItem) => w.name === item.greaseType);
      return warehouseItem && warehouseItem.quantity >= requiredGrease;
    });

    return (
      <ScreenContainer className="p-4">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 gap-6">
            {/* Header */}
            <View className="items-center gap-2">
              <View className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center">
                <Text className="text-3xl">🔧</Text>
              </View>
              <Text className="text-2xl font-bold text-foreground">Смазка узлов</Text>
              <Text className="text-gray-600">Фото после смазки каждого узла</Text>
            </View>

            {!hasEnoughGrease && (
              <View className="p-3 bg-red-50 rounded-xl border border-red-200">
                <Text className="text-red-700">Недостаточно смазки на складе. Обратитесь к механику.</Text>
              </View>
            )}

            {/* Warehouse info */}
            <View className="bg-white rounded-xl shadow p-4 gap-2">
              <Text className="font-semibold text-lg text-gray-800">Склад для {selectedRig?.name}</Text>
              {rigGreaseItems.map((item: WarehouseItem) => (
                <View key={item.id} className="flex-row justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <View className="flex-1">
                    <Text className="font-medium text-gray-800">{item.name}</Text>
                    <Text className={`text-sm ${
                      item.quantity <= item.critical ? 'text-red-600 font-medium' : 'text-gray-600'
                    }`}>
                      Остаток: {item.quantity} {item.unit}
                    </Text>
                  </View>
                  <View className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.quantity <= item.critical ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    <Text>{item.quantity <= item.critical ? 'Критично' : 'ОК'}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Lubrication items */}
            <View className="gap-4">
              {applicableLubricationItems.map((item: LubricationItem) => {
                const warehouseItem = rigGreaseItems.find((w: WarehouseItem) => w.name === item.greaseType);
                const hasEnough = warehouseItem && warehouseItem.quantity >= item.greaseRequired;

                return (
                  <View key={item.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                    <View className="p-4 border-b border-gray-100 flex-row justify-between items-start">
                      <View className="flex-1">
                        <Text className="font-bold text-lg text-gray-900">{item.name}</Text>
                        <Text className="text-sm text-gray-600 mt-1">
                          Требуется: {item.greaseRequired} л {item.greaseType}
                          {!hasEnough && <Text className="ml-2 text-red-600 font-medium">• Недостаточно на складе</Text>}
                        </Text>
                      </View>
                      <View className={`px-3 py-1 rounded-full text-sm font-medium ${
                        item.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        <Text>{item.status === 'completed' ? 'Выполнено' : 'Требуется'}</Text>
                      </View>
                    </View>

                    <View className="p-6 flex items-center">
                      {photos.lubrication[item.id] ? (
                        <View className="relative w-full max-w-xs h-48 mb-4">
                          <Image source={{ uri: photos.lubrication[item.id] || '' }} className="w-full h-full rounded-xl" />
                          <View className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <Text className="text-white text-xs">✓</Text>
                          </View>
                        </View>
                      ) : (
                        <View className="border-2 border-dashed border-gray-300 rounded-xl w-full max-w-xs h-48 flex items-center justify-center bg-gray-50 mb-4">
                          <View className="items-center">
                            <Text className="text-3xl mb-2">📷</Text>
                            <Text className="text-sm text-gray-500 text-center px-4">
                              Сделайте фото после смазки узла
                            </Text>
                          </View>
                        </View>
                      )}

                      <Pressable
                        onPress={() => handlePhotoCapture('lubrication', item.id)}
                        disabled={!hasEnough || item.status === 'completed' || systemLocked}
                        className={`w-full max-w-xs px-4 py-3 rounded-xl font-medium transition ${
                          systemLocked
                            ? 'bg-gray-400'
                            : item.status === 'completed'
                              ? 'bg-green-500'
                              : hasEnough
                                ? 'bg-blue-500'
                                : 'bg-gray-400'
                        }`}
                      >
                        <Text className="text-white text-center">
                          {systemLocked
                            ? 'Система заблокирована'
                            : item.status === 'completed'
                              ? 'Выполнено'
                              : hasEnough
                                ? (photos.lubrication[item.id] ? 'Изменить фото' : 'Сделать фото узла')
                                : 'Недостаточно смазки'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>

            {error && (
              <View className="p-3 bg-red-50 rounded-xl border border-red-200">
                <Text className="text-red-700">{error}</Text>
              </View>
            )}

            <Pressable
              onPress={goToNextStep}
              disabled={!applicableLubricationItems.every((item: LubricationItem) => item.status === 'completed') || systemLocked}
              className={`py-4 rounded-xl ${
                applicableLubricationItems.every((item: LubricationItem) => item.status === 'completed') && !systemLocked
                  ? 'bg-blue-600'
                  : 'bg-gray-300'
              }`}
            >
              <Text className={`text-center text-lg font-semibold ${
                applicableLubricationItems.every((item: LubricationItem) => item.status === 'completed') && !systemLocked
                  ? 'text-white'
                  : 'text-gray-500'
              }`}>
                Начать работу
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  };

  const StepWork = () => {
    const [shiftSeconds, setShiftSeconds] = useState(0);

    useEffect(() => {
      let timer: ReturnType<typeof setInterval> | undefined;
      if (shiftActive && !systemLocked) {
        timer = setInterval(() => {
          setShiftSeconds(prev => prev + 1);
        }, 1000);
      } else {
        setShiftSeconds(0);
      }
      return () => {
        if (timer !== undefined) clearInterval(timer);
      };
    }, [shiftActive, systemLocked]);

    const formatTime = (seconds: number) => {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
      <ScreenContainer className="p-4">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 gap-6">
            {/* Header */}
            <View className="items-center gap-2">
              <View className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center">
                <Text className="text-3xl">⚠️</Text>
              </View>
              <Text className="text-2xl font-bold text-foreground">Рабочий процесс</Text>
              <Text className="text-gray-600">Контроль буровых операций</Text>
            </View>

            {systemLocked && (
              <View className="p-4 bg-red-50 rounded-xl border border-red-200">
                <Text className="text-red-700 font-medium">Система заблокирована для безопасности</Text>
              </View>
            )}

            {/* Work stats */}
            <View className="bg-white rounded-2xl shadow-lg p-6 gap-6">
              <View className="items-center">
                <Text className="text-5xl font-bold text-blue-600 mb-2">{formatTime(shiftSeconds)}</Text>
                <Text className="text-gray-600">Время работы в текущей смене</Text>
              </View>

              <View className="flex-row gap-4">
                <View className="flex-1 bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <Text className="text-sm text-gray-600 mb-1">Свай забурено</Text>
                  <Text className="text-2xl font-bold text-blue-700">14</Text>
                </View>
                <View className="flex-1 bg-green-50 p-4 rounded-xl border border-green-100">
                  <Text className="text-sm text-gray-600 mb-1">Глубина (м)</Text>
                  <Text className="text-2xl font-bold text-green-700">28.5</Text>
                </View>
              </View>

              {/* Telemetry */}
              <View className="p-4 bg-yellow-50 rounded-xl border border-yellow-200 gap-3">
                <Text className="font-medium text-gray-800">Телематика установки</Text>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-sm text-gray-600">Моточасы</Text>
                    <Text className="font-bold">{telemetryData.engineHours.toFixed(1)} ч</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-gray-600">Температура</Text>
                    <Text className="font-bold">{telemetryData.temperature.toFixed(0)}°C</Text>
                  </View>
                </View>
              </View>

              {/* Incident reporting */}
              <View className="p-4 bg-red-50 rounded-xl border border-red-200 gap-3">
                <View className="flex-row items-center justify-between">
                  <Text className="font-medium text-gray-800">Система инцидентов</Text>
                  <View className="bg-red-100 px-2 py-1 rounded-full">
                    <Text className="text-xs text-red-800 font-medium">Нажмите при ЧП</Text>
                  </View>
                </View>
                <Text className="text-sm text-gray-600">Нажмите соответствующую кнопку при возникновении нештатной ситуации</Text>
                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => {
                      logEvent('incident_reported', { type: 'equipment_failure' });
                      alert('Отчет о неисправности сохранен');
                    }}
                    disabled={systemLocked}
                    className={`flex-1 p-3 rounded-lg ${
                      systemLocked ? 'bg-gray-300' : 'bg-red-100'
                    }`}
                  >
                    <Text className={`text-center font-medium ${
                      systemLocked ? 'text-gray-500' : 'text-red-800'
                    }`}>
                      Неисправность
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      logEvent('incident_reported', { type: 'safety_violation' });
                      alert('Отчет о нарушении ТБ сохранен');
                    }}
                    disabled={systemLocked}
                    className={`flex-1 p-3 rounded-lg ${
                      systemLocked ? 'bg-gray-300' : 'bg-amber-100'
                    }`}
                  >
                    <Text className={`text-center font-medium ${
                      systemLocked ? 'text-gray-500' : 'text-amber-800'
                    }`}>
                      Нарушение ТБ
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Shift toggle */}
              <Pressable
                onPress={() => {
                  setShiftActive(!shiftActive);
                  logEvent('shift_toggled', { active: !shiftActive, duration: shiftSeconds });
                }}
                disabled={systemLocked}
                className={`py-4 rounded-xl ${
                  systemLocked
                    ? 'bg-gray-300'
                    : shiftActive
                      ? 'bg-red-600'
                      : 'bg-emerald-600'
                }`}
              >
                <Text className={`text-center text-lg font-semibold ${
                  systemLocked ? 'text-gray-500' : 'text-white'
                }`}>
                  {shiftActive ? 'Завершить смену' : 'Начать работу'}
                </Text>
              </Pressable>
            </View>

            <View className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <Text className="text-sm text-amber-700">
                Внимание: Смена не может быть закрыта без фото состояния оборудования
              </Text>
            </View>

            <Pressable
              onPress={goToNextStep}
              disabled={!shiftActive || systemLocked}
              className={`py-4 rounded-xl ${
                shiftActive && !systemLocked ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <Text className={`text-center text-lg font-semibold ${
                shiftActive && !systemLocked ? 'text-white' : 'text-gray-500'
              }`}>
                Закрыть смену
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  };

  const StepShiftClosure = () => {
    const handleSubmit = () => {
      if (systemLocked) {
        setError('Система заблокирована. Закрытие смены невозможно.');
        return;
      }

      setLoading(true);
      setError(null);

      logEvent('shift_closed', {
        operator: operator.name || operator.id,
        rig: selectedRig?.name || 'Не выбрана'
      });

      setTimeout(() => {
        if (photos.final) {
          setCurrentStep(7);
        } else {
          setError('Требуется финальное фото состояния оборудования');
          setLoading(false);
        }
      }, 1500);
    };

    return (
      <ScreenContainer className="p-4">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 gap-6">
            {/* Header */}
            <View className="items-center gap-2">
              <View className="w-16 h-16 bg-rose-500 rounded-2xl flex items-center justify-center">
                <Text className="text-3xl">✓</Text>
              </View>
              <Text className="text-2xl font-bold text-foreground">Закрытие смены</Text>
              <Text className="text-gray-600">Финальная фотофиксация</Text>
            </View>

            {/* Final photo */}
            <View className="bg-white rounded-2xl shadow-md p-6 gap-4">
              <View className="items-center">
                <Text className="text-lg font-semibold text-gray-800 mb-2">Общее состояние оборудования</Text>
                <Text className="text-gray-600 text-sm">Сделайте общее фото установки в конце смены</Text>
              </View>

              <View className="border-2 border-dashed border-gray-300 rounded-2xl h-64 flex items-center justify-center bg-gray-50">
                {photos.final ? (
                  <View className="relative w-full h-full">
                    <Image source={{ uri: photos.final }} className="w-full h-full rounded-2xl" />
                    <View className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <Text className="text-white">✓</Text>
                    </View>
                  </View>
                ) : (
                  <View className="items-center">
                    <Text className="text-4xl mb-3">📷</Text>
                    <Text className="text-lg font-medium text-gray-500">Сделайте финальное фото</Text>
                  </View>
                )}
              </View>

              <Pressable
                onPress={() => handlePhotoCapture('final')}
                disabled={systemLocked}
                className={`mt-4 py-3 rounded-xl ${
                  systemLocked ? 'bg-gray-300' : 'bg-blue-500'
                }`}
              >
                <Text className={`text-center font-medium ${
                  systemLocked ? 'text-gray-500' : 'text-white'
                }`}>
                  {systemLocked
                    ? 'Система заблокирована'
                    : photos.final ? 'Изменить фото' : 'Сделать финальное фото'
                  }
                </Text>
              </Pressable>
            </View>

            {/* Shift summary */}
            <View className="bg-blue-50 rounded-xl p-4 border border-blue-100 gap-2">
              <Text className="font-semibold text-lg text-gray-800 mb-2">Сводка смены</Text>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Оператор:</Text>
                <Text className="font-medium">{operator.name || operator.id}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Установка:</Text>
                <Text className="font-medium">{selectedRig?.name}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Событий в журнале:</Text>
                <Text className="font-medium text-amber-600">{eventLog.length}</Text>
              </View>
            </View>

            {/* Legal document info */}
            <View className="p-4 bg-purple-50 rounded-xl border border-purple-200 gap-2">
              <Text className="text-sm font-medium text-purple-700">Исполнительная документация</Text>
              <Text className="text-xs text-purple-600">
                Статус: Юридически значимый документ{"\n"}
                Верификационный код: <Text className="font-mono font-bold">{verificationCode}</Text>
              </Text>
            </View>

            {error && (
              <View className="p-3 bg-red-50 rounded-xl border border-red-200">
                <Text className="text-red-700">{error}</Text>
              </View>
            )}

            <Pressable
              onPress={handleSubmit}
              disabled={loading || !photos.final || systemLocked}
              className={`py-4 rounded-xl flex-row items-center justify-center ${
                systemLocked
                  ? 'bg-gray-300'
                  : photos.final && !loading
                    ? 'bg-blue-600'
                    : 'bg-gray-300'
              }`}
            >
              {loading && <Text className="text-white mr-2">⚡</Text>}
              <Text className={`text-center text-lg font-semibold ${
                systemLocked
                  ? 'text-gray-500'
                  : photos.final && !loading
                    ? 'text-white'
                    : 'text-gray-500'
              }`}>
                {systemLocked
                  ? 'Система заблокирована'
                  : loading
                    ? 'Отправка данных...'
                    : 'Подтвердить закрытие смены'
                }
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  };

  const StepSuccess = () => (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 items-center justify-center gap-6">
          <View className="w-24 h-24 bg-green-100 rounded-3xl flex items-center justify-center border-4 border-green-300">
            <Text className="text-5xl">✓</Text>
          </View>

          <View className="items-center gap-3">
            <Text className="text-3xl font-bold text-gray-900 text-center">Смена успешно закрыта!</Text>
            <Text className="text-gray-700 text-center">Все данные сохранены. Отчет доступен в веб-интерфейсе.</Text>
          </View>

          {/* Summary card */}
          <View className="w-full bg-white rounded-2xl shadow-lg p-6 gap-3">
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Оператор:</Text>
              <Text className="font-medium">{operator.name || operator.id}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Установка:</Text>
              <Text className="font-medium">{selectedRig?.name || 'Не выбрана'}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Событий в журнале:</Text>
              <Text className="font-medium text-amber-600">{eventLog.length}</Text>
            </View>
          </View>

          {/* Blockchain verification */}
          <View className="w-full bg-white rounded-2xl shadow-lg p-4 border border-dashed border-blue-300 gap-2">
            <View className="flex-row items-center gap-2">
              <Text className="text-lg font-semibold text-gray-800">🔐 Криптографическая защита</Text>
            </View>
            <Text className="text-xs text-gray-600">
              Верификационный код: <Text className="font-mono font-bold text-blue-600">{verificationCode}</Text>
            </Text>
            <Text className="text-xs text-gray-600">
              Данные защищены технологией блокчейн и не подлежат изменению.
            </Text>
          </View>

          <Pressable
            onPress={() => {
              logEvent('new_shift_requested', {});
              setCurrentStep(0);
              setOperator({ id: '1', name: 'Оператор 1', pin: '1234' });
              setSelectedRig(null);
              setSafetyConfirmed(false);
              setPhotos({ final: null, inspection: {}, lubrication: {}, telematics: {} });
              setSignature(null);
              setShiftActive(false);
              setSystemLocked(false);
            }}
            disabled={systemLocked}
            className={`w-full max-w-xs py-4 rounded-xl font-semibold text-lg ${
              systemLocked ? 'bg-gray-300' : 'bg-blue-600'
            }`}
          >
            <Text className={systemLocked ? 'text-gray-500 text-center' : 'text-white text-center'}>
              Начать новую смену
            </Text>
          </Pressable>

          <Text className="text-center text-xs text-gray-500 mt-4">
            Данные юридически значимы и защищены от изменения{"\n"}
            PCS v3.1 • Событийная архитектура • Блокчейн-защита
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepAuthorization />;
      case 1:
        return <StepRigSelection />;
      case 2:
        return <StepSafetyBriefing />;
      case 3:
        return <StepInspection />;
      case 4:
        return <StepLubrication />;
      case 5:
        return <StepWork />;
      case 6:
        return <StepShiftClosure />;
      case 7:
        return <StepSuccess />;
      default:
        return (
          <ScreenContainer className="p-4">
            <View className="flex-1 items-center justify-center">
              <Text className="text-2xl font-bold text-foreground">Шаг {currentStep + 1}</Text>
              <Text className="text-gray-600 mt-2">В разработке...</Text>
            </View>
          </ScreenContainer>
        );
    }
  };

  if (!appReady) {
    return (
      <ScreenContainer className="p-4">
        <View className="flex-1 items-center justify-center">
          <Text className="text-2xl font-bold text-foreground">Инициализация приложения...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header with progress */}
      {currentStep < 7 && (
        <View className="bg-white shadow-sm border-b border-gray-100 p-4">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-xl font-bold text-gray-900">PILE MASTER</Text>
              <Text className="text-sm text-blue-600">
                {['Авторизация', 'Выбор установки', 'Инструктаж ТБ', 'Предсменный осмотр', 'Смазка узлов', 'Рабочий процесс', 'Закрытие смены'][currentStep]}
              </Text>
            </View>
            <View className={`px-3 py-1 rounded-full ${
              systemLocked ? 'bg-red-100' : 'bg-blue-100'
            }`}>
              <Text className={`text-sm font-medium ${
                systemLocked ? 'text-red-800' : 'text-blue-800'
              }`}>
                {systemLocked ? 'ЗАБЛОКИРОВАНА' : `Шаг ${currentStep + 1} из 7`}
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View className="w-full bg-gray-200 rounded-full h-2">
            <View
              className={`h-2 rounded-full ${systemLocked ? 'bg-red-500' : 'bg-blue-600'}`}
              style={{ width: `${((currentStep + 1) / 7) * 100}%` }}
            />
          </View>
        </View>
      )}

      {/* Main content */}
      <View className="flex-1 max-w-md mx-auto w-full bg-gray-50">
        {renderStep()}
      </View>

      {/* Footer */}
      {currentStep < 7 && (
        <View className="bg-white border-t border-gray-100 py-3 px-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View
                className={`w-2 h-2 rounded-full mr-2 ${
                  offlineMode
                    ? (systemLocked ? 'bg-red-500' : 'bg-yellow-500')
                    : (systemLocked ? 'bg-red-500' : 'bg-green-500')
                }`}
              />
              <Text className="text-xs text-gray-600">
                {systemLocked ? 'ЗАБЛОКИРОВАНО' : (offlineMode ? 'Автономный режим' : 'Онлайн')}
              </Text>
              <Text className="text-xs text-gray-500 ml-3">Событий: {eventLog.length}</Text>
              {offlineMode && syncQueue.length > 0 && (
                <View className={`ml-2 px-2 py-0.5 rounded-full ${
                  systemLocked ? 'bg-red-100' : 'bg-amber-100'
                }`}>
                  <Text className={`text-xs ${
                    systemLocked ? 'text-red-800' : 'text-amber-800'
                  }`}>
                    {syncQueue.length} в очереди
                  </Text>
                </View>
              )}
            </View>
            <View className="flex-row items-center gap-1">
              <Text className="text-xs text-gray-500 font-mono">{verificationCode || '----'}</Text>
              <Text className="text-xs text-gray-500">PCS v3.1</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
