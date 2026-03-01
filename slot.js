const canvas = document.getElementById('slotCanvas');
const ctx = canvas.getContext('2d');
const btn = document.getElementById('spinBtn');
const resultDiv = document.getElementById('slot-result');
const symbols = ['🍒','🍋','🍊','🍎','🍉','⭐','💎'];
let reels = [0,0,0];
let isSpinning = false;

// Simple sound for win/lose
const winSound = new Audio("https://cdn.pixabay.com/audio/2022/10/16/audio_12b3fa3c25.mp3"); // Free short "win" sound
const spinSound = new Audio("https://cdn.pixabay.com/audio/2022/09/27/audio_12335db34f.mp3"); // Free short "spin" sound

function drawReels(vals, highlight=false) {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let i=0;i<3;i++) {
        ctx.save();
        ctx.font = '56px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = highlight ? '#fff98d' : '#fff';
        ctx.strokeStyle = highlight ? '#fffa57' : '#333';
        ctx.lineWidth = highlight ? 6 : 4;
        ctx.beginPath();
        ctx.roundRect(40+i*105,23,70,74,15);
        ctx.stroke();
        ctx.fillText(symbols[vals[i]], 75+i*105, 60);
        ctx.restore();
    }
}
drawReels([0,1,2]);

btn.onclick = function() {
    if(isSpinning) return;
    isSpinning = true;
    resultDiv.textContent = "";
    spinSound.play();
    let frames = 0;
    let val1 = Math.floor(Math.random()*symbols.length);
    let val2 = Math.floor(Math.random()*symbols.length);
    let val3 = Math.floor(Math.random()*symbols.length);
    function spinAnim() {
        frames++;
        if(frames<18) {
            drawReels([
                Math.floor(Math.random()*symbols.length),
                Math.floor(Math.random()*symbols.length),
                Math.floor(Math.random()*symbols.length)
            ]);
            setTimeout(spinAnim,32);
        } else {
            reels = [val1, val2, val3];
            let resSyms = [val1, val2, val3].map(i=>symbols[i]);
            drawReels([val1,val2,val3], resSyms.every((v,i,a)=>v===a[0]));
            // Win logic
            let result = '';
            if(resSyms.every((v,i,a)=>v===a[0])) {
                winSound.play();
                result = "🎉 JACKPOT! All matched!";
            } else if(resSyms.filter(s=>s==="⭐").length >=2) {
                winSound.play();
                result = "✨ 2+ Stars! Bonus!";
            } else {
                result = "No win, try again!";
            }
            setTimeout(()=>{ resultDiv.textContent = result; },240);
            isSpinning = false;
        }
    }
    spinAnim();
};
