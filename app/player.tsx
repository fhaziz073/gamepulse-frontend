import { NBAPlayer, NBASeasonAverages } from "@balldontlie/sdk";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import EStyleSheet from "react-native-extended-stylesheet";
import { link } from "./_layout";
export default function Player() {
  const [player, setPlayer] = useState<NBAPlayer[]>([]);
  const [playerSeasonAvgs, setPlayerSeasonAvgs] = useState<NBASeasonAverages[]>(
    [],
  );
  useEffect(() => {
    async function getPlayer() {
      let response = null;
      response = await fetch(`${link}/players?firstName=Nikola&lastName=Jokic`);
      console.log(response);
      let players = await response.json();
      console.log(players);
      setPlayer(players);
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
    getPlayer();
  }, []);
  return (
    <ScrollView
      style={{ flex: 1, flexDirection: "column" }}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <LinearGradient
        // Background Linear Gradient
        colors={["rgba(0,0,255,1)", "rgba(255, 236, 0, 1)"]}
        style={{ height: "100%", width: "100%", position: "absolute" }}
      />
      <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
        <Image
          style={styles.playerImage}
          resizeMode="contain"
          source={require("../assets/images/jokic.jpg")}
        />
        <View
          style={{ flexDirection: "column", justifyContent: "space-evenly" }}
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
      <View style={styles.injuryBar}>
        <Text style={styles.injuryText}>INJURY STATUS</Text>
        <Text style={styles.injuryText}>OUT (KNEE)</Text>
      </View>
      <View style={styles.container}>
        <Text style={styles.seasonAvg}>2025-2026 Season Average</Text>
        <View style={{ flexDirection: "row" }}>
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
      <View style={styles.container}>
        <Text style={styles.nextGameHeader}>Next Game</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
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
        <Text style={styles.nextGameTime}>Sat, Jan 17th 9:30 P.M.</Text>
      </View>
      <View style={styles.statsContainer}>
        <View style={{ flexDirection: "column" }}>
          <Text style={styles.statsText}>Date</Text>
          <Text style={styles.statsText}>12/29</Text>
          <Text style={styles.statsText}>12/27</Text>
          <Text style={styles.statsText}>12/25</Text>
          <Text style={styles.statsText}>12/23</Text>
        </View>
        <View style={{ flexDirection: "column" }}>
          <Text style={styles.statsText}>Opp</Text>
          <Text style={styles.statsText}>@MIA</Text>
          <Text style={styles.statsText}>@ORL</Text>
          <Text style={styles.statsText}>vs MIN</Text>
          <Text style={styles.statsText}>@DAL</Text>
        </View>
        <View style={{ flexDirection: "column" }}>
          <Text style={styles.statsText}>Result</Text>
          <Text style={styles.statsText}>L 147-123</Text>
          <Text style={styles.statsText}>L 127-126</Text>
          <Text style={styles.statsText}>W 142-138</Text>
          <Text style={styles.statsText}>L 131-130</Text>
        </View>
        <View style={{ flexDirection: "column" }}>
          <Text style={styles.statsText}>MIN</Text>
          <Text style={styles.statsText}>19</Text>
          <Text style={styles.statsText}>38</Text>
          <Text style={styles.statsText}>43</Text>
          <Text style={styles.statsText}>36</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = EStyleSheet.create({
  statsText: {
    fontFamily: "JosefinSans_400Regular",
  },
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
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "white",
    marginTop: "1rem",
    marginLeft: "1rem",
    marginRight: "1rem",
    flexDirection: "row",
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
    height: "13rem",
    width: "13rem",
  },
  playerMeasurableRow: { flexDirection: "column", alignItems: "center" },
  seasonAvg: {
    textDecorationLine: "underline",
    fontFamily: "JosefinSans_400Regular",
    fontSize: "1.5rem",
  },
  seasonStat: {
    fontFamily: "JosefinSans_400Regular",
  },
  seasonStatVal: {
    fontFamily: "IstokWeb_400Regular",
  },
  nextGameTime: {
    fontFamily: "IstokWeb_400Regular",
  },
  vs: {
    fontFamily: "IstokWeb_400Regular",
  },
  nextGameHeader: {
    textDecorationLine: "underline",
    fontFamily: "JosefinSans_400Regular",
  },
  injuryBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "red",
  },
  teamLogo: { height: "4rem", maxWidth: "4rem" },
});
