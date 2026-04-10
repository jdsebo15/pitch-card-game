export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'joker';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | 'big' | 'little';

export interface GameCard {
  suit: Suit;
  rank: Rank;
  id: string;
}

export interface Player {
  id: string;
  name: string;
  hand: GameCard[];
  isHuman: boolean;
  team: number; // 0 or 1
}

export interface Trick {
  cards: Array<{ card: GameCard; playerId: string }>;
  winner?: string;
}

export interface GameState {
  players: Player[];
  deck: GameCard[];
  currentPlayer: string;
  trumpSuit: Suit | null;
  bid: number | null;
  bidder: string | null;
  tricks: Trick[];
  scores: Record<string, number>;
  teamScores: Record<number, number>;
  phase: 'bidding' | 'choosing-trump' | 'discarding' | 'selecting-kitty' | 'playing' | 'scoring';
  dealer: string;
  forcedBid: boolean;
}

export function createDeck(): GameCard[] {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
  const deck: GameCard[] = [];
  
  // Standard 52 cards
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({
        suit,
        rank,
        id: `${suit}-${rank}`,
      });
    }
  }
  
  // Add jokers (2 total)
  deck.push({ suit: 'joker', rank: 'big', id: 'joker-big' });
  deck.push({ suit: 'joker', rank: 'little', id: 'joker-little' });
  
  return deck;
}

export function shuffleDeck(deck: GameCard[]): GameCard[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(deck: GameCard[], numPlayers: number, cardsPerPlayer: number = 9): { hands: GameCard[][]; remainingDeck: GameCard[] } {
  const hands: GameCard[][] = Array.from({ length: numPlayers }, () => []);
  
  for (let i = 0; i < cardsPerPlayer; i++) {
    for (let player = 0; player < numPlayers; player++) {
      if (deck.length > 0) {
        hands[player].push(deck.pop()!);
      }
    }
  }
  
  return { hands, remainingDeck: deck };
}

export function isSameColorSuit(a: Suit, b: Suit): boolean {
  const redA = a === 'hearts' || a === 'diamonds';
  const redB = b === 'hearts' || b === 'diamonds';
  const blackA = a === 'clubs' || a === 'spades';
  const blackB = b === 'clubs' || b === 'spades';
  return (redA && redB) || (blackA && blackB);
}

export function isOffJack(card: GameCard, trumpSuit: Suit | null): boolean {
  return !!trumpSuit &&
    card.rank === 'J' &&
    card.suit !== 'joker' &&
    card.suit !== trumpSuit &&
    isSameColorSuit(card.suit, trumpSuit);
}

export function isTrumpCard(card: GameCard, trumpSuit: Suit | null): boolean {
  if (!trumpSuit) return false;
  return card.suit === 'joker' || card.suit === trumpSuit || isOffJack(card, trumpSuit);
}

export function getCardValue(card: GameCard, trumpSuit: Suit | null): number {
  const baseRankValues: Record<Rank, number> = {
    '2': 1,
    '3': 2,
    '4': 3,
    '5': 4,
    '6': 5,
    '7': 6,
    '8': 7,
    '9': 8,
    '10': 9,
    'J': 10,
    'Q': 11,
    'K': 12,
    'A': 13,
    'little': 14,
    'big': 15,
  };

  if (card.suit === 'joker') {
    return card.rank === 'big' ? 115 : 113;
  }

  if (isOffJack(card, trumpSuit)) return 114;

  if (trumpSuit && card.suit === trumpSuit) {
    if (card.rank === 'J') return 116;
    if (card.rank === 'A') return 112;
    if (card.rank === 'K') return 111;
    if (card.rank === 'Q') return 110;
    return 100 + baseRankValues[card.rank];
  }

  return baseRankValues[card.rank];
}

export function canPlayCard(
  card: GameCard,
  playerHand: GameCard[],
  trickCards: GameCard[],
  trumpSuit: Suit | null,
  leadSuit: Suit | null
): boolean {
  if (trickCards.length === 0 || !leadSuit) return true;

  const effectiveSuit = (c: GameCard) => isTrumpCard(c, trumpSuit) ? trumpSuit : c.suit;
  const hasLeadSuit = playerHand.some(c => effectiveSuit(c) === leadSuit);

  if (!hasLeadSuit) return true;
  return effectiveSuit(card) === leadSuit;
}

export function determineTrickWinner(
  trickCards: Array<{ card: GameCard; playerId: string }>,
  trumpSuit: Suit | null,
  leadSuit: Suit
): string {
  if (!trumpSuit || trickCards.length === 0) return trickCards[0]?.playerId || '';

  // First, find the highest trump card if any
  const trumpCards = trickCards.filter(({ card }) => isTrumpCard(card, trumpSuit));
  if (trumpCards.length > 0) {
    // Highest trump wins
    return trumpCards.reduce((best, current) => 
      getCardValue(current.card, trumpSuit) > getCardValue(best.card, trumpSuit) ? current : best
    ).playerId;
  }

  // No trumps played, highest card of lead suit wins
  const leadSuitCards = trickCards.filter(({ card }) => card.suit === leadSuit);
  if (leadSuitCards.length > 0) {
    return leadSuitCards.reduce((best, current) => 
      getCardValue(current.card, trumpSuit) > getCardValue(best.card, trumpSuit) ? current : best
    ).playerId;
  }

  // Should not happen - someone should have followed suit
  return trickCards[0].playerId;
}

export function getCardPoints(card: GameCard, trumpSuit: Suit): number {
  let points = 0;
  const isTrump = isTrumpCard(card, trumpSuit);
  // Only trump cards (and jokers) can score points
  if (!isTrump) return 0;
  if (card.suit === trumpSuit && card.rank === 'A') points += 1;
  if (card.suit === trumpSuit && card.rank === 'J') points += 1;
  if (isOffJack(card, trumpSuit)) points += 1;
  if (card.rank === 'big') points += 1;   // joker
  if (card.rank === 'little') points += 1; // joker
  if (card.suit === trumpSuit && card.rank === '10') points += 1;
  if (card.suit === trumpSuit && card.rank === '3') points += 3;
  if (card.suit === trumpSuit && card.rank === '2') points += 1;
  return points;
}

export function calculatePoints(trick: Trick, trumpSuit: Suit): number {
  return trick.cards.reduce((sum, { card }) => sum + getCardPoints(card, trumpSuit), 0);
}

export function sortCards(cards: GameCard[], trumpSuit: Suit | null): GameCard[] {
  const suitOrder: Record<Suit, number> = {
    joker: 0,          // jokers first
    hearts: 1,
    diamonds: 2,
    clubs: 3,
    spades: 4,
  };
  
  const rankOrder: Record<Rank, number> = {
    'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2,
    'big': 15, 'little': 14.5, // jokers
  };
  
  return [...cards].sort((a, b) => {
    // If trump suit is set, trump suit comes first (except jokers)
    if (trumpSuit && a.suit !== 'joker' && b.suit !== 'joker') {
      if (a.suit === trumpSuit && b.suit !== trumpSuit) return -1;
      if (a.suit !== trumpSuit && b.suit === trumpSuit) return 1;
    }
    
    // Then by suit order
    if (suitOrder[a.suit] !== suitOrder[b.suit]) {
      return suitOrder[a.suit] - suitOrder[b.suit];
    }
    
    // Then by rank (high to low)
    return rankOrder[b.rank] - rankOrder[a.rank];
  });
}