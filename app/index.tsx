import { setUserInfo } from "@/features/stateSlice";
import { font } from "@/theme";
import { useRouter } from "expo-router";
import React from "react";
import { SectionList, Text, TouchableOpacity, View } from "react-native";
import EStyleSheet from "react-native-extended-stylesheet";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useAppDispatch } from "./hooks";

const DATA = [
  {
    title: "Your Teams",
    data: [
      "NYK 95   3rd 5:42   72 GSW",
      "CHI 17   1st 13:50   15 MIN",
      "SAS   10:30 PM   LAL",
    ],
  },
  {
    title: "Today's Games",
    data: ["DEN 95   3rd 5:42   72 IDK", "CHI 17   1st 13:50   15 MIN"],
  },
];

const App = () => (
  <SafeAreaProvider>
    <SafeAreaView style={styles.container} edges={["top"]}>
      <SectionList
        sections={DATA}
        keyExtractor={(item, index) => item + index}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.title}>{item}</Text>
          </View>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.header}>{title}</Text>
        )}
      />
    </SafeAreaView>
  </SafeAreaProvider>
);

export default function Index() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{
          flex: 1,
          overflow: "hidden",
          borderRadius: 3,
          alignItems: "flex-end",
          justifyContent: "space-around",
          flexDirection: "row",
          paddingTop: 250,
          backgroundColor: "#0f172a",
        }}
      >
        <App></App>
      </SafeAreaView>
      <SafeAreaView
        style={{
          flex: 1,
          overflow: "hidden",
          borderRadius: 3,
          alignItems: "flex-end",
          justifyContent: "space-around",
          flexDirection: "row",
          paddingBottom: 10,
          backgroundColor: "#0f172a",
        }}
      >
        <TouchableOpacity onPress={() => router.navigate("/calendar")}>
          <Text style={styles.menuButton}>Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.navigate("/visualization")}>
          <Text style={styles.menuButton}>Stat Analytics</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.navigate("/team_select")}>
          <Text style={styles.menuButton}>Teams</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => dispatch(setUserInfo(null))}>
          <Text style={styles.menuButton}>Log Out</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = EStyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    height: 400,
  },
  item: {
    backgroundColor: "#0f252a",
    padding: 5,
    marginVertical: 5,
  },
  header: {
    fontSize: 25,
    backgroundColor: "#0f172a",
    color: "#FFFFFF",
    fontFamily: font.bold,
  },
  title: {
    fontSize: 30,
    color: "#FAF9F6",
    fontFamily: font.regular,
  },
  menuButton: {
    backgroundColor: "#303234",
    color: "white",
    fontSize: "1rem",
    padding: "0.5rem",
    borderRadius: 3,
    fontFamily: "JosefinSans_400Regular",
  },
});
