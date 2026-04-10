# Pitch Card Game

A complete Pitch card game implementation built with React Native and Expo.

## Features

- **Complete Pitch Rules**: Implements the classic 4-player Pitch card game with teams
- **Team Play**: North-South vs East-West partnership scoring
- **Full Game Flow**: Deal → Bidding → Discarding → Playing → Scoring
- **AI Opponents**: Three AI players with basic strategy
- **React Native UI**: Clean, responsive card table interface
- **Expo Ready**: Built with Expo SDK for easy deployment

## Game Rules

Pitch is a trick-taking game where:
- 4 players in 2 teams (partners sit across from each other)
- 9 cards dealt to each player
- Bidding starts at 5 points, maximum 10 points
- Trump suit determined by bidder
- Players discard down to 6 cards
- Point cards: A (1), J of trump (1), off-jack (1), jokers (1 each), 10 (1), 3 (3), 2 (1)
- Team with highest bid tries to make their bid, opponents try to stop them

## Tech Stack

- **React Native** with **Expo SDK 54**
- **TypeScript** for type safety
- **NativeWind 4** for styling (Tailwind CSS for React Native)
- **Expo Router** for navigation
- **React Native Game Engine** for game state management

## Getting Started

```bash
# Clone the repository
git clone https://github.com/jdsebo15/pitch-card-game.git
cd pitch-card-game

# Install dependencies
npm install

# Start the development server
npx expo start
```

## Project Structure

```
├── components/          # React components
│   ├── BiddingScreen.tsx
│   ├── Card.tsx
│   ├── DiscardingScreen.tsx
│   └── GameTable.tsx
├── lib/                 # Game logic
│   ├── game.ts         # Core game functions
│   └── gameState.ts    # Game state management
├── screens/            # App screens
│   └── GameScreen.tsx  # Main game screen
├── App.tsx             # App entry point
└── README.md           # This file
```

## Recent Updates

- **Complete team-based scoring** with proper trick resolution
- **Fixed bidding system** with pass handling and forced dealer bid
- **Correct trump logic** including off-jack and jokers
- **UI improvements** for team display and game flow

## Development Status

✅ **Core game engine complete**  
✅ **Team scoring implemented**  
✅ **AI opponents functional**  
✅ **UI/UX polished**  
🔄 **Manual trump selection** (planned)  
🔄 **Manual card selection from kitty** (planned)

## License

MIT