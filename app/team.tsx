import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function TeamScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const { teamId } = route.params as { teamId: string };

  const [players, setPlayers] = useState<any[]>([]);
  const [nextGame, setNextGame] = useState<any>(null);

  // 🔹 Fetch team data
  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      //Need to put in database calls
      // const playersRes = await ;
      //const playersData = await playersRes.json();

      //const gamesRes = await fetch();
      //const gamesData = await gamesRes.json();

      // Get next upcoming game
      //const upcomingGame = gamesData
      //  .filter((g: any) => new Date(g.date) > new Date())
      //    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

      //setPlayers(playersData);
      //setNextGame(upcomingGame);

    } catch (err) {
      console.error(err);
    }
  };

  const renderPlayer = ({ item }: any) => (
    <TouchableOpacity
      style={styles.playerRow}
      onPress={() =>
        navigation.navigate('Player', { playerId: item.id })
      }
    >
      <Text style={styles.playerName}>{item.name}</Text>
      <Text>{item.position}</Text>
      <Text>{item.points} PPG</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backButton}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.teamName}>New York Knicks</Text>
      {nextGame && (
        <TouchableOpacity
          style={styles.gameCard}
          onPress={() =>
            navigation.navigate('Game', { gameId: nextGame.id })
          }
        >
          <Text style={styles.sectionTitle}>Next Game</Text>
          <Text>{nextGame.opponent}</Text>
          <Text>{new Date(nextGame.date).toLocaleString()}</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.sectionTitle}>Roster</Text>
      <FlatList
        data={players}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPlayer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#1e1e1e'
  },
  backButton: {
    color: 'white',
    marginBottom: 10
  },
  teamName: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    color: 'white',
    marginVertical: 10
  },
  gameCard: {
    backgroundColor: '#f97316',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16
  },
  playerRow: {
    backgroundColor: '#eee',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8
  },
  playerName: {
    fontWeight: 'bold'
  }
});