import { NBAPlayer, NBASeasonAverages } from "@balldontlie/sdk";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Image, Text, useWindowDimensions, View } from "react-native";
import EStyleSheet from "react-native-extended-stylesheet";
import { ScrollView } from "react-native-gesture-handler";
import { link } from "./_layout";
import { ALL_NBA_TEAMS } from "./teams";
import { event, game } from "./types";

export default function Player() {
  const [player, setPlayer] = useState<NBAPlayer[]>([]);
  const [playerSeasonAvgs, setPlayerSeasonAvgs] = useState<NBASeasonAverages[]>(
    [],
  );
  const [data, setData] = useState<event | null>(null);
  const [injury, setInjury] = useState<any[]>([]);
  const [stats, setStats] = useState<game[]>([]);
  const { width } = useWindowDimensions();
  useEffect(() => {
    async function getPlayer() {
      let response = null;
      response = await fetch(`${link}/players?firstName=Nikola&lastName=Jokic`);
      console.log(response);
      let players = await response.json();
      console.log(players);
      setPlayer(players);
    }
    getPlayer();
  }, []);
  useEffect(() => {
    async function getPlayerSeasonAvgs() {
      if (player.length !== 0) {
        let seasonAvgsResponse = await fetch(
          `${link}/players/${player[0].id}/seasonalStatAvgs`,
        );
        console.log(seasonAvgsResponse);
        let seasonAvgs = await seasonAvgsResponse.json();
        console.log(seasonAvgs);
        setPlayerSeasonAvgs(seasonAvgs);
        console.log(seasonAvgs);
      }
    }
    getPlayerSeasonAvgs();
  }, [player]);
  useEffect(() => {
    async function getNextGame() {
      try {
        let response = null;
        response = await fetch(`${link}/calendar/${player[0].id}`);
        console.log(response);
        let events = await response.json();
        console.log(events);
        for (let event of events) {
          const toLocal = (utcStr: string): string => {
            const date = new Date(utcStr.replace(" ", "T") + "Z");
            const pad = (n: number) => n.toString().padStart(2, "0");
            const localDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
            const localTime = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
            return `${localDate} ${localTime}`;
          };
          event.start = toLocal(event.start);
          event.end = toLocal(event.end);
        }
        setData(events[0]);
      } catch {
        console.log("Failed to fetch data");
        setData(null);
      }
    }
    getNextGame();
  }, [player]);
  useEffect(() => {
    async function getPlayerInjury() {
      try {
        let response = null;
        response = await fetch(`${link}/players/${player[0].id}/injury`);
        console.log(response);
        let injury = await response.json();
        console.log(injury);
        setInjury(injury);
      } catch {
        console.log("Failed to fetch data");
        setInjury([]);
      }
    }
    getPlayerInjury();
  }, [player]);
  useEffect(() => {
    async function getStats() {
      try {
        let response = null;
        response = await fetch(`${link}/players/${player[0].id}/stats`);
        console.log(response);
        let stats = await response.json();
        console.log(stats);
        setStats(stats);
      } catch {
        console.log("Failed to fetch data");
        setStats([]);
      }
    }
    getStats();
  }, [player]);
  return (
    <LinearGradient
      colors={["rgba(0,0,255,1)", "rgba(255, 236, 0, 1)"]}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexDirection: "column" }}>
        {input(player, playerSeasonAvgs, injury, data)}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 16,
            width: width - 32,
          }}
        >
          <View style={styles.marginFlatList}>
            <View style={styles.statsHeaderRow}>
              <Text style={styles.headerCell}>Date</Text>
              <Text style={styles.headerCell}>Opp</Text>
              <Text style={styles.headerCell}>Result</Text>
              <Text style={styles.headerCell}>MIN</Text>
              <Text style={styles.headerCell}>PTS</Text>
              <Text style={styles.headerCell}>REB</Text>
              <Text style={styles.headerCell}>AST</Text>
            </View>
            {stats.map((item) => (
              <View key={item.id.toString()} style={styles.statsRow}>
                <Text style={[styles.statsCell]}>{item.game.date}</Text>
                <Text style={styles.statsCell}>
                  {ALL_NBA_TEAMS[item.game.visitor_team_id].id}
                </Text>
                <Text style={styles.statsCell}>
                  {item.game.home_team_score}-{item.game.visitor_team_score}
                </Text>
                <Text style={styles.statsCell}>{item.min}</Text>
                <Text style={styles.statsCell}>{item.pts}</Text>
                <Text style={styles.statsCell}>{item.reb}</Text>
                <Text style={styles.statsCell}>{item.ast}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
const input = (
  player: NBAPlayer[],
  playerSeasonAvgs: NBASeasonAverages[],
  injury: any[],
  data: event | null,
) => {
  return (
    <View style={{ flexShrink: 1, flexDirection: "column" }}>
      <View style={{ flexDirection: "row", justifyContent: "space-evenly" }}>
        <Image
          style={styles.playerImage}
          resizeMode="contain"
          source={require("../assets/images/jokic.jpg")}
        />
        <View
          style={{
            flexDirection: "column",
            justifyContent: "space-evenly",
          }}
        >
          <Text style={styles.playerName}>Nikola Jokic</Text>
          <View
            style={{ flexDirection: "row", justifyContent: "space-around" }}
          >
            <Text style={styles.playerInfo}>
              {player.length !== 0 ? player[0].team.full_name : ""}
            </Text>
            <Text style={styles.playerInfo}>
              {player.length !== 0 ? player[0].position : ""}
            </Text>
            <Text style={styles.playerInfo}>
              {player.length !== 0 ? player[0].jersey_number : ""}
            </Text>
          </View>
          <View
            style={{ flexDirection: "row", justifyContent: "space-around" }}
          >
            <View style={styles.playerMeasurableRow}>
              <Text style={styles.playerMeasurableHeaders}>HT</Text>
              <Text style={styles.playerMeasurables}>
                {player.length !== 0 ? player[0].height : ""}
              </Text>
            </View>
            <View style={styles.playerMeasurableRow}>
              <Text style={styles.playerMeasurableHeaders}>Country</Text>
              <Text style={styles.playerMeasurables}>
                {player.length !== 0 ? player[0].country : ""}
              </Text>
            </View>
            <View style={styles.playerMeasurableRow}>
              <Text style={styles.playerMeasurableHeaders}>Weight</Text>
              <Text style={styles.playerMeasurables}>
                {player.length !== 0 ? player[0].weight : ""}
              </Text>
            </View>
          </View>
        </View>
      </View>
      {injury.length !== 0 ? (
        <View style={styles.injuryBar}>
          <Text style={styles.injuryText}>INJURY STATUS</Text>
          <Text style={styles.injuryText}>OUT (KNEE)</Text>
        </View>
      ) : (
        <View></View>
      )}
      <View style={styles.container}>
        <Text style={styles.seasonAvg}>2025-2026 Season Average</Text>
        <View style={{ flexDirection: "row", gap: 20 }}>
          <View style={{ flexDirection: "column" }}>
            <Text style={styles.seasonStat}>PTS</Text>
            <Text style={styles.seasonStatVal}>
              {playerSeasonAvgs.length !== 0
                ? playerSeasonAvgs[0].pts.toFixed(1)
                : ""}
            </Text>
          </View>
          <View style={{ flexDirection: "column" }}>
            <Text style={styles.seasonStat}>REB</Text>
            <Text style={styles.seasonStatVal}>
              {playerSeasonAvgs.length !== 0
                ? playerSeasonAvgs[0].reb.toFixed(1)
                : ""}
            </Text>
          </View>
          <View style={{ flexDirection: "column" }}>
            <Text style={styles.seasonStat}>AST</Text>
            <Text style={styles.seasonStatVal}>
              {playerSeasonAvgs.length !== 0
                ? playerSeasonAvgs[0].ast.toFixed(1)
                : ""}
            </Text>
          </View>
        </View>
      </View>
      {data ? (
        <View style={styles.container}>
          <Text style={styles.nextGameHeader}>Next Game</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
            <Image
              style={styles.teamLogo}
              resizeMode="contain"
              source={require("../assets/images/team_logos/Chicago Bulls.png")}
            />
            <Text style={styles.vs}>vs.</Text>
            <Image
              style={styles.teamLogo}
              source={require("../assets/images/team_logos/Denver Nuggets.png")}
            />
          </View>
          <Text style={styles.nextGameTime}>
            {new Date(data.start).toDateString() +
              " " +
              new Date(data.start).toLocaleTimeString()}
          </Text>
        </View>
      ) : (
        <View></View>
      )}
    </View>
  );
};
const styles = EStyleSheet.create({
  container: {
    overflow: "hidden",
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    marginTop: "1rem",
    marginLeft: "1rem",
    marginRight: "1rem",
  },
  statsContainer: {
    overflow: "hidden",
    borderRadius: 3,
    backgroundColor: "white",
    marginTop: "1rem",
    marginLeft: "1rem",
    marginRight: "1rem",
    flexDirection: "column",
  },
  playerName: {
    color: "white",
    fontFamily: "JosefinSans_400Regular",
    fontSize: "2rem",
  },
  playerInfo: {
    color: "white",
    fontFamily: "JosefinSans_400Regular",
    fontSize: "1rem",
  },
  playerMeasurableHeaders: {
    color: "white",
    fontFamily: "JosefinSans_400Regular",
    fontSize: "1rem",
  },
  playerMeasurables: {
    color: "white",
    fontFamily: "IstokWeb_400Regular",
    fontSize: "1rem",
  },
  injuryText: {
    fontFamily: "KantumruyPro_300Light",
    color: "white",
    fontSize: "1.5rem",
  },
  playerImage: {
    maxWidth: "50%",
  },
  playerMeasurableRow: { flexDirection: "column", alignItems: "center" },
  seasonAvg: {
    textDecorationLine: "underline",
    fontFamily: "JosefinSans_400Regular",
    fontSize: "1.5rem",
  },
  seasonStat: {
    fontFamily: "JosefinSans_400Regular",
    fontSize: "1.5rem",
  },
  seasonStatVal: {
    fontFamily: "IstokWeb_400Regular",
    fontSize: "1.5rem",
  },
  nextGameTime: {
    fontFamily: "IstokWeb_400Regular",
    fontSize: "1.5rem",
  },
  vs: {
    fontFamily: "IstokWeb_400Regular",
    fontSize: "1rem",
  },
  nextGameHeader: {
    textDecorationLine: "underline",
    fontFamily: "JosefinSans_400Regular",
    fontSize: "1.5rem",
  },
  injuryBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "red",
  },
  teamLogo: { height: "5rem", maxWidth: "5rem" },
  statsHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "white",
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    marginTop: "1rem",
    fontFamily: "JosefinSans_400Regular",
  },
  statsRow: {
    flexDirection: "row",
    paddingVertical: "0.25rem",
    backgroundColor: "white",
  },
  statsCell: {
    flex: 1,
    textAlign: "center",
    fontFamily: "IstokWeb_400Regular",
  },
  headerCell: {
    flex: 1,
    textAlign: "center",
    fontFamily: "JosefinSans_400Regular",
  },
  marginFlatList: { marginLeft: "1rem" },
});
