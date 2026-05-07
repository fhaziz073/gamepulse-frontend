import { setUserInfo } from "@/features/stateSlice";
import { font } from "@/theme";
import { Dispatch, ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { Checkbox } from "expo-checkbox";
import { Link } from "expo-router";
import { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import EStyleSheet from "react-native-extended-stylesheet";
import { SafeAreaView } from "react-native-safe-area-context";
import { PersistPartial } from "redux-persist/es/persistReducer";
import { link } from "./_layout";
import { useAppDispatch } from "./hooks";
import { registerForPushNotificationsAsync } from "./push_notifications";

async function signup(
  username: string,
  password: string,
  password2: string,
  avatarUrl: string,
  email: string,
  isNotifed: boolean,
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
  console.log(password2);
  console.log(avatarUrl);
  console.log(email);
  console.log(isNotifed);
  if (password !== password2) {
    console.log("Error: Passwords are not matching");
    return;
  }
  let notifToken = "None";
  if (isNotifed) {
    let token = await registerForPushNotificationsAsync();
    if (token !== undefined) {
      notifToken = token;
    }
  }
  let response = null;
  response = await fetch(`${link}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      password,
      avatarUrl,
      email,
      notif_token: notifToken,
    }),
  });
  console.log(response);
  if (response !== null && response.status === 201) {
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
      dispatch(setUserInfo(data));
    }
  }
}

export default function Index() {
  const [username, changeUsername] = useState("");
  const [password, changePassword] = useState("");
  const [password2, changePassword2] = useState("");
  const [email, changeEmail] = useState("");
  const [avatarUrl, changeAvatarUrl] = useState("");
  const [isNotifed, changeNotifedStatus] = useState(false);
  const dispatch = useAppDispatch();
  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0f172a",
      }}
    >
      <Text style={styles.header}>Welcome to Gamepulse!</Text>
      <ScrollView>
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
        <TextInput
          placeholder="Insert Email"
          style={styles.container}
          value={email}
          onChangeText={changeEmail}
        />
        <TextInput
          placeholder="Add Avatar Url"
          style={styles.container}
          value={avatarUrl}
          onChangeText={changeAvatarUrl}
        />
        {Platform.OS !== "web" ? (
          <View>
            <Checkbox value={isNotifed} onValueChange={changeNotifedStatus} />
            <Text>Turn On Notifications</Text>
          </View>
        ) : (
          <></>
        )}
        <Pressable
          style={styles.button}
          onPress={() =>
            signup(
              username,
              password,
              password2,
              avatarUrl,
              email,
              isNotifed,
              dispatch,
            )
          }
        >
          <Text>Submit</Text>
        </Pressable>
      </ScrollView>
      <Link href={"/login"} style={styles.title}>
        Have an existing account? Login
      </Link>
    </SafeAreaView>
  );
}
const styles = EStyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: "black",
    backgroundColor: "white",
    padding: "1rem",
    margin: "1rem",
  },
  button: {
    borderWidth: 1,
    borderColor: "black",
    backgroundColor: "#FFFFFF",
    color: "white",
    padding: "1rem",
    margin: "3rem",
  },
  header: {
    fontSize: "2rem",
    color: "#FFFFFF",
    fontFamily: font.bold,
  },
  title: {
    fontSize: 15,
    color: "#FAF9F6",
    fontFamily: font.regular,
  },
});
