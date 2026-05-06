import { NBAGame } from "@balldontlie/sdk";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { link } from "./_layout";
import { ALL_NBA_TEAMS } from "./teams";

export default function GameScreen() {
  const router = useRouter();
  const { gameId } = useLocalSearchParams();
  const [game, setGame] = useState<NBAGame | null>(null);
  useEffect(() => {
    async function getGame() {
      const gameResult: NBAGame = await (
        await fetch(`${link}/calendar/${gameId}/next`)
      ).json();
      console.log(gameResult);
      setGame(gameResult);
    }
    getGame();
  }, [gameId]);
  return (
    <SafeAreaView style={styles.container}>
      {/* 🔙 Back Button */}
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>

      {/* 🏀 Game Title */}
      <Text style={styles.title}>
        {game?.visitor_team.name} @ {game?.home_team.name}
      </Text>

      {/* 🟠 Score Section */}
      <View style={styles.scoreRow}>
        {/* Team 1 */}
        <TouchableOpacity
          style={styles.team}
          onPress={() =>
            router.push({
              pathname: "/team",
              params: { teamId: game?.visitor_team.id },
            })
          }
        >
          <Image
            source={ALL_NBA_TEAMS[game ? game.visitor_team.id - 1 : 0].logo}
            style={styles.logo}
          />
          <Text style={styles.score}>{game?.visitor_team_score}</Text>
        </TouchableOpacity>

        {/* Game Info */}
        <View style={styles.gameInfo}>
          <Text style={styles.gameText}>
            {game?.status} {game?.time}
          </Text>
        </View>

        {/* Team 2 */}
        <TouchableOpacity
          style={styles.team}
          onPress={() =>
            router.push({
              pathname: "/team",
              params: { teamId: game?.home_team.id },
            })
          }
        >
          <Image
            source={ALL_NBA_TEAMS[game ? game.home_team.id - 1 : 0].logo}
            style={styles.logo}
          />
          <Text style={styles.score}>{game?.home_team_score}</Text>
        </TouchableOpacity>
      </View>

      {/* ⭐ Top Players */}
      <Text style={styles.section}>Top Players</Text>
      {/* <View style={styles.topPlayers}>
        {topPlayers.map((p, i) => (
          <TouchableOpacity
            key={i}
            style={styles.playerCard}
            onPress={() =>
              router.push({
                pathname: "/player",
                params: { playerId: i },
              })
            }
          >
            <Text style={styles.playerName}>{p.name}</Text>
            <Text>{p.pts} Pts.</Text>
          </TouchableOpacity>
        ))}
      </View> */}

      {/* 📊 Stats Table */}
      <View style={styles.table}>
        <View style={styles.rowHeader}>
          <View style={[styles.cell, styles.nameCol]}>
            <Text style={styles.nameText}>Name</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.centerText}>Pts.</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.centerText}>Ast.</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.centerText}>Reb.</Text>
          </View>
        </View>

        {/* {stats.map((p, i) => (
          <View key={i} style={styles.row}>
            <TouchableOpacity
              style={[styles.cell, styles.nameCol]}
              onPress={() =>
                router.push({
                  pathname: "/player",
                  params: { playerId: i },
                })
              }
            >
              <Text style={styles.nameText}>{p.name}</Text>
            </TouchableOpacity>

            <View style={styles.cell}>
              <Text style={styles.centerText}>{p.pts}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.centerText}>{p.ast}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.centerText}>{p.reb}</Text>
            </View>
          </View>
        ))} */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "orange",
  },
  back: {
    fontSize: 16,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    textAlign: "center",
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 20,
  },
  team: {
    alignItems: "center",
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  score: {
    fontSize: 40,
  },
  gameInfo: {
    alignItems: "center",
  },
  gameText: {
    fontSize: 16,
  },
  section: {
    fontSize: 20,
    marginVertical: 10,
  },
  topPlayers: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  playerCard: {
    backgroundColor: "#eee",
    padding: 12,
    borderRadius: 10,
    width: "48%",
  },
  playerName: {
    fontWeight: "bold",
  },
  table: {
    backgroundColor: "#eee",
    padding: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  rowHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    marginBottom: 6,
  },
  name: {
    width: 120,
  },
  nameCol: {
    flex: 2,
  },

  cell: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center", // center everything by default
  },

  nameText: {
    alignSelf: "flex-start", // 👈 forces left alignment
  },

  centerText: {
    textAlign: "center",
  },
});
