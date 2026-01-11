// Toast Notification Function
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// Game State
const gameState = {
    board: Array(9).fill(null),
    currentPlayer: 'X',
    gameMode: null,
    difficulty: null,
    p1Name: 'Player 1',
    p2Name: 'Player 2',
    isGameOver: false,
    stats: JSON.parse(localStorage.getItem('ttt_stats')) || {
        totalGames: 0,
        computerGames: 0,
        twoPlayerGames: 0,
        computerWins: 0,
        computerLoses: 0,
        computerDraws: 0
    },
    scores: { p1: 0, p2: 0 },
    musicEnabled: localStorage.getItem('ttt_music') !== 'false',
    volume: parseInt(localStorage.getItem('ttt_volume')) || 50,
    fromGame: false
};

const winCombos = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

// Initialize
window.addEventListener('load', () => {
    showIntro();
    initMusic();
    setupMusicToggle();
    setupVolumeControl();
    
    document.body.addEventListener('click', () => {
        if (gameState.musicEnabled) {
            playMusic();
        }
    }, { once: true });
});

// Intro Animation
function showIntro() {
    const intro = document.getElementById('introScreen');
    intro.classList.remove('hidden');
    
    setTimeout(() => {
        intro.classList.add('fade-out');
        setTimeout(() => {
            intro.classList.add('hidden');
            showMenu();
        }, 800);
    }, 3000);
}

// Volume Control
function setupVolumeControl() {
    const slider = document.getElementById('volumeSlider');
    const percent = document.getElementById('volumePercent');
    
    slider.value = gameState.volume;
    percent.textContent = gameState.volume + '%';
    
    slider.addEventListener('input', (e) => {
        gameState.volume = parseInt(e.target.value);
        percent.textContent = gameState.volume + '%';
        localStorage.setItem('ttt_volume', gameState.volume);
        updateVolume();
    });
}

function updateVolume() {
    const audio = document.getElementById('bgMusic');
    if (audio) {
        audio.volume = gameState.volume / 100;
    }
}

// Music
function setupMusicToggle() {
    const toggle = document.getElementById('musicToggle');
    if (toggle) {
        toggle.addEventListener('click', toggleMusic);
        if (gameState.musicEnabled) {
            toggle.parentElement.classList.add('active');
        }
    }
}

function initMusic() {
    updateVolume();
    if (gameState.musicEnabled) {
        playMusic();
    }
}

function toggleMusic() {
    gameState.musicEnabled = !gameState.musicEnabled;
    localStorage.setItem('ttt_music', gameState.musicEnabled);
    const toggle = document.getElementById('musicToggle');
    if (gameState.musicEnabled) {
        toggle.parentElement.classList.add('active');
        playMusic();
    } else {
        toggle.parentElement.classList.remove('active');
        pauseMusic();
    }
}

function playMusic() {
    const audio = document.getElementById('bgMusic');
    if (audio && gameState.musicEnabled) {
        audio.play().catch(e => console.log('Audio play failed:', e));
    }
}

function pauseMusic() {
    const audio = document.getElementById('bgMusic');
    if (audio) audio.pause();
}

// Navigation
function showMenu() {
    hideAll();
    gameState.fromGame = false;
    
    document.getElementById('p1Input').value = '';
    document.getElementById('p2Input').value = '';
    
    document.getElementById('menuScreen').classList.remove('hidden');
}

function showDifficultySelection() {
    hideAll();
    document.getElementById('difficultyScreen').classList.remove('hidden');
}

function showNameInput() {
    hideAll();
    document.getElementById('p1Input').value = '';
    document.getElementById('p2Input').value = '';
    document.getElementById('nameInputScreen').classList.remove('hidden');
}

function showSettings() {
    hideAll();
    gameState.fromGame = false;
    document.getElementById('settingsScreen').classList.remove('hidden');
}

function showSettingsFromGame() {
    gameState.fromGame = true;
    hideAll();
    document.getElementById('settingsScreen').classList.remove('hidden');
}

function backFromSettings() {
    if (gameState.fromGame) {
        backToGame();
    } else {
        showMenu();
    }
}

function backToGame() {
    hideAll();
    document.getElementById('gameScreen').classList.remove('hidden');
}

function showStatsFromSettings() {
    hideAll();
    showStats();
}

function showAbout() {
    hideAll();
    document.getElementById('aboutScreen').classList.remove('hidden');
}

function hideAll() {
    document.querySelectorAll('.menu-screen, .name-input-screen, .game-screen, .stats-screen, .settings-screen, .about-screen')
        .forEach(s => s.classList.add('hidden'));
}

// Turn Display Update
function updateTurnDisplay() {
    if (gameState.isGameOver) return;
    
    const turnText = document.getElementById('turnText');
    const turnSymbol = document.getElementById('turnSymbol');
    const turnDisplay = document.getElementById('turnDisplay');
    
    const currentName = gameState.currentPlayer === 'X' ? gameState.p1Name : gameState.p2Name;
    turnText.textContent = currentName + "'s Turn";
    turnSymbol.textContent = gameState.currentPlayer === 'X' ? '✕' : '◯';
    turnSymbol.style.color = gameState.currentPlayer === 'X' ? '#ff6b9d' : '#00d9ff';
    
    turnDisplay.style.animation = 'none';
    setTimeout(() => {
        turnDisplay.style.animation = 'turnPulse 0.5s ease';
    }, 10);
}

// Game Functions
function startGame(mode, diff = null) {
    gameState.gameMode = mode;
    gameState.difficulty = diff;
    gameState.scores = { p1: 0, p2: 0 };

    if (mode === 'computer') {
        gameState.p1Name = 'You';
        gameState.p2Name = 'Computer';
    } else {
        gameState.p1Name = document.getElementById('p1Input').value.trim() || 'Player 1';
        gameState.p2Name = document.getElementById('p2Input').value.trim() || 'Player 2';
    }

    document.getElementById('p1NameDisplay').textContent = gameState.p1Name;
    document.getElementById('p2NameDisplay').textContent = gameState.p2Name;

    resetGame();
    updateScoreDisplay();
    hideAll();
    document.getElementById('gameScreen').classList.remove('hidden');
    updateTurnDisplay();
}

function resetGame() {
    gameState.board = Array(9).fill(null);
    gameState.currentPlayer = 'X';
    gameState.isGameOver = false;
    renderBoard();
    updateTurnDisplay();
}

function renderBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';

    gameState.board.forEach((cell, i) => {
        const div = document.createElement('div');
        div.className = `cell ${cell ? 'taken ' + cell : ''}`;
        div.textContent = cell || '';
        div.onclick = () => handleMove(i);
        boardEl.appendChild(div);
    });
}

function handleMove(i) {
    if (gameState.isGameOver || gameState.board[i]) return;

    gameState.board[i] = gameState.currentPlayer;
    renderBoard();

    const winner = checkWin(gameState.board, gameState.currentPlayer);
    if (winner) {
        endGame(gameState.currentPlayer, winner.combo);
    } else if (gameState.board.every(b => b)) {
        endGame('draw');
    } else {
        gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
        updateTurnDisplay();
        if (gameState.gameMode === 'computer' && gameState.currentPlayer === 'O') {
            setTimeout(computerMove, 800);
        }
    }
}

function checkWin(board, player) {
    for (let combo of winCombos) {
        if (combo.every(idx => board[idx] === player)) {
            return { combo };
        }
    }
    return null;
}

function computerMove() {
    let move;
    
    if (gameState.difficulty === 'easy') {
        // Easy: Random move
        const avail = gameState.board
            .map((v, i) => v === null ? i : null)
            .filter(v => v !== null);
        move = avail[Math.floor(Math.random() * avail.length)];
    } else if (gameState.difficulty === 'medium') {
        // Medium: 50% chance of best move, 50% random
        if (Math.random() < 0.5) {
            move = getBestMove();
        } else {
            const avail = gameState.board
                .map((v, i) => v === null ? i : null)
                .filter(v => v !== null);
            move = avail[Math.floor(Math.random() * avail.length)];
        }
    } else {
        // Hard: Always best move using minimax
        move = getBestMove();
    }
    
    handleMove(move);
}

function getBestMove() {
    let bestScore = -Infinity;
    let move = 0;
    
    for (let i = 0; i < 9; i++) {
        if (gameState.board[i] === null) {
            gameState.board[i] = 'O';
            let score = minimax(gameState.board, 0, false);
            gameState.board[i] = null;
            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        }
    }
    
    return move;
}

function minimax(board, depth, isMaximizing) {
    const winner = checkWin(board, 'O');
    const loser = checkWin(board, 'X');
    
    if (winner) return 10 - depth;
    if (loser) return depth - 10;
    if (board.every(b => b !== null)) return 0;
    
    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === null) {
                board[i] = 'O';
                let score = minimax(board, depth + 1, false);
                board[i] = null;
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === null) {
                board[i] = 'X';
                let score = minimax(board, depth + 1, true);
                board[i] = null;
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

function endGame(result, winCombo = null) {
    gameState.isGameOver = true;
    gameState.stats.totalGames++;

    // Track game mode
    if (gameState.gameMode === 'computer') {
        gameState.stats.computerGames++;
        
        if (result === 'draw') {
            gameState.stats.computerDraws++;
        } else if (result === 'X') {
            // Player wins against computer
            gameState.stats.computerWins++;
            gameState.scores.p1++;
        } else {
            // Computer wins (player loses)
            gameState.stats.computerLoses++;
            gameState.scores.p2++;
        }
    } else if (gameState.gameMode === 'twoPlayer') {
        gameState.stats.twoPlayerGames++;
        
        if (result === 'X') {
            gameState.scores.p1++;
        } else if (result === 'O') {
            gameState.scores.p2++;
        }
    }

    if (result === 'draw') {
        showWinModal('Draw!', '🤝');
    } else {
        const winnerName = result === 'X' ? gameState.p1Name : gameState.p2Name;
        const symbol = result === 'X' ? '✕' : '◯';
        const color = result === 'X' ? '#ff6b9d' : '#00d9ff';
        showWinModal(winnerName, symbol, color);
    }

    updateScoreDisplay();
    localStorage.setItem('ttt_stats', JSON.stringify(gameState.stats));
}

function showWinModal(text, symbol, color = '#00d9ff') {
    const modal = document.getElementById('winModal');
    const symbolEl = document.getElementById('winnerSymbol');
    const textEl = document.getElementById('winnerText');
    
    symbolEl.textContent = symbol;
    symbolEl.style.color = color;
    textEl.textContent = text;
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('winModal').classList.add('hidden');
    resetGame();
}

function goHomeFromModal() {
    document.getElementById('winModal').classList.add('hidden');
    showMenu();
}

function updateScoreDisplay() {
    document.getElementById('p1Score').textContent = gameState.scores.p1;
    document.getElementById('p2Score').textContent = gameState.scores.p2;
}

function showStats() {
    hideAll();
    const s = gameState.stats;
    
    // Calculate computer win percentage
    // Win rate = Wins / (Wins + Loses) * 100
    const totalComputerGamesPlayed = s.computerWins + s.computerLoses;
    const computerWinPercentage = totalComputerGamesPlayed > 0 
        ? ((s.computerWins / totalComputerGamesPlayed) * 100).toFixed(1) 
        : 'Null';
    
    // Helper function to display stat or "Null"
    const displayStat = (value) => value > 0 ? value : 'Null';
    
    document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card">
            <h3>Total Games Played</h3>
            <p>${displayStat(s.totalGames)}</p>
        </div>
        <div class="stat-card">
            <h3>Played With Computer</h3>
            <p>${displayStat(s.computerGames)}</p>
        </div>
        <div class="stat-card">
            <h3>2 Player Mode</h3>
            <p>${displayStat(s.twoPlayerGames)}</p>
        </div>
        <div class="stat-card">
            <h3>Wins vs Computer</h3>
            <p>${displayStat(s.computerWins)}</p>
        </div>
        <div class="stat-card">
            <h3>Losses vs Computer</h3>
            <p>${displayStat(s.computerLoses)}</p>
        </div>
        <div class="stat-card">
            <h3>Draws vs Computer</h3>
            <p>${displayStat(s.computerDraws)}</p>
        </div>
        <div class="stat-card stat-card-wide">
            <h3>Win Rate vs Computer</h3>
            <p>${computerWinPercentage}${typeof computerWinPercentage === 'number' || computerWinPercentage !== 'Null' ? '%' : ''}</p>
        </div>
    `;
    document.getElementById('statsScreen').classList.remove('hidden');
}

function resetStats() {
    const confirmReset = confirm("Are you sure you want to reset all statistics? This action cannot be undone.");
    
    if (confirmReset) {
        gameState.stats = { 
            totalGames: 0,
            computerGames: 0,
            twoPlayerGames: 0,
            computerWins: 0,
            computerLoses: 0,
            computerDraws: 0
        };
        localStorage.setItem('ttt_stats', JSON.stringify(gameState.stats));
        showStats();
        showToast('✅ Statistics reset successfully!', 'success');
    }
}