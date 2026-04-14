import { IstokWeb_400Regular } from "@expo-google-fonts/istok-web";
import {
  JosefinSans_400Regular,
  useFonts,
} from "@expo-google-fonts/josefin-sans";
import { Kantumruy_300Light } from "@expo-google-fonts/kantumruy";
import { LinearGradient } from "expo-linear-gradient";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Image, Text, View } from "react-native";
import EStyleSheet from "react-native-extended-stylesheet";
SplashScreen.preventAutoHideAsync();
export default function Player() {
  const [loaded, error] = useFonts({
    JosefinSans_400Regular,
    IstokWeb_400Regular,
    Kantumruy_300Light,
  });
  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }
  return (
    <View style={{ flex: 1, flexDirection: "column" }}>
      <LinearGradient
        // Background Linear Gradient
        colors={["rgba(0,0,255,1)", "rgba(255, 236, 0, 1)"]}
        style={{ height: "100%", width: "100%", position: "absolute" }}
      />
      <View style={{ flexDirection: "row" }}>
        <Image source={require("../assets/images/jokic.jpg")} />
        <View style={{ flexDirection: "column" }}>
          <Text
            style={{ color: "white", fontFamily: "JosefinSans_400Regular" }}
          >
            Nikola Jokic
          </Text>
          <View
            style={{ flexDirection: "row", justifyContent: "space-around" }}
          >
            <Text
              style={{ color: "white", fontFamily: "JosefinSans_400Regular" }}
            >
              Denver Nuggets
            </Text>
            <Text
              style={{ color: "white", fontFamily: "JosefinSans_400Regular" }}
            >
              C
            </Text>
            <Text
              style={{ color: "white", fontFamily: "JosefinSans_400Regular" }}
            >
              #15
            </Text>
          </View>
          <View
            style={{ flexDirection: "row", justifyContent: "space-around" }}
          >
            <View style={{ flexDirection: "column", alignItems: "center" }}>
              <Text
                style={{ color: "white", fontFamily: "JosefinSans_400Regular" }}
              >
                HT
              </Text>
              <Text
                style={{ color: "white", fontFamily: "IstokWeb_400Regular" }}
              >
                6&apos;11&apos;
              </Text>
            </View>
            <View style={{ flexDirection: "column", alignItems: "center" }}>
              <Text
                style={{ color: "white", fontFamily: "JosefinSans_400Regular" }}
              >
                Age
              </Text>
              <Text
                style={{ color: "white", fontFamily: "IstokWeb_400Regular" }}
              >
                30
              </Text>
            </View>
            <View style={{ flexDirection: "column", alignItems: "center" }}>
              <Text
                style={{ color: "white", fontFamily: "JosefinSans_400Regular" }}
              >
                Weight
              </Text>
              <Text
                style={{ color: "white", fontFamily: "IstokWeb_400Regular" }}
              >
                284
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          backgroundColor: "red",
        }}
      >
        <Text style={{ fontFamily: "Kantumruy_300Light", color: "white" }}>
          INJURY STATUS
        </Text>
        <Text style={{ fontFamily: "Kantumruy_300Light", color: "white" }}>
          OUT (KNEE)
        </Text>
      </View>
      <View style={styles.container}>
        <Text
          style={{
            textDecorationLine: "underline",
            fontFamily: "JosefinSans_400Regular",
          }}
        >
          2025-2026 Season Average
        </Text>
        <View style={{ flexDirection: "row" }}>
          <View style={{ flexDirection: "column" }}>
            <Text
              style={{
                fontFamily: "JosefinSans_400Regular",
              }}
            >
              PTS
            </Text>
            <Text style={{ fontFamily: "IstokWeb_400Regular" }}>29.6</Text>
          </View>
          <View style={{ flexDirection: "column" }}>
            <Text
              style={{
                fontFamily: "JosefinSans_400Regular",
              }}
            >
              REB
            </Text>
            <Text style={{ fontFamily: "IstokWeb_400Regular" }}>12.2</Text>
          </View>
          <View style={{ flexDirection: "column" }}>
            <Text
              style={{
                fontFamily: "JosefinSans_400Regular",
              }}
            >
              AST
            </Text>
            <Text style={{ fontFamily: "IstokWeb_400Regular" }}>11.0</Text>
          </View>
        </View>
      </View>
      <View style={styles.container}>
        <Text
          style={{
            textDecorationLine: "underline",
            fontFamily: "JosefinSans_400Regular",
          }}
        >
          Next Game
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            style={{ maxHeight: 150, maxWidth: 150 }}
            source={require("../assets/images/team_logos/Chicago Bulls.png")}
          />
          <Text style={{ fontFamily: "IstokWeb_400Regular" }}>vs.</Text>
          <Image
            style={{ maxHeight: 150, maxWidth: 150 }}
            source={require("../assets/images/team_logos/Denver Nuggets.png")}
          />
        </View>
        <Text style={{ fontFamily: "IstokWeb_400Regular" }}>
          Sat, Jan 17th 9:30 P.M.
        </Text>
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
    </View>
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
});
