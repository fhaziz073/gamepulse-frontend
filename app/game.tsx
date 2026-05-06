import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function GameScreen() {
  const router = useRouter();
  const { gameId } = useLocalSearchParams();

  // 🔹 Placeholder data (replace later with API call using gameId)
  const game = {
    team1: {
      id: 1,
      name: "Knicks",
      logo: "../assets/images/team_logos/New York Knicks.png",
    },
    team2: {
      id: 2,
      name: "Bulls",
      logo: "../assets/images/team_logos/Chicago Bulls.png",
    },
    score1: 113,
    score2: 79,
    quarter: "4th",
    time: "5:42",
  };

  const topPlayers = [
    { name: "J. Brunson", pts: 27.2 },
    { name: "K. Towns", pts: 19.8 },
  ];

  const stats = [
    { name: "J. Brunson", pts: 22, ast: 22, reb: 22 },
    { name: "K. Towns", pts: 19, ast: 19, reb: 19 },
    { name: "O. Anunoby", pts: 14, ast: 14, reb: 14 },
    { name: "M. Bridges", pts: 12, ast: 12, reb: 12 },
    { name: "M. McBride", pts: 13, ast: 13, reb: 13 },
    { name: "J. Hart", pts: 7, ast: 7, reb: 7 },
    { name: "J. Clarkson", pts: 8, ast: 8, reb: 8 },
    { name: "L. Shamet", pts: 3, ast: 3, reb: 3 },
  ];


  
  return (
    <View style={styles.container}>
      {/* 🔙 Back Button */}
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>
      

      {/* 🏀 Game Title */}
      <Text style={styles.title}>
        {game.team1.name} @ {game.team2.name}
      </Text>

      {/* 🟠 Score Section */}
      <View style={styles.scoreRow}>
        {/* Team 1 */}
        <TouchableOpacity
          style={styles.team}
          onPress={() =>
            router.push({
              pathname: "/team",
              params: { teamId: game.team1.id },
            })
          }
        >
          <Image source={{ uri: game.team1.logo }} style={styles.logo} />
          <Text style={styles.score}>{game.score1}</Text>
        </TouchableOpacity>

        {/* Game Info */}
        <View style={styles.gameInfo}>
          <Text style={styles.gameText}>
            {game.quarter} {game.time}
          </Text>
        </View>

        {/* Team 2 */}
        <TouchableOpacity
          style={styles.team}
          onPress={() =>
            router.push({
              pathname: "/team",
              params: { teamId: game.team1.id },
            })
          }
        >
          <Image source={{ uri: game.team2.logo }} style={styles.logo} />
          <Text style={styles.score}>{game.score2}</Text>
        </TouchableOpacity>
      </View>

      {/* ⭐ Top Players */}
      <Text style={styles.section}>Top Players</Text>
      <View style={styles.topPlayers}>
        {topPlayers.map((p, i) => (
        <TouchableOpacity
          key={i}
          style={styles.playerCard}
          onPress={() =>
            router.push({
              pathname: "/player",
              params: { playerId: i},
            })
          }
        >
          <Text style={styles.playerName}>{p.name}</Text>
          <Text>{p.pts} Pts.</Text>
        </TouchableOpacity>
      ))}
      </View>

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
 
      {stats.map((p, i) => (
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
      ))}
      </View>
    </View>
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
