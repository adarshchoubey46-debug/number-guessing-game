// ---------------- GLOBAL STATE ----------------
let highestScore = 0;
let highestScorer = "None";
let winStreak = 0;

let playerCount = 0;
let players = [];
let secret = [];
let usedLife = [];
let history = [];

let maxNum = 100;
let attempts = 10;
let remainingAttempts = 0;
let currentPlayer = 0;
let gameStarted = false;


// ---------------- ELEMENTS ----------------
const playerCountInput = document.getElementById("playerCount");
const createPlayersBtn = document.getElementById("createPlayersBtn");
const playerNamesDiv = document.getElementById("playerNames");

const startGameBtn = document.getElementById("startGameBtn");
const gameArea = document.getElementById("gameArea");

const guessInput = document.getElementById("guessInput");
const guessBtn = document.getElementById("guessBtn");
const hintBtn = document.getElementById("hintBtn");
const lifeBtn = document.getElementById("lifeBtn");

const feedback = document.getElementById("feedback");
const attemptsLeft = document.getElementById("attemptsLeft");
const playerTurn = document.getElementById("playerTurn");

const lifeOptions = document.getElementById("lifeOptions");
const historyBox = document.getElementById("historyBox");
const historyList = document.getElementById("historyList");

const highestScoreBox = document.getElementById("highestScore");
const streakBox = document.getElementById("streak");


// ---------------- PLAYER SETUP ----------------
createPlayersBtn.onclick = () => {
    playerCount = parseInt(playerCountInput.value);

    if (isNaN(playerCount) || playerCount < 1 || playerCount > 5) {
        alert("Enter a number between 1 and 5!");
        return;
    }

    playerNamesDiv.innerHTML = "";

    for (let i = 0; i < playerCount; i++) {
        playerNamesDiv.innerHTML += `
            <input type="text" id="player${i}" placeholder="Player ${i + 1} Name">
        `;
    }
};


// ---------------- START GAME ----------------
startGameBtn.onclick = () => {

    // Read names
    players = [];
    for (let i = 0; i < playerCount; i++) {
        const name = document.getElementById(`player${i}`).value.trim();
        if (!name) return alert("Enter all player names!");

        players.push(name);
    }

    // Difficulty
    const level = document.querySelector("input[name='level']:checked");
    if (!level) return alert("Choose a difficulty!");

    if (level.value === "easy") { maxNum = 100; attempts = 10; }
    if (level.value === "medium") { maxNum = 70; attempts = 5; }
    if (level.value === "hard") { maxNum = 30; attempts = 3; }

    // Initialize secret numbers
    secret = [];
    for (let i = 0; i < playerCount; i++)
        secret.push(Math.floor(Math.random() * maxNum) + 1);

    usedLife = Array(playerCount).fill(false);
    history = Array(playerCount).fill(0).map(() => []);

    remainingAttempts = attempts;
    currentPlayer = 0;
    gameStarted = true;

    updateUI();

    gameArea.style.display = "block";
    historyBox.style.display = "block";
};


// ---------------- GAME LOGIC ----------------
guessBtn.onclick = () => {
    if (!gameStarted) return;

    let input = guessInput.value.trim();
    guessInput.value = "";

    // Keywords
    if (input === "0") return doHint();
    if (input.toLowerCase() === "life") return showLifeOptions();

    let guess = parseInt(input);
    if (isNaN(guess)) {
        feedback.textContent = "Invalid guess!";
        return;
    }

    const p = currentPlayer;

    history[p].push(guess);

    // Compare
    if (guess === secret[p]) {
        handleWinner(p);
        return;
    }

    feedback.textContent = guess < secret[p] ? "⬆ HIGHER!" : "⬇ LOWER!";

    nextTurn();
};


hintBtn.onclick = () => {
    if (!gameStarted) return;
    doHint();
};


lifeBtn.onclick = () => {
    if (!gameStarted) return;
    showLifeOptions();
};


// ---------------- HINT SYSTEM ----------------
function doHint() {
    const p = currentPlayer;
    remainingAttempts--;

    let text = `🔍 HINT for ${players[p]}:\n`;
    text += `• Number is ${secret[p] % 2 === 0 ? "EVEN" : "ODD"}\n`;

    if (history[p].length > 0) {
        const last = history[p][history[p].length - 1];
        text += Math.abs(secret[p] - last) <= 10 ?
            "• VERY CLOSE to last guess!\n" :
            "• FAR from last guess.\n";
    }

    let div = [];
    if (secret[p] % 5 === 0) div.push("5");
    if (secret[p] % 3 === 0) div.push("3");
    if (secret[p] % 2 === 0) div.push("2");

    text += `• Divisible by: ${div.join(" ")}`;

    feedback.innerText = text;

    nextTurn();
}


// ---------------- LIFELINES ----------------
function showLifeOptions() {
    const p = currentPlayer;

    if (usedLife[p]) {
        feedback.textContent = "❌ Lifeline already used!";
        return;
    }

    lifeOptions.style.display = "block";
}

lifeOptions.onclick = (e) => {
    if (!e.target.dataset.life) return;

    const p = currentPlayer;
    const type = e.target.dataset.life;

    usedLife[p] = true;

    if (type === "range") {
        feedback.textContent =
            `🔎 50-50 Range: Between ${Math.max(secret[p] - 20, 1)} and ${Math.min(secret[p] + 20, maxNum)}`;
    }

    if (type === "tens") {
        feedback.textContent = `🔢 Tens digit: ${Math.floor(secret[p] / 10)}`;
    }

    if (type === "extra") {
        remainingAttempts++;
        feedback.textContent = `💙 Extra attempt added! Total: ${remainingAttempts}`;
    }

    lifeOptions.style.display = "none";
};


// ---------------- TURN SYSTEM ----------------
function nextTurn() {
    currentPlayer++;

    if (currentPlayer >= playerCount) {
        currentPlayer = 0;
        remainingAttempts--;
    }

    if (remainingAttempts <= 0) return handleNoWinner();

    updateUI();
}


// ---------------- UI UPDATE ----------------
function updateUI() {
    playerTurn.textContent = `${players[currentPlayer]}'s Turn`;
    attemptsLeft.textContent = `Attempts Left: ${remainingAttempts}`;

    // DO NOT ERASE feedback (fix for HIGHER/LOWER issue)

    // Update guess history
    let html = "";
    for (let i = 0; i < playerCount; i++) {
        html += `<p><strong>${players[i]}:</strong> ${history[i].join(", ")}</p>`;
    }
    historyList.innerHTML = html;
}


// ---------------- WINNER ----------------
function handleWinner(p) {
    gameStarted = false;

    let score = remainingAttempts + 1;

    // Streak bonus only for player 1
    if (p === 0) {
        score += winStreak;
        winStreak++;
        feedback.innerHTML = `🎉 WINNER: ${players[p]} 🎉<br>🔥 Streak Bonus +${winStreak - 1}<br>Score: ${score}`;
    } else {
        feedback.innerHTML = `🎉 WINNER: ${players[p]} 🎉<br>Score: ${score}`;
    }

    // Update highest score
    if (score > highestScore) {
        highestScore = score;
        highestScorer = players[p];
        feedback.innerHTML += `<br>🏆 NEW HIGHEST SCORE!`;
    }

    highestScoreBox.textContent = highestScore;
    streakBox.textContent = winStreak;

    setTimeout(() => {
        if (confirm("Play again?")) location.reload();
    }, 1500);
}


// ---------------- NO WINNER ----------------
function handleNoWinner() {
    gameStarted = false;

    let msg = "😢 No one guessed the numbers:\n\n";
    for (let i = 0; i < playerCount; i++) {
        msg += `${players[i]} → ${secret[i]}\n`;
    }

    alert(msg);

    winStreak = 0;
    streakBox.textContent = 0;

    setTimeout(() => {
        if (confirm("Play again?")) location.reload();
    }, 500);
}
