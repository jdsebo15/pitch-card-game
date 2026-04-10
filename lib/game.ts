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
  phase: 'bidding' | 'discarding' | 'playing' | 'scoring';
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

export function getCardValue(card: GameCard, trumpSuit: Suit | null): number {
  // Your specified catch order:
  // 1. A1 (highest)
  // 2. K0 
  // 3. Q0
  // 4. Main jack 1 (jack of trump)
  // 5. Big joker 1 (not in standard deck)
  // 6. Off jack 1 (jack of same color as trump)
  // 7. Little joker 1 (not in standard deck)
  // 8. 10-1
  // 9. 9, 8, 7, 6, 5, 4 (no points)
  // 10. 3-3
  // 11. 2-1 (lowest, but auto-keep)
  
  const isTrump = trumpSuit && card.suit === trumpSuit;
  
  // Base ranking values for trick-winning (higher = wins trick)
  const baseRankValues: Record<Rank, number> = {
    '2': 1,   // 2-1 (lowest rank but has point value)
    '3': 11,  // 3-3 (higher than 4-9 but lower than 10)
    '4': 3, '5': 4, '6': 5, '7': 6, '8': 7, '9': 8,
    '10': 9,  // 10-1
    'J': 12,  // Jack (will be adjusted for trump)
    'Q': 13,  // Q0
    'K': 14,  // K0  
    'A': 15,  // A1
    'little': 16, // Little joker
    'big': 17,    // Big joker
  };
  
  let value = baseRankValues[card.rank];
  
  // Adjust for trump suit special rules
  if (isTrump) {
    // Trump cards are generally higher than non-trump
    value += 20; // Boost trump cards above non-trump
    
    // Special trump rankings:
    if (card.rank === 'J') return 45; // Main jack (highest)
    if (card.rank === 'A') return 44; // Ace of trump
    if (card.rank === 'K') return 43; // King of trump
    if (card.rank === 'Q') return 42; // Queen of trump
    if (card.rank === '2') return 21; // 2 of trump (auto-keep, but low rank)
    // Other trump cards keep their boosted value
  }
  
  // Jokers (always trump in some variations)
  if (card.suit === 'joker') {
    // Jokers rank between main jack and off jack
    if (card.rank === 'big') return 41;    // Big joker
    if (card.rank === 'little') return 40; // Little joker
  }
  
  // Handle off-jack (jack of same color as trump)
  if (trumpSuit && card.rank === 'J') {
    const isSameColor = (
      (trumpSuit === 'hearts' || trumpSuit === 'diamonds') && 
      (card.suit === 'hearts' || card.suit === 'diamonds')
    ) || (
      (trumpSuit === 'clubs' || trumpSuit === 'spades') && 
      (card.suit === 'clubs' || card.suit === 'spades')
    );
    
    if (isSameColor && card.suit !== trumpSuit) {
      // Off jack ranks between main jack and ace
      return 35;
    }
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
    // Your specified point values:
    if (card.rank === 'A') points += 1;          // A1
    // King = 0 points (K0)
    // Queen = 0 points (Q0)
    
    if (card.suit === trumpSuit && card.rank === 'J') points += 1; // Main jack 1
    
    // Jokers
    if (card.rank === 'big') points += 1;    // Big joker 1
    if (card.rank === 'little') points += 1; // Little joker 1
    
    // Off jack (jack of same color as trump) = 1 point
    
    if (card.rank === '10') points += 1;        // 10-1
    if (card.rank === '3') points += 3;         // 3-3
    if (card.rank === '2') points += 1;         // 2-1 (auto keep)
    
    // Additional logic for 2 of trump auto-keep
    if (card.suit === trumpSuit && card.rank === '2') {
      // The 2 of trump is automatically kept by whoever catches it
      // This is handled in the game state logic
    }
  }
  
  return points;
}