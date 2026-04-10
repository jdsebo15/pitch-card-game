import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Card } from './Card';
import { GameCard } from '../lib/game';

const { width, height } = Dimensions.get('window');

interface PlayerPosition {
  id: string;
  name: string;
  handCount: number;
  isCurrent: boolean;
  position: 'top' | 'right' | 'bottom' | 'left';
  score: number;
  isBidder?: boolean;
}

interface GameTableProps {
  players: PlayerPosition[];
  centerCards?: Array<{ card: GameCard; playerId: string }>;
  trumpSuit?: 'hearts' | 'diamonds' | 'clubs' | 'spades' | null;
  currentBid?: number | null;
}

export function GameTable({ players, centerCards = [], trumpSuit, currentBid }: GameTableProps) {
  const getPositionStyle = (position: 'top' | 'right' | 'bottom' | 'left') => {
    switch (position) {
      case 'top':
        return { top: 50, left: width / 2 - 60, alignItems: 'center' as const };
      case 'right':
        return { top: height / 2 - 40, right: 20, alignItems: 'flex-end' as const };
      case 'bottom':
        return { bottom: 100, left: width / 2 - 60, alignItems: 'center' as const };
      case 'left':
        return { top: height / 2 - 40, left: 20, alignItems: 'flex-start' as const };
    }
  };

  const getCardPosition = (index: number, total: number) => {
    const angle = (index / total) * Math.PI * 2;
    const radius = 80;
    return {
      left: Math.cos(angle) * radius + (width / 2 - 50),
      top: Math.sin(angle) * radius + (height / 2 - 70),
    };
  };

  return (
    <View style={styles.container}>
      {/* Game table surface */}
      <View style={styles.table}>
        {/* Trump indicator */}
        {trumpSuit && (
          <View style={styles.trumpIndicator}>
            <Text style={styles.trumpText}>Trump: </Text>
            <View style={styles.trumpSuit}>
              <Text style={[styles.trumpSuitText, { color: trumpSuit === 'hearts' || trumpSuit === 'diamonds' ? '#dc2626' : '#000' }]}>
                {trumpSuit === 'hearts' ? '♥' : trumpSuit === 'diamonds' ? '♦' : trumpSuit === 'clubs' ? '♣' : '♠'}
              </Text>
            </View>
          </View>
        )}
        
        {/* Current bid */}
        {currentBid !== null && (
          <View style={styles.bidIndicator}>
            <Text style={styles.bidText}>Bid: {currentBid}</Text>
          </View>
        )}
        
        {/* Center cards (trick) */}
        <View style={styles.centerArea}>
          {centerCards.map(({ card, playerId }, index) => {
            const position = getCardPosition(index, centerCards.length);
            const player = players.find(p => p.id === playerId);
            return (
              <View key={`${card.id}-${index}`} style={[styles.centerCard, position]}>
                <Card suit={card.suit} rank={card.rank} width={80} height={112} />
                {player && (
                  <Text style={styles.cardPlayerName}>{player.name}</Text>
                )}
              </View>
            );
          })}
          
          {/* Trick center marker */}
          {centerCards.length === 0 && (
            <View style={styles.trickCenter}>
              <Text style={styles.trickCenterText}>Trick {centerCards.length > 0 ? 'in progress' : 'starts here'}</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Player positions */}
      {players.map((player) => {
        const positionStyle = getPositionStyle(player.position);
        return (
          <View key={player.id} style={[styles.playerPosition, positionStyle]}>
            <View style={[
              styles.playerInfo,
              player.isCurrent && styles.currentPlayer,
              player.isBidder && styles.bidderPlayer
            ]}>
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={styles.playerStats}>
                {player.handCount} cards • {player.score} pts
                {player.isBidder && ' • Bidder'}
              </Text>
              
              {/* Hand count indicator */}
              <View style={styles.handIndicator}>
                {Array.from({ length: Math.min(player.handCount, 5) }).map((_, i) => (
                  <View key={i} style={[styles.cardBackMini, { marginLeft: i > 0 ? -8 : 0 }]} />
                ))}
                {player.handCount > 5 && (
                  <Text style={styles.moreCards}>+{player.handCount - 5}</Text>
                )}
              </View>
            </View>
            
            {player.isCurrent && (
              <View style={styles.currentTurnIndicator}>
                <Text style={styles.currentTurnText}>↑</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a202c',
  },
  table: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#2d3748',
    borderRadius: width * 0.5,
    margin: 20,
    borderWidth: 4,
    borderColor: '#4a5568',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trumpIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trumpText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  trumpSuit: {
    marginLeft: 4,
  },
  trumpSuitText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  bidIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(79, 70, 229, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  bidText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  centerArea: {
    position: 'absolute',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerCard: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  cardPlayerName: {
    position: 'absolute',
    bottom: -20,
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    width: 80,
  },
  trickCenter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(74, 85, 104, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4a5568',
    borderStyle: 'dashed',
  },
  trickCenterText: {
    color: '#a0aec0',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  playerPosition: {
    position: 'absolute',
  },
  playerInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
  },
  currentPlayer: {
    backgroundColor: 'rgba(79, 70, 229, 0.9)',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  bidderPlayer: {
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  playerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  playerStats: {
    color: '#cbd5e0',
    fontSize: 12,
    marginBottom: 8,
  },
  handIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardBackMini: {
    width: 20,
    height: 28,
    backgroundColor: '#1e40af',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fff',
  },
  moreCards: {
    color: '#fff',
    fontSize: 10,
    marginLeft: 4,
  },
  currentTurnIndicator: {
    position: 'absolute',
    top: -20,
    alignSelf: 'center',
  },
  currentTurnText: {
    color: '#10b981',
    fontSize: 24,
    fontWeight: 'bold',
  },
});