let user = null;
let balance = 0;
let sessionStart = null;
let sessionTimerInterval = null;
let selfExcluded = false;

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

// ====== GAME UI & LOGIC =======
function showGame(type) {
    const section = document.getElementById('game-section');
    resetGameSection();
    if (type === 'slot') {
        section.innerHTML = `
            <h4>Slot Machine</h4>
            <p>Play for $5 per spin. 15% chance to win $50!</p>
            <div class="slot-reels">
                <div class="slot-reel" id="reel1">🍒</div>
                <div class="slot-reel" id="reel2">🍋</div>
                <div class="slot-reel" id="reel3">🍊</div>
            </div>
            <button id="slot-spin-btn">Spin</button>
            <div id="slot-result"></div>
        `;
        document.getElementById('slot-spin-btn').onclick = playSlotUI;
    } else if (type === 'dice') {
        section.innerHTML = `
            <h4>Dice Game</h4>
            <p>Roll a die for $2 per try. Roll a 6 to win $10!</p>
            <div class="dice-face" id="dice-face">⚀</div>
            <button id="dice-roll-btn">Roll Dice</button>
            <div id="dice-result"></div>
        `;
        document.getElementById('dice-roll-btn').onclick = playDiceUI;
    } else if (type === 'plinko') {
        section.innerHTML = `
            <h4>Plinko</h4>
            <p>Play for $4 per drop.<br>Try to get the best prize at the bottom!</p>
            <div id="plinko-board-container"></div>
            <button id="plinko-drop-btn">Drop Ball</button>
            <div id="plinko-result"></div>
        `;
        renderPlinkoBoard(null);
        document.getElementById('plinko-drop-btn').onclick = playPlinkoUI;
    }
}
// ---- Slot Machine UI + Spin Logic ----
const slotSymbols = ['🍒','🍋','🍊','🍎','🍉','⭐','💎'];
function playSlotUI() {
    if (balance < 5) {
        showToast("Not enough balance for a slot spin.");
        return;
    }
    balance -= 5;
    updateBalance();
    let reels = [];
    let starCount = 0;
    for (let i = 1; i <= 3; i++) {
        let randIdx = Math.floor(Math.random() * slotSymbols.length);
        reels[i-1] = slotSymbols[randIdx];
        document.getElementById("reel"+i).textContent = reels[i-1];
        if (reels[i-1]==='⭐') starCount++;
    }
    let win = false;
    let resultDiv = document.getElementById('slot-result');
    if (reels.every((v,i,a)=>v===a[0])) {
        win = true;
        balance += 50;
        updateBalance();
        resultDiv.textContent = "🎉 JACKPOT! All matched, you win $50!";
    } else if (starCount >= 2) {
        win = true;
        balance += 15;
        updateBalance();
        resultDiv.textContent = "✨ Bonus! 2+ stars, you win $15!";
    } else {
        resultDiv.textContent = "No win. Try again!";
    }
}

// ---- Dice UI + Roll Logic ----
const diceEmojis = ['⚀','⚁','⚂','⚃','⚄','⚅'];
function playDiceUI() {
    if (balance < 2) {
        showToast("Not enough balance for a dice roll.");
        return;
    }
    balance -= 2;
    updateBalance();
    const roll = Math.floor(Math.random() * 6);
    document.getElementById('dice-face').textContent = diceEmojis[roll];
    let result = `You rolled a ${roll+1}.`;
    if (roll === 5) {
        balance += 10;
        updateBalance();
        result += " 🎉 You won $10!";
    }
    document.getElementById('dice-result').textContent = result;
}

// ---- Plinko UI & Animation ----
const PLINKO_COLUMNS = 7;
const PLINKO_ROWS = 8;
const PLINKO_PRIZES = [0, 8, 12, 50, 12, 8, 0];

function renderPlinkoBoard(ballPath = null) {
    const container = document.getElementById('plinko-board-container');
    let html = "";
    // pegs rows
    for (let r = 0; r < PLINKO_ROWS; r++) {
        html += `<div class="plinko-board">`;
        for (let c = 0; c < PLINKO_COLUMNS; c++) {
            let cellClass = "plinko-cell";
            if (ballPath && ballPath[r] === c)
                cellClass += " plinko-ball";
            html += `<div class="${cellClass}">${(ballPath && ballPath[r] === c) ? '●' : '•'}</div>`;
        }
        html += `</div>`;
    }
    // prizes row
    html += `<div class="plinko-prize-row">`;
    for (let i = 0; i < PLINKO_PRIZES.length; i++) {
        html += `<div class="plinko-prize-cell ${PLINKO_PRIZES[i]===0?'plinko-skull':''}">
            ${PLINKO_PRIZES[i]>0 ? '$'+PLINKO_PRIZES[i]: '💀'}
        </div>`;
    }
    html += "</div>";
    container.innerHTML = html;
}

function playPlinkoUI() {
    if (balance < 4) {
        showToast("Not enough balance for Plinko.");
        return;
    }
    balance -= 4;
    updateBalance();

    let col = Math.floor(PLINKO_COLUMNS / 2);
    let path = [col];
    for (let r = 1; r < PLINKO_ROWS; r++) {
        const direction = Math.random() < 0.5 ? -1 : 1;
        col += direction;
        col = Math.max(0, Math.min(PLINKO_COLUMNS - 1, col));
        path.push(col);
    }

    let step = 0;
    function animatePlinko() {
        renderPlinkoBoard(path.slice(0, step + 1));
        step++;
        if (step < path.length)
            setTimeout(animatePlinko, 220);
        else {
            const prize = PLINKO_PRIZES[path[path.length - 1]];
            let resDiv = document.getElementById('plinko-result');
            if (prize > 0) {
                balance += prize;
                updateBalance();
                resDiv.textContent = `🎊 Ball landed on $${prize}. You win $${prize}!`;
            } else {
                resDiv.textContent = `💀 Ball landed on a skull. No prize!`;
            }
        }
    }
    animatePlinko();
}

// ====== Responsible Gambling =======
function selfExclude() {
    selfExcluded = true;
    showToast("You have self-excluded. Account blocked until next session.");
    logout();
}

// ====== Toast Helper =======
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
    }, 2200);
}
