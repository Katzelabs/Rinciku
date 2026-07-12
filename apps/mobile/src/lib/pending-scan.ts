import type { PickedImage } from '@/lib/attachments';

// Hand-off slot for the scan flow: the picked image (base64, up to ~13 MB
// encoded) is far too big for route params, so the list screen stashes it here
// and pushes `new?scan=1`, and the new-transaction screen takes it on mount.
// Take-and-clear so a stale asset can never leak into a later plain "Add".
let pending: PickedImage | null = null;

export function setPendingScan(asset: PickedImage): void {
  pending = asset;
}

export function takePendingScan(): PickedImage | null {
  const asset = pending;
  pending = null;
  return asset;
}
