import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function TeamScreen() {
  const router = useRouter();
  const { teamId } = useLocalSearchParams();

  // 🔹 Placeholder data (replace with API later)
  const [players, setPlayers] = useState<any[]>([]);
  const [nextGame, setNextGame] = useState<any>(null);

  useEffect(() => {
    loadPlaceholderData();
  }, []);

  const loadPlaceholderData = () => {
    //Placeholders
    const playersPlaceholder = [
      { id: 1, name: 'J. Brunson', position: 'PG', points: 27.2 },
      { id: 2, name: 'K. Towns', position: 'C', points: 19.8 },
      { id: 3, name: 'O. Anunoby', position: 'SF', points: 14.3 },
      { id: 4, name: 'M. Bridges', position: 'SG', points: 12.1 }
    ];
 
    // Fake next game
    const gamePlaceholder = {
      id: 101,
      opponent: 'Chicago Bulls',
      date: '2026-05-10T19:30:00'
    };

    setPlayers(playersPlaceholder);
    setNextGame(gamePlaceholder);
  };

  // 👤 Player row
  const renderPlayer = ({ item }: any) => (
    <TouchableOpacity
      style={styles.playerRow}
      onPress={() =>
        router.push({
          pathname: '/player',
          params: { playerId: item.id }
        })
      }
    >
      <Text style={styles.playerName}>{item.name}</Text>
      <Text>{item.position}</Text>
      <Text>{item.points} PPG</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>

      {/* 🔙 Back Button */}
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.backButton}>← Back</Text>
      </TouchableOpacity>

      {/* 🏀 Team Header */}
      <Text style={styles.teamName}>Team {teamId}</Text>

      {/* 📅 Next Game */}
      {nextGame && (
        <TouchableOpacity
          style={styles.gameCard}
          onPress={() =>
            router.push({
              pathname: '/game',
              params: { gameId: nextGame.id }
            })
          }
        >
          <Text style={styles.sectionTitle}>Next Game</Text>
          <Text>{nextGame.opponent}</Text>
          <Text>{new Date(nextGame.date).toLocaleString()}</Text>
        </TouchableOpacity>
      )}

      {/* 👥 Player List */}
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