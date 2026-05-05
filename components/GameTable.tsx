import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions, SafeAreaView } from 'react-native';
import { Card } from './Card';
import { GameCard, sortCards, Suit } from '../lib/game';

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

function useCardSizes() {
  const { width, height } = useWindowDimensions();
  const base = Math.min(width, height);
  const CARD_W = clamp(Math.round(base * 0.13), 44, 72);
  const CARD_H = Math.round(CARD_W * 1.4);
  const SIDE_CARD_W = Math.round(CARD_W * 0.78);
  const SIDE_CARD_H = Math.round(CARD_H * 0.78);
  const CENTER_CARD_W = Math.round(CARD_W * 1.25);
  const CENTER_CARD_H = Math.round(CARD_H * 1.25);
  return { CARD_W, CARD_H, SIDE_CARD_W, SIDE_CARD_H, CENTER_CARD_W, CENTER_CARD_H };
}

interface PlayerPosition {
  id: string;
  name: string;
  handCount: number;
  isCurrent: boolean;
  isHuman: boolean;
  position: 'top' | 'right' | 'bottom' | 'left';
  score: number;
  team: number;
  isBidder?: boolean;
  isDealer?: boolean;
}

interface GameTableProps {
  players: PlayerPosition[];
  playerHands?: Record<string, GameCard[]>;
  centerCards?: Array<{ card: GameCard; playerId: string }>;
  trumpSuit?: 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'joker' | null;
  currentBid?: number | null;
  teamScores?: Record<number, number>;
  thinking?: boolean;
}

function PlayerBadge({
  player,
  align = 'center',
  thinking = false,
}: {
  player: PlayerPosition;
  align?: 'center' | 'flex-start' | 'flex-end';
  thinking?: boolean;
}) {
  const teamColor = player.team === 0 ? '#10b981' : '#3b82f6';
  return (
    <View
      style={[
        badgeStyles.badge,
        player.isCurrent && badgeStyles.active,
        { alignItems: align, borderColor: player.isCurrent ? '#6366f1' : teamColor },
      ]}
    >
      <View style={badgeStyles.nameRow}>
        <Text style={badgeStyles.name}>
          {player.name}
          {player.isBidder ? ' ⭐' : ''}
        </Text>
        {player.isDealer && (
          <View style={badgeStyles.dealerChip}>
            <Text style={badgeStyles.dealerText}>D</Text>
          </View>
        )}
      </View>
      <Text style={[badgeStyles.sub, { color: teamColor }]}>{player.score} pts</Text>
      {thinking && <Text style={badgeStyles.thinking}>thinking…</Text>}
    </View>
  );
}

function HorizontalFanFaceUp({
  cards,
  trumpSuit,
  cardW,
  cardH,
}: {
  cards: GameCard[];
  trumpSuit?: Suit | null;
  cardW: number;
  cardH: number;
}) {
  const sorted = sortCards(cards, trumpSuit || null);
  const show = Math.min(sorted.length, 9);
  const overlap = Math.round(cardW * 0.32);
  const totalW = show > 0 ? cardW + (show - 1) * (cardW - overlap) : 0;
  return (
    <View style={{ width: totalW, height: cardH, position: 'relative' }}>
      {sorted.slice(0, show).map((card, i) => (
        <View key={i} style={{ position: 'absolute', left: i * (cardW - overlap) }}>
          <Card suit={card.suit} rank={card.rank} faceUp={true} width={cardW} height={cardH} />
        </View>
      ))}
    </View>
  );
}

function VerticalFanFaceUp({
  cards,
  trumpSuit,
  cardW,
  cardH,
}: {
  cards: GameCard[];
  trumpSuit?: Suit | null;
  cardW: number;
  cardH: number;
}) {
  const sorted = sortCards(cards, trumpSuit || null);
  const show = Math.min(sorted.length, 8);
  const overlap = Math.round(cardH * 0.2);
  const totalH = show > 0 ? cardH + (show - 1) * (cardH - overlap) : 0;
  return (
    <View style={{ width: cardW, height: totalH, position: 'relative' }}>
      {sorted.slice(0, show).map((card, i) => (
        <View key={i} style={{ position: 'absolute', top: i * (cardH - overlap) }}>
          <Card suit={card.suit} rank={card.rank} faceUp={true} width={cardW} height={cardH} />
        </View>
      ))}
    </View>
  );
}

function TrumpBadge({ trumpSuit }: { trumpSuit: string }) {
  const symbol =
    trumpSuit === 'hearts'   ? '♥' :
    trumpSuit === 'diamonds' ? '♦' :
    trumpSuit === 'clubs'    ? '♣' :
    trumpSuit === 'spades'   ? '♠' : '🃏';
  const color =
    trumpSuit === 'hearts' || trumpSuit === 'diamonds' ? '#dc2626' :
    trumpSuit === 'joker' ? '#7c3aed' : '#000';
  return (
    <View style={infoStyles.trumpBadge}>
      <Text style={infoStyles.trumpLabel}>TRUMP</Text>
      <Text style={[infoStyles.trumpSymbol, { color }]}>{symbol}</Text>
    </View>
  );
}

export function GameTable({
  players,
  playerHands = {},
  centerCards = [],
  trumpSuit,
  currentBid,
  teamScores = { 0: 0, 1: 0 },
  thinking = false,
}: GameTableProps) {
  const sizes = useCardSizes();

  const north = players.find(p => p.position === 'top');
  const south = players.find(p => p.position === 'bottom');
  const west  = players.find(p => p.position === 'left');
  const east  = players.find(p => p.position === 'right');

  const offset = sizes.CENTER_CARD_W * 0.6;
  const getCardOffset = (playerId: string): { dx: number; dy: number } => {
    const p = players.find(pl => pl.id === playerId);
    if (!p) return { dx: 0, dy: 0 };
    switch (p.position) {
      case 'top':    return { dx: 0,        dy: -offset };
      case 'bottom': return { dx: 0,        dy:  offset };
      case 'left':   return { dx: -offset,  dy: 0 };
      case 'right':  return { dx:  offset,  dy: 0 };
    }
  };

  const isThinking = (player: PlayerPosition | undefined) =>
    !!player && player.isCurrent && !player.isHuman && thinking;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.felt}>
        <View style={infoStyles.compactOverlay}>
          <View style={infoStyles.scoreColumn}>
            <View style={[infoStyles.teamChip, { borderColor: '#10b981' }]}>
              <Text style={[infoStyles.teamLabel, { color: '#10b981' }]}>NS</Text>
              <Text style={infoStyles.teamScore}>{teamScores[0]}</Text>
            </View>
            <View style={[infoStyles.teamChip, { borderColor: '#3b82f6' }]}>
              <Text style={[infoStyles.teamLabel, { color: '#3b82f6' }]}>EW</Text>
              <Text style={infoStyles.teamScore}>{teamScores[1]}</Text>
            </View>
          </View>
          <View style={infoStyles.infoColumn}>
            {trumpSuit && <TrumpBadge trumpSuit={trumpSuit} />}
            {currentBid != null && (
              <View style={infoStyles.bidChip}>
                <Text style={infoStyles.bidText}>Bid: {currentBid}</Text>
              </View>
            )}
          </View>
        </View>

        {north && (
          <View style={styles.northArea}>
            <PlayerBadge player={north} thinking={isThinking(north)} />
            <View style={{ marginTop: 8 }}>
              <HorizontalFanFaceUp
                cards={playerHands[north.id] || []}
                trumpSuit={trumpSuit}
                cardW={sizes.CARD_W}
                cardH={sizes.CARD_H}
              />
            </View>
          </View>
        )}

        {west && (
          <View style={styles.westArea}>
            <VerticalFanFaceUp
              cards={playerHands[west.id] || []}
              trumpSuit={trumpSuit}
              cardW={sizes.SIDE_CARD_W}
              cardH={sizes.SIDE_CARD_H}
            />
            <PlayerBadge player={west} align="flex-start" thinking={isThinking(west)} />
          </View>
        )}

        {east && (
          <View style={styles.eastArea}>
            <VerticalFanFaceUp
              cards={playerHands[east.id] || []}
              trumpSuit={trumpSuit}
              cardW={sizes.SIDE_CARD_W}
              cardH={sizes.SIDE_CARD_H}
            />
            <PlayerBadge player={east} align="flex-end" thinking={isThinking(east)} />
          </View>
        )}

        <View style={styles.centerArea}>
          {centerCards.length === 0 ? (
            <View style={styles.emptyCenter}>
              <Text style={styles.emptyCenterText}>Play area</Text>
            </View>
          ) : (
            centerCards.map(({ card, playerId }, i) => {
              const { dx, dy } = getCardOffset(playerId);
              const player = players.find(p => p.id === playerId);
              const teamColor = player?.team === 0 ? '#10b981' : '#3b82f6';
              return (
                <View
                  key={`${card.id}-${i}`}
                  style={[
                    styles.centerCard,
                    { transform: [{ translateX: dx }, { translateY: dy }] },
                  ]}
                >
                  <View style={[styles.centerCardBorder, { borderColor: teamColor }]}>
                    <Card
                      suit={card.suit}
                      rank={card.rank}
                      width={sizes.CENTER_CARD_W}
                      height={sizes.CENTER_CARD_H}
                    />
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>

      {south && (
        <View style={styles.southArea}>
          <PlayerBadge player={south} thinking={isThinking(south)} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#111827',
  },
  felt: {
    flex: 1,
    backgroundColor: '#166534',
    margin: 8,
    borderRadius: 24,
    borderWidth: 6,
    borderColor: '#854d0e',
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  northArea: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    alignItems: 'center',
  },
  westArea: {
    position: 'absolute',
    left: 8,
    top: '28%',
    alignItems: 'center',
    gap: 8,
  },
  eastArea: {
    position: 'absolute',
    right: 8,
    top: '28%',
    alignItems: 'center',
    gap: 8,
  },
  southArea: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    alignItems: 'center',
  },
  centerArea: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  emptyCenter: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCenterText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
  },
  centerCard: {
    position: 'absolute',
  },
  centerCardBorder: {
    borderWidth: 3,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
});

const badgeStyles = StyleSheet.create({
  badge: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4a5568',
    minWidth: 110,
  },
  active: {
    backgroundColor: 'rgba(99,102,241,0.85)',
    borderColor: '#818cf8',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  name: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dealerChip: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f59e0b',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dealerText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sub: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  thinking: {
    color: '#fde68a',
    fontSize: 10,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 1,
  },
});

const infoStyles = StyleSheet.create({
  compactOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    maxWidth: 170,
    height: 72,
  },
  scoreColumn: { gap: 2 },
  infoColumn: { gap: 2 },
  teamChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
  },
  teamLabel: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  teamScore: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  trumpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    height: 28,
    justifyContent: 'center',
  },
  trumpLabel: {
    color: '#d1d5db',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  trumpSymbol: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  bidChip: {
    backgroundColor: 'rgba(79,70,229,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bidText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
