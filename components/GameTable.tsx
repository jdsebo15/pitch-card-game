import React from 'react';
import { View, Text, StyleSheet, Dimensions, SafeAreaView } from 'react-native';
import { Card } from './Card';
import { GameCard, sortCards, Suit } from '../lib/game';

const { width, height } = Dimensions.get('window');

// Card dimensions
const CARD_W = 56;
const CARD_H = 80;
const SIDE_CARD_W = 44;
const SIDE_CARD_H = 62;
const CENTER_CARD_W = 70;
const CENTER_CARD_H = 98;

interface PlayerPosition {
  id: string;
  name: string;
  handCount: number;
  isCurrent: boolean;
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
}

function PlayerBadge({
  player,
  align = 'center',
}: {
  player: PlayerPosition;
  align?: 'center' | 'flex-start' | 'flex-end';
}) {
  const teamColor = player.team === 0 ? '#10b981' : '#3b82f6';
  return (
    <View style={[badgeStyles.badge, player.isCurrent && badgeStyles.active, { alignItems: align, borderColor: player.isCurrent ? '#6366f1' : teamColor }]}>
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
    </View>
  );
}

/** Fanned face‑up cards for North/top — horizontal fan */
function HorizontalFanFaceUp({ cards, trumpSuit }: { cards: GameCard[], trumpSuit?: Suit | null }) {
  const sorted = sortCards(cards, trumpSuit || null);
  const show = Math.min(sorted.length, 9);
  const overlap = 18;
  const totalW = CARD_W + (show - 1) * (CARD_W - overlap);
  return (
    <View style={{ width: totalW, height: CARD_H, position: 'relative' }}>
      {sorted.slice(0, show).map((card, i) => (
        <View key={i} style={{ position: 'absolute', left: i * (CARD_W - overlap) }}>
          <Card suit={card.suit} rank={card.rank} faceUp={true} width={CARD_W} height={CARD_H} />
        </View>
      ))}
    </View>
  );
}

/** Fanned face‑up cards for West/left — vertical fan */
function VerticalFanFaceUp({ cards, trumpSuit }: { cards: GameCard[], trumpSuit?: Suit | null }) {
  const sorted = sortCards(cards, trumpSuit || null);
  const show = Math.min(sorted.length, 8);
  const overlap = 16;
  const totalH = SIDE_CARD_H + (show - 1) * (SIDE_CARD_H - overlap);
  return (
    <View style={{ width: SIDE_CARD_W, height: totalH, position: 'relative' }}>
      {sorted.slice(0, show).map((card, i) => (
        <View key={i} style={{ position: 'absolute', top: i * (SIDE_CARD_H - overlap) }}>
          <Card suit={card.suit} rank={card.rank} faceUp={true} width={SIDE_CARD_W} height={SIDE_CARD_H} />
        </View>
      ))}
    </View>
  );
}

function TrumpBadge({ trumpSuit }: { trumpSuit: string }) {
  const suitSymbol = trumpSuit === 'hearts' ? '♥' : trumpSuit === 'diamonds' ? '♦' : trumpSuit === 'clubs' ? '♣' : trumpSuit === 'spades' ? '♠' : '🃏';
  const color = trumpSuit === 'hearts' || trumpSuit === 'diamonds' ? '#dc2626' : trumpSuit === 'joker' ? '#7c3aed' : '#000';
  return (
    <View style={infoStyles.trumpBadge}>
      <Text style={infoStyles.trumpLabel}>TRUMP</Text>
      <Text style={[infoStyles.trumpSymbol, { color }]}>{suitSymbol}</Text>
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
}: GameTableProps) {
  const north = players.find(p => p.position === 'top');
  const south = players.find(p => p.position === 'bottom');
  const west = players.find(p => p.position === 'left');
  const east = players.find(p => p.position === 'right');

  // Center trick cards — position relative to which player played
  const getCardOffset = (playerId: string): { dx: number; dy: number } => {
    const p = players.find(pl => pl.id === playerId);
    if (!p) return { dx: 0, dy: 0 };
    switch (p.position) {
      case 'top': return { dx: 0, dy: -45 };
      case 'bottom': return { dx: 0, dy: 45 };
      case 'left': return { dx: -55, dy: 0 };
      case 'right': return { dx: 55, dy: 0 };
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* ── Green felt table ── */}
      <View style={styles.felt}>

        {/* ── Compact score/trump/bid overlay (top-left) ── */}
        <View style={infoStyles.compactOverlay}>
          {/* Left column: NS/EW scores stacked */}
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
          {/* Right column: Trump + Bid */}
          <View style={infoStyles.infoColumn}>
            {trumpSuit && <TrumpBadge trumpSuit={trumpSuit} />}
            {currentBid != null && (
              <View style={infoStyles.bidChip}>
                <Text style={infoStyles.bidText}>Bid: {currentBid}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── NORTH ── */}
        {north && (
          <View style={styles.northArea}>
            <PlayerBadge player={north} />
            <View style={{ marginTop: 8 }}>
              <HorizontalFanFaceUp cards={playerHands[north.id] || []} trumpSuit={trumpSuit} />
            </View>
          </View>
        )}

        {/* ── WEST ── */}
        {west && (
          <View style={styles.westArea}>
            <VerticalFanFaceUp cards={playerHands[west.id] || []} trumpSuit={trumpSuit} />
            <PlayerBadge player={west} align="flex-start" />
          </View>
        )}

        {/* ── EAST ── */}
        {east && (
          <View style={styles.eastArea}>
            <VerticalFanFaceUp cards={playerHands[east.id] || []} trumpSuit={trumpSuit} />
            <PlayerBadge player={east} align="flex-end" />
          </View>
        )}

        {/* ── CENTER TRICK AREA ── */}
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
                    <Card suit={card.suit} rank={card.rank} width={CENTER_CARD_W} height={CENTER_CARD_H} />
                  </View>
                </View>
              );
            })
          )}
        </View>

      </View>{/* end felt */}

      {/* ── SOUTH badge (pinned to bottom of felt) ── */}
      {south && (
        <View style={styles.southArea}>
          <PlayerBadge player={south} />
        </View>
      )}
    </SafeAreaView>
  );
}

/* ─── styles ─── */
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#111827',
  },
  felt: {
    flex: 1,
    backgroundColor: '#166534',   // deep green felt
    margin: 8,
    borderRadius: 24,
    borderWidth: 6,
    borderColor: '#854d0e',        // wooden rail
    // relative anchor for absolute children
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── player areas ── */
  northArea: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    alignItems: 'center',
  },
  westArea: {
    position: 'absolute',
    left: 8,
    top: '30%',
    alignItems: 'center',
    gap: 8,
  },
  eastArea: {
    position: 'absolute',
    right: 8,
    top: '30%',
    alignItems: 'center',
    gap: 8,
  },
  southArea: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    alignItems: 'center',
  },

  /* ── center ── */
  centerArea: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  emptyCenter: {
    width: 120,
    height: 120,
    borderRadius: 60,
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

/* ─── player badge styles ─── */
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
});

/* ─── score / trump info styles ─── */
const infoStyles = StyleSheet.create({
  compactOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  scoreColumn: {
    gap: 4,
  },
  infoColumn: {
    gap: 4,
  },
  teamChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  teamLabel: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  teamScore: {
    color: '#fff',
    fontSize: 14,
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
  },
  bidText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
