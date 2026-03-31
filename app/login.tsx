import { changeLoginStatus, setNotifToken } from "@/features/stateSlice";
import { Dispatch, ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import EStyleSheet from "react-native-extended-stylesheet";
import { PersistPartial } from "redux-persist/es/persistReducer";
import { link } from "./_layout";
import { useAppDispatch } from "./hooks";
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
  let response = null;
  const authHeader = "Basic " + btoa(`${username}:${password}`);
  response = await fetch(`${link}/auth/login`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });
  if (response !== null && response.status === 201) {
    let data = await response.json();
    console.log(data);
    dispatch(changeLoginStatus());
    dispatch(setNotifToken(data["Notification Token"]));
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
        backgroundColor: "#00ced1",
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
    backgroundColor: "#045c5a",
    color: "white",
    padding: "1rem",
    margin: "1rem",
  },
  header: {
    fontSize: "2rem",
  },
});
