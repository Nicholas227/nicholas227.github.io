const possibleWords = ['cider', 'apple', 'apply'];
let currentPossible = [...possibleWords];
let guesses = [];
let currentGuess = '';
let currentRow = 0;

const board = document.getElementById('board');
const keyboard = document.getElementById('keyboard');
const message = document.getElementById('message');

// Create board
for (let i = 0; i < 6; i++) {
    const row = document.createElement('div');
    row.className = 'row';
    for (let j = 0; j < 5; j++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        row.appendChild(tile);
    }
    board.appendChild(row);
}

// Create keyboard
const keys = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
];

keys.forEach(row => {
    const keyboardRow = document.createElement('div');
    keyboardRow.className = 'keyboard-row';
    row.forEach(key => {
        const keyElement = document.createElement('div');
        keyElement.className = 'key';
        if (key === 'ENTER' || key === 'BACKSPACE') {
            keyElement.classList.add('wide');
        }
        keyElement.textContent = key;
        keyElement.addEventListener('click', () => handleInput(key));
        keyboardRow.appendChild(keyElement);
    });
    keyboard.appendChild(keyboardRow);
});

// Handle input
function handleInput(key) {
    if (key === 'ENTER') {
        submitGuess();
    } else if (key === 'BACKSPACE') {
        currentGuess = currentGuess.slice(0, -1);
        updateBoard();
    } else if (key.match(/^[A-Z]$/) && currentGuess.length < 5) {
        currentGuess += key.toLowerCase();
        updateBoard();
    }
}

function handleKeyDown(e) {
    if (e.key === 'Enter') {
        handleInput('ENTER');
    } else if (e.key === 'Backspace') {
        handleInput('BACKSPACE');
    } else if (e.key.match(/^[a-zA-Z]$/) && currentGuess.length < 5) {
        handleInput(e.key.toUpperCase());
    }
}

document.addEventListener('keydown', handleKeyDown);

function updateBoard() {
    const row = board.children[currentRow];
    for (let i = 0; i < 5; i++) {
        const tile = row.children[i];
        tile.textContent = currentGuess[i] || '';
        tile.className = 'tile';
        if (currentGuess[i]) {
            tile.classList.add('filled');
        }
    }
}

function submitGuess() {
    if (currentGuess.length !== 5) {
        message.textContent = 'Guess must be 5 letters';
        return;
    }
    if (guesses.includes(currentGuess)) {
        message.textContent = 'Already guessed that word';
        return;
    }
    guesses.push(currentGuess);

    // Calculate evil feedback
    const feedback = getEvilFeedback(currentGuess);
    displayFeedback(feedback);
    updateKeyboard(currentGuess, feedback);

    if (feedback.every(c => c === 'green')) {
        message.textContent = 'You win! The word was one of the possibilities.';
        document.removeEventListener('keydown', handleKeyDown);
        return;
    }

    currentRow++;
    currentGuess = '';
    if (currentRow === 6) {
        message.textContent = 'Game over. Possible words: ' + currentPossible.join(', ');
        document.removeEventListener('keydown', handleKeyDown);
    }
}

function getFeedback(guess, target) {
    let feedback = new Array(5).fill(null);
    let targetLetters = target.split('');
    let guessLetters = guess.split('');

    // Mark greens
    for (let i = 0; i < 5; i++) {
        if (guessLetters[i] === targetLetters[i]) {
            feedback[i] = 'green';
            targetLetters[i] = null;
        }
    }

    // Mark yellows and grays
    for (let i = 0; i < 5; i++) {
        if (feedback[i] === null) {
            const index = targetLetters.indexOf(guessLetters[i]);
            if (index !== -1) {
                feedback[i] = 'yellow';
                targetLetters[index] = null;
            } else {
                feedback[i] = 'gray';
            }
        }
    }

    return feedback;
}

function getEvilFeedback(guess) {
    if (currentPossible.length === 0) return new Array(5).fill('gray');

    // Get all possible feedbacks
    const feedbacks = currentPossible.map(word => getFeedback(guess, word));

    // Count occurrences of each feedback
    const feedbackMap = {};
    feedbacks.forEach(fb => {
        const key = fb.join(',');
        if (!feedbackMap[key]) {
            feedbackMap[key] = { fb, count: 0 };
        }
        feedbackMap[key].count++;
    });

    // Find the feedback with the highest count, but prefer non-winning feedbacks
    let lowCount = Infinity;
    let bestFb = null;
    for (const key in feedbackMap) {
        const fb = feedbackMap[key].fb;
        const count = feedbackMap[key].count;
        const isWinning = fb.every(c => c === 'green');
        if (!isWinning && count < lowCount) {
            lowCount = count;
            bestFb = fb;
        }
    }
    // If no non-winning feedback, fall back to any
    if (!bestFb) {
        for (const key in feedbackMap) {
            const count = feedbackMap[key].count;
            if (count > maxCount) {
                maxCount = count;
                bestFb = feedbackMap[key].fb;
            }
        }
    }

    // Filter possible words
    currentPossible = currentPossible.filter(word => {
        const fb = getFeedback(guess, word);
        return fb.every((c, i) => c === bestFb[i]);
    });

    return bestFb;
}

function displayFeedback(feedback) {
    const row = board.children[currentRow];
    for (let i = 0; i < 5; i++) {
        const tile = row.children[i];
        tile.classList.add(feedback[i]);
    }
}

function updateKeyboard(guess, feedback) {
    for (let i = 0; i < 5; i++) {
        const letter = guess[i].toUpperCase();
        const color = feedback[i];
        const keyElement = Array.from(document.querySelectorAll('.key')).find(key => key.textContent === letter);
        if (keyElement) {
            const currentColor = keyElement.classList.contains('green') ? 'green' : keyElement.classList.contains('yellow') ? 'yellow' : 'gray';
            if (color === 'green' || (color === 'yellow' && currentColor !== 'green') || (color === 'gray' && currentColor === 'gray')) {
                keyElement.className = 'key ' + color;
            }
        }
    }
}