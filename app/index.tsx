import { setUserInfo } from "@/features/stateSlice";
import { useRouter } from "expo-router";
import React from 'react';
import { Button, SectionList, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch } from "./hooks";

const DATA = [
{
  title: 'Your Teams',
  data: ['NYK 95   3rd 5:42   72 GSW', 'CHI 17   1st 13:50   15 MIN', 'SAS   10:30 PM   LAL'] 
},
{
  title: "Today's Games",
  data: ['DEN 95   3rd 5:42   72 IDK', 'CHI 17   1st 13:50   15 MIN']
}
]

const App = () => (
  <SafeAreaProvider>
    <SafeAreaView style={styles.container} edges={['top']}>
      <SectionList
        sections={DATA}
        keyExtractor={(item, index) => item + index}
        renderItem={({item}) => (
          <View style={styles.item}>
            <Text style={styles.title}>{item}</Text>
          </View>
        )}
        renderSectionHeader={({section: {title}}) => (
          <Text style={styles.header}>{title}</Text>
        )}
      />
    </SafeAreaView>
  </SafeAreaProvider>
);

export default function Index() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  return (
<SafeAreaProvider>
  <SafeAreaView style={{
          flex: 1,
          overflow: "hidden",
          borderRadius: 3,
          alignItems: "flex-end",
          justifyContent: "space-around",
          flexDirection: "row",
          paddingTop: 250,
          backgroundColor: "#708090",
        }}
      >
    <App></App>
  </SafeAreaView>
<SafeAreaView
        style={{
          flex: 1,
          overflow: "hidden",
          borderRadius: 3,
          alignItems: "flex-end",
          justifyContent: "space-around",
          flexDirection: "row",
          paddingBottom: 10,
          backgroundColor: "#708090"
        }}
      >
      <Button
        title="Calendar"
        onPress={() => router.navigate("/calendar")}
        color={"#303234"}
      />
      <Button
        title="Preferences"
        onPress={() => router.navigate("/preferences")}
        color={"#303234"}
      />
      <Button
        title="Player"
        onPress={() => router.navigate("/player")}
        color={"#303234"}
      />
      <Button
        title="Log Out"
        onPress={() => dispatch(setUserInfo(null))}
        color={"#303234"}
      />
      </SafeAreaView>
      </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: 400
  },
  item: {
    backgroundColor: '#5f6266',
    padding: 5,
    marginVertical: 5,
  },
  header: {
    fontSize: 25,
    backgroundColor: '#708090',
  },
  title: {
    fontSize: 30,
  }
});