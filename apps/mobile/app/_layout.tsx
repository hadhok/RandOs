import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { HikeStoreProvider } from "../hooks/useHikeStore";

export default function RootLayout() {
  return (
    <HikeStoreProvider>
      <StatusBar style="light" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </HikeStoreProvider>
  );
}
