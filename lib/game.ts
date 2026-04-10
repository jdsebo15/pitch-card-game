export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

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
  phase: 'bidding' | 'playing' | 'scoring';
}

export function createDeck(): GameCard[] {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
  const deck: GameCard[] = [];
  
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({
        suit,
        rank,
        id: `${suit}-${rank}`,
      });
    }
  }
  
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

export function dealCards(deck: GameCard[], numPlayers: number): { hands: GameCard[][]; remainingDeck: GameCard[] } {
  const hands: GameCard[][] = Array.from({ length: numPlayers }, () => []);
  const cardsPerPlayer = 6; // Standard Pitch deals 6 cards each
  
  for (let i = 0; i < cardsPerPlayer; i++) {
    for (let player = 0; player < numPlayers; player++) {
      if (deck.length > 0) {
        hands[player].push(deck.pop()!);
      }
    }
  }
  
  return { hands, remainingDeck: deck };
}

export function getCardValue(card: GameCard, trumpSuit: Suit | null): number {
  // In Pitch: J of trump is highest, then A, K, Q, 10, 9, etc.
  // Non-trump suits: A, K, Q, J, 10, 9, etc.
  
  const isTrump = trumpSuit && card.suit === trumpSuit;
  const rankValues: Record<Rank, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14,
  };
  
  let value = rankValues[card.rank];
  
  // Adjust for trump suit special rules
  if (isTrump) {
    if (card.rank === 'J') return 20; // Right bower (jack of trump)
    // Note: Left bower logic would need to check for jack of same color suit
  }
  
  return value;
}

function getOppositeColor(suit: Suit): Suit {
  if (suit === 'hearts' || suit === 'diamonds') {
    return suit === 'hearts' ? 'diamonds' : 'hearts';
  } else {
    return suit === 'clubs' ? 'spades' : 'clubs';
  }
}

export function canPlayCard(
  card: GameCard,
  playerHand: GameCard[],
  trickCards: GameCard[],
  trumpSuit: Suit | null,
  leadSuit: Suit | null
): boolean {
  // If no cards in trick yet, any card can be played
  if (trickCards.length === 0) return true;
  
  // Must follow suit if possible
  if (leadSuit) {
    const hasLeadSuit = playerHand.some(c => c.suit === leadSuit);
    if (hasLeadSuit) {
      return card.suit === leadSuit;
    }
  }
  
  // Can play any card if don't have lead suit
  return true;
}

export function determineTrickWinner(
  trickCards: Array<{ card: GameCard; playerId: string }>,
  trumpSuit: Suit | null,
  leadSuit: Suit
): string {
  let winner = trickCards[0];
  let highestValue = getCardValue(winner.card, trumpSuit);
  
  for (let i = 1; i < trickCards.length; i++) {
    const current = trickCards[i];
    const currentValue = getCardValue(current.card, trumpSuit);
    
    // Trump beats non-trump
    if (trumpSuit && current.card.suit === trumpSuit && winner.card.suit !== trumpSuit) {
      winner = current;
      highestValue = currentValue;
    }
    // Higher value of same suit/trump wins
    else if (current.card.suit === winner.card.suit && currentValue > highestValue) {
      winner = current;
      highestValue = currentValue;
    }
  }
  
  return winner.playerId;
}

export function calculatePoints(trick: Trick, trumpSuit: Suit): number {
  let points = 0;
  
  for (const { card } of trick.cards) {
    // High: Ace of trump
    if (card.suit === trumpSuit && card.rank === 'A') points += 1;
    // Low: 2 of trump
    if (card.suit === trumpSuit && card.rank === '2') points += 1;
    // Jack: Jack of trump
    if (card.suit === trumpSuit && card.rank === 'J') points += 1;
    // Game: Count points from high cards
    if (card.rank === '10') points += 10;
    if (card.rank === 'J') points += 1;
    if (card.rank === 'Q') points += 2;
    if (card.rank === 'K') points += 3;
    if (card.rank === 'A') points += 4;
  }
  
  return points;
}