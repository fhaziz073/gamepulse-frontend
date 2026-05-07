import { NBAGame, NBAPlayer, NBAStats } from "@balldontlie/sdk";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { link } from "./_layout";
import { ALL_NBA_TEAMS } from "./teams";

export default function GameScreen() {
  const router = useRouter();
  const { gameId, teamId } = useLocalSearchParams();
  console.log(gameId);
  console.log(teamId);
  const [game, setGame] = useState<NBAGame | null>(null);
  const [stats, setStats] = useState<NBAStats[]>([]);
  const [topPlayers, setTopPlayers] = useState<NBAStats[]>([]);
  useEffect(() => {
    async function getGame() {
      if (teamId) {
        const gameResult: NBAGame = await (
          await fetch(`${link}/calendar/${teamId}/next`)
        ).json();
        console.log(gameResult);
        setGame(gameResult);
      } else if (gameId) {
        const gameResult: NBAGame = await (
          await fetch(`${link}/games/${gameId}`)
        ).json();
        console.log(gameResult);
        setGame(gameResult);
      }
    }
    getGame();
  }, [gameId, teamId]);
  useEffect(() => {
    async function getGame() {
      if (game) {
        const [homePlayers, visitorPlayers]: [NBAPlayer[], NBAPlayer[]] =
          await Promise.all([
            fetch(`${link}/teams/?ids=${game!.home_team.id}`).then((r) =>
              r.json(),
            ),
            fetch(`${link}/teams/?ids=${game!.visitor_team.id}`).then((r) =>
              r.json(),
            ),
          ]);
        const players = homePlayers.concat(visitorPlayers);
        const results = await Promise.all(
          players.map(async (player) => {
            const text = await fetch(
              `${link}/players/${player.id}/stats/${game!.id}`,
            ).then((r) => r.text());

            if (!text) return null;
            try {
              return JSON.parse(text) as NBAStats;
            } catch {
              console.warn(`Invalid JSON for player ${player.id}`);
              return null;
            }
          }),
        );
        const validStats = results.filter((s): s is NBAStats => s !== null);
        const top: NBAStats[] = [];
        for (const stat of validStats) {
          if (top.length < 2) {
            top.push(stat);
          } else if (stat.pts > top[0].pts) {
            top[0] = stat;
          } else if (stat.pts > top[1].pts) {
            top[1] = stat;
          }
        }

        setStats(validStats);
        setTopPlayers([...top]);
      }
    }
    getGame();
  }, [game]);
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>
        {game?.visitor_team.name} @ {game?.home_team.name}
      </Text>
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
            {!isNaN(new Date(game?.status).getTime())
              ? new Date(game?.status).toLocaleDateString() +
                " " +
                new Date(game?.status).toLocaleTimeString()
              : ""}
          </Text>
          <Text style={styles.gameText}>{game?.time}</Text>
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
      {topPlayers.length > 0 ? (
        <View>
          <Text style={styles.section}>Top Players</Text>
          <View style={styles.topPlayers}>
            {topPlayers ? (
              topPlayers.map((p, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.playerCard}
                  onPress={() =>
                    router.push({
                      pathname: "/player",
                      params: { playerId: p.player.id },
                    })
                  }
                >
                  <Text style={styles.playerName}>
                    {p.player.first_name + " " + p.player.last_name}
                  </Text>
                  <Text>{p.pts} Pts.</Text>
                </TouchableOpacity>
              ))
            ) : (
              <></>
            )}
          </View>
        </View>
      ) : (
        <></>
      )}
      <ScrollView>
        {stats.length > 0 ? (
          <View>
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

              {stats ? (
                stats.map((p, i) => (
                  <View key={i} style={styles.row}>
                    <TouchableOpacity
                      style={[styles.cell, styles.nameCol]}
                      onPress={() =>
                        router.push({
                          pathname: "/player",
                          params: { playerId: p.player.id },
                        })
                      }
                    >
                      <Text style={styles.nameText}>
                        {p.player.first_name + " " + p.player.last_name}
                      </Text>
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
                ))
              ) : (
                <></>
              )}
            </View>
          </View>
        ) : (
          <></>
        )}
      </ScrollView>
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
    flexDirection: "column",
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
    alignItems: "center",
  },

  nameText: {
    alignSelf: "flex-start",
  },

  centerText: {
    textAlign: "center",
  },
});
