import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Suit, Rank } from '../lib/game';

export interface CardProps {
  suit: Suit;
  rank: Rank;
  faceUp?: boolean;
  width?: number;
  height?: number;
}

const suitSymbols: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const suitColors: Record<Suit, string> = {
  hearts: '#dc2626', // red-600
  diamonds: '#dc2626', // red-600
  clubs: '#000000', // black
  spades: '#000000', // black
};

export function Card({ suit, rank, faceUp = true, width = 100, height = 140 }: CardProps) {
  if (!faceUp) {
    return (
      <View style={[styles.card, { width, height }, styles.cardBack]}>
        <View style={styles.cardBackPattern} />
      </View>
    );
  }

  return (
    <View style={[styles.card, { width, height }]}>
      <View style={styles.cardCorner}>
        <Text style={[styles.rankText, { color: suitColors[suit] }]}>{rank}</Text>
        <Text style={[styles.suitText, { color: suitColors[suit] }]}>{suitSymbols[suit]}</Text>
      </View>
      <View style={styles.cardCenter}>
        <Text style={[styles.centerSymbol, { color: suitColors[suit] }]}>{suitSymbols[suit]}</Text>
        <Text style={[styles.centerRank, { color: suitColors[suit] }]}>{rank}</Text>
      </View>
      <View style={[styles.cardCorner, styles.cardCornerBottom]}>
        <Text style={[styles.rankText, { color: suitColors[suit], transform: [{ rotate: '180deg' }] }]}>{rank}</Text>
        <Text style={[styles.suitText, { color: suitColors[suit], transform: [{ rotate: '180deg' }] }]}>{suitSymbols[suit]}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    padding: 12,
    justifyContent: 'space-between',
  },
  cardBack: {
    backgroundColor: '#1e40af', // blue-700
  },
  cardBackPattern: {
    flex: 1,
    backgroundColor: '#3b82f6', // blue-500
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
    borderStyle: 'dashed',
  },
  cardCorner: {
    alignItems: 'flex-start',
  },
  cardCornerBottom: {
    alignItems: 'flex-end',
  },
  rankText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  suitText: {
    fontSize: 16,
    marginTop: -4,
  },
  cardCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  centerSymbol: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  centerRank: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
});