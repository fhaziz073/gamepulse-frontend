import { setUserInfo } from "@/features/stateSlice";
import { useRouter } from "expo-router";
import { Button, View } from "react-native";
import { useAppDispatch } from "./hooks";
export default function Index() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  return (
    <View
      style={{
        flex: 1,
        overflow: "hidden",
        borderRadius: 3,
        alignItems: "flex-end",
        justifyContent: "space-around",
        flexDirection: "row",
        paddingBottom: 15,
        backgroundColor: "#708090",
      }}
    >
      <View style={{ flexDirection: "column" }}>
        <Button
          title="Calendar"
          onPress={() => router.navigate("/calendar")}
          color={"#303234"}
        />
      </View>
      <View style={{ flexDirection: "column" }}>
        <Button
          title="Preferences"
          onPress={() => router.navigate("/preferences")}
          color={"#303234"}
        />
      </View>
      <View style={{ flexDirection: "column" }}>
        <Button
          title="Player"
          onPress={() => router.navigate("/player")}
          color={"#303234"}
        />
      </View>
      <View style={{ flexDirection: "column" }}>
        <Button
          title="Visualization"
          onPress={() => router.navigate("/visualization")}
          color={"#303234"}
        />
      </View>
      <View style={{ flexDirection: "column" }}>
        <Button
          title="Log Out"
          onPress={() => dispatch(setUserInfo(null))}
          color={"#303234"}
        />
      </View>
    </View>
  );
}
