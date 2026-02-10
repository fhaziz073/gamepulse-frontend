import { Stack } from "expo-router";
import EStyleSheet from "react-native-extended-stylesheet";
export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="calendar" options={{ headerTitle: "" }} />
      <Stack.Screen name="index" options={{ headerTitle: "Home" }} />
    </Stack>
  );
}
EStyleSheet.build({
  // always call EStyleSheet.build() even if you don't use global variables!
  $textColor: "#0275d8",
});
