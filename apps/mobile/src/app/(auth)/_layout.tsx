import { Stack } from 'expo-router';

export default function AuthLayout() {
  // ios_from_right replaces Android's system zoom transition; no-op on iOS.
  return (
    <Stack
      screenOptions={{ headerShown: false, animation: 'ios_from_right' }}
    />
  );
}
