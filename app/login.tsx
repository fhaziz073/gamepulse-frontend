import { changeLoginStatus } from "@/features/stateSlice";
import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import EStyleSheet from "react-native-extended-stylesheet";
import { useAppDispatch } from "./hooks";
export default function Index() {
  const dispatch = useAppDispatch();
  const [username, changeUsername] = useState("");
  const [password, changePassword] = useState("");
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={styles.header}>Sign In To Gamepulse</Text>
      <TextInput
        placeholder="Username"
        style={styles.container}
        value={username}
        onChangeText={changeUsername}
      />
      <TextInput
        placeholder="Password"
        style={styles.container}
        value={password}
        onChangeText={changePassword}
      />
      <Pressable
        style={styles.button}
        onPress={() => dispatch(changeLoginStatus())}
      >
        Submit
      </Pressable>
      <Link href={"/signup"}>No Account? Create One</Link>
    </View>
  );
}
const styles = EStyleSheet.create({
  container: {
    backgroundColor: "white",
    padding: "1rem",
    margin: "1rem",
  },
  button: {
    backgroundColor: "green",
    color: "white",
  },
  header: {
    fontSize: "2rem",
  },
});
