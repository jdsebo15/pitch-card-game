import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import 'react-native-gesture-handler';
import { useState } from 'react';
import { GameScreen } from './screens/GameScreen';

type Screen = 'menu' | 'game' | 'rules';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');
  
  const renderScreen = () => {
    switch (currentScreen) {
      case 'game':
        return <GameScreen onGameEnd={() => setCurrentScreen('menu')} />;
      case 'rules':
        return (
          <View style={styles.rulesContainer}>
            <Text style={styles.rulesTitle}>Pitch Rules</Text>
            <View style={styles.rulesContent}>
              <Text style={styles.rulesSection}>🎴 The Game</Text>
              <Text style={styles.rulesText}>
                Pitch is a trick-taking card game for 2-4 players. Each player is dealt 6 cards from a standard 52-card deck.
              </Text>
              
              <Text style={styles.rulesSection}>💰 Bidding</Text>
              <Text style={styles.rulesText}>
                Players bid on how many points they think they can take (2-4). The highest bidder chooses the trump suit.
              </Text>
              
              <Text style={styles.rulesSection}>🎯 Point Values (Catch Order)</Text>
              <Text style={styles.rulesText}>
                1. 🅰️ Ace = 1 point (highest){'\n'}
                2. 🇰 King = 0 points{'\n'}
                3. 🇶 Queen = 0 points{'\n'}
                4. 🎃 Main Jack (trump) = 1 point{'\n'}
                5. 🃏 Big Joker = 1 point{'\n'}
                6. 🃏 Little Joker = 1 point{'\n'}
                7. 🎭 Off Jack (same color) = 1 point{'\n'}
                8. 🔟 10 = 1 point{'\n'}
                9. 9, 8, 7, 6, 5, 4 = 0 points{'\n'}
                10. 3️⃣ 3 = 3 points{'\n'}
                11. 2️⃣ 2 = 1 point (auto-keep){'\n'}{'\n'}
                Note: 2 of trump is automatically kept by whoever catches it, even if they don't win the trick.
              </Text>
              
              <Text style={styles.rulesSection}>🃏 Game Play</Text>
              <Text style={styles.rulesText}>
                The bidder leads the first trick. Players must follow suit if possible. The highest card of the led suit wins, unless a trump card is played.
              </Text>
              
              <Text style={styles.rulesSection}>🏆 Winning</Text>
              <Text style={styles.rulesText}>
                The bidder must make at least their bid to score points. If they fail, they lose the bid amount. The player with the most points after all cards are played wins.
              </Text>
            </View>
            
            <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('menu')}>
              <Text style={styles.backButtonText}>Back to Menu</Text>
            </TouchableOpacity>
          </View>
        );
      case 'menu':
      default:
        return (
          <View style={styles.menuContainer}>
            <Text style={styles.title}>🎴 Pitch Card Game</Text>
            <Text style={styles.subtitle}>Classic trick-taking card game</Text>
            
            <View style={styles.menuButtons}>
              <TouchableOpacity style={styles.menuButton} onPress={() => setCurrentScreen('game')}>
                <Text style={styles.menuButtonText}>Start New Game</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.menuButton, styles.rulesButton]} onPress={() => setCurrentScreen('rules')}>
                <Text style={styles.menuButtonText}>How to Play</Text>
              </TouchableOpacity>
              
              <View style={styles.gameInfo}>
                <Text style={styles.infoTitle}>Features:</Text>
                <Text style={styles.infoItem}>• Complete Pitch game rules</Text>
                <Text style={styles.infoItem}>• 3 AI opponents</Text>
                <Text style={styles.infoItem}>• Beautiful card animations</Text>
                <Text style={styles.infoItem}>• Real-time game state</Text>
                <Text style={styles.infoItem}>• iOS optimized interface</Text>
              </View>
            </View>
            
            <Text style={styles.footerText}>Built with React Native + Expo</Text>
          </View>
        );
    }
  };
  
  return (
    <View style={styles.container}>
      {renderScreen()}
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a202c',
  },
  menuContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#a0aec0',
    marginBottom: 60,
    textAlign: 'center',
  },
  menuButtons: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  menuButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  rulesButton: {
    backgroundColor: '#374151',
  },
  menuButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  gameInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 20,
    borderRadius: 12,
    marginTop: 30,
    width: '100%',
  },
  infoTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoItem: {
    color: '#cbd5e0',
    fontSize: 14,
    marginBottom: 6,
  },
  footerText: {
    color: '#718096',
    fontSize: 12,
    marginTop: 40,
  },
  rulesContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  rulesTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
    textAlign: 'center',
  },
  rulesContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
  },
  rulesSection: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  rulesText: {
    color: '#cbd5e0',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 10,
  },
  backButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignSelf: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
