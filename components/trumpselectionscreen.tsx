import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Card } from './Card';
import { GameCard, Suit } from '../lib/game';

interface TrumpSelectionScreenProps {
  playerHand: GameCard[];
  forcedBid: boolean;
  bid: number | null;
  onChooseTrump: (suit: Suit) => void;
}

const suits: { suit: Suit; label: string; symbol: string; color: string }[] = [
  { suit: 'hearts', label: 'Hearts', symbol: '♥', color: '#dc2626' },
  { suit: 'diamonds', label: 'Diamonds', symbol: '♦', color: '#dc2626' },
  { suit: 'clubs', label: 'Clubs', symbol: '♣', color: '#ffffff' },
  { suit: 'spades', label: 'Spades', symbol: '♠', color: '#ffffff' },
];

export function TrumpSelectionScreen({ playerHand, forcedBid, bid, onChooseTrump }: TrumpSelectionScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Trump</Text>
      <Text style={styles.subtitle}>
        {forcedBid ? `You were forced to bid ${bid}. Pick the best trump suit.` : `You won the bid at ${bid}. Choose trump.`}
      </Text>

      <View style={styles.handSection}>
        <Text style={styles.sectionTitle}>Your Hand</Text>
        <View style={styles.handContainer}>
          {playerHand.map((card) => (
            <View key={card.id} style={styles.cardWrapper}>
              <Card suit={card.suit} rank={card.rank} width={72} height={100} />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.buttonGrid}>
        {suits.map(({ suit, label, symbol, color }) => (
          <TouchableOpacity key={suit} style={styles.suitButton} onPress={() => onChooseTrump(suit)}>
            <Text style={[styles.suitSymbol, { color }]}>{symbol}</Text>
            <Text style={styles.suitLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a202c',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#cbd5e0',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 24,
  },
  handSection: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  handContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  cardWrapper: {
    margin: 4,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  suitButton: {
    width: 140,
    backgroundColor: '#374151',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  suitSymbol: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  suitLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
