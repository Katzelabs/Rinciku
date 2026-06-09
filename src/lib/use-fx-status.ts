import { useSyncExternalStore } from 'react';
import { getFxStatus, subscribeFx, type FxStatus } from './fx';

export function useFxStatus(): FxStatus {
  return useSyncExternalStore(subscribeFx, getFxStatus, getFxStatus);
}
