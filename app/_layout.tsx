import { Stack } from "expo-router";
import EStyleSheet from "react-native-extended-stylesheet";
import { Provider } from "react-redux";
import { useAppSelector } from "./hooks";
import { store } from "./store";
export const link = "https://gamepulse-backend.onrender.com";
export default function RootLayout() {
  return (
    <Provider store={store}>
      <StackLayout />
    </Provider>
  );
}
function StackLayout() {
  const isLoggedIn = useAppSelector((state) => state.isLoggedIn);
  return (
    <Stack>
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
      </Stack.Protected>
      <Stack.Protected guard={isLoggedIn}>
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
