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
import { Provider } from "react-redux";
import { useAppSelector } from "./hooks";
import { store } from "./store";
export const link = "https://gamepulse-backend.onrender.com";
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
    <Provider store={store}>
      <StackLayout />
    </Provider>
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
        <Stack.Screen name="index" options={{ headerTitle: "Home" }} />
        <Stack.Screen name="calendar" options={{ headerTitle: "" }} />
      </Stack.Protected>
    </Stack>
  );
}
EStyleSheet.build({
  // always call EStyleSheet.build() even if you don't use global variables!
  $textColor: "#0275d8",
});
