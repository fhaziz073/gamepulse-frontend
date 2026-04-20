import { setUserInfo } from "@/features/stateSlice";
import { useRouter } from "expo-router";
import { Button, Text, View } from "react-native";
import { useAppDispatch } from "./hooks";
export default function Index() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
      <Button
        title="Go to Calendar"
        onPress={() => router.navigate("/calendar")}
      />
      <Button
        title="Go to Preferences"
        onPress={() => router.navigate("/preferences")}
      />
      <Button title="Go to Player" onPress={() => router.navigate("/player")} />
      <Button
        title="Log Out"
        onPress={() => {
          dispatch(setUserInfo(null));
        }}
      />
    </View>
  );
}
