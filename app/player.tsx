import { Image, Text, View } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';

export default function Player() {
  return (
    <View style={{ flex: 1, flexDirection: "column"}}>
        <LinearGradient
            // Background Linear Gradient
            colors={['rgba(0,0,255,1)', 'rgba(255, 236, 0, 1)', 'transparent']}
            style={{position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                height: 800,
            }}
        />
      <View style={{ flexDirection: "row" }}>
        <Image source={require("../assets/images/jokic.jpg")} />
        <View style={{ flexDirection: "column" }}>
          <Text style = {{color: "white"}}>Nikola Jokic</Text>
          <View
            style={{ flexDirection: "row", justifyContent: "space-around" }}
          >
            <Text style = {{color: "white"}}>Denver Nuggets</Text>
            <Text style = {{color: "white"}}>C</Text>
            <Text style = {{color: "white"}}>#15</Text>
          </View>
          <View
            style={{ flexDirection: "row", justifyContent: "space-around" }}
          >
            <View style={{ flexDirection: "column", alignItems: "center" }}>
              <Text style = {{color: "white"}}>HT</Text>
              <Text style = {{color: "white"}}>6&apos;11&apos;</Text>
            </View>
            <View style={{ flexDirection: "column", alignItems: "center" }}>
              <Text style = {{color: "white"}}>Age</Text>
              <Text style = {{color: "white"}}>30</Text>
            </View>
            <View style={{ flexDirection: "column", alignItems: "center" }}>
              <Text style = {{color: "white"}}>Weight</Text>
              <Text style = {{color: "white"}}>284</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", backgroundColor: "red" }}>
        <Text>INJURED Status</Text>
        <Text>Out (Knee)</Text>
      </View>
      <View
        style={{
          overflow: "hidden",
          borderRadius: 3,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ textDecorationLine: "underline" }}>
          2025-2026 Season Average
        </Text>
        <View style={{ flexDirection: "row" }}>
          <View style={{ flexDirection: "column" }}>
            <Text>PTS</Text>
            <Text>29.6</Text>
          </View>
          <View style={{ flexDirection: "column" }}>
            <Text>REB</Text>
            <Text>12.2</Text>
          </View>
          <View style={{ flexDirection: "column" }}>
            <Text>AST</Text>
            <Text>11.0</Text>
          </View>
        </View>
      </View>
      <View
        style={{
          overflow: "hidden",
          borderRadius: 3,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ textDecorationLine: "underline" }}>Next Game</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            style={{ maxHeight: 150, maxWidth: 150 }}
            source={require("../assets/images/team_logos/Chicago Bulls.png")}
          />
          <Text>vs.</Text>
          <Image
            style={{ maxHeight: 150, maxWidth: 150 }}
            source={require("../assets/images/team_logos/Denver Nuggets.png")}
          />
        </View>
        <Text>Sat, Jan 17th 9:30 P.M.</Text>
      </View>
      <View
        style={{
          overflow: "hidden",
          borderRadius: 3,
          alignItems: "center",
          justifyContent: "space-around",
          flexDirection: "row",
        }}
      >
        <View style={{ flexDirection: "column" }}>
          <Text>Date</Text>
          <Text>12/29</Text>
          <Text>12/27</Text>
          <Text>12/25</Text>
          <Text>12/23</Text>
        </View>
        <View style={{ flexDirection: "column" }}>
          <Text>Opp</Text>
          <Text>@MIA</Text>
          <Text>@ORL</Text>
          <Text>vs MIN</Text>
          <Text>@DAL</Text>
        </View>
        <View style={{ flexDirection: "column" }}>
          <Text>Result</Text>
          <Text>L 147-123</Text>
          <Text>L 127-126</Text>
          <Text>W 142-138</Text>
          <Text>L 131-130</Text>
        </View>
        <View style={{ flexDirection: "column" }}>
          <Text>MIN</Text>
          <Text>19</Text>
          <Text>38</Text>
          <Text>43</Text>
          <Text>36</Text>
        </View>
      </View>
    </View>
  );
}
