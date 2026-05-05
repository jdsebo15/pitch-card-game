import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Card } from './Card';
import { GameCard, Suit, isTrumpCard, isOffJack, getCardPoints, sortCards } from '../lib/game';

interface DiscardingScreenProps {
  pool: GameCard[];
  trumpSuit: Suit | null;
  keepCount?: number;
  onConfirm: (keepIds: string[]) => void;
}

export function DiscardingScreen({ pool, trumpSuit, keepCount = 6, onConfirm }: DiscardingScreenProps) {
  const [selected, setSelected] = useState<Set<string>>(() => {
    // Pre-select all trump cards (they're locked anyway). The user picks the
    // remainder from non-trump options.
    const initial = new Set<string>();
    for (const card of pool) {
      if (trumpSuit && isTrumpCard(card, trumpSuit)) initial.add(card.id);
    }
    return initial;
  });

  const sorted = sortCards(pool, trumpSuit);

  const toggle = (cardId: string, locked: boolean) => {
    if (locked) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else if (next.size < keepCount) next.add(cardId);
      return next;
    });
  };

  const isLocked = (card: GameCard) => {
    if (!trumpSuit) return false;
    return isTrumpCard(card, trumpSuit);
  };

  const tag = (card: GameCard) => {
    if (!trumpSuit) return '';
    if (isOffJack(card, trumpSuit)) return 'Off-Jack';
    if (card.suit === 'joker') return 'Joker';
    if (isTrumpCard(card, trumpSuit) && getCardPoints(card, trumpSuit) > 0) return 'Trump pt';
    if (isTrumpCard(card, trumpSuit)) return 'Trump';
    return '';
  };

  const remaining = keepCount - selected.size;
  const canConfirm = selected.size === keepCount;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pick your final {keepCount} cards</Text>
      <Text style={styles.subtitle}>
        {remaining > 0
          ? `Tap ${remaining} more card${remaining !== 1 ? 's' : ''} to keep • trump locked in`
          : 'Hand looks good — tap Confirm'}
      </Text>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {sorted.map(card => {
          const picked = selected.has(card.id);
          const locked = isLocked(card);
          const label = tag(card);
          return (
            <TouchableOpacity
              key={card.id}
              activeOpacity={locked ? 1 : 0.7}
              onPress={() => toggle(card.id, locked)}
              style={[
                styles.cardSlot,
                picked && styles.cardKept,
                !picked && !locked && styles.cardDropped,
                locked && styles.cardLocked,
              ]}
            >
              <Card suit={card.suit} rank={card.rank} width={56} height={80} />
              {label ? <Text style={styles.tag}>{label}</Text> : null}
              {!picked && !locked && (
                <View style={styles.crossOverlay}>
                  <Text style={styles.crossText}>discard</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={[styles.confirm, !canConfirm && styles.confirmDisabled]}
        onPress={() => canConfirm && onConfirm(Array.from(selected))}
        disabled={!canConfirm}
      >
        <Text style={styles.confirmText}>
          {canConfirm ? 'Confirm hand' : `Select ${remaining} more`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#cbd5e0',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 12,
  },
  cardSlot: {
    padding: 4,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  cardKept: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
  cardDropped: {
    opacity: 0.55,
  },
  cardLocked: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245,158,11,0.10)',
  },
  tag: {
    color: '#cbd5e0',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  crossOverlay: {
    position: 'absolute',
    top: 4,
    bottom: 18,
    left: 4,
    right: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossText: {
    color: '#fca5a5',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  confirm: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  confirmDisabled: {
    backgroundColor: '#374151',
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
