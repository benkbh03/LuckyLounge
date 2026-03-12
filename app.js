let balance = 100;

function updateBalance() {
    document.getElementById('balance').textContent = balance.toFixed(2);
}

function getBet() {
    let bet = Number(document.getElementById('bet-amount').value);
    if (isNaN(bet) || bet < 1) bet = 1;
    return bet;
}

function setMaxBet() {
    document.getElementById('bet-amount').value = Math.floor(balance);
}

function resetBalance() {
    balance = 100;
    updateBalance();
    document.getElementById('game-section').innerHTML = '';
}

// --- UI Main game loader ---
function showGame(type) {
    const section = document.getElementById('game-section');
    section.innerHTML = "";
    if (type === "slot") {
        section.innerHTML = `
            <h4>Slot Machine</h4>
            <div class="slot-reels">
                <div class="slot-reel" id="reel1">🍒</div>
                <div class="slot-reel" id="reel2">🍋</div>
                <div class="slot-reel" id="reel3">🍊</div>
            </div>
            <div style="display:flex;gap:7px;justify-content:center;">
                <button id="slot-spin-btn">Spin</button>
                <button onclick="setMaxBet()">Max</button>
            </div>
            <div id="slot-result" style="text-align:center;min-height:1.5em;"></div>
        `;
        document.getElementById('slot-spin-btn').onclick = playSlotUI;
    } else if (type === "dice") {
        section.innerHTML = `
            <h4>Dice Game</h4>
            <div class="dice-face" id="dice-face"></div>
            <div style="display:flex;gap:7px;justify-content:center;">
                <button id="dice-roll-btn">Roll Dice</button>
                <button onclick="setMaxBet()">Max</button>
            </div>
            <div id="dice-result" style="text-align:center;min-height:1.4em;"></div>
        `;
        renderDiceFace(1);
        document.getElementById('dice-roll-btn').onclick = playDiceUI;
    } else if (type === "plinko") {
        section.innerHTML = `
            <h4>Plinko</h4>
            <div id="plinko-board-container"></div>
            <div style="display:flex;gap:7px;justify-content:center;">
                <button id="plinko-drop-btn">Drop Ball</button>
                <button onclick="setMaxBet()">Max</button>
            </div>
            <div id="plinko-result"></div>
        `;
        renderPlinkoBoard(null);
        document.getElementById('plinko-drop-btn').onclick = playPlinkoUI;
    }
}

// --- Slot logic ---
const slotSymbols = ['🍒', '🍋', '🍊', '🍎', '🍉', '⭐', '💎'];

function playSlotUI() {
    const bet = getBet();
    if (bet > balance) { showResult('slot-result', "Insufficient balance."); return; }
    balance -= bet;
    updateBalance();
    let reelEls = [1, 2, 3].map(i => document.getElementById('reel' + i));
    let resultDiv = document.getElementById('slot-result');
    let stops = [];
    for (let i = 0; i < 3; i++) stops[i] = Math.floor(Math.random() * slotSymbols.length);
    let frames = 0, animTimes = [12, 16, 20];
    function animateReels() {
        for (let i = 0; i < 3; i++) {
            if (frames < animTimes[i]) {
                let idx = (frames + i) % slotSymbols.length;
                reelEls[i].textContent = slotSymbols[idx];
                reelEls[i].classList.add('slot-anim');
                setTimeout(() => reelEls[i].classList.remove('slot-anim'), 200);
            } else {
                reelEls[i].textContent = slotSymbols[stops[i]];
            }
        }
        frames++;
        if (frames <= Math.max(...animTimes)) {
            setTimeout(animateReels, 43);
        } else {
            let resSyms = stops.map(i => slotSymbols[i]);
            let starCount = resSyms.filter(s => s === '⭐').length;
            if (resSyms.every((v, i, a) => v === a[0])) {
                let win = bet * 10;
                balance += win;
                updateBalance();
                reelEls.forEach(re => re.classList.add('jackpot'));
                resultDiv.textContent = `🎉 JACKPOT! All matched—win $${win}!`;
            } else if (starCount >= 2) {
                let win = bet * 3;
                balance += win;
                updateBalance();
                resultDiv.textContent = `✨ 2+ Stars! Bonus $${win}!`;
                reelEls.forEach(re => re.classList.remove('jackpot'));
            } else {
                resultDiv.textContent = "No win. Try again!";
                reelEls.forEach(re => re.classList.remove('jackpot'));
            }
        }
    }
    animateReels();
}

// --- Dice logic (SVG) ---
function renderDiceFace(face) {
    const pips = [
        [], [[1,1]], [[0,0],[2,2]], [[0,0],[1,1],[2,2]], [[0,0],[0,2],[2,0],[2,2]],
        [[0,0],[0,2],[1,1],[2,0],[2,2]], [[0,0],[0,2],[1,0],[1,2],[2,0],[2,2]]
    ];
    let svg = `<svg class="dice-svg${face === 6 ? ' jackpot' : ''}" viewBox="0 0 62 62">
        <rect width="62" height="62" rx="14" fill="#19192c"/>
        ${pips[face].map(([r, c]) =>
            `<circle class="dot" cx="${18 + 13 * c}" cy="${18 + 13 * r}" r="6"/>`
        ).join('')}
    </svg>`;
    document.getElementById('dice-face').innerHTML = svg;
}

function playDiceUI() {
    const bet = getBet();
    if (bet > balance) { showResult('dice-result', "Insufficient balance."); return; }
    balance -= bet;
    updateBalance();
    let face = 1, rollAnim = 0;
    let resultDiv = document.getElementById('dice-result');
    function rollDiceAnim() {
        face = Math.floor(Math.random() * 6) + 1;
        renderDiceFace(face);
        rollAnim++;
        if (rollAnim <= 12) {
            setTimeout(rollDiceAnim, 32);
        } else {
            if (face === 6) {
                let win = bet * 5;
                balance += win;
                updateBalance();
                resultDiv.textContent = '🎉 You rolled 6! You win $' + win + '!';
            } else {
                resultDiv.textContent = "You rolled " + face + '.';
            }
        }
    }
    rollDiceAnim();
}

// --- Plinko ---
const PLINKO_COLUMNS = 7, PLINKO_ROWS = 8, PLINKO_PRIZES = [0, 8, 12, 50, 12, 8, 0];

function renderPlinkoBoard(ballPath = null) {
    const container = document.getElementById('plinko-board-container');
    let html = "";
    for (let r = 0; r < PLINKO_ROWS; r++) {
        html += `<div class="plinko-board">`;
        for (let c = 0; c < PLINKO_COLUMNS; c++) {
            let cellClass = "plinko-cell";
            if (ballPath && ballPath[r] === c) cellClass += " plinko-ball";
            html += `<div class="${cellClass}">${(ballPath && ballPath[r] === c) ? '●' : '•'}</div>`;
        }
        html += `</div>`;
    }
    html += `<div class="plinko-prize-row">`;
    for (let i = 0; i < PLINKO_PRIZES.length; i++) {
        let classN = "plinko-prize-cell";
        if (PLINKO_PRIZES[i] === 50) classN += ' jackpot';
        if (PLINKO_PRIZES[i] === 0) classN += ' plinko-skull';
        html += `<div class="${classN}">${PLINKO_PRIZES[i] > 0 ? ('$' + PLINKO_PRIZES[i]) : '💀'}</div>`;
    }
    html += "</div>";
    container.innerHTML = html;
}

function playPlinkoUI() {
    let bet = getBet();
    if (bet > balance) { showResult('plinko-result', "Insufficient balance."); return; }
    balance -= bet;
    updateBalance();
    document.getElementById('plinko-result').textContent = "";
    let col = Math.floor(PLINKO_COLUMNS / 2);
    let path = [col];
    for (let r = 1; r < PLINKO_ROWS; r++) {
        const direction = Math.random() < 0.45 ? -1 : (Math.random() < 0.55 ? 1 : 0);
        col += direction;
        col = Math.max(0, Math.min(PLINKO_COLUMNS - 1, col));
        path.push(col);
    }
    let step = 0;
    function animateDrop() {
        renderPlinkoBoard(path.slice(0, step + 1));
        step++;
        if (step < path.length) {
            setTimeout(animateDrop, 140);
        } else {
            const prize = PLINKO_PRIZES[path[path.length - 1]];
            let resDiv = document.getElementById('plinko-result');
            if (prize > 0) {
                let winnings = prize * bet;
                balance += winnings;
                updateBalance();
                resDiv.textContent = `🎊 Ball landed on $${prize}. You win $${winnings}!`;
            } else {
                resDiv.textContent = "💀 Ball landed on a skull. You lost your bet.";
            }
        }
    }
    animateDrop();
}

function showResult(id, text) {
    document.getElementById(id).textContent = text;
}

window.onload = () => { updateBalance(); };
