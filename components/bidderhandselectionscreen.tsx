import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Card } from './Card';
import { GameCard } from '../lib/game';

interface BidderHandSelectionScreenProps {
  cards: GameCard[];
  trumpSuit: string | null;
  onConfirm: (cardIds: string[]) => void;
}

export function BidderHandSelectionScreen({ cards, trumpSuit, onConfirm }: BidderHandSelectionScreenProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedCount = selectedIds.length;
  const sortedCards = useMemo(() => [...cards], [cards]);

  const toggleCard = (cardId: string) => {
    setSelectedIds((current) => {
      if (current.includes(cardId)) {
        return current.filter(id => id !== cardId);
      }
      if (current.length >= 6) return current;
      return [...current, cardId];
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Final 6</Text>
      <Text style={styles.subtitle}>
        Trump is {trumpSuit}. Select exactly 6 cards to keep. The rest go to the kitty.
      </Text>

      <Text style={styles.counter}>{selectedCount}/6 selected</Text>

      <View style={styles.cardGrid}>
        {sortedCards.map((card) => {
          const selected = selectedIds.includes(card.id);
          return (
            <TouchableOpacity
              key={card.id}
              style={[styles.cardSlot, selected && styles.cardSlotSelected]}
              onPress={() => toggleCard(card.id)}
            >
              <Card suit={card.suit} rank={card.rank} width={72} height={100} />
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.confirmButton, selectedCount !== 6 && styles.confirmButtonDisabled]}
        disabled={selectedCount !== 6}
        onPress={() => onConfirm(selectedIds)}
      >
        <Text style={styles.confirmButtonText}>Lock In 6 Cards</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a202c',
    padding: 20,
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
    marginBottom: 16,
  },
  counter: {
    color: '#10b981',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  cardSlot: {
    margin: 6,
    padding: 4,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSlotSelected: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  confirmButton: {
    marginTop: 20,
    alignSelf: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
  },
  confirmButtonDisabled: {
    backgroundColor: '#4b5563',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
