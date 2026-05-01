import { create } from 'zustand';

const useGameStore = create((set, get) => ({
  // Current game data
  gameId: null,
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  gameState: 'waiting', // waiting | active | finished
  turn: 'w',
  players: {},
  moves: [],
  timers: { white: 600, black: 600 },
  timeControl: null,
  result: null,
  legalMoves: [],
  selectedSquare: null,
  isCheck: false,
  isCheckmate: false,
  isStalemate: false,
  isDraw: false,

  // Opponent info
  opponent: null,
  playerColor: null,

  // Game list (for lobby)
  games: [],
  activeGames: [],
  waitingGames: [],

  // Chat
  globalMessages: [],
  gameMessages: [],

  // Promotion dialog
  showPromotion: false,
  promotionSquare: null,
  promotionCallback: null,

  // Actions
  setGameData: (data) => set((state) => ({ ...state, ...data })),

  setFen: (fen) => set({ fen }),

  setGameState: (gameState) => set({ gameState }),

  setTurn: (turn) => set({ turn }),

  setPlayers: (players) => set({ players }),

  addMove: (move) =>
    set((state) => ({ moves: [...state.moves, move] })),

  setMoves: (moves) => set({ moves }),

  updateTimers: (timers) => set({ timers }),

  setResult: (result) => set({ result, gameState: 'finished' }),

  setLegalMoves: (legalMoves) => set({ legalMoves }),

  setSelectedSquare: (selectedSquare) => set({ selectedSquare }),

  setCheckStatus: (isCheck, isCheckmate, isStalemate, isDraw) =>
    set({ isCheck, isCheckmate, isStalemate, isDraw }),

  setOpponent: (opponent) => set({ opponent }),

  setPlayerColor: (playerColor) => set({ playerColor }),

  setGames: (games) =>
    set({
      games,
      waitingGames: games.filter((g) => g.status === 'waiting'),
      activeGames: games.filter((g) => g.status === 'active'),
    }),

  setGlobalMessages: (globalMessages) => set({ globalMessages }),

  addGlobalMessage: (msg) =>
    set((state) => ({
      globalMessages: [...state.globalMessages.slice(-99), msg],
    })),

  setGameMessages: (gameMessages) => set({ gameMessages }),

  addGameMessage: (msg) =>
    set((state) => ({
      gameMessages: [...state.gameMessages.slice(-99), msg],
    })),

  showPromotionDialog: (square, callback) =>
    set({ showPromotion: true, promotionSquare: square, promotionCallback: callback }),

  hidePromotionDialog: () =>
    set({ showPromotion: false, promotionSquare: null, promotionCallback: null }),

  resetGame: () =>
    set({
      gameId: null,
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      gameState: 'waiting',
      turn: 'w',
      players: {},
      moves: [],
      timers: { white: 600, black: 600 },
      timeControl: null,
      result: null,
      legalMoves: [],
      selectedSquare: null,
      isCheck: false,
      isCheckmate: false,
      isStalemate: false,
      isDraw: false,
      opponent: null,
      playerColor: null,
      gameMessages: [],
    }),
}));

export default useGameStore;
