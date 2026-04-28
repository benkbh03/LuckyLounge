// Shared game and wallet state used across the main app pages.
const STARTING_BALANCE = 100;
const BALANCE_STORAGE_KEY = 'll_virtual_balance';
let balance = loadBalance();
let currentGame = null;

// Symbols and payout tables used by the slot and plinko games.
const slotSymbols = [
    { name: 'Cherry', icon: '\u{1F352}' },
    { name: 'Lemon', icon: '\u{1F34B}' },
    { name: 'Orange', icon: '\u{1F34A}' },
    { name: 'Apple', icon: '\u{1F34E}' },
    { name: 'Melon', icon: '\u{1F349}' },
    { name: 'Star', icon: '\u2B50' },
    { name: 'Diamond', icon: '\u{1F48E}' }
];
const PLINKO_ROWS = 10;
const PLINKO_PRIZES = [20, 10, 5, 1, 0, 0, 1, 5, 10, 20];

// Updates any visible balance display in the page header or game layout.
function updateBalance() {
    const balanceEl = document.getElementById('balance');
    if (balanceEl) {
        balanceEl.textContent = balance.toFixed(2);
    }
}

// Loads the saved virtual balance or falls back to the starting amount.
function loadBalance() {
    const savedBalance = Number(localStorage.getItem(BALANCE_STORAGE_KEY));
    return Number.isFinite(savedBalance) ? savedBalance : STARTING_BALANCE;
}

// Saves the current virtual balance to browser storage.
function saveBalance() {
    localStorage.setItem(BALANCE_STORAGE_KEY, balance.toFixed(2));
}

// Reads the current bet input and keeps it within the minimum allowed value.
function getBet() {
    let bet = Number(document.getElementById('bet-amount').value);
    if (isNaN(bet) || bet < 1) bet = 1;
    return bet;
}

// Fills the bet input with the largest whole-number bet the user can place.
function setMaxBet() {
    document.getElementById('bet-amount').value = Math.floor(balance);
}

// Renders the selected game UI inside the shared game container.
function showGame(type, shouldScroll = true) {
    const section = document.getElementById('game-section');
    currentGame = type;
    section.innerHTML = '';

    if (type === 'slot') {
        section.innerHTML = `
            <h4>Slot Machine</h4>
            <div class="slot-reels">
                <div class="slot-reel" id="reel1" aria-label="Cherry">${slotSymbols[0].icon}</div>
                <div class="slot-reel" id="reel2" aria-label="Lemon">${slotSymbols[1].icon}</div>
                <div class="slot-reel" id="reel3" aria-label="Orange">${slotSymbols[2].icon}</div>
            </div>
            <button id="slot-spin-btn">Spin</button>
            <div id="slot-result" class="game-result"></div>
        `;
        document.getElementById('slot-spin-btn').addEventListener('click', playSlotUI);
        if (shouldScroll) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }

    if (type === 'dice') {
        section.innerHTML = `
            <h4>Dice Game</h4>
            <div class="dice-face" id="dice-face"></div>
            <button id="dice-roll-btn">Roll Dice</button>
            <div id="dice-result" class="game-result"></div>
        `;
        renderDiceFace(1);
        document.getElementById('dice-roll-btn').addEventListener('click', playDiceUI);
        if (shouldScroll) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }

    if (type === 'plinko') {
        section.innerHTML = `
            <h4>Plinko</h4>
            <div id="plinko-board-container"></div>
            <button id="plinko-drop-btn">Drop Ball</button>
            <div id="plinko-result" class="game-result"></div>
        `;
        renderPlinkoBoard(null);
        document.getElementById('plinko-drop-btn').addEventListener('click', playPlinkoUI);
    }

    if (shouldScroll) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Runs the slot machine animation, checks the result, and applies winnings.
function playSlotUI() {
    const bet = getBet();
    if (bet > balance) {
        showResult('slot-result', 'Insufficient balance.');
        return;
    }

    balance -= bet;
    saveBalance();
    updateBalance();

    const reelEls = [1, 2, 3].map(i => document.getElementById('reel' + i));
    const resultDiv = document.getElementById('slot-result');
    const stops = [];

    for (let i = 0; i < 3; i++) {
        stops[i] = Math.floor(Math.random() * slotSymbols.length);
    }

    let frames = 0;
    const animTimes = [12, 16, 20];

    function animateReels() {
        for (let i = 0; i < 3; i++) {
            if (frames < animTimes[i]) {
                const idx = (frames + i) % slotSymbols.length;
                reelEls[i].textContent = slotSymbols[idx].icon;
                reelEls[i].setAttribute('aria-label', slotSymbols[idx].name);
                reelEls[i].classList.add('slot-anim');
                setTimeout(() => reelEls[i].classList.remove('slot-anim'), 200);
            } else {
                reelEls[i].textContent = slotSymbols[stops[i]].icon;
                reelEls[i].setAttribute('aria-label', slotSymbols[stops[i]].name);
            }
        }

        frames++;

        if (frames <= Math.max(...animTimes)) {
            setTimeout(animateReels, 43);
            return;
        }

        const resSyms = stops.map(i => slotSymbols[i].name);
        const starCount = resSyms.filter(symbol => symbol === 'Star').length;

        if (resSyms.every((value, index, array) => value === array[0])) {
            const win = bet * 10;
            balance += win;
            saveBalance();
            updateBalance();
            reelEls.forEach(reel => reel.classList.add('jackpot'));
            resultDiv.textContent = `JACKPOT! All matched. You win $${win}!`;
        } else if (starCount >= 2) {
            const win = bet * 3;
            balance += win;
            saveBalance();
            updateBalance();
            resultDiv.textContent = `2+ Stars! Bonus $${win}!`;
            reelEls.forEach(reel => reel.classList.remove('jackpot'));
        } else {
            resultDiv.textContent = 'No win. Try again!';
            reelEls.forEach(reel => reel.classList.remove('jackpot'));
        }
    }

    animateReels();
}

// Draws a single SVG dice face based on the rolled number.
function renderDiceFace(face) {
    const pips = [
        [],
        [[1, 1]],
        [[0, 0], [2, 2]],
        [[0, 0], [1, 1], [2, 2]],
        [[0, 0], [0, 2], [2, 0], [2, 2]],
        [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
        [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]]
    ];

    const dots = pips[face].map(([row, column]) => {
        return `<circle class="dot" cx="${18 + 13 * column}" cy="${18 + 13 * row}" r="6"/>`;
    }).join('');

    document.getElementById('dice-face').innerHTML = `
        <svg class="dice-svg${face === 6 ? ' jackpot' : ''}" viewBox="0 0 62 62">
            <rect width="62" height="62" rx="14" fill="#19192c"/>
            ${dots}
        </svg>
    `;
}

// Animates a dice roll, then pays out if the player lands on six.
function playDiceUI() {
    const bet = getBet();
    if (bet > balance) {
        showResult('dice-result', 'Insufficient balance.');
        return;
    }

    balance -= bet;
    saveBalance();
    updateBalance();

    let face = 1;
    let rollAnim = 0;
    const resultDiv = document.getElementById('dice-result');

    function rollDiceAnim() {
        face = Math.floor(Math.random() * 6) + 1;
        renderDiceFace(face);
        rollAnim++;

        if (rollAnim <= 12) {
            setTimeout(rollDiceAnim, 32);
            return;
        }

        if (face === 6) {
            const win = bet * 5;
            balance += win;
            saveBalance();
            updateBalance();
            resultDiv.textContent = 'You rolled 6! You win $' + win + '!';
        } else {
            resultDiv.textContent = 'You rolled ' + face + '.';
        }
    }

    rollDiceAnim();
}

// Builds the plinko board and highlights the current ball position during animation.
function renderPlinkoBoard(ballPath = null) {
    const container = document.getElementById('plinko-board-container');
    let html = '';

    for (let row = 0; row < PLINKO_ROWS; row++) {
        html += '<div class="plinko-board-row">';

        for (let column = 0; column <= row; column++) {
            let cellClass = 'plinko-cell';
            let cellText = '.';

            if (ballPath && ballPath[row] === column) {
                cellClass += ' plinko-ball';
                cellText = 'o';
            }

            html += `<div class="${cellClass}">${cellText}</div>`;
        }

        html += '</div>';
    }

    html += '<div class="plinko-prize-row">';

    for (let i = 0; i < PLINKO_PRIZES.length; i++) {
        let className = 'plinko-prize-cell';
        let prizeText = PLINKO_PRIZES[i] > 0 ? PLINKO_PRIZES[i] + 'x' : 'Lose';

        if (i === 0 || i === PLINKO_PRIZES.length - 1) className += ' jackpot';
        if (i === 4 || i === 5) className += ' losing-slot';

        html += `<div class="${className}">${prizeText}</div>`;
    }

    html += '</div><div class="plinko-alignment-note">Rare edge hits pay the most. The middle is the most common loss.</div>';
    container.innerHTML = html;
}

// Simulates a plinko drop, animates the path, and handles the final payout.
function playPlinkoUI() {
    const bet = getBet();
    if (bet > balance) {
        showResult('plinko-result', 'Insufficient balance.');
        return;
    }

    balance -= bet;
    saveBalance();
    updateBalance();
    document.getElementById('plinko-result').textContent = '';

    let column = 0;
    const path = [column];

    for (let row = 1; row < PLINKO_ROWS; row++) {
        if (Math.random() < 0.5) {
            column++;
        }

        path.push(column);
    }

    let step = 0;

    function animateDrop() {
        renderPlinkoBoard(path.slice(0, step + 1));
        step++;

        if (step < path.length) {
            setTimeout(animateDrop, 140);
            return;
        }

        const finalSlot = path[path.length - 1];
        const prize = PLINKO_PRIZES[finalSlot];
        const resultDiv = document.getElementById('plinko-result');

        if (prize > 0) {
            const winnings = prize * bet;
            balance += winnings;
            saveBalance();
            updateBalance();
            resultDiv.textContent = `Ball landed in slot ${finalSlot + 1} for ${prize}x. You win $${winnings}!`;
        } else {
            resultDiv.textContent = 'Ball landed in the middle. You lost your bet.';
        }
    }

    animateDrop();
}

// Shows a short game result message inside the given result element.
function showResult(id, text) {
    document.getElementById(id).textContent = text;
}

// Reads the signed-in user from session storage.
function getCurrentUser() {
    const user = sessionStorage.getItem('ll_user');

    if (!user) {
        return null;
    }

    try {
        return JSON.parse(user);
    } catch (error) {
        sessionStorage.removeItem('ll_user');
        return null;
    }
}

// Updates the header account area for either a signed-in user or a guest.
function updateUserBar(user) {
    const greetingEl = document.getElementById('user-greeting');
    const labelEl = document.querySelector('.account-label');
    const logoutLink = document.getElementById('logout-link');

    if (!greetingEl || !labelEl) {
        return;
    }

    if (user) {
        labelEl.textContent = 'Signed in';
        greetingEl.textContent = user.username;

        if (logoutLink) {
            logoutLink.textContent = 'Logout';
            logoutLink.setAttribute('href', '#');
        }

        return;
    }

    labelEl.textContent = 'Guest';
    greetingEl.textContent = 'Browse games';

    if (logoutLink) {
        logoutLink.textContent = 'Login';
        logoutLink.setAttribute('href', 'login.html');
    }
}

// Protects pages that should only be available after login.
function requireLoggedInUser() {
    const user = getCurrentUser();

    if (!user) {
        window.location.href = 'login.html';
        return null;
    }

    updateUserBar(user);
    return user;
}

// Signs the user out and sends them back to the login page.
function logout(event) {
    event.preventDefault();
    sessionStorage.removeItem('ll_user');
    window.location.href = 'login.html';
}

// Wires up the wallet page controls for deposit and dummy helper actions.
function setupWalletPage() {
    const walletBalance = document.getElementById('wallet-balance');
    const topupInput = document.getElementById('topup-amount');
    const topupButton = document.getElementById('topup-btn');
    const withdrawButton = document.getElementById('withdraw-btn');
    const setLimitsButton = document.getElementById('set-limits-btn');
    const walletMessage = document.getElementById('wallet-message');
    if (!walletBalance || !topupInput || !topupButton || !walletMessage) {
        return;
    }

    // Keeps the wallet balance box and top header balance in sync.
    function updateWalletBalance() {
        walletBalance.textContent = balance.toFixed(2);
        updateBalance();
    }

    // Adds virtual money to the balance after validating the entered amount.
    topupButton.addEventListener('click', () => {
        const amount = Number(topupInput.value);

        if (!Number.isFinite(amount) || amount < 1 || amount > 100) {
            walletMessage.textContent = 'Choose an amount between $1 and $100 virtual money.';
            walletMessage.className = 'status-msg error';
            return;
        }

        balance += amount;
        saveBalance();
        updateWalletBalance();
        walletMessage.textContent = `Added $${amount.toFixed(2)} virtual money. Take a break before adding more.`;
        walletMessage.className = 'status-msg success';
    });

    // Shows a placeholder message for the future withdraw flow.
    if (withdrawButton) {
        withdrawButton.addEventListener('click', () => {
            walletMessage.textContent = 'This button would allow you to withdraw the money in your balance.';
            walletMessage.className = 'status-msg success';
        });
    }

    // Shows a placeholder message for a future responsible-play limits tool.
    if (setLimitsButton) {
        setLimitsButton.addEventListener('click', () => {
            walletMessage.textContent = 'This button would allow you to set time and money limits';
            walletMessage.className = 'status-msg success';
        });
    }

    updateWalletBalance();
}

// Sets up shared page behavior for headers, auth, games, and wallet controls.
function setupApp() {
    const requiresAuth = document.body.dataset.requiresAuth === 'true';
    const currentUser = getCurrentUser();

    if (requiresAuth && !requireLoggedInUser()) {
        return;
    }

    if (!requiresAuth) {
        updateUserBar(currentUser);
    }

    const logoutLink = document.getElementById('logout-link');
    if (logoutLink && currentUser) {
        logoutLink.addEventListener('click', logout);
    }

    const balanceEl = document.getElementById('balance');
    if (balanceEl) {
        updateBalance();
    }

    const maxBetBtn = document.getElementById('max-bet-btn');
    if (maxBetBtn) {
        maxBetBtn.addEventListener('click', setMaxBet);
    }

    document.querySelectorAll('[data-game]').forEach(button => {
        button.addEventListener('click', () => showGame(button.dataset.game));
    });

    const gamePage = document.body.dataset.gamePage;
    if (gamePage) {
        showGame(gamePage, false);
    }

    setupWalletPage();
}

// Starts the shared app logic after the page HTML has loaded.
document.addEventListener('DOMContentLoaded', setupApp);
