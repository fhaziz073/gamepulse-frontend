import { useState } from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import EStyleSheet from "react-native-extended-stylesheet";
import { link } from "./_layout";
import { useAppSelector } from "./hooks";
import { ALL_NBA_TEAMS } from "./teams";
export default function Preferences() {
  const ALL_FAVORITE_TEAMS = ALL_NBA_TEAMS.map((x) => {
    return { ...x, isOn: true };
  });
  async function changePreferences(
    userId: string | undefined,
    favTeams: typeof ALL_NBA_TEAMS,
  ) {
    let response = null;
    response = await fetch(`${link}/users/pref`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        gameStartNotifPref: false,
        ongoingGameNotifPref: false,
        favTeams: JSON.stringify({ teams: [] }),
        favPlayers: JSON.stringify({ players: [] }),
      }),
    });
    console.log(response);
    if (response !== null && response.status === 201) {
      console.log("Preferences updated");
    } else {
      console.log("Updating preferences failed");
    }
  }
  const [images, setImages] = useState(ALL_FAVORITE_TEAMS);
  const userId = useAppSelector((state) => state.userInfo?.["User ID"]);
  const selectedTeams = images.filter((x) => {
    return x.isOn;
  });
  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={images}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              let newImages = images.map((x) => {
                return x.id === item.id ? { ...x, isOn: !x.isOn } : x;
              });
              setImages(newImages);
            }}
          >
            <Image
              resizeMode="contain"
              style={{
                ...styles.teamLogo,
                backgroundColor: item.isOn ? "red" : "blue",
              }}
              source={item.logo}
              key={item.name}
            />
          </Pressable>
        )}
        columnWrapperStyle={{ justifyContent: "space-evenly" }}
        numColumns={3}
      />
      <Pressable
        style={styles.submit}
        onPress={() => {
          changePreferences(userId, selectedTeams);
        }}
      >
        <Text>Submit</Text>
      </Pressable>
    </View>
  );
}
const styles = EStyleSheet.create({
  teamLogo: {
    height: "10rem",
    width: "10rem",
  },
  submit: {
    height: "3rem",
    width: "3rem",
    backgroundColor: "blue",
    justifyContent: "center",
  },
});
