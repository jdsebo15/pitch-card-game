import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Card } from './Card';
import { GameCard, Suit, sortCards } from '../lib/game';

interface TrumpSelectionScreenProps {
  playerHand: GameCard[];
  forcedBid: boolean;
  bid: number | null;
  onChooseTrump: (suit: Suit) => void;
}

const SUITS: { suit: Suit; label: string; symbol: string; red: boolean }[] = [
  { suit: 'hearts',   label: 'Hearts',   symbol: '♥', red: true  },
  { suit: 'diamonds', label: 'Diamonds', symbol: '♦', red: true  },
  { suit: 'clubs',    label: 'Clubs',    symbol: '♣', red: false },
  { suit: 'spades',   label: 'Spades',   symbol: '♠', red: false },
];

export function TrumpSelectionScreen({ playerHand, forcedBid, bid, onChooseTrump }: TrumpSelectionScreenProps) {
  const sortedHand = sortCards(playerHand, null);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Trump</Text>
      <Text style={styles.subtitle}>
        {forcedBid
          ? `Stuck at ${bid} — pick the suit you can do most with.`
          : `You won the bid at ${bid}. Pick a trump.`}
      </Text>

      <View style={styles.handPreview}>
        {sortedHand.map(card => (
          <View key={card.id} style={styles.handCard}>
            <Card suit={card.suit} rank={card.rank} width={48} height={68} />
          </View>
        ))}
      </View>

      <View style={styles.suitGrid}>
        {SUITS.map(({ suit, label, symbol, red }) => {
          const count = playerHand.filter(c => c.suit === suit).length;
          return (
            <TouchableOpacity key={suit} style={styles.suitButton} onPress={() => onChooseTrump(suit)}>
              <Text style={[styles.suitSymbol, { color: red ? '#dc2626' : '#fff' }]}>{symbol}</Text>
              <Text style={styles.suitLabel}>{label}</Text>
              <Text style={styles.suitCount}>{count} in hand</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#cbd5e0',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  handPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 18,
  },
  handCard: {
    margin: 2,
  },
  suitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  suitButton: {
    width: '47%',
    backgroundColor: '#374151',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  suitSymbol: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  suitLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  suitCount: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
});
