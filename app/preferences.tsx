import { useState } from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import EStyleSheet from "react-native-extended-stylesheet";
import { ALL_NBA_TEAMS } from "./teams";

export default function Preferences() {
  const [images, setImages] = useState(ALL_NBA_TEAMS);
  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={images}
        renderItem={({ item }) => (
          <Pressable>
            <Image
              resizeMode="contain"
              style={styles.teamLogo}
              source={item.logo}
              key={item.name}
            />
          </Pressable>
        )}
        columnWrapperStyle={{ justifyContent: "space-evenly" }}
        numColumns={3}
      />
      <Pressable style={styles.submit}>
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
