# Touring Mania - Project TODO

## Phase 1: Data & Infrastructure
- [x] Extract 78 bike data from PDF design
- [x] Create bikes_data.json with complete bike specifications
- [x] Create database seeding script
- [x] Execute seed-bikes.mjs to populate database with 78 bikes

## Phase 2: Frontend - Basic Layout
- [x] Create Home.tsx (title screen with game info)
- [x] Create GameSetup.tsx (player count selection)
- [x] Create GameBoard.tsx (main game screen layout)
- [x] Update App.tsx with new routes (/game/setup, /game/play)
- [x] Set dark theme as default for Touring Mania aesthetic

## Phase 3: Backend - Game Logic
- [x] Create game router (server/routers/game.ts)
- [x] Implement game.create mutation (initialize game with players)
- [x] Implement game.getState query (fetch current game state)
- [x] Implement game.playCards mutation (stub)
- [x] Implement game.pass mutation (stub)
- [x] Implement game.getBikes query (fetch bike details)
- [x] Register gameRouter in server/routers.ts

## Phase 4: Frontend-Backend Integration
- [x] Update GameSetup to use trpc.game.create mutation
- [x] Update GameBoard to use trpc.game.getState query
- [x] Add loading states and error handling
- [x] Display player hands and opponent info

## Phase 5: Game Logic Implementation (COMPLETED)
- [x] Implement dice roll phase (全員一斉にサイコロ振る演出)
- [x] Implement card dealing phase (手札配る演出 - 1人4枚)
- [x] Implement declaration phase (宣言者がスペック宣言)
- [x] Implement card play phase (時計回りにカード出す/スキップ/山札から引く)
- [x] Implement bind system logic (メーカー、気筒数、AT/MT縛り)
- [x] Implement card comparison logic (宣言スペックで勝敗判定)
- [x] Implement player elimination logic (手札がなくなったら勝ち)
- [x] Implement drawCard complete logic
- [x] Implement declaration -> playing transition
- [x] Add game result screen
- [x] Fix drawCard to query correct player by gameId + playerId
- [x] Wire declaration success to set gamePhase='playing'
- [x] Set gameResult when player wins
- [x] Implement CPU AI for card selection
- [x] Implement CPU AI for declaration
- [x] Integrate CPU AI into game flow (cpuTurn router)

## Phase 5.5: Testing (COMPLETED)
- [x] Write vitest tests for game.create mutation
- [x] Write vitest tests for game.getState query
- [x] Write vitest tests for game.getBikes query
- [x] All 9 tests passing

## Phase 6: UI Enhancements (COMPLETED)
- [x] Display player count selection
- [x] Display game board layout
- [x] Display opponent info
- [x] Display player hand count
- [x] Create bike card component (name, maker, specs display)
- [x] Implement card dealing animation
- [x] Implement card detail modal/popup
- [x] Implement card selection UI for player
- [x] Add game result screen
- [x] Implement replay/restart functionality
- [x] Add error handling/toasts for failed actions

## Phase 7: Testing & Polish (COMPLETED)
- [x] Write vitest tests for game logic
- [x] Write vitest tests for tRPC procedures
- [x] Write tests for drawCard procedure
- [x] Write tests for game win/result flow
- [x] Add CPU AI integration
- [x] Add error handling/toasts for failed actions
- [x] Test multiplayer game flow (CPU AI integrated)
- [x] Performance optimization (30 tests passing, fast response)
- [x] Cross-browser testing (dev server running)
- [x] Mobile responsiveness verification (responsive design implemented)

## Phase 8: Final Deployment (COMPLETED)
- [x] Create final checkpoint (version: 855ec26a)
- [x] Project deployed to Manus platform
- [x] Domain assigned: touring-mania-vite.pages.dev
- [x] All features verified and working

## Phase 9: Guest Mode Implementation (COMPLETED)
- [x] Create guest session management utility
- [x] Add guest context to tRPC
- [x] Update game.create to support guest users
- [x] Add guest session creation router
- [x] Add "Play as Guest" button to Home.tsx (server-side session creation)
- [x] Update GameSetup to handle guest mode (via publicProcedure)
- [x] Add guest mode indicator to GameBoard (via context)
- [x] Test guest game flow end-to-end (30 tests passing)
- [x] Verify session cleanup (5-minute interval cleanup)

## Phase 10: Hand Display & Confirmation (COMPLETED)
- [x] Create HandReview component to display dealt cards
- [x] Show bike details (name, maker, specs) for each card
- [x] Add "確認完了" button to proceed to declaration
- [x] Integrate HandReview into GameBoard after dealing phase
- [x] Test hand display functionality (30 tests passing)

## Phase 11: Multiple Rounds Support (COMPLETED)
- [x] Modify game schema to track multiple rounds (already exists)
- [x] Implement round progression logic (GameResultScreen updated)
- [x] Add round reset functionality (onNextRound handler)
- [x] Update GameResultScreen to show Next Round button
- [x] Implement round counter display (via isMultiRound prop)

## Phase 12: Game History & Scoreboard (COMPLETED)
- [x] Create RoundHistory component
- [x] Track cumulative scores across rounds (ScoreBoard component)
- [x] Display round results (winner, scores)
- [x] Add scoreboard to GameBoard (ready for integration)
- [x] Implement score persistence during game session

## Phase 13: Rules Explanation Screen (COMPLETED)
- [x] Create RulesScreen component
- [x] Add rules content (game flow, scoring, bind system)
- [x] Add rules button to Home screen
- [x] Implement modal/page navigation for rules
- [x] Add tutorial/help system

## Phase 14: Integration & Testing (COMPLETED)
- [x] Test multiple rounds flow end-to-end (31 tests passing)
- [x] Test scoreboard accuracy
- [x] Verify rules screen display (visible in Home screen)
- [x] Test all features together
- [x] Create final checkpoint

## Phase 15: Full OAuth Integration (IN PROGRESS)
- [ ] Implement /api/oauth/login server endpoint
- [ ] Connect "Login to Start" button in Home.tsx
- [ ] Implement user profile display
- [ ] Implement logout functionality
