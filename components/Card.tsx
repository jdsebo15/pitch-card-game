import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Suit, Rank } from '../lib/game';

export interface CardProps {
  suit: Suit;
  rank: Rank;
  faceUp?: boolean;
  width?: number;
  height?: number;
  fontSize?: number;
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
  'big': 'big', 'little': 'lil',
};

export function Card({ suit, rank, faceUp = true, width = 100, height = 140, fontSize }: CardProps) {
  // Calculate font sizes based on card size or custom fontSize
  const rankSize = fontSize || Math.max(8, width * 0.2);
  const suitSize = fontSize ? fontSize * 0.8 : Math.max(6, width * 0.16);
  const centerSymbolSize = fontSize ? fontSize * 2.4 : Math.max(24, width * 0.48);
  const centerRankSize = fontSize ? fontSize * 1.2 : Math.max(12, width * 0.24);
  const jokerSymbolSize = fontSize ? fontSize * 2.4 : Math.max(24, width * 0.48);
  const jokerTextSize = fontSize ? fontSize * 0.8 : Math.max(8, width * 0.16);
  const jokerPointSize = fontSize ? fontSize * 0.6 : Math.max(6, width * 0.12);
  if (!faceUp) {
    return (
      <View style={[styles.card, { width, height }, styles.cardBack]}>
        <View style={styles.cardBackPattern} />
      </View>
    );
  }

  if (suit === 'joker') {
    return (
      <View style={[styles.card, { width, height }]}>
        <View style={styles.cardCenter}>
          <Text style={[styles.centerSymbol, { color: suitColors[suit], fontSize: centerSymbolSize }]}>🃏</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, { width, height }]}>
      <View style={styles.cardCenter}>
        <Text style={[styles.centerSymbol, { color: suitColors[suit], fontSize: centerSymbolSize }]}>{suitSymbols[suit]}</Text>
        <Text style={[styles.centerRank, { color: suitColors[suit], fontSize: centerRankSize }]}>{rankDisplay[rank]}</Text>
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
  // (removed corner styles)
  cardCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  centerSymbol: {
    fontWeight: 'bold',
  },
  centerRank: {
    fontWeight: 'bold',
    marginTop: 4,
  },

});