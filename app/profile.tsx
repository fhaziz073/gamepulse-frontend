import { setUserInfo } from "@/features/stateSlice";
import { font } from "@/theme";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    FlatList,
    Image,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import EStyleSheet from "react-native-extended-stylesheet";
import { SafeAreaView } from "react-native-safe-area-context";
import { link } from "./_layout";
import { useAppDispatch, useAppSelector } from "./hooks";
import { ALL_NBA_TEAMS } from "./teams";

async function safeText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

async function patchJson(path: string, body: any) {
  return await fetch(`${link}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Merge updated preference fields into stored user (Redux + persist). */
function mergeUserPreference(
  userInfo: any,
  prefPatch: Record<string, unknown>,
) {
  const basePref = userInfo?.preference ?? {};
  return {
    ...userInfo,
    preference: {
      ...basePref,
      ...prefPatch,
    },
  };
}

/** Merge updated account fields into stored user (Redux + persist). */
function mergeUserAccount(userInfo: any, patch: Record<string, unknown>) {
  return {
    ...userInfo,
    ...patch,
  };
}

async function loginJson(username: string, password: string) {
  const res = await fetch(`${link}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (res.status !== 201) return null;
  const contentType = res.headers.get("content-type") ?? "";
  const text = await safeText(res);
  if (!contentType.toLowerCase().includes("application/json")) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const userInfo = useAppSelector((s) => s.userInfo as any);
  const preference = userInfo?.preference ?? null;

  const userId: string | null = (userInfo?.id ??
    userInfo?.["User ID"] ??
    null) as string | null;
  const currentUsername: string = (userInfo?.username ??
    userInfo?.Username ??
    "") as string;
  const currentEmail: string = (userInfo?.email ??
    userInfo?.Email ??
    "") as string;
  const currentAvatarUrl: string = (userInfo?.avatarUrl ??
    userInfo?.["Avatar URL"] ??
    "") as string;
  const [avatarOk, setAvatarOk] = useState(true);

  const [username, setUsername] = useState(currentUsername);
  const [email, setEmail] = useState(currentEmail);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);
  const [newPassword, setNewPassword] = useState("");
  const [currentPasswordForRefresh, setCurrentPasswordForRefresh] =
    useState("");

  const [gameStartNotifPref, setGameStartNotifPref] = useState<boolean>(
    Boolean(preference?.gameStartNotifPref ?? false),
  );
  const [ongoingGameNotifPref, setOngoingGameNotifPref] = useState<boolean>(
    Boolean(preference?.ongoingGameNotifPref ?? false),
  );

  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>(
    Array.isArray(preference?.favTeams) ? preference.favTeams : [],
  );

  const teams = useMemo(() => ALL_NBA_TEAMS, []);

  const syncFromUserInfo = useCallback(() => {
    const p = userInfo?.preference;
    if (p) {
      setGameStartNotifPref(Boolean(p.gameStartNotifPref));
      setOngoingGameNotifPref(Boolean(p.ongoingGameNotifPref));
      setSelectedTeamIds(Array.isArray(p.favTeams) ? [...p.favTeams] : []);
    }
    setUsername(currentUsername);
    setEmail(currentEmail);
    setAvatarUrl(currentAvatarUrl);
    setAvatarOk(true);
  }, [userInfo?.preference, currentUsername, currentEmail, currentAvatarUrl]);

  // Keep form in sync when Redux userInfo changes (after save or re-login).
  useEffect(() => {
    syncFromUserInfo();
  }, [syncFromUserInfo]);

  // Also resync whenever the screen regains focus.
  useFocusEffect(
    useCallback(() => {
      syncFromUserInfo();
    }, [syncFromUserInfo]),
  );

  const toggleTeam = (id: number) => {
    setSelectedTeamIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const requireUser = () => {
    if (!userId) {
      Alert.alert("Not logged in", "No user info found. Please log in again.");
      router.replace("/login");
      return null;
    }
    return userId;
  };

  const refreshUserInfo = async () => {
    if (!username.trim() || !currentPasswordForRefresh.trim()) return;
    const fresh = await loginJson(username.trim(), currentPasswordForRefresh);
    if (fresh) dispatch(setUserInfo(fresh));
  };

  const onSaveAccount = async () => {
    const id = requireUser();
    if (!id) return;

    const actions: Promise<Response>[] = [];
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const trimmedAvatar = avatarUrl.trim();

    if (trimmedUsername && trimmedUsername !== currentUsername) {
      actions.push(
        patchJson("/users/username", {
          userID: id,
          newUsername: trimmedUsername,
        }),
      );
    }
    if (trimmedEmail && trimmedEmail !== currentEmail) {
      actions.push(
        patchJson("/users/email", { userID: id, newEmail: trimmedEmail }),
      );
    }
    if (trimmedAvatar !== currentAvatarUrl) {
      actions.push(
        patchJson("/users/avatarUrl", {
          userID: id,
          newAvatarUrl: trimmedAvatar,
        }),
      );
    }
    if (newPassword.trim()) {
      actions.push(
        patchJson("/users/password", {
          userID: id,
          newPassword: newPassword.trim(),
        }),
      );
    }

    if (actions.length === 0) {
      Alert.alert("No changes", "Nothing to save.");
      return;
    }

    const results = await Promise.all(actions);
    const failed = results.filter((r) => !r.ok);
    if (failed.length) {
      const first = failed[0];
      const msg = await safeText(first);
      Alert.alert(
        "Save failed",
        `Server returned ${first.status}.\n\n${msg || "No details."}`,
      );
      return;
    }

    // Optimistically update local stored user (even if user didn't enter current password to refresh).
    dispatch(
      setUserInfo(
        mergeUserAccount(userInfo, {
          ...(trimmedUsername
            ? { username: trimmedUsername, Username: trimmedUsername }
            : {}),
          ...(trimmedEmail ? { email: trimmedEmail, Email: trimmedEmail } : {}),
          ...(trimmedAvatar
            ? { avatarUrl: trimmedAvatar, "Avatar URL": trimmedAvatar }
            : {}),
        }),
      ),
    );

    await refreshUserInfo();
    setNewPassword("");
    Alert.alert("Saved", "Account updated.");
  };

  const onSaveNotifications = async () => {
    const id = requireUser();
    if (!id) return;

    const res1 = await patchJson("/users/pref/gs", {
      userID: id,
      newGS: gameStartNotifPref,
    });
    if (!res1.ok) {
      Alert.alert("Save failed", `Games Starting pref: ${res1.status}`);
      return;
    }

    const res2 = await patchJson("/users/pref/ogc", {
      userID: id,
      newOGC: ongoingGameNotifPref,
    });
    if (!res2.ok) {
      Alert.alert("Save failed", `Ongoing Close Games pref: ${res2.status}`);
      return;
    }

    dispatch(
      setUserInfo(
        mergeUserPreference(userInfo, {
          gameStartNotifPref,
          ongoingGameNotifPref,
        }),
      ),
    );
    Alert.alert("Saved", "Notification preferences updated.");
  };

  const onSaveTeams = async () => {
    const id = requireUser();
    if (!id) return;

    const res = await patchJson("/users/pref/teams", {
      userID: id,
      newTeams: selectedTeamIds,
    });
    if (!res.ok) {
      const msg = await safeText(res);
      Alert.alert(
        "Save failed",
        `Server returned ${res.status}.\n\n${msg || "No details."}`,
      );
      return;
    }

    dispatch(
      setUserInfo(
        mergeUserPreference(userInfo, {
          favTeams: [...selectedTeamIds],
        }),
      ),
    );
    Alert.alert("Saved", "Favorite teams updated.");
  };

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>

        <View style={styles.avatarRow}>
          {currentAvatarUrl && avatarOk ? (
            <Image
              source={{ uri: currentAvatarUrl }}
              style={styles.avatar}
              onError={() => setAvatarOk(false)}
            />
          ) : (
            <View style={styles.avatarFallback} />
          )}
        </View>

        <Text style={styles.title}>Profile</Text>

        <Text style={styles.section}>Account</Text>
        <TextInput
          placeholder="Username"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Email"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Avatar URL (optional)"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={avatarUrl}
          onChangeText={setAvatarUrl}
          autoCapitalize="none"
        />
        <TextInput
          placeholder="New password (optional)"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={Platform.OS !== "web"}
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Current password (to refresh session after changes)"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={currentPasswordForRefresh}
          onChangeText={setCurrentPasswordForRefresh}
          secureTextEntry={Platform.OS !== "web"}
          autoCapitalize="none"
        />

        <Pressable style={styles.primaryBtn} onPress={onSaveAccount}>
          <Text style={styles.primaryBtnText}>Save account changes</Text>
        </Pressable>

        <Text style={styles.section}>Notifications</Text>
        <Pressable
          style={styles.toggleRow}
          onPress={() => setGameStartNotifPref((v) => !v)}
        >
          <Text style={styles.toggleLabel}>Games starting notifications</Text>
          <Text style={styles.toggleValue}>
            {gameStartNotifPref ? "On" : "Off"}
          </Text>
        </Pressable>
        <Pressable
          style={styles.toggleRow}
          onPress={() => setOngoingGameNotifPref((v) => !v)}
        >
          <Text style={styles.toggleLabel}>Close game notifications</Text>
          <Text style={styles.toggleValue}>
            {ongoingGameNotifPref ? "On" : "Off"}
          </Text>
        </Pressable>
        <Pressable style={styles.primaryBtn} onPress={onSaveNotifications}>
          <Text style={styles.primaryBtnText}>
            Save notification preferences
          </Text>
        </Pressable>

        <Text style={styles.section}>Favorite teams</Text>
        <Text style={styles.subtle}>
          Tap to select your teams, then press “Save favorite teams”.
        </Text>

        <FlatList
          data={teams}
          scrollEnabled={false}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => {
            const isSelected = selectedTeamIds.includes(
              ALL_NBA_TEAMS.findIndex((x) => x.id === item.id) + 1,
            );
            return (
              <Pressable
                style={styles.teamRow}
                onPress={() =>
                  toggleTeam(
                    ALL_NBA_TEAMS.findIndex((x) => x.id === item.id) + 1,
                  )
                }
              >
                <Text style={styles.teamName}>{item.name}</Text>
                <Text style={styles.teamSelected}>
                  {isSelected ? "Selected" : ""}
                </Text>
              </Pressable>
            );
          }}
        />

        <Pressable style={styles.primaryBtn} onPress={onSaveTeams}>
          <Text style={styles.primaryBtnText}>Save favorite teams</Text>
        </Pressable>
        <Pressable
          style={styles.logOutButton}
          onPress={() => dispatch(setUserInfo(null))}
        >
          <Text style={styles.menuButton}>Log Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = EStyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  avatarRow: {
    alignItems: "center",
    marginTop: 4,
    marginBottom: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#334155",
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#334155",
  },
  back: {
    color: "#FAF9F6",
    marginBottom: 8,
    fontFamily: font.regular,
  },
  title: {
    fontSize: 28,
    color: "#FFFFFF",
    marginBottom: 16,
    fontFamily: font.bold,
  },
  section: {
    fontSize: 18,
    color: "#FFFFFF",
    marginTop: 18,
    marginBottom: 8,
    fontFamily: font.bold,
  },
  subtle: {
    color: "#cbd5e1",
    marginBottom: 8,
    fontFamily: font.regular,
  },
  input: {
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0b1220",
    color: "#FFFFFF",
    padding: "0.75rem",
    marginBottom: "0.75rem",
    borderRadius: 8,
    fontFamily: font.regular,
  },
  primaryBtn: {
    backgroundColor: "#e2e8f0",
    borderRadius: 8,
    padding: "0.85rem",
    alignItems: "center",
    marginTop: 6,
  },
  primaryBtnText: {
    color: "#0f172a",
    fontFamily: font.bold,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#0b1220",
  },
  toggleLabel: {
    color: "#FFFFFF",
    fontFamily: font.regular,
  },
  toggleValue: {
    color: "#94a3b8",
    fontFamily: font.bold,
  },
  teamRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#0b1220",
  },
  teamName: {
    color: "#FFFFFF",
    fontFamily: font.regular,
  },
  teamSelected: {
    color: "#22c55e",
    fontFamily: font.bold,
  },
  menuButton: {
    color: "white",
    fontSize: "1rem",
    fontFamily: "JosefinSans_400Regular",
  },
  logOutButton: {
    backgroundColor: "#303234",
    borderRadius: 8,
    padding: "0.85rem",
    alignItems: "center",
    marginTop: 6,
  },
});
