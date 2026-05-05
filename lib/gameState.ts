import {
  Suit,
  GameCard,
  Player,
  Trick,
  GameState,
  createDeck,
  shuffleDeck,
  dealCards,
  getCardValue,
  canPlayCard,
  determineTrickWinner,
  calculatePoints,
  getCardPoints,
  isTrumpCard,
  effectiveSuit,
} from './game';

const HAND_SIZE = 6;
const DEAL_SIZE = 9;

export class PitchGame {
  private state: GameState;
  private kitty: GameCard[] = [];
  private passedPlayers: Set<string> = new Set();
  private dealerIndex: number = 0;

  constructor(numPlayers: number = 4) {
    this.state = this.initializeGame(numPlayers, { 0: 0, 1: 0 });
  }

  private initializeGame(numPlayers: number, carryTeamScores: Record<number, number>): GameState {
    const deck = shuffleDeck(createDeck());
    const { hands, remainingDeck } = dealCards(deck, numPlayers, DEAL_SIZE);

    const players: Player[] = [
      { id: 'player-1', name: 'You',     hand: hands[0], isHuman: true,  team: 0 },
      { id: 'player-2', name: 'Bob',     hand: hands[1], isHuman: false, team: 1 },
      { id: 'player-3', name: 'Alice',   hand: hands[2], isHuman: false, team: 0 },
      { id: 'player-4', name: 'Charlie', hand: hands[3], isHuman: false, team: 1 },
    ];

    this.kitty = [];
    this.passedPlayers = new Set();

    const dealer = players[this.dealerIndex];
    const firstBidder = players[(this.dealerIndex + 1) % players.length];

    return {
      players,
      deck: remainingDeck,
      currentPlayer: firstBidder.id,
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
      teamScores: { ...carryTeamScores },
      phase: 'bidding',
      dealer: dealer.id,
      forcedBid: false,
    };
  }

  getState(): GameState {
    return { ...this.state };
  }

  getKitty(): GameCard[] {
    return [...this.kitty];
  }

  startNextHand(): void {
    this.state = this.initializeGame(this.state.players.length, this.state.teamScores);
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

  private getNextNonPassedPlayer(playerId: string): string {
    let nextId = this.getLeftPlayerId(playerId);
    while (this.passedPlayers.has(nextId)) {
      if (nextId === this.state.bidder) return nextId;
      nextId = this.getLeftPlayerId(nextId);
    }
    return nextId;
  }

  // ─── Bidding ───────────────────────────────────────────────────────────────

  placeBid(playerId: string, bid: number): boolean {
    if (this.state.phase !== 'bidding') return false;
    if (this.state.currentPlayer !== playerId) return false;

    if (bid === 0) {
      this.passedPlayers.add(playerId);
      const nextPlayerId = this.getNextNonPassedPlayer(playerId);

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
    this.state.currentPlayer = this.getNextNonPassedPlayer(playerId);
    return true;
  }

  private endBiddingPhase(): void {
    if (this.state.bidder && this.state.bid !== null) {
      this.state.phase = 'choosing-trump';
      this.state.currentPlayer = this.state.bidder;
    } else if (this.state.forcedBid) {
      this.state.bidder = this.state.dealer;
      this.state.bid = 5;
      this.state.phase = 'choosing-trump';
      this.state.currentPlayer = this.state.dealer;
    } else {
      // Nobody bid and dealer wasn't forced — re-deal preserving scores.
      this.state = this.initializeGame(this.state.players.length, this.state.teamScores);
    }
  }

  // ─── Trump selection ───────────────────────────────────────────────────────

  chooseTrump(playerId: string, suit: Suit): boolean {
    if (this.state.phase !== 'choosing-trump') return false;
    if (this.state.bidder !== playerId || this.state.currentPlayer !== playerId) return false;
    if (suit === 'joker') return false;

    this.state.trumpSuit = suit;

    // Hand off any forced point-card surplus, then auto-discard for non-bidders
    // and shuffle the kitty over to the bidder so they can pick their final 6.
    this.handlePointCardPassing();
    this.assignKittyFromDeck();
    this.autoDiscardForNonBidders();
    this.collectKittyForBidder();

    this.state.phase = 'discarding';
    this.state.currentPlayer = this.state.bidder;
    return true;
  }

  // ─── Discarding ────────────────────────────────────────────────────────────

  /** Public so the UI can preview which cards are valid to drop. */
  canDiscardCard(playerId: string, card: GameCard): boolean {
    if (!this.state.trumpSuit) return false;
    const isTrump = this.isTrump(card);
    if (!isTrump) return true;
    if (this.isPointCard(card)) return false;
    return true;
  }

  /**
   * Bidder finalizes which 6 cards to keep. Everything else goes to the kitty.
   * Also accepts the call from AI bidders.
   */
  finalizeBidderHand(playerId: string, keepIds: string[]): boolean {
    if (this.state.phase !== 'discarding') return false;
    if (this.state.bidder !== playerId || this.state.currentPlayer !== playerId) return false;
    if (keepIds.length !== HAND_SIZE) return false;

    const bidder = this.state.players.find(p => p.id === playerId);
    if (!bidder) return false;

    const keepSet = new Set(keepIds);
    if (keepSet.size !== HAND_SIZE) return false;

    const kept = bidder.hand.filter(c => keepSet.has(c.id));
    if (kept.length !== HAND_SIZE) return false;

    const dropped = bidder.hand.filter(c => !keepSet.has(c.id));
    bidder.hand = kept;
    this.kitty.push(...dropped);

    this.state.phase = 'playing';
    this.state.currentPlayer = this.state.bidder;
    return true;
  }

  private handlePointCardPassing(): void {
    for (const player of this.state.players) {
      while (player.hand.filter(card => this.isPointCard(card)).length > HAND_SIZE) {
        const leftPlayer = this.state.players.find(p => p.id === this.getLeftPlayerId(player.id))!;
        const idx = player.hand.findIndex(card => this.isPointCard(card));
        if (idx === -1) break;
        const [cardToPass] = player.hand.splice(idx, 1);
        leftPlayer.hand.push(cardToPass);
      }
    }
  }

  private assignKittyFromDeck(): void {
    this.kitty = [...this.state.deck];
    this.state.deck = [];
  }

  /** Non-bidders drop all non-trump cards, then draw from the kitty back to 6. */
  private autoDiscardForNonBidders(): void {
    for (const player of this.state.players) {
      if (player.id === this.state.bidder) continue;

      const kept: GameCard[] = [];
      for (const card of player.hand) {
        if (this.isTrump(card)) {
          kept.push(card);
        } else {
          this.kitty.push(card);
        }
      }
      player.hand = kept;

      // If a player somehow has more than 6 trump cards, push the lowest-value
      // non-point trump back into the kitty until they're at 6.
      while (player.hand.length > HAND_SIZE) {
        const dropIdx = player.hand.findIndex(c => !this.isPointCard(c));
        if (dropIdx === -1) break;
        const [dropped] = player.hand.splice(dropIdx, 1);
        this.kitty.push(dropped);
      }

      // Draw from the kitty back up to 6 (skipping cards we just discarded
      // for ourselves so we don't get them right back).
      while (player.hand.length < HAND_SIZE && this.kitty.length > 0) {
        const drawn = this.kitty.shift();
        if (drawn) player.hand.push(drawn);
      }
    }
  }

  /**
   * Bidder receives all kitty leftovers up-front so the manual discard UI can
   * show one big pool and let them pick exactly 6.
   */
  private collectKittyForBidder(): void {
    const bidder = this.state.players.find(p => p.id === this.state.bidder);
    if (!bidder) return;
    bidder.hand = [...bidder.hand, ...this.kitty];
    this.kitty = [];
  }

  // ─── Trick play ────────────────────────────────────────────────────────────

  playCard(playerId: string, cardId: string): boolean {
    if (this.state.phase !== 'playing') return false;
    if (this.state.currentPlayer !== playerId) return false;

    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return false;

    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return false;

    const card = player.hand[cardIndex];

    let currentTrick = this.state.tricks[this.state.tricks.length - 1];
    if (!currentTrick || currentTrick.winner) {
      currentTrick = { cards: [], winner: undefined };
      this.state.tricks.push(currentTrick);
    }

    const leadSuit = currentTrick.cards[0]
      ? effectiveSuit(currentTrick.cards[0].card, this.state.trumpSuit)
      : null;

    if (!canPlayCard(card, player.hand, currentTrick.cards.map(c => c.card), this.state.trumpSuit, leadSuit)) {
      return false;
    }

    player.hand.splice(cardIndex, 1);
    currentTrick.cards.push({ card, playerId });

    if (currentTrick.cards.length === this.state.players.length) {
      this.completeTrick(currentTrick);
    } else {
      this.advancePlayer();
    }
    return true;
  }

  private completeTrick(trick: Trick): void {
    if (!this.state.trumpSuit || trick.cards.length === 0) return;

    const leadSuit = effectiveSuit(trick.cards[0].card, this.state.trumpSuit);
    const winnerId = determineTrickWinner(trick.cards, this.state.trumpSuit, leadSuit);
    trick.winner = winnerId;

    const trickPoints = calculatePoints(trick, this.state.trumpSuit);
    this.state.scores[winnerId] += trickPoints;

    this.state.currentPlayer = winnerId;

    if (this.state.players.every(p => p.hand.length === 0)) {
      this.state.phase = 'scoring';
      this.calculateFinalScores();
    }
  }

  private calculateFinalScores(): void {
    const teamPoints: Record<number, number> = { 0: 0, 1: 0 };
    for (const player of this.state.players) {
      teamPoints[player.team] += this.state.scores[player.id] || 0;
    }

    if (this.state.bidder && this.state.bid !== null) {
      const bidder = this.state.players.find(p => p.id === this.state.bidder)!;
      const bidderTeam = bidder.team;
      const opposingTeam = bidderTeam === 0 ? 1 : 0;

      if (teamPoints[bidderTeam] >= this.state.bid) {
        this.state.teamScores[bidderTeam] += teamPoints[bidderTeam];
      } else {
        this.state.teamScores[bidderTeam] -= this.state.bid;
      }
      this.state.teamScores[opposingTeam] += teamPoints[opposingTeam];
    }

    this.dealerIndex = (this.dealerIndex + 1) % this.state.players.length;
  }

  private advancePlayer(): void {
    const ids = this.state.players.map(p => p.id);
    const i = ids.indexOf(this.state.currentPlayer);
    this.state.currentPlayer = ids[(i + 1) % ids.length];
  }

  // ─── AI ────────────────────────────────────────────────────────────────────

  makeAIMove(playerId: string): void {
    switch (this.state.phase) {
      case 'bidding':        return this.makeAIBid(playerId);
      case 'choosing-trump': return this.makeAIChooseTrump(playerId);
      case 'discarding':     return this.makeAIDiscard(playerId);
      case 'playing':        return this.makeAIPlay(playerId);
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
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return;
    const trumpSuit = this.state.trumpSuit;
    const top = [...player.hand]
      .sort((a, b) => getCardValue(b, trumpSuit) - getCardValue(a, trumpSuit))
      .slice(0, HAND_SIZE)
      .map(c => c.id);
    this.finalizeBidderHand(playerId, top);
  }

  private makeAIBid(playerId: string): void {
    const player = this.state.players.find(p => p.id === playerId)!;
    const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

    const suitEvaluations = suits.map(suit => {
      let points = 0;
      let strength = 0;
      for (const card of player.hand) {
        if (card.suit === suit && card.rank === 'J')  points += 1;
        if (card.suit === suit && card.rank === 'A')  points += 1;
        if (card.suit === suit && card.rank === '10') points += 1;
        if (card.suit === suit && card.rank === '3')  points += 3;
        if (card.suit === suit && card.rank === '2')  points += 1;
        if (card.rank === 'J' && card.suit !== suit && card.suit !== 'joker') {
          const sameColor =
            ((suit === 'hearts'   || suit === 'diamonds') && (card.suit === 'hearts'   || card.suit === 'diamonds')) ||
            ((suit === 'clubs'    || suit === 'spades')   && (card.suit === 'clubs'    || card.suit === 'spades')  );
          if (sameColor) points += 1;
        }
        if (card.suit === 'joker') { points += 1; strength += 10; }
        if (card.suit === suit) {
          const value = getCardValue(card, suit);
          if      (value >= 110) strength += 3;
          else if (value >= 100) strength += 2;
          else                   strength += 1;
        }
      }
      return { suit, points, strength };
    });

    const best = suitEvaluations.reduce((a, b) => (b.points > a.points ? b : a));

    let bid = 0;
    if      (best.points >= 6 && best.strength >= 15) bid = 10;
    else if (best.points >= 5 && best.strength >= 12) bid = 8;
    else if (best.points >= 4 && best.strength >= 10) bid = 7;
    else if (best.points >= 3 && best.strength >= 8)  bid = 6;
    else if (best.points >= 2 && best.strength >= 6)  bid = 5;

    const playerIndex = this.state.players.findIndex(p => p.id === playerId);
    const dealerIndex = this.state.players.findIndex(p => p.id === this.state.dealer);
    const position = (playerIndex - dealerIndex - 1 + this.state.players.length) % this.state.players.length;
    if (position <= 1 && bid === 5) bid = 0;

    if (this.state.bid !== null && bid <= this.state.bid) bid = 0;

    this.placeBid(playerId, bid);
  }

  private makeAIPlay(playerId: string): void {
    const player = this.state.players.find(p => p.id === playerId)!;
    const trumpSuit = this.state.trumpSuit;
    const currentTrick = this.state.tricks[this.state.tricks.length - 1];
    const leadSuit = currentTrick?.cards[0]
      ? effectiveSuit(currentTrick.cards[0].card, trumpSuit)
      : null;

    const playable = player.hand.filter(card =>
      canPlayCard(card, player.hand, currentTrick?.cards.map(c => c.card) || [], trumpSuit, leadSuit)
    );
    if (playable.length === 0) return;

    let cardToPlay: GameCard;
    if (!leadSuit) {
      const nonTrump = playable.filter(c => !isTrumpCard(c, trumpSuit));
      cardToPlay = (nonTrump.length > 0 ? nonTrump : playable).reduce((hi, c) =>
        getCardValue(c, trumpSuit) > getCardValue(hi, trumpSuit) ? c : hi
      );
    } else {
      const winning = currentTrick.cards.reduce((w, c) =>
        getCardValue(c.card, trumpSuit) > getCardValue(w.card, trumpSuit) ? c : w
      , currentTrick.cards[0]);
      const winningValue = getCardValue(winning.card, trumpSuit);
      const beats = playable.filter(card => getCardValue(card, trumpSuit) > winningValue);
      const pool = beats.length > 0 ? beats : playable;
      cardToPlay = pool.reduce((lo, c) =>
        getCardValue(c, trumpSuit) < getCardValue(lo, trumpSuit) ? c : lo
      );
    }

    this.playCard(playerId, cardToPlay.id);
  }

  isGameOver(): boolean {
    return this.state.phase === 'scoring';
  }

  getWinner(): { playerId: string; score: number } | null {
    if (!this.isGameOver()) return null;
    let winnerId = Object.keys(this.state.scores)[0];
    let highest = this.state.scores[winnerId];
    for (const [id, s] of Object.entries(this.state.scores)) {
      if (s > highest) { highest = s; winnerId = id; }
    }
    return { playerId: winnerId, score: highest };
  }
}
