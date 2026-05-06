import { setUserInfo } from "@/features/stateSlice";
import { font } from "@/theme";
import { Dispatch, ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { Checkbox } from "expo-checkbox";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import EStyleSheet from "react-native-extended-stylesheet";
import { PersistPartial } from "redux-persist/es/persistReducer";
import { link } from "./_layout";
import { useAppDispatch } from "./hooks";
import { registerForPushNotificationsAsync } from "./push_notifications";

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

async function loginAfterSignup(
  username: string,
  password: string,
): Promise<any | null> {
  const response = await fetch(`${link}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });
  if (response.status !== 201) return null;
  return await safeJson(response);
}

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
  if (!username.trim() || !password.trim() || !password2.trim() || !email.trim()) {
    Alert.alert("Missing info", "Username, email, and both password fields are required.");
    return;
  }
  if (password !== password2) {
    Alert.alert("Passwords don't match", "Make sure both password fields are identical.");
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
    const userJson = await safeJson(response);
    if (userJson) {
      dispatch(setUserInfo(userJson));
      return true;
    }

    // Backend currently returns 201 with an empty body; immediately log in so we still get user JSON.
    const loginJson = await loginAfterSignup(username, password);
    if (loginJson) {
      dispatch(setUserInfo(loginJson));
      return true;
    }

    console.log("Signup succeeded, but could not log in automatically.");
    Alert.alert(
      "Account created",
      "Your account was created, but auto-login didn't complete. Try logging in with the same username/password.",
    );
    return true;
  } else if (response !== null) {
    const errText = await response.text().catch(() => "");
    console.log("Signup failed:", response.status, errText);
    Alert.alert(
      "Signup failed",
      `Server returned ${response.status}.\n\n${errText || "No error details."}`,
    );
    return false;
  }
  return false;
}

export default function Index() {
  const [username, changeUsername] = useState("");
  const [password, changePassword] = useState("");
  const [password2, changePassword2] = useState("");
  const [email, changeEmail] = useState("");
  const [avatarUrl, changeAvatarUrl] = useState("");
  const [isNotifed, changeNotifedStatus] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();
  return (
    <View
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
          onPress={async () => {
            const ok = await signup(
              username,
              password,
              password2,
              avatarUrl,
              email,
              isNotifed,
              dispatch,
            );
            if (ok) router.replace("/");
          }}
        >
          <Text>Submit</Text>
        </Pressable>
      </ScrollView>
      <Link href={"/login"} style={styles.title}>Have an existing account? Login</Link>
    </View>
  );
}
const styles = EStyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: 'black',
    backgroundColor: "white",
    padding: "1rem",
    margin: "1rem",
  },
  button: {
    borderWidth: 1,
    borderColor: 'black',
    backgroundColor: "#FFFFFF",
    color: "white",
    padding: "1rem",
    margin: "3rem"
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
