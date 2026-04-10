import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Card } from './Card';
import { GameCard, getCardPoints, isOffJack, isTrumpCard } from '../lib/game';

interface DiscardingScreenProps {
  playerHand: GameCard[];
  trumpSuit: 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'joker' | null;
  currentPlayer: string;
  playerName: string;
  discards: GameCard[];
  onDiscardCard: (cardId: string) => void;
  onComplete: () => void;
}

export function DiscardingScreen({
  playerHand,
  trumpSuit,
  currentPlayer,
  playerName,
  discards,
  onDiscardCard,
  onComplete,
}: DiscardingScreenProps) {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  
  const isPlayerTurn = currentPlayer === 'player-1';
  const cardsToDiscard = 3;
  const cardsDiscarded = discards.length;
  const cardsRemaining = cardsToDiscard - cardsDiscarded;
  
  const isPointCard = (card: GameCard): boolean => {
    if (!trumpSuit || trumpSuit === 'joker') return false;
    return getCardPoints(card, trumpSuit) > 0;
  };
  
  const isTrump = (card: GameCard): boolean => {
    if (!trumpSuit || trumpSuit === 'joker') return false;
    return isTrumpCard(card, trumpSuit);
  };
  
  const canDiscardCard = (card: GameCard): boolean => {
    if (!isPlayerTurn) return false;
    if (cardsDiscarded >= cardsToDiscard) return false;
    
    const cardIsTrump = isTrump(card);
    const isPoint = isPointCard(card);
    const trumpCount = playerHand.filter(isTrump).length;

    console.log(`[canDiscard] ${card.rank}${card.suit} | trump=${cardIsTrump} point=${isPoint} trumpCount=${trumpCount}`);

    if (cardIsTrump && isPoint) { console.log('  -> BLOCKED: trump point card'); return false; }
    if (cardIsTrump && trumpCount <= 6) { console.log('  -> BLOCKED: trump count <= 6'); return false; }

    console.log('  -> ALLOWED');
    return true;
  };
  
  const handleCardSelect = (cardId: string) => {
    if (!isPlayerTurn) return;
    
    const card = playerHand.find(c => c.id === cardId);
    if (!card || !canDiscardCard(card)) return;
    
    setSelectedCard(cardId === selectedCard ? null : cardId);
  };
  
  const handleDiscardSelected = () => {
    if (selectedCard) {
      onDiscardCard(selectedCard);
      setSelectedCard(null);
    }
  };
  
  const getCardStatus = (card: GameCard): string => {
    const cardIsTrump = isTrump(card);
    const isPoint = isPointCard(card);
    
    if (cardIsTrump && isPoint) {
      return isOffJack(card, trumpSuit === 'joker' ? null : trumpSuit) ? 'Off-Jack (Cannot Discard)' : 'Trump Point Card (Cannot Discard)';
    }
    if (cardIsTrump) {
      return 'Trump Card';
    }
    if (isPoint) {
      return 'Point Card (Can Discard)';
    }
    return 'Safe to Discard';
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discarding Phase</Text>
        <Text style={styles.subtitle}>
          {isPlayerTurn ? 'Your turn to discard' : `${playerName}'s turn`}
        </Text>
        
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Discard {cardsRemaining} more card{cardsRemaining !== 1 ? 's' : ''} ({cardsDiscarded}/3)
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[styles.progressFill, { width: `${(cardsDiscarded / cardsToDiscard) * 100}%` }]} 
            />
          </View>
        </View>
        
        {trumpSuit && (
          <View style={styles.trumpIndicator}>
            <Text style={styles.trumpText}>Trump: </Text>
            <Text style={[styles.trumpSuit, { color: trumpSuit === 'hearts' || trumpSuit === 'diamonds' ? '#dc2626' : trumpSuit === 'joker' ? '#7c3aed' : '#000' }]}>
              {trumpSuit === 'hearts' ? '♥' : trumpSuit === 'diamonds' ? '♦' : trumpSuit === 'clubs' ? '♣' : trumpSuit === 'spades' ? '♠' : '🃏'}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.handSection}>
        <Text style={styles.sectionTitle}>
          Your Hand ({playerHand.length} cards) • Select {cardsRemaining} to discard
        </Text>
        
        <View style={styles.handContainer}>
          {playerHand.map((card) => {
            const canDiscard = canDiscardCard(card);
            const isSelected = selectedCard === card.id;
            const cardIsTrump = isTrump(card);
            const isPoint = isPointCard(card);
            
            return (
              <TouchableOpacity
                key={card.id}
                style={[
                  styles.cardWrapper,
                  !canDiscard && styles.cardDisabled,
                  isSelected && styles.cardSelected,
                  cardIsTrump && styles.cardTrump,
                  isPoint && styles.cardPoint,
                ]}
                onPress={() => handleCardSelect(card.id)}
                disabled={!canDiscard}
              >
                <Card suit={card.suit} rank={card.rank} width={70} height={98} />
                <Text style={styles.cardStatus}>{getCardStatus(card)}</Text>
                {!canDiscard && (
                  <View style={styles.cannotDiscardOverlay}>
                    <Text style={styles.cannotDiscardText}>✗</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        
        {selectedCard && (
          <TouchableOpacity
            style={styles.discardButton}
            onPress={handleDiscardSelected}
          >
            <Text style={styles.discardButtonText}>
              Discard Selected Card
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.discardsSection}>
        <Text style={styles.sectionTitle}>
          Your Discards ({discards.length}/3)
        </Text>
        
        {discards.length > 0 ? (
          <View style={styles.discardsContainer}>
            {discards.map((card, index) => (
              <View key={card.id} style={styles.discardedCard}>
                <Card suit={card.suit} rank={card.rank} width={60} height={84} />
                <Text style={styles.discardNumber}>#{index + 1}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noDiscardsText}>No cards discarded yet</Text>
        )}
      </View>
      
      <View style={styles.rulesSection}>
        <Text style={styles.rulesTitle}>Discarding Rules:</Text>
        <View style={styles.rulesList}>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleEmoji}>📋</Text>
            <Text style={styles.ruleText}>Discard 3 cards from your 9-card hand</Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleEmoji}>🚫</Text>
            <Text style={styles.ruleText}>Cannot discard trump unless you have more than 6 trump cards</Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleEmoji}>🎯</Text>
            <Text style={styles.ruleText}>Trump point cards cannot be discarded (A/J/2/10/3 of trump, jokers, off-jack)</Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleEmoji}>🔄</Text>
            <Text style={styles.ruleText}>If you have more than 6 point cards, one passes left automatically</Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleEmoji}>🎴</Text>
            <Text style={styles.ruleText}>Bidder then chooses the final 6 cards to keep</Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleEmoji}>👑</Text>
            <Text style={styles.ruleText}>Bidder gets remaining cards (kitty) after discarding</Text>
          </View>
        </View>
      </View>
      
      {!isPlayerTurn && (
        <Text style={styles.waitingText}>
          Waiting for {playerName} to discard...
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ff69b4',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#a0aec0',
    marginBottom: 16,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  progressText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
  },
  progressBar: {
    width: 200,
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  trumpIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 70, 229, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trumpText: {
    color: '#cbd5e0',
    fontSize: 14,
  },
  trumpSuit: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  handSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  handContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardWrapper: {
    margin: 6,
    alignItems: 'center',
    borderRadius: 8,
    padding: 4,
    position: 'relative',
  },
  cardDisabled: {
    opacity: 0.5,
  },
  cardSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  cardTrump: {
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  cardPoint: {
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  cardStatus: {
    color: '#cbd5e0',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 80,
  },
  cannotDiscardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cannotDiscardText: {
    color: '#ef4444',
    fontSize: 24,
    fontWeight: 'bold',
  },
  discardButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  discardButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  discardsSection: {
    marginBottom: 30,
  },
  discardsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  discardedCard: {
    margin: 6,
    alignItems: 'center',
  },
  discardNumber: {
    color: '#a0aec0',
    fontSize: 10,
    marginTop: 4,
  },
  noDiscardsText: {
    color: '#718096',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  rulesSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  rulesTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  rulesList: {
    gap: 8,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  ruleEmoji: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  ruleText: {
    color: '#cbd5e0',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  waitingText: {
    color: '#f59e0b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
});