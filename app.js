let balance = 100;
function updateBalance() {
  document.getElementById('balance').textContent = balance.toFixed(2);
}
function getBet() {
  let bet = Number(document.getElementById('bet-amount').value);
  if(isNaN(bet) || bet<1) bet = 1;
  return bet;
}
function resetBalance() {
  balance = 100; updateBalance();
  document.getElementById('game-section').innerHTML='';
}

// Main game loader & UI setup
function showGame(type) {
  const section = document.getElementById('game-section');
  section.innerHTML = "";
  if(type==="slot") {
      section.innerHTML = `
          <h4>Slot Machine</h4>
          <div class="slot-reels">
              <div class="slot-reel" id="reel1">🍒</div>
              <div class="slot-reel" id="reel2">🍋</div>
              <div class="slot-reel" id="reel3">🍊</div>
          </div>
          <button id="slot-spin-btn">Spin</button>
          <div id="slot-result" style="text-align:center;min-height:1.5em;"></div>
      `;
      document.getElementById('slot-spin-btn').onclick = playSlotUI;
  } else if(type==="dice") {
      section.innerHTML = `
          <h4>Dice Game</h4>
          <div class="dice-face" id="dice-face"></div>
          <button id="dice-roll-btn">Roll Dice</button>
          <div id="dice-result" style="text-align:center;min-height:1.4em;"></div>
      `;
      renderDiceFace(1);
      document.getElementById('dice-roll-btn').onclick=playDiceUI;
  } else if(type==="plinko") {
      section.innerHTML=`
          <h4>Plinko</h4>
          <div id="plinko-board-container"></div>
          <button id="plinko-drop-btn">Drop Ball</button>
          <div id="plinko-result"></div>
      `;
      renderPlinkoBoard(null);
      document.getElementById('plinko-drop-btn').onclick=playPlinkoUI;
  } else if(type==="roulette") {
    section.innerHTML = `
      <h4>Roulette</h4>
      <div id="roulette-bets-row">Pick number(s) and/or a color:</div>
      <div id="roulette-board" class="roulette-board"></div>
      <div class="roulette-bets">
        <button class="roulette-color red" id="bet-red">Red</button>
        <button class="roulette-color black" id="bet-black">Black</button>
      </div>
      <button id="roulette-spin-btn">Spin!</button>
      <div id="roulette-result" style="min-height:1.6em;"></div>
    `;
    renderRouletteBoard();
    // Betting state
    window.rouletteBets = {
      numbers: new Set(),
      colors: new Set()
    };
    // Number bet handling
    document.querySelectorAll('.roulette-num-btn').forEach(btn => {
      btn.onclick = (e) => {
        const n = parseInt(btn.dataset.no);
        if(window.rouletteBets.numbers.has(n)) {
          window.rouletteBets.numbers.delete(n);
          btn.classList.remove('roulette-bet');
        } else {
          window.rouletteBets.numbers.add(n);
          btn.classList.add('roulette-bet');
        }
      };
    });
    // Color bets
    document.getElementById('bet-red').onclick = ()=>{
      const btn = document.getElementById('bet-red');
      if(window.rouletteBets.colors.has('red')) {
        window.rouletteBets.colors.delete('red');
        btn.classList.remove('roulette-bet');
      } else {
        window.rouletteBets.colors.add('red');
        btn.classList.add('roulette-bet');
      }
    }
    document.getElementById('bet-black').onclick = ()=>{
      const btn = document.getElementById('bet-black');
      if(window.rouletteBets.colors.has('black')) {
        window.rouletteBets.colors.delete('black');
        btn.classList.remove('roulette-bet');
      } else {
        window.rouletteBets.colors.add('black');
        btn.classList.add('roulette-bet');
      }
    }
    document.getElementById('roulette-spin-btn').onclick = playRouletteUI;
  }
}

// Slot Machine Logic
const slotSymbols = ['🍒','🍋','🍊','🍎','🍉','⭐','💎'];
function playSlotUI() {
  const bet = getBet();
  if(bet > balance) { showResult('slot-result', "Insufficient balance."); return; }
  balance -= bet; updateBalance();
  let reelEls=[1,2,3].map(i=>document.getElementById('reel'+i));
  let resultDiv = document.getElementById('slot-result');
  let stops = [];
  for(let i=0;i<3;i++) stops[i]=Math.floor(Math.random()*slotSymbols.length);
  let frames=0, animTimes=[12,16,20];
  function animateReels() {
      for(let i=0;i<3;i++) {
          if(frames<animTimes[i]) {
           let idx=(frames+i)%slotSymbols.length;
           reelEls[i].textContent=slotSymbols[idx];
           reelEls[i].classList.add('slot-anim');
           setTimeout(()=>reelEls[i].classList.remove('slot-anim'),200);
          } else reelEls[i].textContent=slotSymbols[stops[i]];
      }
      frames++;
      if(frames<=Math.max(...animTimes)) setTimeout(animateReels,43);
      else{
       let resSyms = stops.map(i=>slotSymbols[i]);
       let starCount=resSyms.filter(s=>s==='⭐').length;
       if(resSyms.every((v,i,a)=>v===a[0])) {
           let win=bet*10; balance+=win; updateBalance();
           reelEls.forEach(re=>re.classList.add('jackpot'));
           resultDiv.textContent = `🎉 JACKPOT! All matched—win $${win}!`;
       } else if(starCount>=2) {
          let win=bet*3; balance+=win; updateBalance();
          resultDiv.textContent = `✨ 2+ Stars! Bonus $${win}!`;
          reelEls.forEach(re=>re.classList.remove('jackpot'));
       } else {
          resultDiv.textContent = "No win. Try again!";
          reelEls.forEach(re=>re.classList.remove('jackpot'));
       }
      }
  }
  animateReels();
}

// Dice logic (SVG)
function renderDiceFace(face) {
  const pips=[
      [], [[1,1]], [[0,0],[2,2]], [[0,0],[1,1],[2,2]], [[0,0],[0,2],[2,0],[2,2]],
      [[0,0],[0,2],[1,1],[2,0],[2,2]], [[0,0],[0,2],[1,0],[1,2],[2,0],[2,2]]
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
  const bet = getBet();
  if(bet > balance) { showResult('dice-result',"Insufficient balance."); return; }
  balance -= bet; updateBalance();
  let face=1,rollAnim=0;
  let resultDiv = document.getElementById('dice-result');
  function rollDiceAnim() {
    face = Math.floor(Math.random()*6)+1;
    renderDiceFace(face);
    rollAnim++;
    if(rollAnim<=12) setTimeout(rollDiceAnim,32);
    else {
      if(face===6) {
        let win=bet*5; balance+=win; updateBalance();
        resultDiv.textContent='🎉 You rolled 6! You win $'+win+'!';
      }
      else resultDiv.textContent="You rolled "+face+'.';
    }
  }
  rollDiceAnim();
}

// Plinko Logic
const PLINKO_COLUMNS=7, PLINKO_ROWS=8, PLINKO_PRIZES=[0,8,12,50,12,8,0];
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
  for (let i=0;i<PLINKO_PRIZES.length;i++) {
    let classN="plinko-prize-cell";
    if (PLINKO_PRIZES[i]===50) classN+=' jackpot';
    if (PLINKO_PRIZES[i]===0) classN+=' plinko-skull';
    html += `<div class="${classN}">${PLINKO_PRIZES[i]>0?('$'+PLINKO_PRIZES[i]):'💀'}</div>`;
  }
  html += "</div>";
  container.innerHTML = html;
}
function playPlinkoUI() {
  let bet = getBet();
  if(bet > balance) { showResult('plinko-result',"Insufficient balance."); return;}
  balance -= bet; updateBalance();
  document.getElementById('plinko-result').textContent="";
  let col=Math.floor(PLINKO_COLUMNS/2);
  let path=[col];
  for(let r=1;r<PLINKO_ROWS;r++) {
    const direction = Math.random()<0.45?-1:(Math.random()<0.55?1:0);
    col+=direction;
    col=Math.max(0,Math.min(PLINKO_COLUMNS-1,col));
    path.push(col);
  }
  let step=0;
  function animateDrop() {
    renderPlinkoBoard(path.slice(0, step + 1));
    step++;
    if(step<path.length) setTimeout(animateDrop,140);
    else {
      const prize=PLINKO_PRIZES[path[path.length-1]];
      let resDiv=document.getElementById('plinko-result');
      if(prize>0) {
        let winnings=prize*bet; balance+=winnings; updateBalance();
        resDiv.textContent = `🎊 Ball landed on $${prize}. You win $${winnings}!`;
      } else resDiv.textContent="💀 Ball landed on a skull. You lost your bet.";
    }
  }
  animateDrop();
}
function showResult(id,text) { document.getElementById(id).textContent=text; }

// --------- ROULETTE FUNCTIONS ---------
function renderRouletteBoard() {
  const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
  let html = "";
  for(let r = 0; r < 12; r++) {
    html += `<div class="roulette-board-row">`;
    for(let c = 0; c < 3; c++) {
      let n = r*3+c+1;
      let color = redNumbers.includes(n) ? 'red' : 'black';
      html += `<button class="roulette-num-btn ${color}" id="roulette-btn-${n}" data-no="${n}">${n}</button>`;
    }
    html += `</div>`;
  }
  document.getElementById('roulette-board').innerHTML = html;
}
function playRouletteUI() {
  const numbers = [...Array(36).keys()].map(i=>i+1);
  const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
  const blackNumbers = numbers.filter(n=>!redNumbers.includes(n));
  let bets = window.rouletteBets;
  const betAmt = getBet();
  if ((!bets.numbers.size && !bets.colors.size) || betAmt > balance) {
    showResult('roulette-result', betAmt > balance ? 'Insufficient balance.' : "Place at least one bet.");
    return;
  }
  balance -= betAmt; updateBalance();

  // Pick random winning number
  let winning = numbers[Math.floor(Math.random()*36)];
  let highlightIdx = 0, rounds=3, totalSpins=36*rounds + numbers.indexOf(winning);

  // Animation loop
  function animateSpin() {
    let prevBtn = document.querySelector('.roulette-selected');
    if(prevBtn) prevBtn.classList.remove('roulette-selected');
    let btn = document.getElementById('roulette-btn-'+numbers[highlightIdx%36]);
    btn.classList.add('roulette-selected');
    highlightIdx++;
    let delay = 24+Math.min(38,highlightIdx*1.22); // slows down
    if(highlightIdx <= totalSpins) setTimeout(animateSpin, delay);
    else {
      // payout
      let color = redNumbers.includes(winning) ? 'red' : 'black';
      let winSum = 0, payoutMsg = [];
      // Number (35:1)
      bets.numbers.forEach(n=>{
        if(n === winning) {
          winSum += betAmt*36;
          payoutMsg.push(`🎯 Number ${n} hit! Win $${betAmt*36}`);
        }
      });
      // Color (2:1)
      bets.colors.forEach(col=>{
        if(col===color) {
          winSum += betAmt*2;
          payoutMsg.push(`🎲 ${col[0].toUpperCase()+col.slice(1)} wins! +$${betAmt*2}`);
        }
      });
      if(winSum) {
        balance += winSum; updateBalance();
        showResult('roulette-result', `<span style="color:#17e9e1">WIN!<br>${payoutMsg.join('<br>')}</span>`);
      } else {
        showResult('roulette-result', `Result: ${winning} (${color.toUpperCase()}) — no win, try again!`);
      }
      // reset bets for next round
      bets.numbers.clear();
      bets.colors.clear();
      document.querySelectorAll('.roulette-bet').forEach(el=>el.classList.remove('roulette-bet'));
    }
  }
  animateSpin();
}


// --- Load default state ---
window.onload = () => { updateBalance(); }
