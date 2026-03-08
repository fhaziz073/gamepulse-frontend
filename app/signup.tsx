import { changeLoginStatus } from "@/features/stateSlice";
import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import EStyleSheet from "react-native-extended-stylesheet";
import { useAppDispatch } from "./hooks";
export default function Index() {
  const [username, changeUsername] = useState("");
  const [password, changePassword] = useState("");
  const [password2, changePassword2] = useState("");
  const dispatch = useAppDispatch();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#00ced1"
      }}
    >
      <Text style={styles.header}>Welcome to Gamepulse!</Text>
      <TextInput
        placeholder="Create Username"
        style={styles.container}
        value={username}
        onChangeText={changeUsername}
      />
      <TextInput
        placeholder="Create Password"
        style={styles.container}
        value={password}
        onChangeText={changePassword}
      />
      <TextInput
        placeholder="Confirm Password"
        style={styles.container}
        value={password2}
        onChangeText={changePassword2}
      />
      <Pressable
        style={styles.button}
        onPress={() => dispatch(changeLoginStatus())}
      >
        Submit
      </Pressable>
      <Link href={"/login"}>Have an existing account? Login</Link>
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
    backgroundColor: "#045c5a",
    color: "white",
    padding: "1rem",
    margin: "1rem",
  },
  header: {
    fontSize: "2rem",
  },
});
