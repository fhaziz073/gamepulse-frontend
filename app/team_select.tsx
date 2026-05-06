import { useRouter } from 'expo-router';
import React from 'react';
import {
    Button,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function TeamsScreen() {
  const router = useRouter();

  //Placeholder list
  const teams = [
    { id: 1, name: 'New York Knicks' },
    { id: 2, name: 'Chicago Bulls' },
    { id: 3, name: 'Los Angeles Lakers' },
    { id: 4, name: 'Golden State Warriors' },
    { id: 5, name: 'Boston Celtics' }
  ];

  const renderTeam = ({ item }: any) => (
    <TouchableOpacity
      style={styles.teamRow}
      onPress={() =>
        router.push({
          pathname: '/team',
          params: { teamId: item.id }
        })
      }
    >
      <Text style={styles.teamName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>

      {/* 🔙 Back Button */}
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.backButton}>← Back</Text>
      </TouchableOpacity>

      {/* 🏀 Title */}
      <Text style={styles.title}>Select a Team</Text>

      {/* 📋 Team List */}
      <FlatList
        data={teams}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTeam}
      />

      {/* 🔽 Bottom Navigation (match your index.tsx) */}
      <View style={styles.navBar}>
        <Button
          title="Calendar"
          onPress={() => router.navigate("/calendar")}
          color="#303234"
        />
        <Button
          title="Preferences"
          onPress={() => router.navigate("/preferences")}
          color="#303234"
        />
        <Button
          title="Player"
          onPress={() => router.navigate("/player")}
          color="#303234"
        />
        <Button
          title="Stat Analytics"
          onPress={() => router.navigate("/visualization")}
          color="#303234"
        />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#0f172a'
  },
  backButton: {
    color: 'white',
    marginBottom: 10
  },
  title: {
    fontSize: 28,
    color: 'white',
    marginBottom: 16
  },
  teamRow: {
    backgroundColor: '#0f252a',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10
  },
  teamName: {
    fontSize: 20,
    color: '#FAF9F6'
  },
  navBar: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-around'
  }
});