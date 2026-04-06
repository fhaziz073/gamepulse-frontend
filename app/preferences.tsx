import { useState } from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import EStyleSheet from "react-native-extended-stylesheet";
import { ALL_NBA_TEAMS } from "./teams";
export default function Preferences() {
  const ALL_FAVORITE_TEAMS = ALL_NBA_TEAMS.map((x) => {
    return { ...x, isOn: true };
  });
  async function changePreferences() {}
  const [images, setImages] = useState(ALL_FAVORITE_TEAMS);
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
      <Pressable style={styles.submit} onPress={changePreferences}>
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
