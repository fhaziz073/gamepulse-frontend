import { IstokWeb_400Regular } from "@expo-google-fonts/istok-web";
import {
  JosefinSans_400Regular,
  useFonts,
} from "@expo-google-fonts/josefin-sans";
import { KantumruyPro_300Light } from "@expo-google-fonts/kantumruy-pro";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import EStyleSheet from "react-native-extended-stylesheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider } from "react-redux";
import { useAppSelector } from "./hooks";
import { store } from "./store";
import Constants from "expo-constants";

function getDevMachineIp(): string | null {
  // Example hostUri: "10.0.0.12:8081"
  const hostUri =
    (Constants.expoConfig as any)?.hostUri ??
    (Constants as any)?.expoConfig?.hostUri ??
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ??
    (Constants as any)?.manifest?.hostUri;
  if (!hostUri || typeof hostUri !== "string") return null;
  const host = hostUri.split(":")[0];
  if (!host) return null;
  return host;
}

export const link = (() => {
  // Allow overriding via env (works with Expo SDK 49+).
  const envUrl =
    (process.env as any).EXPO_PUBLIC_API_URL ||
    (process.env as any).EXPO_PUBLIC_BACKEND_URL;
  if (envUrl && typeof envUrl === "string") return envUrl.replace(/\/$/, "");

  // In local development, point the phone/emulator at the dev machine IP.
  if (__DEV__) {
    const ip = getDevMachineIp();
    if (ip) return `http://${ip}:3000`;
    // Fallbacks
    return "http://localhost:3000";
  }

  // Default (production/staging)
  return "https://gamepulse-backend.onrender.com";
})();
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    JosefinSans_400Regular,
    IstokWeb_400Regular,
    KantumruyPro_300Light,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }
  return (
    <GestureHandlerRootView>
      <Provider store={store}>
        <StackLayout />
      </Provider>
    </GestureHandlerRootView>
  );
}
function StackLayout() {
  const isLoggedIn = useAppSelector((state) => state.userInfo);
  return (
    <Stack>
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
      </Stack.Protected>
      <Stack.Protected guard={!!isLoggedIn}>
        <Stack.Screen
          name="index"
          options={{ headerShown: false, headerTitle: "Home" }}
        />
        <Stack.Screen name="profile" options={{ title: "Profile" }} />
        <Stack.Screen
          name="calendar"
          options={{ headerShown: false, headerTitle: "Calendar" }}
        />
        <Stack.Screen
          name="player"
          options={{ headerShown: false, headerTitle: "Player" }}
        />
        <Stack.Screen
          name="visualization"
          options={{ headerShown: false, headerTitle: "Stat Analytics" }}
        />
        <Stack.Screen
          name="team_select"
          options={{ headerShown: false, headerTitle: "Teams" }}
        />
        <Stack.Screen
          name="team"
          options={{ headerShown: false, headerTitle: "Team" }}
        />
        <Stack.Screen
          name="game"
          options={{ headerShown: false, headerTitle: "Game" }}
        />
      </Stack.Protected>
    </Stack>
  );
}
EStyleSheet.build({
  // always call EStyleSheet.build() even if you don't use global variables!
  $textColor: "#0275d8",
});
