import { useSyncExternalStore } from 'react';
import { getFxStatus, subscribeFx, type FxStatus } from '@rinciku/core';

export function useFxStatus(): FxStatus {
  return useSyncExternalStore(subscribeFx, getFxStatus, getFxStatus);
}
