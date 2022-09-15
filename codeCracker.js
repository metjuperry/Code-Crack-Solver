// Works on https://lovattspuzzles.com/online-puzzles-competitions/code-cracker/
// Need to focus on the game

function wordMatches(template, string, externalLetterTable = {}, excluded = []) {

    if (template.length !== string.length) return false;

    for (const excludedLetter of excluded) {
        if (string.includes(excludedLetter)) return false;
    }

    let seenNumbers = [];
    let seenLetters = [];
    let letterTable = {};

    for (const [key, value] of Object.entries(externalLetterTable)) {
        seenNumbers.push(key);
        seenLetters.push(value);

        letterTable[key] = value;

    }

    for (let index = 0; index < template.length; index++) {
        const code = template[index];
        const char = string[index];

        if (seenNumbers.includes(code) || seenLetters.includes(char)) {
            if (letterTable[code] !== char) return false;
        }

        letterTable[code] = char;
        seenNumbers.push(code);
        seenLetters.push(char);

    }

    return true;
}

function triggerMouseEvent (node) {
    var clickEvent = document.createEvent('MouseEvents');
    clickEvent.initEvent ("mousedown", true, true);
    node.dispatchEvent (clickEvent);
}

var letterTable = {}
var excluded = []

var rows = document.getElementsByClassName("grid-wrapper")[0].children

var parsedRows = [];

for (const key of document.getElementsByClassName("input-key isBlack")) {
    excluded.push(key.textContent.replaceAll("\n", "").trim().toLowerCase())
}

for (const row of rows) {

    let rowstring = []

    for (const col of row.children) {
        let value = col.children[0].getElementsByClassName("number")[0].textContent.replaceAll("\n", "").trim()

        if (value === '') {
            value = 'X';
        }

        let answer = col.children[0].getElementsByClassName("solution")[0].textContent.replaceAll("\n", "").trim().toLowerCase()

        if (answer !== '') letterTable[value] = answer

        rowstring.push(value);

    }

    parsedRows.push(rowstring)

}

var words = [];

// Parse rows for words
for (const row of parsedRows) {
    var word = []

    for (const letter of row) {
        if (letter === "X") {
            if (word.length !== 1) {
                if (word.length > 1) words.push(word)
            }
            word = []
        } else {
            word.push(letter)
        }
    }

    if (word.length > 1) words.push(word)

}

//Parse cols for words
for (let column = 0; column < parsedRows[0].length; column++) {

    var word = []

    for (let row = 0; row < parsedRows.length; row++) {
        let letter = parsedRows[row][column];

        if (letter === "X") {
            if (word.length !== 1) {
                if (word.length > 1) words.push(word)
            }
            word = []
        } else {
            word.push(letter)
        }
    }
    if (word.length > 1) words.push(word)
}

words = words.sort((a, b) => b.length - a.length)

var dictionaryWords = {}

// Get dictionary
for (const word of words) {
    if (!dictionaryWords[word.length]) {
        let wordsNumber = await fetch("https://fly.wordfinderapi.com/api/search?length=" + word.length + "&page_size=1")

        let existingWords = await fetch("https://fly.wordfinderapi.com/api/search?length=" + word.length + "&page_size=" + (await wordsNumber.json())["filter_results"])

        dictionaryWords[word.length] = (await existingWords.json())["word_pages"][0]["word_list"].map((x) => { return x["word"] })

    }
}

var wordsWithMatches = []

for (const word of words) {
    wordsWithMatches.push({
        "template": word,
        "matches": dictionaryWords[word.length],
        "solved": false
    })
}

while (wordsWithMatches.some((x) => !x.solved)) {
    for (const word of wordsWithMatches.filter(x => !x.solved)) {

        let newMatches = []

        for (const dictionaryWord of word.matches) {
            if (wordMatches(word.template, dictionaryWord, letterTable, excluded)) {
                newMatches.push(dictionaryWord)
            }
        }

        word.matches = newMatches;

        if(word.matches.length === 1) {
            word.solved = true;

            for (let index = 0; index < word.template.length; index++) {
                letterTable[word.template[index]] = word.matches[0][index]
                
            }

        }

    }
}

for (let rowIndex = 0; rowIndex < parsedRows.length; rowIndex++) {
    for (let colIndex = 0; colIndex < parsedRows[rowIndex].length; colIndex++) {

        if(parsedRows[rowIndex][colIndex] !== "X") {
            parsedRows[rowIndex][colIndex] = letterTable[parseInt(parsedRows[rowIndex][colIndex])].toUpperCase()
        } else {
            parsedRows[rowIndex][colIndex] = "-"
        }
    }
    
}

console.table(parsedRows);

console.table(letterTable);

var clickableCells = {}
var clickableLegend = {}

for (const cell of document.getElementsByClassName("number")) {
    clickableCells[cell.textContent.replaceAll("\n", "").trim()] = cell
}

for (const cell of document.getElementsByClassName("input-key")) {
    clickableLegend[cell.textContent.replaceAll("\n", "").trim()] = cell
}

for (const [key, value] of Object.entries(clickableCells)) {
    triggerMouseEvent(value)
    if(key !== "") triggerMouseEvent(clickableLegend[letterTable[parseInt(key)].toUpperCase()])
}

console.groupCollapsed("Parsed rows")
console.table(parsedRows)
console.groupEnd()

console.groupCollapsed("Letter table")
console.table(letterTable)
console.groupEnd()
