let score = 0;
let currentAnswer = null;
let gameOver = false;
let lastResult = null;

function randomBool(){ return Math.random() < 0.5 }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)] }

function generateExpression(){
  const difficulty = Math.min(score, 5)
  let expr, result;

  if(difficulty<2){
    const A=randomBool(), B=randomBool(), op=pick(["AND","OR"]);
    result = op==="AND"? A&&B : A||B;
    expr = `${A} ${op} ${B}`;
  } else if(difficulty<4){
    const type = pick(["NOT","XOR"]);
    if(type==="NOT"){ const A=randomBool(); result=!A; expr=`NOT ${A}` }
    else{ const A=randomBool(), B=randomBool(); result=A!==B; expr=`${A} XOR ${B}` }
  } else {
    const A=randomBool(), B=randomBool(), prev=lastResult??randomBool(), type=pick(["PREV_AND_A","NOT_PREV_OR_B"]);
    if(type==="PREV_AND_A"){ result=prev&&A; expr=`PREV AND ${A}` }
    else{ result=!(prev||B); expr=`NOT (PREV OR ${B})` }
  }

  currentAnswer=result;
  lastResult=result;
  return expr;
}

function nextRound(){
  if(gameOver) return
  const exprEl = document.getElementById("expression");
  exprEl.classList.remove("show");
  setTimeout(()=>{
    exprEl.innerText=generateExpression();
    if(score<2) exprEl.style.color="#3b82f6";
    else if(score<4) exprEl.style.color="#facc15";
    else exprEl.style.color="#ef4444";
    exprEl.classList.add("show");
  }, 200);
  document.getElementById("status").innerText="";
}

function flashButton(btn, correct){
  btn.classList.add(correct?"correct":"wrong");
  setTimeout(()=>btn.classList.remove("correct","wrong"),300);
}

function answer(value, btn){
  if(gameOver) return
  const correct=value===currentAnswer;
  flashButton(btn,correct);

  if(correct){
    score++;
    const scoreEl=document.getElementById("score");
    scoreEl.innerText="Score: "+score;
    scoreEl.classList.add("up");
    setTimeout(()=>scoreEl.classList.remove("up"),200);
    nextRound();
  } else endGame();
}

function endGame() {
  gameOver = true;
  const statusEl = document.getElementById("status");
  statusEl.innerText = "❌ Game Over. Final score: " + score;
  statusEl.classList.add("shake");
  setTimeout(() => statusEl.classList.remove("shake"), 300);

  // Сохраняем счет в блокчейн, если кошелек подключен и подтвержден
  if (typeof window.saveScoreOnChain === 'function' && typeof window.isWalletVerified === 'function') {
    setTimeout(async () => {
      if (window.isWalletVerified()) {
        const shouldSave = confirm(
          `🎮 Game Over!\n\nYour score: ${score}\n\n` +
          `Save this score to the blockchain?`
        );
        
        if (shouldSave) {
          const success = await window.saveScoreOnChain(score);
          if (success) {
            // Успешно сохранено
          }
        }
      } else {
        alert("Please verify your wallet first to save scores!");
      }
    }, 500);
  }
}

function restartGame(){
  score=0; gameOver=false; lastResult=null;
  document.getElementById("score").innerText="Score: 0";
  document.getElementById("status").innerText="";
  nextRound();
}

nextRound();

const infoBtn = document.getElementById("infoBtn");

infoBtn.addEventListener("click", () => {
  const message = `
🎮 Truth Table Game - Rules

- Your task: Decide if the expression is TRUE or FALSE.
- Operators:

  AND: True only if both operands are True
  OR: True if at least one operand is True
  XOR: True if operands are different
  NOT: Inverts the value (True → False, False → True)
  PREV: Refers to the result of the previous round
  PREV AND A: Logical AND of previous result and new random value A
  NOT (PREV OR B): Logical NOT of (previous result OR new random value B)

- Scoring: +1 for correct, game ends on wrong answer.

Good luck!
  `;
  alert(message);
});
