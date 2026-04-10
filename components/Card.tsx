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
  joker: '🃏',
};

const suitColors: Record<Suit, string> = {
  hearts: '#dc2626', // red-600
  diamonds: '#dc2626', // red-600
  clubs: '#000000', // black
  spades: '#000000', // black
  joker: '#7c3aed', // purple-600
};

const rankDisplay: Record<Rank, string> = {
  '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '10': '10',
  'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A',
  'big': 'Big', 'little': 'Little',
};

export function Card({ suit, rank, faceUp = true, width = 100, height = 140 }: CardProps) {
  if (!faceUp) {
    return (
      <View style={[styles.card, { width, height }, styles.cardBack]}>
        <View style={styles.cardBackPattern} />
      </View>
    );
  }

  if (suit === 'joker') {
    return (
      <View style={[styles.card, { width, height }, styles.jokerCard]}>
        <View style={styles.jokerCenter}>
          <Text style={styles.jokerSymbol}>🃏</Text>
          <Text style={styles.jokerText}>{rankDisplay[rank]} Joker</Text>
          <Text style={styles.jokerPoint}>1 point</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, { width, height }]}>
      <View style={styles.cardCorner}>
        <Text style={[styles.rankText, { color: suitColors[suit] }]}>{rankDisplay[rank]}</Text>
        <Text style={[styles.suitText, { color: suitColors[suit] }]}>{suitSymbols[suit]}</Text>
      </View>
      <View style={styles.cardCenter}>
        <Text style={[styles.centerSymbol, { color: suitColors[suit] }]}>{suitSymbols[suit]}</Text>
        <Text style={[styles.centerRank, { color: suitColors[suit] }]}>{rankDisplay[rank]}</Text>
      </View>
      <View style={[styles.cardCorner, styles.cardCornerBottom]}>
        <Text style={[styles.rankText, { color: suitColors[suit], transform: [{ rotate: '180deg' }] }]}>{rankDisplay[rank]}</Text>
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
  jokerCard: {
    backgroundColor: '#fef3c7', // yellow-50
    borderWidth: 2,
    borderColor: '#7c3aed', // purple-600
  },
  jokerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jokerSymbol: {
    fontSize: 48,
    marginBottom: 8,
  },
  jokerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7c3aed', // purple-600
    marginBottom: 4,
  },
  jokerPoint: {
    fontSize: 12,
    color: '#dc2626', // red-600
    fontWeight: '600',
  },
});