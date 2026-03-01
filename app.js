let user = null;
let balance = 0;
let sessionStart = null;
let sessionTimerInterval = null;
let selfExcluded = false;

// ====== LOGIN & LOGOUT =======
function login() {
    if (selfExcluded) {
        alert("Your account is blocked due to self-exclusion. Please contact support if needed.");
        return;
    }
    const username = document.getElementById('username').value.trim();
    if (!username) {
        alert('Please enter your username.');
        return;
    }
    user = username;
    balance = 100;
    sessionStart = new Date();
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'block';
    document.getElementById('display-username').textContent = user;
    updateBalance();
    startSessionTimer();
    resetGameSection();
}

function logout() {
    user = null;
    clearSessionTimer();
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('dashboard-section').style.display = 'none';
    resetGameSection();
}

// ====== BALANCE & ACCOUNT FUNCTIONS =======
function updateBalance() {
    document.getElementById('balance').textContent = balance.toFixed(2);
}

function deposit() {
    const amt = Number(document.getElementById('deposit-amount').value);
    if (isNaN(amt) || amt <= 0) {
        showToast('Deposit amount must be greater than $0.');
        return;
    }
    balance += amt;
    updateBalance();
    showToast(`Deposited $${amt.toFixed(2)} successfully!`);
    document.getElementById('deposit-amount').value = '';
}

function withdraw() {
    const amt = Number(document.getElementById('withdraw-amount').value);
    if (isNaN(amt) || amt <= 0) {
        showToast('Withdrawal amount must be greater than $0.');
        return;
    }
    if (amt > balance) {
        showToast('Insufficient balance for withdrawal.');
        return;
    }
    balance -= amt;
    updateBalance();
    showToast(`Withdrew $${amt.toFixed(2)}. Funds will be processed shortly.`);
    document.getElementById('withdraw-amount').value = '';
}

// ====== SESSION TIMER =======
function startSessionTimer() {
    sessionTimerInterval = setInterval(() => {
        if (!sessionStart) return;
        const now = new Date();
        const msElapsed = now - sessionStart;
        const mins = Math.floor(msElapsed / 60000);
        const secs = Math.floor((msElapsed % 60000) / 1000);
        document.getElementById('session-timer').textContent =
            `Session time: ${mins}m ${secs}s`;
    }, 1000);
}

function clearSessionTimer() {
    clearInterval(sessionTimerInterval);
    document.getElementById('session-timer').textContent = "";
}

function resetGameSection() {
    document.getElementById('game-section').innerHTML = '';
}

// ====== GAME LOGIC =======
function showGame(type) {
    const section = document.getElementById('game-section');
    if (type === 'slot') {
        section.innerHTML = `
            <h4>Slot Machine</h4>
            <p>Play for $5 per spin. 15% chance to win $50!</p>
            <button onclick="playSlot()">Spin</button>
            <div id="slot-result"></div>
        `;
    } else if (type === 'dice') {
        section.innerHTML = `
            <h4>Dice Game</h4>
            <p>Roll a die for $2 per try. Roll a 6 to win $10!</p>
            <button onclick="playDice()">Roll Dice</button>
            <div id="dice-result"></div>
        `;
    } else if (type === 'plinko') {
        section.innerHTML = `
            <h4>Plinko</h4>
            <p>Play for $4 per drop. Reach the best prize at the bottom!</p>
            <button onclick="playPlinko()">Drop Ball</button>
            <div id="plinko-board"></div>
            <div id="plinko-result"></div>
        `;
    }
}

function playSlot() {
    if (balance < 5) {
        showToast("Not enough balance for a slot spin.");
        return;
    }
    balance -= 5;
    updateBalance();
    const win = Math.random() < 0.15; // 15% chance
    if (win) {
        balance += 50;
        updateBalance();
        document.getElementById('slot-result').textContent =
            "🎉 JACKPOT! You won $50!";
    } else {
        document.getElementById('slot-result').textContent =
            "No win. Try again!";
    }
}

function playDice() {
    if (balance < 2) {
        showToast("Not enough balance for a dice roll.");
        return;
    }
    balance -= 2;
    updateBalance();
    const roll = Math.floor(Math.random() * 6) + 1;
    let result = `You rolled a ${roll}.`;
    if (roll === 6) {
        balance += 10;
        updateBalance();
        result += " 🎉 You won $10!";
    }
    document.getElementById('dice-result').textContent = result;
}

// ====== PLINKO GAME =======
const PLINKO_COLUMNS = 7;
const PLINKO_ROWS = 7;
const PLINKO_PRIZES = [0, 8, 12, 50, 12, 8, 0]; // The prizes at the bottom

function playPlinko() {
    if (balance < 4) {
        showToast("Not enough balance for Plinko.");
        return;
    }
    balance -= 4;
    updateBalance();

    let boardHTML = "";
    let col = Math.floor(PLINKO_COLUMNS / 2); // start in the middle
    let path = [col];

    // Simulate the ball bouncing left/right down each row
    for (let r = 0; r < PLINKO_ROWS; r++) {
        // Random left (-1) or right (+1)
        const direction = Math.random() < 0.5 ? -1 : 1;
        col += direction;
        col = Math.max(0, Math.min(PLINKO_COLUMNS - 1, col));
        path.push(col);
    }

    // Build a simple board visualization using emojis or text
    for (let r = 0; r <= PLINKO_ROWS; r++) {
        let rowStr = "";
        for (let c = 0; c < PLINKO_COLUMNS; c++) {
            if (c === path[r]) {
                rowStr += "🔵 "; // Ball position
            } else {
                rowStr += "⚪ "; // Peg
            }
        }
        boardHTML += rowStr + "<br>";
    }
    // Prize display row
    let prizeRow = "";
    for (let i = 0; i < PLINKO_PRIZES.length; i++) {
        if (PLINKO_PRIZES[i] > 0)
            prizeRow += "$" + PLINKO_PRIZES[i].toString().padEnd(2) + " ";
        else
            prizeRow += "💀      ";
    }
    boardHTML += prizeRow;

    document.getElementById('plinko-board').innerHTML = boardHTML;

    // Show prize result
    const finalCol = path[path.length - 1];
    const prize = PLINKO_PRIZES[finalCol];
    if (prize > 0) {
        balance += prize;
        updateBalance();
        document.getElementById('plinko-result').textContent =
            `🎊 Plinko Ball landed in slot $${prize}! You won $${prize}.`;
    } else {
        document.getElementById('plinko-result').textContent =
            `Oh no! The ball landed in a skull slot. No prize.`;
    }
}

// ====== RESPONSIBLE GAMBLING =======
function selfExclude() {
    selfExcluded = true;
    showToast("You have self-excluded. Account blocked until next session.");
    logout();
}

// ====== UI Helper: Toast Messages =======
function showToast(message) {
    let toast = document.createElement('div');
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '30px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = 'linear-gradient(90deg, #17e9e1 50%, #9f50ff 100%)';
    toast.style.color = '#13121E';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '12px';
    toast.style.boxShadow = '0 2px 10px rgba(23,233,225,.09)';
    toast.style.zIndex = '99';
    toast.style.fontWeight = '600';
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 2000);
}
