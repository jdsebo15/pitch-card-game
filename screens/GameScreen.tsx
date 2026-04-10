import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
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
  
  const player = gameState.players.find(p => p.id === 'player-1')!;
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
  
  useEffect(() => {
    updateGameState();
    
    // AI turn handling with natural random delays
    if (!currentPlayer.isHuman && gameState.phase !== 'scoring') {
      // Different delays for different phases to feel natural
      let baseDelay = 800; // ms
      
      if (gameState.phase === 'bidding') {
        // Bidding: quick decisions (0.8-1.5s)
        baseDelay = 800 + Math.random() * 700;
      } else if (gameState.phase === 'choosing-trump') {
        // Trump selection: medium thinking (1-2s)
        baseDelay = 1000 + Math.random() * 1000;
      } else if (gameState.phase === 'discarding') {
        // Discarding: quick but thoughtful (0.5-1.2s)
        baseDelay = 500 + Math.random() * 700;
      } else if (gameState.phase === 'selecting-kitty') {
        // Kitty selection: careful consideration (1.5-3s)
        baseDelay = 1500 + Math.random() * 1500;
      } else if (gameState.phase === 'playing') {
        // Playing cards: varies by situation (0.6-2s)
        const currentTrick = gameState.tricks[gameState.tricks.length - 1];
        const trickCards = currentTrick?.cards || [];
        
        if (trickCards.length === 0) {
          // Leading: quick decision (0.6-1.2s)
          baseDelay = 600 + Math.random() * 600;
        } else if (trickCards.length === 3) {
          // Last to play: quick (0.5-1s)
          baseDelay = 500 + Math.random() * 500;
        } else {
          // Middle of trick: medium thinking (0.8-1.8s)
          baseDelay = 800 + Math.random() * 1000;
        }
      }
      
      const timer = setTimeout(() => {
        game.makeAIMove(currentPlayer.id);
        updateGameState();
      }, baseDelay);
      
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, gameState.phase, game, updateGameState]);
  
  const handlePlaceBid = (bid: number) => {
    const success = game.placeBid('player-1', bid);
    if (success) {
      updateGameState();
    }
  };
  
  const handlePass = () => {
    // Pass is represented as bid 0
    const success = game.placeBid('player-1', 0);
    if (success) {
      updateGameState();
    }
  };
  
  const handleChooseTrump = (suit: Suit) => {
    const success = game.chooseTrump('player-1', suit);
    if (success) {
      updateGameState();
    }
  };

  const handleDiscardCard = (cardId: string) => {
    const success = game.discardCard('player-1', cardId);
    if (success) {
      updateGameState();
    }
  };

  const handleConfirmBidderHand = (cardIds: string[]) => {
    const success = game.confirmBidderHand('player-1', cardIds);
    if (success) {
      updateGameState();
    }
  };
  
  const handlePlayCard = (cardId: string) => {
    if (gameState.currentPlayer !== 'player-1') return;
    
    const success = game.playCard('player-1', cardId);
    if (success) {
      setSelectedCard(null);
      updateGameState();
    }
  };
  
  const handleCardSelect = (cardId: string) => {
    if (gameState.currentPlayer !== 'player-1' || gameState.phase !== 'playing') return;
    setSelectedCard(cardId === selectedCard ? null : cardId);
  };
  
  const handlePlaySelectedCard = () => {
    if (selectedCard) {
      handlePlayCard(selectedCard);
    }
  };
  
  // Render bidding phase
  if (gameState.phase === 'bidding') {
    return (
      <BiddingScreen
        playerHand={player.hand}
        currentBid={gameState.bid}
        currentPlayer={gameState.currentPlayer}
        playerName={currentPlayer.name}
        onPlaceBid={handlePlaceBid}
        onPass={handlePass}
      />
    );
  }
  
  if (gameState.phase === 'choosing-trump') {
    if (gameState.currentPlayer === 'player-1') {
      return (
        <TrumpSelectionScreen
          playerHand={player.hand}
          forcedBid={gameState.forcedBid}
          bid={gameState.bid}
          onChooseTrump={handleChooseTrump}
        />
      );
    }

    return (
      <View style={styles.centeredPhaseScreen}>
        <Text style={styles.phaseTitle}>Choosing Trump</Text>
        <Text style={styles.waitingText}>Waiting for {currentPlayer.name} to choose trump...</Text>
      </View>
    );
  }

  // Render discarding phase
  if (gameState.phase === 'discarding') {
    return (
      <DiscardingScreen
        playerHand={player.hand}
        trumpSuit={gameState.trumpSuit}
        currentPlayer={gameState.currentPlayer}
        playerName={currentPlayer.name}
        discards={game.getDiscards('player-1')}
        onDiscardCard={handleDiscardCard}
        onComplete={() => {}}
      />
    );
  }

  if (gameState.phase === 'selecting-kitty') {
    if (gameState.currentPlayer === 'player-1') {
      return (
        <BidderHandSelectionScreen
          cards={game.getBidderPool()}
          trumpSuit={gameState.trumpSuit}
          onConfirm={handleConfirmBidderHand}
        />
      );
    }

    return (
      <View style={styles.centeredPhaseScreen}>
        <Text style={styles.phaseTitle}>Bidder Choosing Final Hand</Text>
        <Text style={styles.waitingText}>Waiting for {currentPlayer.name} to lock in their 6 cards...</Text>
      </View>
    );
  }
  
  // Render playing phase
  return (
    <View style={styles.container}>
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
      
      {/* Player hand */}
      <View style={styles.playerHandContainer}>
        <Text style={styles.handTitle}>
          {gameState.currentPlayer === 'player-1' ? '🟢 Your turn' : `⏳ ${currentPlayer.name}'s turn`} • {player.hand.length} cards
        </Text>
        
        <View style={styles.handCards}>
          {player.hand.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.cardTouchable,
                selectedCard === card.id && styles.cardSelected,
              ]}
              onPress={() => handleCardSelect(card.id)}
              disabled={gameState.currentPlayer !== 'player-1'}
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
        {gameState.currentPlayer === 'player-1' && selectedCard && (
          <TouchableOpacity
            style={styles.playButton}
            onPress={handlePlaySelectedCard}
          >
            <Text style={styles.playButtonText}>Play Selected Card</Text>
          </TouchableOpacity>
        )}
        
        {gameState.currentPlayer !== 'player-1' && (
          <Text style={styles.waitingText}>
            Waiting for {currentPlayer.name} to play...
          </Text>
        )}
      </View>
      
      {/* Game info */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a202c',
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
  waitingText: {
    color: '#f59e0b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
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
  centeredPhaseScreen: {
    flex: 1,
    backgroundColor: '#1a202c',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  phaseTitle: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
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