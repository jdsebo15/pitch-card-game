import { Suit, Rank, GameCard, Player, Trick, GameState, createDeck, shuffleDeck, dealCards, getCardValue, canPlayCard, determineTrickWinner, calculatePoints, getCardPoints, isTrumpCard } from './game';

export class PitchGame {
  private state: GameState;
  private kitty: GameCard[] = [];
  private discards: Map<string, GameCard[]> = new Map();
  private bidderPool: GameCard[] = [];
  private passedPlayers: Set<string> = new Set();
  
  constructor(numPlayers: number = 4) {
    this.state = this.initializeGame(numPlayers);
  }
  
  private dealerIndex: number = 0; // Tracks rotating dealer
  
  private initializeGame(numPlayers: number): GameState {
    const deck = shuffleDeck(createDeck());
    const { hands, remainingDeck } = dealCards(deck, numPlayers, 9); // Deal 9 cards each
    
    // Teams: Players across from each other are partners
    // Clockwise order: South → West → North → East
    const players: Player[] = [
      { id: 'player-1', name: 'You', hand: hands[0], isHuman: true, team: 0 },    // South (bottom)
      { id: 'player-2', name: 'Bob', hand: hands[1], isHuman: true, team: 1 },    // West (left)
      { id: 'player-3', name: 'Alice', hand: hands[2], isHuman: true, team: 0 },  // North (top)
      { id: 'player-4', name: 'Charlie', hand: hands[3], isHuman: true, team: 1 }, // East (right)
    ];
    
    // Initialize per-hand state
    this.discards = new Map();
    this.passedPlayers = new Set();
    players.forEach(p => this.discards.set(p.id, []));
    
    // Bidding starts to the left of the dealer
    const dealer = players[this.dealerIndex];
    const firstBidderIndex = (this.dealerIndex + 1) % players.length;
    const firstBidder = players[firstBidderIndex];
    
    return {
      players,
      deck: remainingDeck,
      currentPlayer: firstBidder.id, // Start bidding with player to left of dealer
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
      teamScores: {
        0: 0, // Team 0 (North-South)
        1: 0, // Team 1 (East-West)
      },
      phase: 'bidding',
      dealer: dealer.id,
      forcedBid: false, // Track if dealer is forced to bid
    };
  }
  
  getState(): GameState {
    return { ...this.state };
  }
  
  getKitty(): GameCard[] {
    return [...this.kitty];
  }

  getBidderPool(): GameCard[] {
    return [...this.bidderPool];
  }
  
  getDiscards(playerId: string): GameCard[] {
    return this.discards.get(playerId) || [];
  }
  
  private isPointCard(card: GameCard): boolean {
    return !!this.state.trumpSuit && getCardPoints(card, this.state.trumpSuit) > 0;
  }

  private isTrump(card: GameCard): boolean {
    return isTrumpCard(card, this.state.trumpSuit);
  }

  private getLeftPlayerId(playerId: string): string {
    const ids = this.state.players.map(p => p.id);
    const idx = ids.indexOf(playerId);
    return ids[(idx + 1) % ids.length];
  }
  
  placeBid(playerId: string, bid: number): boolean {
    if (this.state.phase !== 'bidding') return false;
    if (this.state.currentPlayer !== playerId) return false;

    if (bid === 0) {
      this.passedPlayers.add(playerId);
      const nextPlayerId = this.getLeftPlayerId(playerId);

      if (nextPlayerId === this.state.dealer && this.state.bid === null) {
        this.state.forcedBid = true;
        this.endBiddingPhase();
        return true;
      }

      if (this.passedPlayers.size >= this.state.players.length - 1 && this.state.bidder) {
        this.endBiddingPhase();
        return true;
      }

      this.state.currentPlayer = nextPlayerId;
      return true;
    }
    
    if (bid < 5 || bid > 10) return false;
    if (this.state.bid !== null && bid <= this.state.bid) return false;

    this.state.bid = bid;
    this.state.bidder = playerId;

    const nextPlayerId = this.getLeftPlayerId(playerId);
    if (nextPlayerId === this.state.dealer) {
      this.endBiddingPhase();
    } else {
      this.state.currentPlayer = nextPlayerId;
    }

    return true;
  }
  
  private endBiddingPhase() {
    if (this.state.bidder && this.state.bid !== null) {
      this.state.phase = 'choosing-trump';
      this.state.currentPlayer = this.state.bidder;
    } else if (this.state.forcedBid) {
      const dealer = this.state.players.find(p => p.id === this.state.dealer)!;
      this.state.bidder = dealer.id;
      this.state.bid = 5;
      this.state.phase = 'choosing-trump';
      this.state.currentPlayer = dealer.id;
    } else {
      this.state = this.initializeGame(this.state.players.length);
    }
  }
  
  chooseTrump(playerId: string, suit: Suit): boolean {
    if (this.state.phase !== 'choosing-trump') return false;
    if (this.state.bidder !== playerId || this.state.currentPlayer !== playerId) return false;
    if (suit === 'joker') return false;

    this.state.trumpSuit = suit;
    this.state.phase = 'discarding';
    this.state.currentPlayer = this.state.bidder;
    return true;
  }

  // Discard cards — only the bidder discards in Pitch
  discardCard(playerId: string, cardId: string): boolean {
    if (this.state.phase !== 'discarding') return false;
    if (this.state.bidder !== playerId) return false; // only bidder discards
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
    
    // After bidder discards enough to reach 6 cards or less, move to selecting-kitty
    const playerDiscards = this.discards.get(playerId)!.length;
    const handSize = player.hand.length;
    // If player has 6 or fewer cards, they can finish discarding
    if (handSize <= 6) {
      this.completeDiscardingPhase();
    }
    
    return true;
  }
  
  private canDiscardCard(playerId: string, card: GameCard): boolean {
    if (!this.state.trumpSuit) return false;
    
    const player = this.state.players.find(p => p.id === playerId)!;
    const isTrump = this.isTrump(card);

    // Non-trump cards can always be discarded
    if (!isTrump) return true;

    // Trump cards: can't discard trump point cards (Ace, Jack, 10, 3, 2 of trump)
    const isPointCard = this.isPointCard(card);
    if (isPointCard) return false;

    // Non-point trump cards are discardable
    return true;
    if (isPointCard) return false;

    return true;
  }
  
  private completeDiscardingPhase() {
    this.handlePointCardPassing();
    this.assignKitty();

    const bidder = this.state.players.find(p => p.id === this.state.bidder!);
    if (!bidder) return;

    this.bidderPool = [...bidder.hand, ...this.kitty];
    this.kitty = [];

    this.state.phase = 'selecting-kitty';
    this.state.currentPlayer = this.state.bidder!;
  }
  
  private handlePointCardPassing() {
    for (const player of this.state.players) {
      while (player.hand.filter(card => this.isPointCard(card)).length > 6) {
        const leftPlayer = this.state.players.find(p => p.id === this.getLeftPlayerId(player.id))!;
        const pointCardIndex = player.hand.findIndex(card => this.isPointCard(card));
        if (pointCardIndex === -1) break;
        const [cardToPass] = player.hand.splice(pointCardIndex, 1);
        leftPlayer.hand.push(cardToPass);
      }
    }
  }
  
  private assignKitty() {
    this.kitty = [...this.state.deck];
    this.state.deck = [];

    for (const player of this.state.players) {
      const playerDiscards = this.discards.get(player.id) || [];
      this.kitty.push(...playerDiscards);
      this.discards.set(player.id, []);
    }
  }
  
  confirmBidderHand(playerId: string, selectedCardIds: string[]): boolean {
    if (this.state.phase !== 'selecting-kitty') return false;
    if (this.state.bidder !== playerId || this.state.currentPlayer !== playerId) return false;
    if (selectedCardIds.length !== 6) return false;

    const uniqueIds = new Set(selectedCardIds);
    if (uniqueIds.size !== 6) return false;

    const selectedCards = this.bidderPool.filter(card => uniqueIds.has(card.id));
    if (selectedCards.length !== 6) return false;

    const bidder = this.state.players.find(p => p.id === playerId);
    if (!bidder) return false;

    bidder.hand = selectedCards;
    this.kitty = this.bidderPool.filter(card => !uniqueIds.has(card.id));
    this.bidderPool = [];

    this.normalizeHandsToSix();

    this.state.phase = 'playing';
    this.state.currentPlayer = this.state.bidder!;
    return true;
  }

  private normalizeHandsToSix() {
    for (const player of this.state.players) {
      if (player.id === this.state.bidder) continue;

      while (player.hand.length > 6) {
        const discardableIndex = player.hand.findIndex(card => this.canDiscardCard(player.id, card));
        if (discardableIndex === -1) break;
        const [removed] = player.hand.splice(discardableIndex, 1);
        this.kitty.push(removed);
      }
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
    const leadSuit = currentTrick.cards[0] ? (this.isTrump(currentTrick.cards[0].card) ? this.state.trumpSuit : currentTrick.cards[0].card.suit) : null;
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
    
    // Calculate points for the trick
    const trickPoints = calculatePoints(trick, this.state.trumpSuit);
    this.state.scores[winnerId] += trickPoints;
    
    // Special rule: 2 of trump auto-keep
    // The player who catches the 2 of trump gets the point, even if they don't win the trick
    for (const { card, playerId } of trick.cards) {
      if (card.suit === this.state.trumpSuit && card.rank === '2') {
        // The catcher of the 2 gets the point
        // Note: This point is already included in trickPoints, but we ensure it goes to the catcher
        // by transferring it from winner to catcher if different
        if (playerId !== winnerId) {
          this.state.scores[winnerId] -= 1; // Remove from winner
          this.state.scores[playerId] += 1; // Give to catcher
        }
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
    const teamPoints: Record<number, number> = { 0: 0, 1: 0 };

    for (const player of this.state.players) {
      teamPoints[player.team] += this.state.scores[player.id] || 0;
    }

    if (this.state.bidder && this.state.bid !== null) {
      const bidder = this.state.players.find(p => p.id === this.state.bidder)!;
      const bidderTeam = bidder.team;
      const opposingTeam = bidderTeam === 0 ? 1 : 0;

      if (teamPoints[bidderTeam] >= this.state.bid) {
        this.state.teamScores[bidderTeam] += this.state.bid;
      } else {
        this.state.teamScores[bidderTeam] -= this.state.bid;
      }

      this.state.teamScores[opposingTeam] += teamPoints[opposingTeam];
    }

    this.dealerIndex = (this.dealerIndex + 1) % this.state.players.length;
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
    } else if (this.state.phase === 'choosing-trump') {
      this.makeAIChooseTrump(playerId);
    } else if (this.state.phase === 'discarding') {
      this.makeAIDiscard(playerId);
    } else if (this.state.phase === 'selecting-kitty') {
      this.makeAISelectKitty(playerId);
    } else if (this.state.phase === 'playing') {
      this.makeAIPlay(playerId);
    }
  }
  
  private makeAIChooseTrump(playerId: string): void {
    const player = this.state.players.find(p => p.id === playerId)!;
    const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

    const bestSuit = suits.reduce((best, suit) => {
      const bestCount = player.hand.filter(card => isTrumpCard(card, best)).length;
      const suitCount = player.hand.filter(card => isTrumpCard(card, suit)).length;
      return suitCount > bestCount ? suit : best;
    }, 'hearts' as Suit);

    this.chooseTrump(playerId, bestSuit);
  }

  private makeAIDiscard(playerId: string): void {
    // Discard all 3 cards at once so we don't get stuck waiting for re-renders
    for (let i = 0; i < 3; i++) {
      if (this.state.phase !== 'discarding') break;

      const player = this.state.players.find(p => p.id === playerId)!;
      const discardableCards = player.hand.filter(card =>
        this.canDiscardCard(playerId, card)
      );

      if (discardableCards.length === 0) break;

      discardableCards.sort((a, b) =>
        getCardValue(a, this.state.trumpSuit) - getCardValue(b, this.state.trumpSuit)
      );

      this.discardCard(playerId, discardableCards[0].id);
    }
  }
  
  private makeAIBid(playerId: string): void {
    const player = this.state.players.find(p => p.id === playerId)!;
    
    // Improved AI bidding strategy
    // Count potential points and trump strength
    let potentialPoints = 0;
    let trumpStrength = 0;
    let highCards = 0;
    
    // Evaluate each suit as potential trump
    const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const suitEvaluations = suits.map(suit => {
      let points = 0;
      let strength = 0;
      
      for (const card of player.hand) {
        // Count points this card would be worth if this suit is trump
        if (card.suit === suit && card.rank === 'J') points += 1; // Main jack
        if (card.suit === suit && card.rank === 'A') points += 1;
        if (card.suit === suit && card.rank === '10') points += 1;
        if (card.suit === suit && card.rank === '3') points += 3;
        if (card.suit === suit && card.rank === '2') points += 1;
        
        // Count off-jack points
        if (card.rank === 'J' && card.suit !== suit) {
          const isSameColor = (
            (suit === 'hearts' || suit === 'diamonds') && 
            (card.suit === 'hearts' || card.suit === 'diamonds')
          ) || (
            (suit === 'clubs' || suit === 'spades') && 
            (card.suit === 'clubs' || card.suit === 'spades')
          );
          if (isSameColor) points += 1;
        }
        
        // Jokers are always trump
        if (card.suit === 'joker') {
          points += 1;
          strength += 10;
        }
        
        // Trump strength (higher cards are better)
        if (card.suit === suit) {
          const value = getCardValue(card, suit);
          if (value >= 110) strength += 3; // High trump (J, A, K, Q)
          else if (value >= 100) strength += 2; // Medium trump
          else strength += 1; // Low trump
        }
      }
      
      return { suit, points, strength };
    });
    
    // Find best suit
    const bestSuit = suitEvaluations.reduce((best, current) => 
      current.points > best.points ? current : best
    );
    
    potentialPoints = bestSuit.points;
    trumpStrength = bestSuit.strength;
    
    // Count high cards (10+) for non-trump evaluation
    for (const card of player.hand) {
      const value = getCardValue(card, null);
      if (value >= 10) highCards++;
    }
    
    let bid = 0; // Pass
    
    // Bid calculation based on hand strength
    if (potentialPoints >= 6 && trumpStrength >= 15) {
      bid = 10; // Very strong hand
    } else if (potentialPoints >= 5 && trumpStrength >= 12) {
      bid = 8; // Strong hand
    } else if (potentialPoints >= 4 && trumpStrength >= 10) {
      bid = 7; // Good hand
    } else if (potentialPoints >= 3 && trumpStrength >= 8) {
      bid = 6; // Decent hand
    } else if (potentialPoints >= 2 && trumpStrength >= 6) {
      bid = 5; // Minimum bid
    }
    
    // Adjust based on position (more aggressive in early position)
    const playerIndex = this.state.players.findIndex(p => p.id === playerId);
    const dealerIndex = this.state.players.findIndex(p => p.id === this.state.dealer);
    const position = (playerIndex - dealerIndex - 1 + 4) % 4; // 0 = first to bid, 3 = last
    
    if (position <= 1 && bid === 5) {
      // More conservative in early position with minimum hand
      bid = 0;
    }
    
    // Only bid if higher than current bid
    if (this.state.bid !== null && bid <= this.state.bid) {
      bid = 0; // Pass
    }
    
    if (bid > 0) {
      this.placeBid(playerId, bid);
    } else {
      this.placeBid(playerId, 0);
    }
  }
  
  private makeAISelectKitty(playerId: string): void {
    if (!this.state.trumpSuit) return;
    const selectedCards = [...this.bidderPool]
      .sort((a, b) => getCardValue(b, this.state.trumpSuit) - getCardValue(a, this.state.trumpSuit))
      .slice(0, 6)
      .map(card => card.id);

    this.confirmBidderHand(playerId, selectedCards);
  }

  private makeAIPlay(playerId: string): void {
    const player = this.state.players.find(p => p.id === playerId)!;
    const currentTrick = this.state.tricks[this.state.tricks.length - 1];
    const leadSuit = currentTrick?.cards[0]
      ? (this.isTrump(currentTrick.cards[0].card) ? this.state.trumpSuit : currentTrick.cards[0].card.suit)
      : null;
    
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