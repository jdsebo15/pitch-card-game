import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, SafeAreaView, Modal } from 'react-native';
import { GameTable } from '../components/GameTable';
import { BiddingScreen } from '../components/BiddingScreen';
import { DiscardingScreen } from '../components/DiscardingScreen';
import { TrumpSelectionScreen } from '../components/trumpselectionscreen';
import { BidderHandSelectionScreen } from '../components/bidderhandselectionscreen';
import { DebugOverlay } from '../components/debugoverlay';
import { Card } from '../components/Card';
import { PitchGame } from '../lib/gameState';
import { GameCard, Suit, sortCards } from '../lib/game';

export function GameScreen({ onGameEnd }: { onGameEnd: () => void }) {
  const [game, setGame] = useState<PitchGame>(new PitchGame());
  const [gameState, setGameState] = useState(game.getState());
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer)!;
  
  const playerPositions = gameState.players.map((p, index) => ({
    id: p.id,
    name: p.name,
    handCount: p.hand.length,
    isCurrent: p.id === gameState.currentPlayer,
    // Clockwise: South (0) = bottom, West (1) = left, North (2) = top, East (3) = right
    position: (index === 0 ? 'bottom' : index === 1 ? 'left' : index === 2 ? 'top' : 'right') as 'top' | 'right' | 'bottom' | 'left',
    score: gameState.scores[p.id] || 0,
    team: p.team,
    isBidder: p.id === gameState.bidder,
    isDealer: p.id === gameState.dealer,
  }));
  
  const currentTrick = gameState.tricks[gameState.tricks.length - 1];
  const centerCards = currentTrick?.cards || [];
  
  const updateGameState = useCallback(() => {
    const newState = game.getState();
    setGameState(newState);
    
    // Check if game is over
    if (game.isGameOver()) {
      const winner = game.getWinner();
      if (winner) {
        Alert.alert(
          'Hand Over!',
          `Team 0: ${newState.teamScores[0]}\nTeam 1: ${newState.teamScores[1]}\n\nTop individual this hand: ${gameState.players.find(p => p.id === winner.playerId)?.name} (${winner.score})`,
          [
            { text: 'New Game', onPress: () => setGame(new PitchGame()) },
            { text: 'Main Menu', onPress: onGameEnd },
          ]
        );
      }
    }
  }, [game, gameState.players, onGameEnd]);
  
  const handlePlaceBid = (bid: number) => {
    const success = game.placeBid(gameState.currentPlayer, bid);
    if (success) updateGameState();
  };
  
  const handlePass = () => {
    const success = game.placeBid(gameState.currentPlayer, 0);
    if (success) updateGameState();
  };
  
  const handleChooseTrump = (suit: Suit) => {
    const success = game.chooseTrump(gameState.currentPlayer, suit);
    if (success) updateGameState();
  };
  
  const handleDiscardCard = (cardId: string) => {
    const success = game.discardCard(gameState.currentPlayer, cardId);
    if (success) updateGameState();
  };
  
  const handleConfirmBidderHand = (cardIds: string[]) => {
    const success = game.confirmBidderHand(gameState.currentPlayer, cardIds);
    if (success) updateGameState();
  };
  
  const handlePlayCard = (cardId: string) => {
    const success = game.playCard(gameState.currentPlayer, cardId);
    if (success) {
      setSelectedCard(null);
      updateGameState();
    }
  };
  
  const handleCardSelect = (cardId: string) => {
    if (gameState.phase !== 'playing') return;
    setSelectedCard(cardId === selectedCard ? null : cardId);
  };
  
  const handlePlaySelectedCard = () => {
    if (selectedCard) {
      handlePlayCard(selectedCard);
    }
  };
  
  // ─── Inline UI for each phase ───
  const renderTrumpUI = () => (
    <View style={phaseStyles.container}>
      <Text style={phaseStyles.title}>Choose Trump Suit</Text>
      <Text style={phaseStyles.subtitle}>You bid {gameState.bid}</Text>
      <View style={phaseStyles.suitRow}>
        {['hearts', 'diamonds', 'clubs', 'spades'].map(suit => (
          <TouchableOpacity
            key={suit}
            style={phaseStyles.suitButton}
            onPress={() => handleChooseTrump(suit as Suit)}
          >
            <Text style={[
              phaseStyles.suitSymbol,
              { color: suit === 'hearts' || suit === 'diamonds' ? '#dc2626' : '#000' }
            ]}>
              {suit === 'hearts' ? '♥' : suit === 'diamonds' ? '♦' : suit === 'clubs' ? '♣' : '♠'}
            </Text>
            <Text style={phaseStyles.suitLabel}>{suit}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDiscardUI = () => {
    const discards = game.getDiscards(gameState.currentPlayer);
    const remaining = 3 - discards.length;
    return (
      <View style={phaseStyles.container}>
        <Text style={phaseStyles.title}>Discard {remaining} more card{remaining !== 1 ? 's' : ''}</Text>
        <Text style={phaseStyles.subtitle}>Select cards to discard from your hand</Text>
        <View style={phaseStyles.handPreview}>
          {currentPlayer.hand.map(card => (
            <View key={card.id} style={phaseStyles.previewCard}>
              <Card suit={card.suit} rank={card.rank} width={50} height={70} />
              <TouchableOpacity
                style={phaseStyles.discardButton}
                onPress={() => handleDiscardCard(card.id)}
              >
                <Text style={phaseStyles.discardButtonText}>Discard</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderKittyUI = () => (
    <View style={phaseStyles.container}>
      <Text style={phaseStyles.title}>Select Your Final 6 Cards</Text>
      <Text style={phaseStyles.subtitle}>Choose 6 cards from the pool</Text>
      <TouchableOpacity
        style={phaseStyles.confirmButton}
        onPress={() => {
          // Auto-pick the 6 highest-value cards
          const pool = game.getBidderPool();
          const selected = [...pool]
            .sort((a, b) => {
              // Simple value sort (trump high)
              const aVal = a.suit === gameState.trumpSuit ? 100 : 0;
              const bVal = b.suit === gameState.trumpSuit ? 100 : 0;
              return bVal - aVal;
            })
            .slice(0, 6)
            .map(c => c.id);
          handleConfirmBidderHand(selected);
        }}
      >
        <Text style={phaseStyles.confirmButtonText}>Auto‑Pick Best 6 Cards</Text>
      </TouchableOpacity>
    </View>
  );
  
  // ─── Main table view ───
  return (
    <SafeAreaView style={styles.container}>
      <GameTable
        players={playerPositions}
        playerHands={gameState.players.reduce((acc, p) => ({
          ...acc,
          [p.id]: p.hand
        }), {})}
        centerCards={centerCards}
        trumpSuit={gameState.trumpSuit}
        currentBid={gameState.bid}
        teamScores={gameState.teamScores}
      />
      
      {/* Player hand (only in playing phase) */}
      {gameState.phase === 'playing' && (
        <View style={styles.playerHandContainer}>
          <Text style={styles.handTitle}>
            🟢 {currentPlayer.name}'s turn • {currentPlayer.hand.length} cards
          </Text>
          
          <View style={styles.handCards}>
            {sortCards(currentPlayer.hand, gameState.trumpSuit).map((card) => (
              <TouchableOpacity
                key={card.id}
                style={[
                  styles.cardTouchable,
                  selectedCard === card.id && styles.cardSelected,
                ]}
                onPress={() => handleCardSelect(card.id)}
              >
                <Card
                  suit={card.suit}
                  rank={card.rank}
                  width={70}
                  height={98}
                />
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Play button */}
          {selectedCard && (
            <TouchableOpacity
              style={styles.playButton}
              onPress={handlePlaySelectedCard}
            >
              <Text style={styles.playButtonText}>Play Selected Card</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {/* Bidding UI (inline on table) */}
      {gameState.phase === 'bidding' && (
        <View style={biddingStyles.container}>
          <Text style={biddingStyles.title}>
            {currentPlayer.name}'s turn to bid
          </Text>
          <View style={biddingStyles.bidRow}>
            {[5, 6, 7, 8, 9, 10].map(bid => (
              <TouchableOpacity
                key={bid}
                style={[
                  biddingStyles.bidButton,
                  gameState.bid !== null && bid <= gameState.bid && biddingStyles.bidDisabled
                ]}
                onPress={() => handlePlaceBid(bid)}
                disabled={gameState.bid !== null && bid <= gameState.bid}
              >
                <Text style={biddingStyles.bidText}>{bid}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={biddingStyles.passButton}
            onPress={handlePass}
          >
            <Text style={biddingStyles.passText}>Pass</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Game info overlay (top-left) */}
      <View style={styles.gameInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phase:</Text>
          <Text style={styles.infoValue}>
            {gameState.phase === 'playing' ? 'Playing' : gameState.phase === 'scoring' ? 'Scoring' : gameState.phase}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Trump:</Text>
          <Text style={styles.infoValue}>
            {gameState.trumpSuit ? 
              (gameState.trumpSuit === 'hearts' ? '♥ Hearts' :
               gameState.trumpSuit === 'diamonds' ? '♦ Diamonds' :
               gameState.trumpSuit === 'clubs' ? '♣ Clubs' : 
               gameState.trumpSuit === 'spades' ? '♠ Spades' :
               '🃏 Joker') : 
              'Not set'}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Bid:</Text>
          <Text style={styles.infoValue}>
            {gameState.bid !== null ? `${gameState.bid} by ${gameState.players.find(p => p.id === gameState.bidder)?.name}` : 'None'}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tricks:</Text>
          <Text style={styles.infoValue}>
            {gameState.tricks.filter(t => t.winner).length} completed
          </Text>
        </View>
      </View>
      
      {/* Menu button */}
      <TouchableOpacity style={styles.menuButton} onPress={onGameEnd}>
        <Text style={styles.menuButtonText}>Menu</Text>
      </TouchableOpacity>
      
      {/* Debug button */}
      <TouchableOpacity style={styles.debugButton} onPress={() => setShowDebug(true)}>
        <Text style={styles.debugButtonText}>🔍</Text>
      </TouchableOpacity>
      
      {/* Phase-specific UI */}
      {gameState.phase === 'choosing-trump' && renderTrumpUI()}
      {gameState.phase === 'discarding' && renderDiscardUI()}
      {gameState.phase === 'selecting-kitty' && renderKittyUI()}
      
      {/* Debug overlay */}
      <DebugOverlay
        visible={showDebug}
        onClose={() => setShowDebug(false)}
        playerHands={gameState.players.map(p => ({ name: p.name, hand: p.hand }))}
        trumpSuit={gameState.trumpSuit}
        currentPhase={gameState.phase}
        scores={gameState.scores}
        teamScores={gameState.teamScores}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a202c',
    paddingTop: 0,
  },
  playerHandContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  handCards: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  cardTouchable: {
    marginHorizontal: 4,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardSelected: {
    transform: [{ translateY: -10 }],
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 20,
  },
  playButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 8,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gameInfo: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 12,
    minWidth: 180,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoLabel: {
    color: '#a0aec0',
    fontSize: 14,
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  menuButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  menuButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  debugButton: {
    position: 'absolute',
    top: 60,
    right: 80,
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

const overlayStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1a202c',
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: '90%',
  },
});

const biddingStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 160, // Higher up to avoid covering South's hand
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  bidRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  bidButton: {
    backgroundColor: '#3b82f6',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bidDisabled: {
    backgroundColor: '#6b7280',
    opacity: 0.5,
  },
  bidText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  passButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  passText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

const phaseStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 160, // Higher up to avoid covering South's hand
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#cbd5e0',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  suitRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    marginBottom: 20,
  },
  suitButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 12,
    minWidth: 80,
  },
  suitSymbol: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  suitLabel: {
    color: '#fff',
    fontSize: 14,
    textTransform: 'capitalize',
  },
  handPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  previewCard: {
    alignItems: 'center',
  },
  discardButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  discardButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});