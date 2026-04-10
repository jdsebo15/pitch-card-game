import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Card } from './Card';
import { GameCard } from '../lib/game';

interface BiddingScreenProps {
  playerHand: GameCard[];
  currentBid: number | null;
  currentPlayer: string;
  playerName: string;
  onPlaceBid: (bid: number) => void;
  onPass: () => void;
}

export function BiddingScreen({
  playerHand,
  currentBid,
  currentPlayer,
  playerName,
  onPlaceBid,
  onPass,
}: BiddingScreenProps) {
  const [selectedBid, setSelectedBid] = useState<number | null>(null);
  
  const isPlayerTurn = currentPlayer === 'player-1';
  
  const bids = [2, 3, 4];
  
  const handleBid = (bid: number) => {
    if (!isPlayerTurn) return;
    if (currentBid !== null && bid <= currentBid) return;
    setSelectedBid(bid);
    onPlaceBid(bid);
  };
  
  const handlePass = () => {
    if (!isPlayerTurn) return;
    onPass();
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bidding Phase</Text>
        <Text style={styles.subtitle}>
          {isPlayerTurn ? 'Your turn to bid' : `${playerName}'s turn`}
        </Text>
        
        {currentBid !== null && (
          <View style={styles.currentBidContainer}>
            <Text style={styles.currentBidText}>Current bid: </Text>
            <Text style={styles.currentBidValue}>{currentBid}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.handSection}>
        <Text style={styles.sectionTitle}>Your Hand ({playerHand.length} cards)</Text>
        <View style={styles.handContainer}>
          {playerHand.map((card, index) => (
            <View key={card.id} style={[styles.cardWrapper, { marginLeft: index > 0 ? -30 : 0 }]}>
              <Card suit={card.suit} rank={card.rank} width={80} height={112} />
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.biddingSection}>
        <Text style={styles.sectionTitle}>Place Your Bid</Text>
        <Text style={styles.bidInstructions}>
          Bid how many points (2-4) you think you can make.{'\n'}
          You must bid higher than the current bid or pass.
        </Text>
        
        <View style={styles.bidButtons}>
          {bids.map((bid) => {
            const isDisabled = currentBid !== null && bid <= currentBid;
            const isSelected = selectedBid === bid;
            
            return (
              <TouchableOpacity
                key={bid}
                style={[
                  styles.bidButton,
                  isSelected && styles.bidButtonSelected,
                  isDisabled && styles.bidButtonDisabled,
                  !isPlayerTurn && styles.bidButtonDisabled,
                ]}
                onPress={() => handleBid(bid)}
                disabled={isDisabled || !isPlayerTurn}
              >
                <Text style={[
                  styles.bidButtonText,
                  isSelected && styles.bidButtonTextSelected,
                  (isDisabled || !isPlayerTurn) && styles.bidButtonTextDisabled,
                ]}>
                  Bid {bid}
                </Text>
                {isSelected && <Text style={styles.selectedIndicator}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
        
        <TouchableOpacity
          style={[
            styles.passButton,
            !isPlayerTurn && styles.passButtonDisabled,
          ]}
          onPress={handlePass}
          disabled={!isPlayerTurn}
        >
          <Text style={[
            styles.passButtonText,
            !isPlayerTurn && styles.passButtonTextDisabled,
          ]}>
            Pass
          </Text>
        </TouchableOpacity>
        
        {!isPlayerTurn && (
          <Text style={styles.waitingText}>
            Waiting for {playerName} to bid...
          </Text>
        )}
      </View>
      
      <View style={styles.bidInfo}>
        <Text style={styles.infoTitle}>Point Values (Catch Order):</Text>
        <View style={styles.pointsList}>
          <View style={styles.pointItem}>
            <Text style={styles.pointEmoji}>🅰️</Text>
            <Text style={styles.pointText}>Ace = 1 point (highest)</Text>
          </View>
          <View style={styles.pointItem}>
            <Text style={styles.pointEmoji}>🇰</Text>
            <Text style={styles.pointText}>King = 0 points</Text>
          </View>
          <View style={styles.pointItem}>
            <Text style={styles.pointEmoji}>🇶</Text>
            <Text style={styles.pointText}>Queen = 0 points</Text>
          </View>
          <View style={styles.pointItem}>
            <Text style={styles.pointEmoji}>🎃</Text>
            <Text style={styles.pointText}>Main Jack (trump) = 1 point</Text>
          </View>
          <View style={styles.pointItem}>
            <Text style={styles.pointEmoji}>🃏</Text>
            <Text style={styles.pointText}>Big Joker = 1 point</Text>
          </View>
          <View style={styles.pointItem}>
            <Text style={styles.pointEmoji}>🎭</Text>
            <Text style={styles.pointText}>Off Jack (same color) = 1 point</Text>
          </View>
          <View style={styles.pointItem}>
            <Text style={styles.pointEmoji}>🃏</Text>
            <Text style={styles.pointText}>Little Joker = 1 point</Text>
          </View>
          <View style={styles.pointItem}>
            <Text style={styles.pointEmoji}>🔟</Text>
            <Text style={styles.pointText}>10 = 1 point</Text>
          </View>
          <View style={styles.pointItem}>
            <Text style={styles.pointEmoji}>3️⃣</Text>
            <Text style={styles.pointText}>3 = 3 points</Text>
          </View>
          <View style={styles.pointItem}>
            <Text style={styles.pointEmoji}>2️⃣</Text>
            <Text style={styles.pointText}>2 = 1 point (auto-keep)</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a202c',
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
    marginBottom: 12,
  },
  currentBidContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 70, 229, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4f46e5',
  },
  currentBidText: {
    color: '#cbd5e0',
    fontSize: 14,
  },
  currentBidValue: {
    color: '#fff',
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
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  cardWrapper: {
    marginBottom: 10,
  },
  biddingSection: {
    marginBottom: 30,
    alignItems: 'center',
  },
  bidInstructions: {
    color: '#a0aec0',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  bidButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 12,
  },
  bidButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  bidButtonSelected: {
    backgroundColor: '#4f46e5',
    borderColor: '#6366f1',
  },
  bidButtonDisabled: {
    backgroundColor: '#2d3748',
    opacity: 0.5,
  },
  bidButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bidButtonTextSelected: {
    color: '#fff',
  },
  bidButtonTextDisabled: {
    color: '#718096',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 4,
    right: 8,
    color: '#10b981',
    fontSize: 16,
    fontWeight: 'bold',
  },
  passButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  passButtonDisabled: {
    borderColor: '#7f1d1d',
    opacity: 0.5,
  },
  passButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  passButtonTextDisabled: {
    color: '#7f1d1d',
  },
  waitingText: {
    color: '#f59e0b',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
  bidInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  pointsList: {
    gap: 8,
  },
  pointItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  pointText: {
    color: '#cbd5e0',
    fontSize: 14,
    flex: 1,
  },
});