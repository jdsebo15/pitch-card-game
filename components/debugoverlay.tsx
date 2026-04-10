import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GameCard } from '../lib/game';
import { Card } from './Card';

interface DebugOverlayProps {
  visible: boolean;
  onClose: () => void;
  playerHands: Array<{ name: string; hand: GameCard[] }>;
  trumpSuit: string | null;
  currentPhase: string;
  scores: Record<string, number>;
  teamScores: Record<number, number>;
}

export function DebugOverlay({ 
  visible, 
  onClose, 
  playerHands, 
  trumpSuit, 
  currentPhase,
  scores,
  teamScores
}: DebugOverlayProps) {
  if (!visible) return null;

  const totalPointsInHands = playerHands.reduce((total, player) => {
    return total + player.hand.length;
  }, 0);

  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Debug Info</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game State</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phase:</Text>
            <Text style={styles.infoValue}>{currentPhase}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Trump:</Text>
            <Text style={styles.infoValue}>{trumpSuit || 'Not set'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total cards in hands:</Text>
            <Text style={styles.infoValue}>{totalPointsInHands}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team Scores</Text>
          <View style={styles.teamScores}>
            <View style={styles.teamScore}>
              <Text style={[styles.teamLabel, { color: '#60a5fa' }]}>Team 0 (N/S)</Text>
              <Text style={styles.teamValue}>{teamScores[0]}</Text>
            </View>
            <View style={styles.teamScore}>
              <Text style={[styles.teamLabel, { color: '#f87171' }]}>Team 1 (E/W)</Text>
              <Text style={styles.teamValue}>{teamScores[1]}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Player Hands</Text>
          {playerHands.map((player, index) => (
            <View key={index} style={styles.playerHand}>
              <View style={styles.playerHeader}>
                <Text style={styles.playerName}>{player.name}</Text>
                <Text style={styles.playerScore}>Score: {scores[player.name === 'You' ? 'player-1' : `player-${index + 1}`] || 0}</Text>
              </View>
              <View style={styles.handCards}>
                {player.hand.map((card, cardIndex) => (
                  <View key={cardIndex} style={styles.debugCard}>
                    <Card suit={card.suit} rank={card.rank} width={40} height={56} />
                    <Text style={styles.cardId}>{card.id}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.cardCount}>{player.hand.length} cards</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Card Values (if trump is {trumpSuit || 'none'})</Text>
          <Text style={styles.note}>
            Main Jack (trump J): 116{'\n'}
            Off Jack: 114{'\n'}
            Big Joker: 115{'\n'}
            Little Joker: 113{'\n'}
            Trump A: 112{'\n'}
            Trump K: 111{'\n'}
            Trump Q: 110{'\n'}
            Other trump: 100+base{'\n'}
            Non-trump: base value
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: 1000,
    padding: 20,
    justifyContent: 'center',
  },
  content: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    paddingBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#374151',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoLabel: {
    color: '#9ca3af',
    fontSize: 14,
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  teamScores: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  teamScore: {
    alignItems: 'center',
  },
  teamLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  teamValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  playerHand: {
    marginBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 12,
    borderRadius: 8,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  playerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  playerScore: {
    color: '#9ca3af',
    fontSize: 14,
  },
  handCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  debugCard: {
    margin: 2,
    alignItems: 'center',
  },
  cardId: {
    color: '#9ca3af',
    fontSize: 8,
    marginTop: 2,
  },
  cardCount: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'right',
  },
  note: {
    color: '#9ca3af',
    fontSize: 12,
    lineHeight: 18,
  },
});
