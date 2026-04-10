# Pitch Card Game

A React Native iOS implementation of the classic trick-taking card game Pitch (also known as Setback or High-Low-Jack).

## Features

- **Complete card game implementation** with proper Pitch rules
- **Beautiful card visuals** with smooth animations
- **AI opponents** for single-player gameplay
- **Local multiplayer** (pass-and-play) support
- **Game state management** with TypeScript safety

## Game Rules (Pitch)

Pitch is a trick-taking game for 2-4 players (usually 4 in partnerships) where players bid on how many points they can take. Points are earned from:
- **High**: Ace of trump
- **Low**: 2 of trump  
- **Jack**: Jack of trump
- **Game**: Points from high cards (A=4, K=3, Q=2, J=1, 10=10)

## Tech Stack

- **React Native** with **Expo** (iOS only)
- **TypeScript** for type safety
- **React Native Reanimated** for smooth animations
- **React Native Gesture Handler** for card interactions
- **Custom game engine** with complete Pitch logic

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run ios
   ```

3. Use the Expo Go app on your iOS device to scan the QR code.

## Project Structure

- `/components` - React components (Card, PlayerHand, GameTable, etc.)
- `/lib` - Game logic and utilities
- `/screens` - Game screens (Home, Game, Settings, etc.)
- `/assets` - Images, sounds, and other assets

## Development Status

✅ **Completed:**
- Basic project setup with Expo + TypeScript
- Card component with suits and ranks
- Game logic foundation (deck creation, shuffling, dealing)
- Basic UI with game start screen

🔄 **In Progress:**
- Game state management
- Bidding system
- Trick-taking logic
- AI opponent implementation

📋 **Planned:**
- Online multiplayer
- Tutorial mode
- Different game variations
- Sound effects and music

## License

MIT