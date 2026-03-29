import { changeLoginStatus } from "@/features/stateSlice";
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
import { PersistPartial } from "redux-persist/es/persistReducer";
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
  if (Platform.OS === "android") {
    response = await fetch("https://gamepulse-backend.onrender.com/users", {
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
  } else {
    response = await fetch(`https://gamepulse-backend.onrender.com/users`, {
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
  }
  console.log(response);
  if (response !== null && response.status === 201) {
    dispatch(changeLoginStatus());
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
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#00ced1",
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
