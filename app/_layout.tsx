import { Stack } from "expo-router";
import EStyleSheet from "react-native-extended-stylesheet";
export const isLoggedIn = false;
export default function RootLayout() {
  return (
    <Stack>
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
      </Stack.Protected>
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="calendar" options={{ headerTitle: "" }} />
        <Stack.Screen name="index" options={{ headerTitle: "Home" }} />
      </Stack.Protected>
    </Stack>
  );
}
EStyleSheet.build({
  // always call EStyleSheet.build() even if you don't use global variables!
  $textColor: "#0275d8",
});
