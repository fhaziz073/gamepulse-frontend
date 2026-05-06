import { NBAPlayer } from "@balldontlie/sdk";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { link } from "./_layout";
import { event } from "./types";

export default function TeamScreen() {
  const router = useRouter();
  const { teamId } = useLocalSearchParams();

  const [players, setPlayers] = useState<NBAPlayer[]>([]);
  const [nextGame, setNextGame] = useState<event | null>(null);

  useEffect(() => {
    loadPlaceholderData();
  }, []);

  const loadPlaceholderData = async () => {
    const players: NBAPlayer[] = await (
      await fetch(`${link}/teams?ids=${teamId}`)
    ).json();
    const game: event = (
      await (await fetch(`${link}/calendar/${teamId}`)).json()
    )[0];
    console.log(game);
    setPlayers(players);
    setNextGame(game);
  };

  // 👤 Player row
  const renderPlayer = ({ item }: { item: NBAPlayer }) => (
    <TouchableOpacity
      style={styles.playerRow}
      onPress={() =>
        router.push({
          pathname: "/player",
          params: { playerId: item.id },
        })
      }
    >
      <Text style={styles.playerName}>
        {item.first_name + " " + item.last_name}
      </Text>
      <Text>{item.position}</Text>
      <Text>#{item.jersey_number}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 🔙 Back Button */}
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.backButton}>← Back</Text>
      </TouchableOpacity>

      {/* 🏀 Team Header */}
      <Text style={styles.teamName}>
        {players.length > 0 ? players[0].team.full_name : ""}
      </Text>

      {/* 📅 Next Game */}
      {nextGame && (
        <TouchableOpacity
          style={styles.gameCard}
          onPress={() =>
            router.push({
              pathname: "/game",
              params: { gameId: teamId },
            })
          }
        >
          <Text style={styles.sectionTitle}>Next Game</Text>
          <Text>{nextGame.title}</Text>
          <Text>{new Date(nextGame.start).toLocaleString()}</Text>
        </TouchableOpacity>
      )}

      {/* 👥 Player List */}
      <Text style={styles.sectionTitle}>Roster</Text>

      <FlatList
        data={players}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPlayer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#1e1e1e",
  },
  backButton: {
    color: "white",
    marginBottom: 10,
  },
  teamName: {
    fontSize: 28,
    color: "white",
    fontWeight: "bold",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    color: "white",
    marginVertical: 10,
  },
  gameCard: {
    backgroundColor: "#f97316",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  playerRow: {
    backgroundColor: "#eee",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  playerName: {
    fontWeight: "bold",
  },
});
