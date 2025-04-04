
const socket = io();
let wallet = 4.76;
let currentPeriod = 202504040128;
let timeRemaining = 59;
let gameHistory = [];
let selectedBet = null;
let selectedAmount = 1;

function updateWallet() {
  document.querySelector('.balance').textContent = `₹${wallet.toFixed(2)}`;
}

function updateTimer() {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  document.querySelector('.countdown').textContent = 
    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  document.querySelector('.period').textContent = currentPeriod;
}

function updateHistoryTable() {
  const tbody = document.getElementById('historyBody');
  tbody.innerHTML = gameHistory.slice(0, 10).map(record => `
    <tr>
      <td>${record.period}</td>
      <td>${record.number}</td>
      <td>${record.bigSmall}</td>
      <td><span class="dot ${record.color}"></span></td>
    </tr>
  `).join('');
}

function placeBet(type, value, amount) {
  fetch('/api/bet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'user1', // Temporary user ID
      type,
      value,
      amount
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      alert(data.error);
    } else {
      wallet = data.balance;
      updateWallet();
    }
  });
}

// Socket events
socket.on('tick', data => {
  timeRemaining = data.timeRemaining;
  updateTimer();
});

socket.on('newRound', data => {
  currentPeriod = data.period;
  timeRemaining = data.timeRemaining;
  gameHistory.unshift(data.lastResult);
  updateTimer();
  updateHistoryTable();
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  updateWallet();
  updateTimer();
  
  // Color buttons
  document.querySelectorAll('.color-buttons button').forEach(button => {
    button.addEventListener('click', () => {
      const color = button.className.split(' ')[0];
      placeBet('color', color, selectedAmount);
    });
  });
  
  // Number buttons
  document.querySelectorAll('.number-grid button').forEach(button => {
    button.addEventListener('click', () => {
      const number = parseInt(button.textContent);
      placeBet('number', number, selectedAmount);
    });
  });
  
  // Big/Small buttons
  document.querySelectorAll('.big-small button').forEach(button => {
    button.addEventListener('click', () => {
      const value = button.className === 'big' ? 'Big' : 'Small';
      placeBet('bigSmall', value, selectedAmount);
    });
  });
  
  // Multiplier buttons
  document.querySelectorAll('.multipliers button').forEach(button => {
    button.addEventListener('click', () => {
      selectedAmount = parseInt(button.textContent.substring(1));
    });
  });
  
  // Random bet
  document.querySelector('.random').addEventListener('click', () => {
    const number = Math.floor(Math.random() * 10);
    placeBet('number', number, selectedAmount);
  });
  
  // Fetch initial game state
  fetch('/api/game/current')
    .then(res => res.json())
    .then(data => {
      currentPeriod = data.period;
      timeRemaining = data.timeRemaining;
      gameHistory = data.history;
      updateTimer();
      updateHistoryTable();
    });
});
