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
import { GameCard, Suit } from '../lib/game';

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
    position: (index === 0 ? 'bottom' : index === 1 ? 'top' : index === 2 ? 'right' : 'left') as 'top' | 'right' | 'bottom' | 'left',
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
  
  // ─── Overlay rendering ───
  const renderBiddingOverlay = () => (
    <Modal transparent visible={gameState.phase === 'bidding'} animationType="slide">
      <View style={overlayStyles.backdrop}>
        <View style={overlayStyles.modal}>
          <BiddingScreen
            playerHand={currentPlayer.hand}
            currentBid={gameState.bid}
            currentPlayer={gameState.currentPlayer}
            playerName={currentPlayer.name}
            onPlaceBid={handlePlaceBid}
            onPass={handlePass}
          />
        </View>
      </View>
    </Modal>
  );
  
  const renderTrumpOverlay = () => (
    <Modal transparent visible={gameState.phase === 'choosing-trump'} animationType="slide">
      <View style={overlayStyles.backdrop}>
        <View style={overlayStyles.modal}>
          <TrumpSelectionScreen
            playerHand={currentPlayer.hand}
            forcedBid={gameState.forcedBid}
            bid={gameState.bid}
            onChooseTrump={handleChooseTrump}
          />
        </View>
      </View>
    </Modal>
  );
  
  const renderDiscardOverlay = () => (
    <Modal transparent visible={gameState.phase === 'discarding'} animationType="slide">
      <View style={overlayStyles.backdrop}>
        <View style={overlayStyles.modal}>
          <DiscardingScreen
            playerHand={currentPlayer.hand}
            trumpSuit={gameState.trumpSuit}
            currentPlayer={gameState.currentPlayer}
            playerName={currentPlayer.name}
            discards={game.getDiscards(gameState.currentPlayer)}
            onDiscardCard={handleDiscardCard}
            onComplete={() => {}}
          />
        </View>
      </View>
    </Modal>
  );
  
  const renderKittyOverlay = () => (
    <Modal transparent visible={gameState.phase === 'selecting-kitty'} animationType="slide">
      <View style={overlayStyles.backdrop}>
        <View style={overlayStyles.modal}>
          <BidderHandSelectionScreen
            cards={game.getBidderPool()}
            trumpSuit={gameState.trumpSuit}
            onConfirm={handleConfirmBidderHand}
          />
        </View>
      </View>
    </Modal>
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
            {currentPlayer.hand.map((card) => (
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
      
      {/* Overlays */}
      {renderBiddingOverlay()}
      {renderTrumpOverlay()}
      {renderDiscardOverlay()}
      {renderKittyOverlay()}
      
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
    top: 20,
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
    top: 20,
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
    top: 20,
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