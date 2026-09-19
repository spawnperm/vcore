import { useState, useCallback } from 'react';
import { UxReviewPin } from '../domain/review/model';
import { reviewRepository } from '../infrastructure/repositories/reviewRepository';

export function useUxReviewContext(selectedScreenId: string) {
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [pins, setPins] = useState<UxReviewPin[]>(() => reviewRepository.getAll());
  const [pendingPinPos, setPendingPinPos] = useState<{ x: number; y: number } | null>(null);
  const [newPinText, setNewPinText] = useState('');

  const currentScreenPins = pins.filter((p) => p.screenId === selectedScreenId);

  const addPin = useCallback(() => {
    if (!pendingPinPos || !newPinText.trim()) return;

    const pin = new UxReviewPin({
      id: `pin-${Date.now()}`,
      screenId: selectedScreenId,
      xPercent: pendingPinPos.x,
      yPercent: pendingPinPos.y,
      author: 'Иван Петров (Архитектор)',
      text: newPinText.trim(),
      time: 'Только что',
      status: 'open',
    });

    reviewRepository.add(pin);
    setPins([...reviewRepository.getAll()]);
    setPendingPinPos(null);
    setNewPinText('');
  }, [pendingPinPos, newPinText, selectedScreenId]);

  const removePin = useCallback((pinId: string) => {
    reviewRepository.remove(pinId);
    setPins([...reviewRepository.getAll()]);
  }, []);

  return {
    isReviewMode,
    setIsReviewMode,
    currentScreenPins,
    pendingPinPos,
    setPendingPinPos,
    newPinText,
    setNewPinText,
    addPin,
    removePin,
  };
}
