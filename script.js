const INTRO = [
    {text: ["You are a halfling, just trying to exist.", "Meanwhile, the dark lord rampages across the world.", "You do not care about this. You are trying to farm potatoes.", "Because what could a halfing possibly do about it anyway?"]}
]

const GRASS_AND_MUD = [
    {text: ["In the garden..."]},
    {text: ["A knock at the door..."]},
    {text: ["The world becomes a darker, more dangerous place.", "(From now on, removing an ORC costs an additional POTATO.)"]}
]

const IN_THE_GARDEN = [
    {text: ["You happily root about all day in your garden."], values: {potatoes: 1}},
    {text: ["You narrowly avoid a visitor by hiding in a potato sack."], values: {potatoes: 1, destiny: 1}},
    {text: ["A hooded stranger lingers outside your farm."], values: {destiny: 1, orcs: 1}},
    {text: ["Your field is ravaged in the night by unseen enemies."], values: {orcs: 1, potatoes: -1}},
    {text: ["You trade potatoes for other delicious foodstuffs."], values: {potatoes: -1}},
    {text: ["You burrow into a bumper crop of potatoes. Do you cry with joy? Possibly."], values: {potatoes: 2}}
]

const A_KNOCK_AT_THE_DOOR = [
    {text: ["A distant cousin", "They are after your potatoes.", "They may snitch on you."], values: {orcs: 1}},
    {text: ["A dwarven stranger.", "You refuse them entry.", "Ghastly creatures."], values: {destiny: 1}},
    {text: ["A wizard strolls by.", "You pointedly draw the curtains."], values: {orcs: 1, destiny: 1}},
    {text: ["There are rumors of war in the reaches.", "You eat some potatoes."], values: {potatoes: -1, orcs: 2}},
    {text: ["It's an elf.", "They are not serious people."], values: {destiny: 1}},
    {text: ["It's a sack of potatoes from a generous neighbour.", "You really must remember to pay them a visit one of these years."], values: {potatoes: 2}}
]

const GAME_OVER = [
    {text: [`An interfering ${Math.random() < 0.5 ? 'bard' : 'wizard'} turns up at your doorstep with a quest, and you are whisked away against your will on an adventure.`, "THE END."]},
    {text: ["You have enough potatoes that you can go underground and not return to the surface until the danger is past.", "You nestle down into your burrow and enjoy your well earned rest.", "THE END."]},
    {text: ["The orcs finally find your potato farm.", "Alas, orcs are not so interested in potatoes as they are in eating you, and you end up in a cookpot.", "THE END."]}
]

const stats = {
    destiny: 0,
    potatoes: 0,
    orcs: 0
}

let textDiv = document.getElementById('text-div');
let nextButton = document.getElementById('next-button');
let rollButton = document.getElementById('roll-button');
let hurlButton = document.getElementById('hurl-button');
let nextClicked = false;
let rollClicked = false;
let rollValue = 0;
let hurlCost = 1;

async function transitionToState(state) {
    switch(state) {
        case INTRO:
            nextButton.disabled = true;
            await displayLines(INTRO[0].text);
            transitionToState(GRASS_AND_MUD);
            break;
        case GRASS_AND_MUD:
            hurlButton.disabled = !(stats.potatoes >= hurlCost && stats.orcs > 0);
            await waitForNext();
            await displayStats();
            await waitForRoll();
            hurlButton.disabled = true;
            await waitForNext();
            if (rollValue === 1 || rollValue === 2) {
                await displayLines(GRASS_AND_MUD[0].text);
                transitionToState(IN_THE_GARDEN);
            } else if (rollValue === 3 || rollValue === 4) {
                await displayLines(GRASS_AND_MUD[1].text);
                transitionToState(A_KNOCK_AT_THE_DOOR);
            } else {
                await displayLines(GRASS_AND_MUD[2].text);
                hurlCost++;
                hurlButton.innerText = `HURL (cost: ${hurlCost})`
                transitionToState(GRASS_AND_MUD);
            }
            break;
        case IN_THE_GARDEN:
            await waitForRoll();
            await waitForNext();
            await displayLines(IN_THE_GARDEN[rollValue-1].text);
            await waitForNext();
            await modifyStats(IN_THE_GARDEN[rollValue-1].values);
            transitionToState(checkGameOver() ? GAME_OVER : GRASS_AND_MUD);
            break;
        case A_KNOCK_AT_THE_DOOR:
            await waitForRoll();
            await waitForNext();
            await displayLines(A_KNOCK_AT_THE_DOOR[rollValue-1].text);
            await waitForNext();
            await modifyStats(A_KNOCK_AT_THE_DOOR[rollValue-1].values);
            transitionToState(checkGameOver() ? GAME_OVER : GRASS_AND_MUD);
            break;
        case GAME_OVER:
            await waitForNext();
            if (stats.orcs >= 10) {
                await displayLines(GAME_OVER[2].text);
            } else if (stats.potatoes >= 10) {
                await displayLines(GAME_OVER[1].text);
            } else {
                await displayLines(GAME_OVER[0].text);
            }
            break;
        default:
            console.error('Error: unknown state', state);
            break;
    }
}

async function displayLines(text) {
    for (let line of text) {
        textDiv.innerText = '';
        for (let character of line) {
            textDiv.innerHTML += character;
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        if (line !== text[text.length-1]) {
            await waitForNext();
        }
    }
}

async function displayStats() {
    const textArray = [];
    for (const [key, value] of Object.entries(stats)) {
        textArray.push(`${key.toUpperCase()}: ${value}`);
    }
    await displayLines([`(${textArray.join(', ')})`]);
}

async function modifyStats(values) {
    const textArray = [];
    for (const [key, value] of Object.entries(values)) {
        stats[key] = Math.max(0, stats[key] + value);
        textArray.push(`${value > 0 ? '+' : ''}${value} ${key.toUpperCase()}`);
    }
    await displayLines([`(${textArray.join(', ')})`]);
}

async function waitForNext() {
    nextButton.disabled = false;
    while (nextClicked === false) {
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    nextClicked = false;
    nextButton.disabled = true;
}

async function waitForRoll() {
    rollButton.disabled = false;
    while (rollClicked === false) {
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    rollClicked = false;
    rollButton.disabled = true;
    await displayLines([`You rolled a ${rollValue}.`]);
}

function next() {
    nextClicked = true;
}

function roll() {
    rollClicked = true;
    rollValue = Math.ceil(Math.random() * 6);
}

async function hurl() {
    hurlButton.disabled = true;
    rollButton.disabled = true;
    await displayLines(['You hurl potatoes at the orcs.', `(-${hurlCost} POTATO, -1 ORC)`]);
    await waitForNext();
    stats.potatoes -= hurlCost;
    stats.orcs--;
    await displayStats();
    hurlButton.disabled = !(stats.orcs > 0 && stats.potatoes >= hurlCost);
    rollButton.disabled = false;
}

function checkGameOver() {
    return stats.destiny >= 10 || stats.potatoes >= 10 || stats.orcs >= 10;
}

transitionToState(INTRO);
