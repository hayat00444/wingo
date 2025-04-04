
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(cors());
app.use(express.json());
app.use(express.static('./'));

// Game state
let currentPeriod = Math.floor(Date.now() / 60000); // New period every minute
let gameState = {
  timeRemaining: 60,
  currentNumber: null,
  currentColor: null,
  bigSmall: null
};

// User data (temporary in-memory storage)
const users = new Map();

// Game history
let gameHistory = [];

// Generate result
function generateResult() {
  const number = Math.floor(Math.random() * 10);
  let color;
  if (number === 0 || number === 5) color = 'violet';
  else if ([1,3,7,9].includes(number)) color = 'green';
  else color = 'red';
  
  const bigSmall = number >= 5 ? 'Big' : 'Small';
  
  return { number, color, bigSmall };
}

// Calculate winnings
function calculateWinnings(bet, result) {
  let multiplier = 0;
  
  if (bet.type === 'color') {
    if (bet.value === result.color) {
      multiplier = bet.value === 'violet' ? 4.5 : 2;
    }
  } else if (bet.type === 'number' && bet.value === result.number) {
    multiplier = 9;
  } else if (bet.type === 'bigSmall' && bet.value === result.bigSmall) {
    multiplier = 2;
  }
  
  return bet.amount * multiplier;
}

// API Routes
app.get('/api/game/current', (req, res) => {
  res.json({
    period: currentPeriod,
    timeRemaining: gameState.timeRemaining,
    history: gameHistory.slice(0, 10)
  });
});

app.post('/api/bet', (req, res) => {
  const { userId, type, value, amount } = req.body;
  
  if (!users.has(userId)) {
    users.set(userId, { balance: 100, bets: [] });
  }
  
  const user = users.get(userId);
  
  if (user.balance < amount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  user.balance -= amount;
  user.bets.push({ type, value, amount, period: currentPeriod });
  
  res.json({ balance: user.balance });
});

// Game loop
setInterval(() => {
  gameState.timeRemaining--;
  
  if (gameState.timeRemaining <= 0) {
    const result = generateResult();
    gameHistory.unshift({ period: currentPeriod, ...result });
    
    // Process bets
    users.forEach((user, userId) => {
      user.bets.forEach(bet => {
        if (bet.period === currentPeriod) {
          const winnings = calculateWinnings(bet, result);
          user.balance += winnings;
        }
      });
      user.bets = user.bets.filter(bet => bet.period !== currentPeriod);
    });
    
    currentPeriod++;
    gameState.timeRemaining = 60;
    gameState = { ...gameState, ...result };
    
    io.emit('newRound', {
      period: currentPeriod,
      lastResult: result,
      timeRemaining: 60
    });
  } else {
    io.emit('tick', { timeRemaining: gameState.timeRemaining });
  }
}, 1000);

server.listen(5000, '0.0.0.0', () => {
  console.log('Server running on port 5000');
});
