const PLINKO_COLUMNS = 7;
const PLINKO_ROWS = 8;
const PLINKO_PRIZES = [0,8,12,50,12,8,0];
let balance = 100;

function updateBalance() {
    document.getElementById('balance').textContent = balance.toFixed(2);
}

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

function playPlinko() {
    const betInput = document.getElementById('bet-amount');
    let betAmt = Number(betInput.value);
    if (isNaN(betAmt) || betAmt < 1) {
        document.getElementById('plinko-result').textContent = "Please enter a valid bet amount (minimum $1).";
        return;
    }
    if (betAmt > balance) {
        document.getElementById('plinko-result').textContent = "Insufficient balance for this bet.";
        return;
    }
    balance -= betAmt;
    updateBalance();
    document.getElementById('plinko-result').textContent = "";

    let col = Math.floor(PLINKO_COLUMNS / 2);
    let path = [col];
    for (let r = 1; r < PLINKO_ROWS; r++) {
        const direction = Math.random() < 0.45 ? -1 : (Math.random()<0.55?1:0);
        col += direction;
        col = Math.max(0, Math.min(PLINKO_COLUMNS - 1, col));
        path.push(col);
    }
    let step = 0;
    function animateDrop() {
        renderPlinkoBoard(path.slice(0, step + 1));
        step++;
        if (step < path.length)
            setTimeout(animateDrop, 140);
        else {
            const prize = PLINKO_PRIZES[path[path.length - 1]];
            let resDiv = document.getElementById('plinko-result');
            if (prize > 0) {
                const winnings = prize * betAmt;
                balance += winnings;
                updateBalance();
                resDiv.textContent = `🎊 Ball landed on $${prize}. You win $${winnings}!`;
            } else {
                resDiv.textContent = `💀 Ball landed on a skull. You lost your bet.`;
            }
        }
    }
    animateDrop();
}

// Initial setup
window.onload = () => {
    updateBalance();
    renderPlinkoBoard();
};
