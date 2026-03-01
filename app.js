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

function showGame(type) {
    const section = document.getElementById('game-section');
    resetGameSection();
    if (type === 'slot') {
        section.innerHTML = `
            <h4>Slot Machine</h4>
            <p>Play for $5 per spin. 15% chance to win $50, Stars = bonus!</p>
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
            <p>Roll a die for $2 per try. Roll a six for $10!</p>
            <div class="dice-face" id="dice-face"></div>
            <button id="dice-roll-btn">Roll Dice</button>
            <div id="dice-result"></div>
        `;
        renderDiceFace(1);
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

const slotSymbols = ['🍒','🍋','🍊','🍎','🍉','⭐','💎'];
function playSlotUI() {
    if (balance < 5) {
        showToast("Not enough balance for a slot spin.");
        return;
    }
    balance -= 5;
    updateBalance();
    const reels = [];
    let starCount = 0;
    let jackpot = false;
    let reelEls = [1,2,3].map(i => document.getElementById('reel'+i));
    let resultDiv = document.getElementById('slot-result');
    let animTimes = [12,16,20];
    let stops = [];
    for(let i=0;i<3;i++) { stops[i]=Math.floor(Math.random()*slotSymbols.length); }
    let frames=0;
    function animateReels() {
        for(let i=0;i<3;i++) {
            if(frames<animTimes[i]) {
                let idx = (frames+i)%slotSymbols.length;
                reelEls[i].textContent = slotSymbols[idx];
                reelEls[i].classList.add('slot-anim');
                setTimeout(()=>reelEls[i].classList.remove('slot-anim'),210)
            } else {
                reelEls[i].textContent = slotSymbols[stops[i]];
            }
        }
        frames++;
        if(frames<=Math.max(...animTimes)) {
            setTimeout(animateReels,42);
        } else {
            let resSyms = stops.map(i=>slotSymbols[i]);
            starCount = resSyms.filter(s=>s==='⭐').length;
            if(resSyms.every((v,i,a)=>v===a[0])) {
                jackpot = true;
                balance += 50;
                updateBalance();
                reelEls.forEach(re=>re.classList.add('jackpot'));
                resultDiv.textContent = '🎉 JACKPOT! All matched—win $50!';
            } else if(starCount >= 2) {
                balance += 15;
                updateBalance();
                resultDiv.textContent = '✨ 2+ Stars! You win $15!';
                reelEls.forEach(re=>re.classList.remove('jackpot'));
            } else {
                resultDiv.textContent = 'No win. Try again!';
                reelEls.forEach(re=>re.classList.remove('jackpot'));
            }
        }
    }
    animateReels();
}

function renderDiceFace(face) {
    const pips = [
        [],
        [[1,1]],
        [[0,0],[2,2]],
        [[0,0],[1,1],[2,2]],
        [[0,0],[0,2],[2,0],[2,2]],
        [[0,0],[0,2],[1,1],[2,0],[2,2]],
        [[0,0],[0,2],[1,0],[1,2],[2,0],[2,2]],
    ];
    let svg =
        `<svg class="dice-svg${face===6?' jackpot':''}" viewBox="0 0 62 62">
            <rect width="62" height="62" rx="14" fill="#19192c"/>
            ${pips[face].map(([r,c])=>
                `<circle class="dot" cx="${18+13*c}" cy="${18+13*r}" r="6"/>`).join('')}
        </svg>`;
    document.getElementById('dice-face').innerHTML = svg;
}
function playDiceUI() {
    if (balance < 2) {
        showToast("Not enough balance for a dice roll.");
        return;
    }
    balance -= 2;
    updateBalance();
    let face = 1;
    let rollAnim = 0;
    let resultDiv = document.getElementById('dice-result');
    function rollDiceAnim() {
        face = Math.floor(Math.random()*6)+1;
        renderDiceFace(face);
        rollAnim++;
        if(rollAnim<=12){
            setTimeout(rollDiceAnim,32);
        } else {
            if(face===6){
                balance += 10;
                updateBalance();
                resultDiv.textContent='🎉 You rolled 6! You win $10!';
            } else {
                resultDiv.textContent=`You rolled ${face}.`;
            }
        }
    }
    rollDiceAnim();
}

const PLINKO_COLUMNS = 7;
const PLINKO_ROWS = 8;
const PLINKO_PRIZES = [0,8,12,50,12,8,0];

function renderPlinkoBoard(ballPath = null) {
    const container = document.getElementById('plinko-board-container');
    let html = "";
    for (let r = 0; r < PLINKO_ROWS; r++) {
        html += `<div class="plinko-board">`;
        for (let c = 0; c < PLINKO_COLUMNS; c++) {
            let cellClass = "plinko-cell";
            if (ballPath && ballPath[r] === c)
                cellClass += " plinko-ball";
            html += `<div class="${cellClass}">${(ballPath && ballPath[r]===c)?'●':'•'}</div>`;
        }
        html += `</div>`;
    }
    // Prizes
    html += `<div class="plinko-prize-row">`;
    for (let i = 0; i < PLINKO_PRIZES.length; i++) {
        let classN = "plinko-prize-cell";
        if (PLINKO_PRIZES[i]===50) classN += ' jackpot';
        if (PLINKO_PRIZES[i]===0) classN += ' plinko-skull';
        html += `<div class="${classN}">${PLINKO_PRIZES[i]>0?('$'+PLINKO_PRIZES[i]):'💀'}</div>`;
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
        const direction = Math.random() < 0.45 ? -1 : (Math.random()<0.55?1:0);
        col += direction;
        col = Math.max(0, Math.min(PLINKO_COLUMNS - 1, col));
        path.push(col);
    }
    let step = 0;
    function animatePlinko() {
        renderPlinkoBoard(path.slice(0, step + 1));
        step++;
        if (step < path.length)
            setTimeout(animatePlinko, 140);
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

function selfExclude() {
    selfExcluded = true;
    showToast("You have self-excluded. Account blocked until next session.");
    logout();
}
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
    setTimeout(() => { toast.remove(); }, 2200);
}
