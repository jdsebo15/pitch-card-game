import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Modal,
  Platform,
  UIManager,
  LayoutAnimation,
  useWindowDimensions,
} from 'react-native';
import { GameTable } from '../components/GameTable';
import { DiscardingScreen } from '../components/DiscardingScreen';
import { TrumpSelectionScreen } from '../components/TrumpSelectionScreen';
import { DebugOverlay } from '../components/DebugOverlay';
import { Card } from '../components/Card';
import { PitchGame } from '../lib/gameState';
import { Suit, sortCards } from '../lib/game';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AI_DELAY_MS = 850;
const HUMAN_ID = 'player-1';

export function GameScreen({ onGameEnd }: { onGameEnd: () => void }) {
  const [game, setGame] = useState<PitchGame>(() => new PitchGame());
  const [gameState, setGameState] = useState(() => game.getState());
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);

  const aiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handOverShown = useRef(false);

  const { width } = useWindowDimensions();
  const handCardW = Math.min(72, Math.max(54, Math.round(width * 0.13)));
  const handCardH = Math.round(handCardW * 1.4);

  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer)!;
  const human = gameState.players.find(p => p.id === HUMAN_ID)!;
  const isHumanTurn = currentPlayer.id === HUMAN_ID;

  const playerPositions = gameState.players.map((p, index) => ({
    id: p.id,
    name: p.name,
    handCount: p.hand.length,
    isCurrent: p.id === gameState.currentPlayer,
    isHuman: p.isHuman,
    position: (index === 0 ? 'bottom' : index === 1 ? 'left' : index === 2 ? 'top' : 'right') as
      'top' | 'right' | 'bottom' | 'left',
    score: gameState.scores[p.id] || 0,
    team: p.team,
    isBidder: p.id === gameState.bidder,
    isDealer: p.id === gameState.dealer,
  }));

  const currentTrick = gameState.tricks[gameState.tricks.length - 1];
  const centerCards = currentTrick && !currentTrick.winner ? currentTrick.cards : [];

  const refresh = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setGameState(game.getState());
  }, [game]);

  // ─── Hand-over alert ────────────────────────────────────────────────────────
  useEffect(() => {
    if (gameState.phase !== 'scoring' || handOverShown.current) return;
    handOverShown.current = true;
    const ns = gameState.teamScores[0];
    const ew = gameState.teamScores[1];
    const winner = ns === ew ? 'Tie!' : ns > ew ? 'NS leads' : 'EW leads';
    Alert.alert(
      'Hand complete',
      `NS: ${ns}\nEW: ${ew}\n\n${winner}`,
      [
        {
          text: 'Next hand',
          onPress: () => {
            handOverShown.current = false;
            game.startNextHand();
            refresh();
          },
        },
        { text: 'Main menu', style: 'cancel', onPress: onGameEnd },
      ]
    );
  }, [gameState.phase, gameState.teamScores, game, onGameEnd, refresh]);

  // ─── AI driver loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (aiTimer.current) {
      clearTimeout(aiTimer.current);
      aiTimer.current = null;
    }

    const phase = gameState.phase;
    if (phase === 'scoring') {
      setAiThinking(false);
      return;
    }

    const me = gameState.players.find(p => p.id === gameState.currentPlayer);
    if (!me || me.isHuman) {
      setAiThinking(false);
      return;
    }

    setAiThinking(true);
    aiTimer.current = setTimeout(() => {
      game.makeAIMove(me.id);
      setAiThinking(false);
      refresh();
    }, AI_DELAY_MS);

    return () => {
      if (aiTimer.current) {
        clearTimeout(aiTimer.current);
        aiTimer.current = null;
      }
    };
  }, [gameState.currentPlayer, gameState.phase, game, refresh]);

  // ─── Human action handlers ─────────────────────────────────────────────────
  const onPlaceBid = (bid: number) => {
    if (game.placeBid(HUMAN_ID, bid)) refresh();
  };
  const onPass = () => {
    if (game.placeBid(HUMAN_ID, 0)) refresh();
  };
  const onChooseTrump = (suit: Suit) => {
    if (game.chooseTrump(HUMAN_ID, suit)) refresh();
  };
  const onConfirmDiscard = (keepIds: string[]) => {
    if (game.finalizeBidderHand(HUMAN_ID, keepIds)) refresh();
  };
  const onPlaySelected = () => {
    if (!selectedCard) return;
    if (game.playCard(HUMAN_ID, selectedCard)) {
      setSelectedCard(null);
      refresh();
    }
  };

  const showHand = gameState.phase === 'playing' || gameState.phase === 'bidding';
  const showBidModal = gameState.phase === 'bidding' && isHumanTurn;
  const showTrumpModal = gameState.phase === 'choosing-trump' && isHumanTurn;
  const showDiscardModal = gameState.phase === 'discarding' && isHumanTurn;
  const minBid = (gameState.bid ?? 4) + 1;

  return (
    <SafeAreaView style={styles.container}>
      <GameTable
        players={playerPositions}
        playerHands={gameState.players.reduce((acc, p) => ({ ...acc, [p.id]: p.hand }), {})}
        centerCards={centerCards}
        trumpSuit={gameState.trumpSuit}
        currentBid={gameState.bid}
        teamScores={gameState.teamScores}
        thinking={aiThinking}
      />

      {showHand && (
        <View style={styles.handBar}>
          <Text style={styles.handTitle}>
            {gameState.phase === 'bidding'
              ? '🃏 Your hand'
              : isHumanTurn
                ? `Your turn • ${human.hand.length} card${human.hand.length !== 1 ? 's' : ''}`
                : `${currentPlayer.name}'s turn`}
          </Text>
          <View style={styles.handCards}>
            {sortCards(human.hand, gameState.trumpSuit).map(card => {
              const picked = selectedCard === card.id;
              return (
                <TouchableOpacity
                  key={card.id}
                  activeOpacity={0.8}
                  style={[styles.cardTouchable, picked && styles.cardSelected]}
                  onPress={() => {
                    if (gameState.phase !== 'playing' || !isHumanTurn) return;
                    setSelectedCard(picked ? null : card.id);
                  }}
                  disabled={gameState.phase !== 'playing' || !isHumanTurn}
                >
                  <Card suit={card.suit} rank={card.rank} width={handCardW} height={handCardH} />
                </TouchableOpacity>
              );
            })}
          </View>
          {selectedCard && gameState.phase === 'playing' && isHumanTurn && (
            <TouchableOpacity style={styles.playButton} onPress={onPlaySelected}>
              <Text style={styles.playButtonText}>Play card</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.menuButton} onPress={onGameEnd}>
        <Text style={styles.menuButtonText}>Menu</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.debugButton} onPress={() => setShowDebug(true)}>
        <Text style={styles.debugButtonText}>🔍</Text>
      </TouchableOpacity>

      {/* ── Bidding modal ── */}
      <Modal visible={showBidModal} transparent animationType="fade">
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.card}>
            <Text style={modalStyles.title}>Your bid</Text>
            <Text style={modalStyles.subtitle}>
              {gameState.bid != null
                ? `Current bid: ${gameState.bid} — beat it or pass`
                : 'Bid 5–10 or pass'}
            </Text>
            <View style={modalStyles.bidRow}>
              {[5, 6, 7, 8, 9, 10].map(bid => {
                const disabled = bid < minBid;
                return (
                  <TouchableOpacity
                    key={bid}
                    style={[modalStyles.bidButton, disabled && modalStyles.bidDisabled]}
                    onPress={() => !disabled && onPlaceBid(bid)}
                    disabled={disabled}
                  >
                    <Text style={modalStyles.bidText}>{bid}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={modalStyles.passButton} onPress={onPass}>
              <Text style={modalStyles.passText}>
                {gameState.dealer === HUMAN_ID && gameState.bid === null
                  ? 'Pass (forces 5)'
                  : 'Pass'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Trump selection modal ── */}
      <Modal visible={showTrumpModal} transparent animationType="fade">
        <View style={modalStyles.backdrop}>
          <View style={[modalStyles.card, modalStyles.cardWide]}>
            <TrumpSelectionScreen
              playerHand={human.hand}
              forcedBid={gameState.forcedBid}
              bid={gameState.bid}
              onChooseTrump={onChooseTrump}
            />
          </View>
        </View>
      </Modal>

      {/* ── Discard modal ── */}
      <Modal visible={showDiscardModal} transparent animationType="slide">
        <View style={modalStyles.backdrop}>
          <View style={[modalStyles.card, modalStyles.cardWide, modalStyles.cardTall]}>
            <DiscardingScreen
              pool={human.hand}
              trumpSuit={gameState.trumpSuit}
              onConfirm={onConfirmDiscard}
            />
          </View>
        </View>
      </Modal>

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
  },
  handBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    padding: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  handCards: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  cardTouchable: {
    marginHorizontal: 3,
    marginBottom: 6,
    borderRadius: 8,
  },
  cardSelected: {
    transform: [{ translateY: -10 }],
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 20,
  },
  playButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 4,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  menuButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    paddingHorizontal: 14,
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
    top: 40,
    right: 75,
    backgroundColor: 'rgba(59, 130, 246, 0.85)',
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

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#1a202c',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardWide: {
    maxWidth: 460,
  },
  cardTall: {
    maxHeight: '90%',
    padding: 0,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 18,
  },
  bidRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  bidButton: {
    backgroundColor: '#3b82f6',
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bidDisabled: {
    backgroundColor: '#374151',
    opacity: 0.55,
  },
  bidText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  passButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  passText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
