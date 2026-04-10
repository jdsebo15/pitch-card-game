import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import 'react-native-gesture-handler';
import { Card } from './components/Card';
import { createDeck, shuffleDeck, dealCards } from './lib/game';
import { useState } from 'react';

export default function App() {
  const [deck, setDeck] = useState(() => shuffleDeck(createDeck()));
  const [playerHand, setPlayerHand] = useState<Array<any>>([]);
  const [gameStarted, setGameStarted] = useState(false);
  
  const startGame = () => {
    const shuffled = shuffleDeck(createDeck());
    const { hands } = dealCards(shuffled, 4);
    setDeck(shuffled);
    setPlayerHand(hands[0]); // Player is first hand
    setGameStarted(true);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎴 Pitch Card Game</Text>
      <Text style={styles.subtitle}>Classic trick-taking card game</Text>
      
      {!gameStarted ? (
        <TouchableOpacity style={styles.startButton} onPress={startGame}>
          <Text style={styles.startButtonText}>Start Game</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.gameArea}>
          <Text style={styles.handTitle}>Your Hand ({playerHand.length} cards)</Text>
          <View style={styles.handContainer}>
            {playerHand.map((card, index) => (
              <View key={card.id} style={[styles.cardWrapper, { marginLeft: index > 0 ? -40 : 0 }]}>
                <Card suit={card.suit} rank={card.rank} />
              </View>
            ))}
          </View>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => setGameStarted(false)}>
            <Text style={styles.actionButtonText}>New Game</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a202c',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#a0aec0',
    marginBottom: 40,
  },
  startButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  gameArea: {
    alignItems: 'center',
    width: '100%',
  },
  handTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 20,
  },
  handContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
    flexWrap: 'wrap',
  },
  cardWrapper: {
    marginBottom: 10,
  },
  actionButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
