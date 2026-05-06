import { setUserInfo } from "@/features/stateSlice";
import { font } from "@/theme";
import { Dispatch, ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { Link } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import EStyleSheet from "react-native-extended-stylesheet";
import { PersistPartial } from "redux-persist/es/persistReducer";
import { link } from "./_layout";
import { useAppDispatch } from "./hooks";

async function safeJson(response: Response): Promise<any | null> {
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  if (!text) return null;
  if (!contentType.toLowerCase().includes("application/json")) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function login(
  username: string,
  password: string,
  dispatch: ThunkDispatch<
    {
      isLoggedIn: boolean;
    } & PersistPartial,
    undefined,
    UnknownAction
  > &
    Dispatch<UnknownAction>,
) {
  console.log(username);
  console.log(password);
  if (!username.trim() || !password.trim()) {
    Alert.alert("Missing info", "Username and password are required.");
    return;
  }
  let response = null;
  response = await fetch(`${link}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });
  if (response !== null && response.status === 201) {
    const data = await safeJson(response);
    if (data) {
      dispatch(setUserInfo(data));
      return;
    }
    Alert.alert("Login failed", "Server returned an invalid response.");
  } else if (response !== null) {
    const errText = await response.text().catch(() => "");
    Alert.alert(
      "Login failed",
      `Server returned ${response.status}.\n\n${errText || "No error details."}`,
    );
  }
}
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
        backgroundColor: "#0f172a",
      }}
    >
      <Text style={styles.header}>Sign in to Gamepulse</Text>
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
        onPress={() => login(username, password, dispatch)}
      >
        <Text>Submit</Text>
      </Pressable>
      <Link href={"/signup"} style={styles.title}>No Account? Create One</Link>
    </View>
  );
}
const styles = EStyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: 'black',
    backgroundColor: "white",
    padding: "1rem",
    margin: "1rem"
  },
  button: {
    borderWidth: 1,
    borderColor: 'black',
    backgroundColor: "#FFFFFF",
    padding: "1rem",
    margin: "1rem"
  },
  header: {
    fontSize: "2rem",
    color: "#FFFFFF",
    fontFamily: font.bold
  },
  title: {
    fontSize: 15,
    color: "#FAF9F6",
    fontFamily: font.regular
  }
});
