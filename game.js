// game.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const scoreDisplay = document.getElementById('scoreDisplay');

// VÉRIFICATION CRITIQUE : S'assurer que les éléments sont trouvés
if (!canvas || !ctx) {
    console.error("Erreur: Impossible de trouver l'élément Canvas ou son contexte 2D. Le jeu ne peut pas démarrer.");
    // Empêcher l'exécution du reste du script si le canvas manque
    throw new Error("Canvas ou Context 2D introuvable.");
}

// Définition des images et de leur source (Vérifiez la CASSE ici et sur GitHub !)
const playerImg = new Image();
playerImg.src = 'perso.png';
const diplomaImg = new Image();
diplomaImg.src = 'icone.png';
const gainImg = new Image();
gainImg.src = 'gain.png';
const mambzImg = new Image();
mambzImg.src = 'mambz.png';

// --- AJOUT IMPORTANT : GESTION DU PRÉ-CHARGEMENT DES IMAGES ---
const imagesToLoad = [playerImg, diplomaImg, gainImg, mambzImg];
let imagesLoadedCount = 0;

function initializeGame() {
    imagesLoadedCount++;
    
    // Si toutes les images sont chargées, on lance le jeu
    if (imagesLoadedCount === imagesToLoad.length) {
        console.log("Toutes les images sont chargées. Démarrage du jeu.");
        
        // Démarrer la génération d'objets uniquement ICI
        setInterval(spawnDiploma, 2000); 
        setInterval(spawnArrow, 1500);  
        setInterval(spawnMambz, 3000);  

        // Lancement sécurisé de la boucle principale
        requestAnimationFrame(gameLoop);
    }
}

// Attacher l'événement 'load' ou 'error' à chaque image
imagesToLoad.forEach(img => {
    if (img.complete) {
        initializeGame(); // Déjà en cache
    } else {
        img.addEventListener('load', initializeGame);
        img.addEventListener('error', () => {
            console.error(`Erreur 404/Casse : L'image ${img.src} n'a pas pu être chargée. Le jeu démarre sans elle.`);
            initializeGame(); // Compter l'image comme "traitée" même en erreur
        });
    }
});
// --- FIN DU PRÉ-CHARGEMENT ---


// Constantes du jeu
const GRAVITY = 0.8;
const JUMP_POWER = -20;
const PLAYER_SPEED = 7;
const CANVAS_WIDTH = canvas.width;
const GROUND_Y = canvas.height - 10;
const DIPLOMA_SPEED = 3;
const MAMBZ_SPEED = 10;
const ARROW_SPEED = 7;
const WIN_SCORE = 10;
const MAMBZ_SCORE_VALUE = 3;

// État du jeu
let score = 0;
let gameOver = false;
let isRewardVisible = false;
let rewardStartTime = 0;
const REWARD_DURATION = 1000;
let rewardDrawnAtScore = 0;

// Objets du jeu
let player = {
    x: 50,
    y: GROUND_Y - 40,
    width: 50,
    height: 80,
    yVelocity: 0,
    xVelocity: 0,
    isJumping: false
};

let diplomas = [];
let arrows = [];
let mambzItems = [];

// --- GESTION DU PERSONNAGE (Mouvement et Saut) ---

function updatePlayer() {
    player.yVelocity += GRAVITY;
    player.y += player.yVelocity;
    player.x += player.xVelocity;

    if (player.y + player.height > GROUND_Y) {
        player.y = GROUND_Y - player.height;
        player.yVelocity = 0;
        player.isJumping = false;
    }

    if (player.x < 0) {
        player.x = 0;
    }
    if (player.x + player.width > CANVAS_WIDTH) {
        player.x = CANVAS_WIDTH - player.width;
    }
}

function drawPlayer() {
    if (playerImg.complete) {
        ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    } else {
        // Option de secours au cas où le chargement échoue complètement
        ctx.fillStyle = 'blue';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
}

function jump() {
    if (!player.isJumping) {
        player.yVelocity = JUMP_POWER;
        player.isJumping = true;
    }
}

// --- GESTION DES OBJETS (Apparition et Mouvement) ---

function spawnDiploma() {
    diplomas.push({
        x: canvas.width,
        y: Math.random() * (canvas.height / 2) + 50,
        width: 50,
        height: 50,
        type: 'diploma'
    });
}

function spawnMambz() {
    mambzItems.push({
        x: canvas.width,
        y: Math.random() * (canvas.height / 2) + 50,
        width: 200,
        height: 200,
        type: 'mambz'
    });
}

function spawnArrow() {
    arrows.push({
        x: canvas.width,
        y: Math.random() * (GROUND_Y - 20) + 20,
        width: 15,
        height: 10,
        text: "<-- 💥⚡HTML⚡💥"
    });
}

function updateObjects(array, speed) {
    for (let i = array.length - 1; i >= 0; i--) {
        array[i].x -= speed;
        if (array[i].x + array[i].width < 0) {
            array.splice(i, 1);
        }
    }
}

function drawObjects(array) {
    array.forEach(obj => {
        if (obj.text) {
            ctx.fillStyle = 'red';
            ctx.font = '15px Arial';
            ctx.fillText(obj.text, obj.x, obj.y + obj.height * 0.75);
        } else if (obj.type === 'diploma' && diplomaImg.complete) {
            ctx.drawImage(diplomaImg, obj.x, obj.y, obj.width, obj.height);
        } else if (obj.type === 'mambz' && mambzImg.complete) {
            ctx.drawImage(mambzImg, obj.x, obj.y, obj.width, obj.height);
        } else {
            // Option de secours si l'image ne charge pas
            ctx.fillStyle = obj.type === 'mambz' ? 'orange' : 'yellow';
            ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        }
    });
}

// --- GESTION DES COLLISIONS ET DU SCORE ---

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function handleCollisions() {
    const addScoreAndCheckReward = (points) => {
        score += points;
        scoreDisplay.textContent = `Score: ${score}`;
        
        if (score > 0 && score % WIN_SCORE === 0 && score > rewardDrawnAtScore) {
            isRewardVisible = true;
            rewardStartTime = performance.now();
            rewardDrawnAtScore = score;
        }
    }

    // Collisions avec les Diplômes
    for (let i = diplomas.length - 1; i >= 0; i--) {
        if (checkCollision(player, diplomas[i])) {
            addScoreAndCheckReward(1);
            diplomas.splice(i, 1);
        }
    }

    // Collisions avec les Mambz
    for (let i = mambzItems.length - 1; i >= 0; i--) {
        if (checkCollision(player, mambzItems[i])) {
            addScoreAndCheckReward(MAMBZ_SCORE_VALUE);
            mambzItems.splice(i, 1);
        }
    }

    // Collisions avec les Flèches
    for (let i = arrows.length - 1; i >= 0; i--) {
        if (checkCollision(player, arrows[i])) {
            score = Math.max(0, score - 1);
            scoreDisplay.textContent = `Score: ${score}`;
            arrows.splice(i, 1);
        }
    }
}

// --- BOUCLE PRINCIPALE DU JEU ---

function gameLoop(currentTime) {
    if (gameOver) {
        return;
    }

    // 1. Nettoyer l'écran et dessiner le fond et le sol
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FFFFCB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'green';
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);

    // 2. Mettre à jour les positions
    updatePlayer();
    updateObjects(diplomas, DIPLOMA_SPEED);
    updateObjects(mambzItems, MAMBZ_SPEED);
    updateObjects(arrows, ARROW_SPEED);

    // 3. Dessiner tous les éléments
    drawPlayer();
    drawObjects(diplomas);
    drawObjects(mambzItems);
    drawObjects(arrows);

    // 4. Vérifier les interactions
    handleCollisions();

    // Gestion et Dessin de la récompense (Goûter)
    if (isRewardVisible && gainImg.complete) {
        const timeElapsed = currentTime - rewardStartTime;
        let opacity = 1;

        if (timeElapsed >= REWARD_DURATION) {
            isRewardVisible = false;
        } else {
            const fadeStart = REWARD_DURATION * 0.5;
            if (timeElapsed > fadeStart) {
                opacity = 1 - (timeElapsed - fadeStart) / (REWARD_DURATION - fadeStart);
            }
        }
        
        if (isRewardVisible) {
            ctx.save();
            ctx.globalAlpha = opacity;
            const rewardWidth = 100;
            const rewardHeight = 100;
            const rewardX = (canvas.width / 2) - (rewardWidth / 2);
            const rewardY = (canvas.height / 2) - (rewardHeight / 2);

            ctx.drawImage(gainImg, rewardX, rewardY, rewardWidth, rewardHeight);
            
            ctx.restore();
        }
    }
    
    // 5. Continuer la boucle (cette ligne doit TOUJOURS être la dernière action)
    requestAnimationFrame(gameLoop);
}

// --- GESTION DES CONTRÔLES ---

document.addEventListener('keydown', (e) => {
    if (gameOver) return;
    if (e.code === 'Space') {
        jump();
        e.preventDefault();
    }
    if (e.code === 'ArrowRight') {
        player.xVelocity = PLAYER_SPEED;
    } else if (e.code === 'ArrowLeft') {
        player.xVelocity = -PLAYER_SPEED;
    }
});

document.addEventListener('keyup', (e) => {
    if (gameOver) return;
    if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
        player.xVelocity = 0;
    }
});
