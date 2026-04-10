import { Suit, Rank, GameCard, Player, Trick, GameState, createDeck, shuffleDeck, dealCards, getCardValue, canPlayCard, determineTrickWinner, calculatePoints } from './game';

export class PitchGame {
  private state: GameState;
  private kitty: GameCard[] = [];
  private discards: Map<string, GameCard[]> = new Map();
  
  constructor(numPlayers: number = 4) {
    this.state = this.initializeGame(numPlayers);
  }
  
  private initializeGame(numPlayers: number): GameState {
    const deck = shuffleDeck(createDeck());
    const { hands, remainingDeck } = dealCards(deck, numPlayers, 9); // Deal 9 cards each
    
    const players: Player[] = [
      { id: 'player-1', name: 'You', hand: hands[0], isHuman: true },
      { id: 'player-2', name: 'AI North', hand: hands[1], isHuman: false },
      { id: 'player-3', name: 'AI East', hand: hands[2], isHuman: false },
      { id: 'player-4', name: 'AI West', hand: hands[3], isHuman: false },
    ];
    
    // Initialize discards map
    players.forEach(p => this.discards.set(p.id, []));
    
    return {
      players,
      deck: remainingDeck,
      currentPlayer: 'player-1',
      trumpSuit: null,
      bid: null,
      bidder: null,
      tricks: [],
      scores: {
        'player-1': 0,
        'player-2': 0,
        'player-3': 0,
        'player-4': 0,
      },
      phase: 'bidding',
    };
  }
  
  getState(): GameState {
    return { ...this.state };
  }
  
  getKitty(): GameCard[] {
    return [...this.kitty];
  }
  
  getDiscards(playerId: string): GameCard[] {
    return this.discards.get(playerId) || [];
  }
  
  // Helper to check if a card is worth points
  private isPointCard(card: GameCard): boolean {
    if (!this.state.trumpSuit) return false;
    
    // Cards worth points in this variation:
    // A, J of trump, big/little joker, off jack, 10, 3, 2
    if (card.rank === 'A') return true;
    if (card.suit === this.state.trumpSuit && card.rank === 'J') return true;
    if (card.rank === 'big' || card.rank === 'little') return true;
    if (card.rank === '10') return true;
    if (card.rank === '3') return true;
    if (card.rank === '2') return true;
    
    // Off jack (jack of same color as trump)
    if (card.rank === 'J' && this.state.trumpSuit) {
      const isSameColor = (
        (this.state.trumpSuit === 'hearts' || this.state.trumpSuit === 'diamonds') && 
        (card.suit === 'hearts' || card.suit === 'diamonds')
      ) || (
        (this.state.trumpSuit === 'clubs' || this.state.trumpSuit === 'spades') && 
        (card.suit === 'clubs' || card.suit === 'spades')
      );
      
      if (isSameColor && card.suit !== this.state.trumpSuit) {
        return true;
      }
    }
    
    return false;
  }
  
  // Check if player has all trumps
  private hasAllTrumps(playerId: string): boolean {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || !this.state.trumpSuit) return false;
    
    // Count trump cards in hand
    const trumpCards = player.hand.filter(card => 
      card.suit === this.state.trumpSuit || card.suit === 'joker'
    );
    
    // Total possible trump cards: 13 of trump suit + 2 jokers = 15
    // But in a 9-card hand, having 9 trumps means you have all trumps in your hand
    return trumpCards.length === player.hand.length;
  }
  
  // Check if player has all point cards
  private hasAllPointCards(playerId: string): boolean {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || !this.state.trumpSuit) return false;
    
    // Count point cards in hand
    const pointCards = player.hand.filter(card => this.isPointCard(card));
    
    // If all cards in hand are point cards
    return pointCards.length === player.hand.length;
  }
  
  placeBid(playerId: string, bid: number): boolean {
    if (this.state.phase !== 'bidding') return false;
    if (this.state.currentPlayer !== playerId) return false;
    
    // Validate bid (2-4 in standard Pitch)
    if (bid < 2 || bid > 4) return false;
    
    // Must be higher than current bid
    if (this.state.bid !== null && bid <= this.state.bid) return false;
    
    this.state.bid = bid;
    this.state.bidder = playerId;
    
    // Move to next player for bidding
    this.advancePlayer();
    
    // If all players have bid or someone passed, end bidding
    const allPlayersBid = this.state.players.every(p => 
      p.id === playerId || this.state.bidder === playerId
    );
    
    if (allPlayersBid || bid === 0) { // 0 represents pass
      this.endBiddingPhase();
    }
    
    return true;
  }
  
  private endBiddingPhase() {
    if (this.state.bidder && this.state.bid !== null) {
      // Bidder chooses trump (for now, auto-choose first card's suit)
      const bidder = this.state.players.find(p => p.id === this.state.bidder)!;
      const trumpSuit = bidder.hand[0]?.suit || 'hearts';
      this.state.trumpSuit = trumpSuit;
      
      // Move to discarding phase
      this.state.phase = 'discarding';
      this.state.currentPlayer = this.state.bidder;
    } else {
      // No one bid, redeal
      this.state = this.initializeGame(this.state.players.length);
    }
  }
  
  // Discard cards (3 cards to discard from 9 to get to 6)
  discardCard(playerId: string, cardId: string): boolean {
    if (this.state.phase !== 'discarding') return false;
    if (this.state.currentPlayer !== playerId) return false;
    
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return false;
    
    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return false;
    
    const card = player.hand[cardIndex];
    
    // Check discard rules
    if (!this.canDiscardCard(playerId, card)) {
      return false;
    }
    
    // Move card to discards
    player.hand.splice(cardIndex, 1);
    this.discards.get(playerId)!.push(card);
    
    // Check if player has discarded enough (3 cards)
    const playerDiscards = this.discards.get(playerId)!.length;
    if (playerDiscards >= 3) {
      // Player has discarded enough, move to next player
      this.advancePlayer();
      
      // Check if all players have discarded
      const allDiscarded = this.state.players.every(p => 
        this.discards.get(p.id)!.length >= 3
      );
      
      if (allDiscarded) {
        this.completeDiscardingPhase();
      }
    }
    
    return true;
  }
  
  private canDiscardCard(playerId: string, card: GameCard): boolean {
    if (!this.state.trumpSuit) return false;
    
    const player = this.state.players.find(p => p.id === playerId)!;
    
    // Rule 1: Can't discard trump unless you have all trumps
    const isTrump = card.suit === this.state.trumpSuit || card.suit === 'joker';
    if (isTrump && !this.hasAllTrumps(playerId)) {
      return false;
    }
    
    // Rule 2: Trumps worth points can never be discarded
    if (isTrump && this.isPointCard(card)) {
      return false;
    }
    
    // Rule 3: If you have all point cards, you must pass one to left
    // (This is handled separately in the passing phase)
    
    return true;
  }
  
  private completeDiscardingPhase() {
    // Handle passing of point cards if someone has all point cards
    this.handlePointCardPassing();
    
    // Deal cards from remaining deck to get players back to 6 cards
    this.replenishHands();
    
    // Bidder gets the kitty (remaining cards after discards)
    this.assignKitty();
    
    // Move to playing phase
    this.state.phase = 'playing';
    this.state.currentPlayer = this.state.bidder!;
  }
  
  private handlePointCardPassing() {
    if (!this.state.trumpSuit) return;
    
    for (const player of this.state.players) {
      if (this.hasAllPointCards(player.id)) {
        // Player has all point cards, must pass one to left
        const leftPlayerIndex = (this.state.players.indexOf(player) + 1) % this.state.players.length;
        const leftPlayer = this.state.players[leftPlayerIndex];
        
        // Find a point card to pass (prefer non-trump if possible)
        const pointCardIndex = player.hand.findIndex(card => 
          this.isPointCard(card) && (card.suit !== this.state.trumpSuit && card.suit !== 'joker')
        );
        
        const cardToPassIndex = pointCardIndex >= 0 ? pointCardIndex : 
          player.hand.findIndex(card => this.isPointCard(card));
        
        if (cardToPassIndex >= 0) {
          const cardToPass = player.hand.splice(cardToPassIndex, 1)[0];
          leftPlayer.hand.push(cardToPass);
        }
      }
    }
  }
  
  private replenishHands() {
    // Each player should have 6 cards after discarding 3 from 9
    const targetHandSize = 6;
    
    for (const player of this.state.players) {
      while (player.hand.length < targetHandSize && this.state.deck.length > 0) {
        player.hand.push(this.state.deck.pop()!);
      }
    }
  }
  
  private assignKitty() {
    // Bidder gets all remaining cards in the deck (kitty)
    this.kitty = [...this.state.deck];
    this.state.deck = [];
    
    // Add kitty to bidder's hand
    const bidder = this.state.players.find(p => p.id === this.state.bidder!);
    if (bidder) {
      bidder.hand.push(...this.kitty);
      this.kitty = [];
    }
  }
  
  playCard(playerId: string, cardId: string): boolean {
    if (this.state.phase !== 'playing') return false;
    if (this.state.currentPlayer !== playerId) return false;
    
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return false;
    
    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return false;
    
    const card = player.hand[cardIndex];
    
    // Get current trick or start new one
    let currentTrick = this.state.tricks[this.state.tricks.length - 1];
    if (!currentTrick || currentTrick.winner) {
      currentTrick = { cards: [], winner: undefined };
      this.state.tricks.push(currentTrick);
    }
    
    // Check if card can be played
    const leadSuit = currentTrick.cards[0]?.card.suit || null;
    const canPlay = canPlayCard(
      card,
      player.hand,
      currentTrick.cards.map(c => c.card),
      this.state.trumpSuit,
      leadSuit
    );
    
    if (!canPlay) return false;
    
    // Play the card
    player.hand.splice(cardIndex, 1);
    currentTrick.cards.push({ card, playerId });
    
    // Check if trick is complete (all 4 players played)
    if (currentTrick.cards.length === this.state.players.length) {
      this.completeTrick(currentTrick);
    } else {
      // Move to next player
      this.advancePlayer();
    }
    
    return true;
  }
  
  private completeTrick(trick: Trick) {
    if (!this.state.trumpSuit || trick.cards.length === 0) return;
    
    const leadSuit = trick.cards[0].card.suit;
    const winnerId = determineTrickWinner(trick.cards, this.state.trumpSuit, leadSuit);
    trick.winner = winnerId;
    
    // Award points to winner
    const points = calculatePoints(trick, this.state.trumpSuit);
    this.state.scores[winnerId] += points;
    
    // Special rule: 2 of trump auto-keep
    // The player who catches the 2 of trump gets the point, even if they don't win the trick
    for (const { card, playerId } of trick.cards) {
      if (card.suit === this.state.trumpSuit && card.rank === '2') {
        // The catcher of the 2 gets the point
        this.state.scores[playerId] += 1;
        // Note: We already added the point in calculatePoints, but this ensures
        // the catcher gets it regardless of trick winner
      }
    }
    
    // Winner leads next trick
    this.state.currentPlayer = winnerId;
    
    // Check if game is over (all cards played)
    const allHandsEmpty = this.state.players.every(p => p.hand.length === 0);
    if (allHandsEmpty) {
      this.state.phase = 'scoring';
      this.calculateFinalScores();
    }
  }
  
  private calculateFinalScores() {
    // In Pitch, bidder must make their bid or lose points
    if (this.state.bidder && this.state.bid !== null) {
      const bidderScore = this.state.scores[this.state.bidder];
      if (bidderScore >= this.state.bid) {
        // Bidder succeeded
        this.state.scores[this.state.bidder] = this.state.bid;
      } else {
        // Bidder failed, loses bid amount
        this.state.scores[this.state.bidder] = -this.state.bid;
      }
    }
  }
  
  private advancePlayer() {
    const playerIds = this.state.players.map(p => p.id);
    const currentIndex = playerIds.indexOf(this.state.currentPlayer);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    this.state.currentPlayer = playerIds[nextIndex];
  }
  
  // AI logic
  makeAIMove(playerId: string): void {
    if (this.state.phase === 'bidding') {
      this.makeAIBid(playerId);
    } else if (this.state.phase === 'discarding') {
      this.makeAIDiscard(playerId);
    } else if (this.state.phase === 'playing') {
      this.makeAIPlay(playerId);
    }
  }
  
  private makeAIDiscard(playerId: string): void {
    const player = this.state.players.find(p => p.id === playerId)!;
    
    // AI discarding strategy:
    // 1. Try to discard non-point, non-trump cards first
    // 2. If must discard trump, discard lowest non-point trump
    // 3. Keep point cards and high trump cards
    
    // Find discardable cards
    const discardableCards = player.hand.filter(card => 
      this.canDiscardCard(playerId, card)
    );
    
    if (discardableCards.length === 0) {
      // No discardable cards (shouldn't happen with proper rules)
      return;
    }
    
    // Sort by value (discard lowest value cards first)
    discardableCards.sort((a, b) => {
      const aValue = getCardValue(a, this.state.trumpSuit);
      const bValue = getCardValue(b, this.state.trumpSuit);
      return aValue - bValue;
    });
    
    // Discard the lowest value discardable card
    const cardToDiscard = discardableCards[0];
    this.discardCard(playerId, cardToDiscard.id);
  }
  
  private makeAIBid(playerId: string): void {
    const player = this.state.players.find(p => p.id === playerId)!;
    
    // Simple AI: Count trump candidates and high cards
    let trumpCandidates = 0;
    let highCards = 0;
    
    for (const card of player.hand) {
      const value = getCardValue(card, null);
      if (value >= 10) highCards++;
      if (card.rank === 'J' || card.rank === 'A') trumpCandidates++;
    }
    
    let bid = 0; // Pass
    
    if (trumpCandidates >= 2 && highCards >= 3) {
      bid = 4;
    } else if (trumpCandidates >= 1 && highCards >= 2) {
      bid = 3;
    } else if (highCards >= 2) {
      bid = 2;
    }
    
    // Only bid if higher than current bid
    if (this.state.bid !== null && bid <= this.state.bid) {
      bid = 0; // Pass
    }
    
    if (bid > 0) {
      this.placeBid(playerId, bid);
    } else {
      // Pass
      this.advancePlayer();
    }
  }
  
  private makeAIPlay(playerId: string): void {
    const player = this.state.players.find(p => p.id === playerId)!;
    const currentTrick = this.state.tricks[this.state.tricks.length - 1];
    const leadSuit = currentTrick?.cards[0]?.card.suit || null;
    
    // Find playable cards
    const playableCards = player.hand.filter(card => 
      canPlayCard(
        card,
        player.hand,
        currentTrick?.cards.map(c => c.card) || [],
        this.state.trumpSuit,
        leadSuit
      )
    );
    
    if (playableCards.length === 0) return;
    
    // Simple AI strategy:
    // 1. If leading, play highest non-trump card
    // 2. If following, try to win trick if possible
    // 3. Otherwise, play lowest card
    
    let cardToPlay: GameCard;
    
    if (!leadSuit) {
      // Leading: play highest non-trump card
      const nonTrumpCards = playableCards.filter(c => c.suit !== this.state.trumpSuit);
      if (nonTrumpCards.length > 0) {
        cardToPlay = nonTrumpCards.reduce((highest, card) => 
          getCardValue(card, this.state.trumpSuit) > getCardValue(highest, this.state.trumpSuit) ? card : highest
        );
      } else {
        cardToPlay = playableCards[0];
      }
    } else {
      // Following suit
      const leadSuitCards = playableCards.filter(c => c.suit === leadSuit);
      const trumpCards = playableCards.filter(c => c.suit === this.state.trumpSuit);
      
      // Try to win the trick
      const currentWinningCard = currentTrick?.cards.reduce((winning, current) => {
        const winningValue = getCardValue(winning.card, this.state.trumpSuit);
        const currentValue = getCardValue(current.card, this.state.trumpSuit);
        return currentValue > winningValue ? current : winning;
      }, currentTrick.cards[0]);
      
      if (currentWinningCard) {
        const winningValue = getCardValue(currentWinningCard.card, this.state.trumpSuit);
        
        // Look for a card that can beat the current winner
        const winningCards = playableCards.filter(card => 
          getCardValue(card, this.state.trumpSuit) > winningValue
        );
        
        if (winningCards.length > 0) {
          // Play the lowest winning card
          cardToPlay = winningCards.reduce((lowest, card) => 
            getCardValue(card, this.state.trumpSuit) < getCardValue(lowest, this.state.trumpSuit) ? card : lowest
          );
        } else {
          // Can't win, play lowest card
          cardToPlay = playableCards.reduce((lowest, card) => 
            getCardValue(card, this.state.trumpSuit) < getCardValue(lowest, this.state.trumpSuit) ? card : lowest
          );
        }
      } else {
        cardToPlay = playableCards[0];
      }
    }
    
    this.playCard(playerId, cardToPlay.id);
  }
  
  isGameOver(): boolean {
    return this.state.phase === 'scoring';
  }
  
  getWinner(): { playerId: string; score: number } | null {
    if (!this.isGameOver()) return null;
    
    let winnerId = Object.keys(this.state.scores)[0];
    let highestScore = this.state.scores[winnerId];
    
    for (const [playerId, score] of Object.entries(this.state.scores)) {
      if (score > highestScore) {
        highestScore = score;
        winnerId = playerId;
      }
    }
    
    return { playerId: winnerId, score: highestScore };
  }
}