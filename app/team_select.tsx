import { useRouter } from "expo-router";
import React from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import EStyleSheet from "react-native-extended-stylesheet";
import { SafeAreaView } from "react-native-safe-area-context";
import { ALL_NBA_TEAMS } from "./teams";

export default function TeamsScreen() {
  const router = useRouter();

  const teams = ALL_NBA_TEAMS;

  const renderTeam = ({ item }: { item: (typeof ALL_NBA_TEAMS)[0] }) => (
    <TouchableOpacity
      style={styles.teamRow}
      onPress={() =>
        router.push({
          pathname: "/team",
          params: { teamId: ALL_NBA_TEAMS.indexOf(item) + 1 },
        })
      }
    >
      <Text style={styles.teamName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    /* Used ChatGPT for assistance with debugging this section*/
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.backButton}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Select a Team</Text>
      <FlatList
        data={teams}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTeam}
      />
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.navigate("/calendar")}>
          <Text style={styles.menuButton}>Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.navigate("/visualization")}>
          <Text style={styles.menuButton}>Stat Analytics</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = EStyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#0f172a",
  },
  backButton: {
    color: "white",
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    color: "white",
    marginBottom: 16,
  },
  teamRow: {
    backgroundColor: "#0f252a",
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
  },
  teamName: {
    fontSize: 20,
    color: "#FAF9F6",
  },
  navBar: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-around",
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
