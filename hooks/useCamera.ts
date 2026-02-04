import { useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';

interface PhotoData {
  uri: string;
  width: number;
  height: number;
  timestamp: string;
  size: number; // in bytes
}

/**
 * Custom hook for camera functionality
 * Handles photo capture, compression, and batch operations
 * Note: This is a mock implementation. For real camera, integrate expo-camera
 */
export function useCamera() {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [isCameraReady, setIsCameraReady] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<any>(null);

  const capturePhoto = useCallback(async (): Promise<PhotoData | null> => {
    try {
      setIsCapturing(true);
      setCameraError(null);

      // Mock photo capture - in production, use expo-camera
      const mockPhoto: PhotoData = {
        uri: `file://mock-photo-${Date.now()}.jpg`,
        width: 1920,
        height: 1080,
        timestamp: new Date().toISOString(),
        size: Math.floor(Math.random() * 5000000) + 1000000, // 1-5MB
      };

      setPhotos(prev => [...prev, mockPhoto]);
      return mockPhoto;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to capture photo';
      setCameraError(errorMessage);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const captureMultiplePhotos = useCallback(async (count: number): Promise<PhotoData[]> => {
    const capturedPhotos: PhotoData[] = [];

    for (let i = 0; i < count; i++) {
      const photo = await capturePhoto();
      if (photo) {
        capturedPhotos.push(photo);
      }
      // Small delay between captures
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return capturedPhotos;
  }, [capturePhoto]);

  const compressPhoto = useCallback(async (photoUri: string, quality: number = 0.7): Promise<PhotoData | null> => {
    try {
      // Mock compression - in production, use expo-image-manipulator
      const mockCompressed: PhotoData = {
        uri: photoUri,
        width: 1280,
        height: 720,
        timestamp: new Date().toISOString(),
        size: Math.floor(Math.random() * 2000000) + 500000, // 0.5-2MB
      };

      return mockCompressed;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to compress photo';
      setCameraError(errorMessage);
      return null;
    }
  }, []);

  const deletePhoto = useCallback((photoUri: string) => {
    setPhotos(prev => prev.filter(p => p.uri !== photoUri));
  }, []);

  const clearPhotos = useCallback(() => {
    setPhotos([]);
  }, []);

  const getTotalPhotoSize = useCallback((): number => {
    return photos.reduce((sum, photo) => sum + photo.size, 0);
  }, [photos]);

  const getTotalPhotoSizeInMB = useCallback((): string => {
    const bytes = getTotalPhotoSize();
    return (bytes / 1024 / 1024).toFixed(2);
  }, [getTotalPhotoSize]);

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    try {
      // Mock permission request - in production, use expo-permissions
      if (Platform.OS === 'web') {
        return true;
      }
      return true;
    } catch (error) {
      setCameraError('Camera permission denied');
      return false;
    }
  }, []);

  const rotatePhoto = useCallback((photoUri: string, degrees: number): PhotoData | null => {
    const photo = photos.find(p => p.uri === photoUri);
    if (!photo) return null;

    // Mock rotation - in production, use expo-image-manipulator
    const rotated: PhotoData = {
      ...photo,
      width: degrees % 180 === 90 ? photo.height : photo.width,
      height: degrees % 180 === 90 ? photo.width : photo.height,
    };

    setPhotos(prev =>
      prev.map(p => p.uri === photoUri ? rotated : p)
    );

    return rotated;
  }, [photos]);

  const cropPhoto = useCallback((photoUri: string, x: number, y: number, width: number, height: number): PhotoData | null => {
    const photo = photos.find(p => p.uri === photoUri);
    if (!photo) return null;

    // Mock crop - in production, use expo-image-manipulator
    const cropped: PhotoData = {
      ...photo,
      width,
      height,
    };

    setPhotos(prev =>
      prev.map(p => p.uri === photoUri ? cropped : p)
    );

    return cropped;
  }, [photos]);

  return {
    photos,
    isCameraReady,
    cameraError,
    isCapturing,
    cameraRef,
    capturePhoto,
    captureMultiplePhotos,
    compressPhoto,
    deletePhoto,
    clearPhotos,
    getTotalPhotoSize,
    getTotalPhotoSizeInMB,
    requestCameraPermission,
    rotatePhoto,
    cropPhoto,
  };
}
