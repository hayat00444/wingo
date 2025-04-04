
// Game state
let wallet = 4.76;
let currentPeriod = 202504040128;
let timeRemaining = 59;
let gameHistory = [];

// Update wallet display
function updateWallet() {
  document.querySelector('.balance').textContent = `₹${wallet.toFixed(2)}`;
}

// Update timer
function updateTimer() {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  document.querySelector('.countdown').textContent = 
    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Generate random result
function generateResult() {
  const number = Math.floor(Math.random() * 10);
  let color;
  if (number === 0 || number === 5) color = 'violet';
  else if ([1,3,7,9].includes(number)) color = 'green';
  else color = 'red';
  
  const bigSmall = number >= 5 ? 'Big' : 'Small';
  
  return { number, color, bigSmall };
}

// Add result to history
function addToHistory(result) {
  gameHistory.unshift({
    period: currentPeriod,
    ...result
  });
  
  updateHistoryTable();
  currentPeriod++;
}

// Update history table
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

// Game timer
setInterval(() => {
  timeRemaining--;
  if (timeRemaining < 0) {
    timeRemaining = 59;
    const result = generateResult();
    addToHistory(result);
  }
  updateTimer();
}, 1000);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  updateWallet();
  updateTimer();
  
  // Add click handlers
  document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => {
      // Handle betting logic here
      console.log('Bet placed:', button.textContent);
    });
  });
});
