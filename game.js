// game.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');
const playerImg = new Image();
playerImg.src = 'images/perso.png';
const diplomaImg = new Image();
diplomaImg.src = 'images/icone.png';

// Image du gain (le goûter)
const gainImg = new Image();
gainImg.src = 'images/gain.png'; 

// Image pour l'objet "mambz"
const mambzImg = new Image();
mambzImg.src = 'images/mambz.png'; 

// Vérification de la disponibilité du canvas et du contexte
if (!canvas || !ctx) {
    console.error("Erreur: Impossible de trouver l'élément Canvas ou son contexte 2D. Veuillez vérifier Page2.html.");
}

// Constantes du jeu
const GRAVITY = 0.8 ;          
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

// Variables pour l'affichage de la récompense
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
    // 1. Appliquer la gravité
    player.yVelocity += GRAVITY;
    // 2. Mettre à jour la position Y et X
    player.y += player.yVelocity;
    player.x += player.xVelocity; 

    // 3. Gérer l'atterrissage
    if (player.y + player.height > GROUND_Y) {
        player.y = GROUND_Y - player.height;
        player.yVelocity = 0;
        player.isJumping = false;
    }

    // 4. Gérer les limites horizontales 
    if (player.x < 0) { 
        player.x = 0;
    }
    if (player.x + player.width > CANVAS_WIDTH) {
        player.x = CANVAS_WIDTH - player.width;
    }
}

function drawPlayer() {
    // Assurez-vous d'utiliser playerImg.complete ici pour éviter les erreurs
    if (playerImg.complete) {
        ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    } else {
        // Option de secours
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

        // DESSIN DES OBSTACLES (TEXTE "HTML ⚡💥")
        if (obj.text) {
            ctx.fillStyle = 'red'; 
            ctx.font = '15px Arial'; 

            ctx.fillText(obj.text, obj.x, obj.y + obj.height * 0.75);

        // DESSIN DES DIPLÔMES (Image)
        } else if (obj.type === 'diploma' && diplomaImg.complete) {
            ctx.drawImage(diplomaImg, obj.x, obj.y, obj.width, obj.height);
        // DESSIN DES MAMBZ (Image)
        } else if (obj.type === 'mambz' && mambzImg.complete) {
            ctx.drawImage(mambzImg, obj.x, obj.y, obj.width, obj.height);
        } else {
            // Option de secours pour les diplômes/mambz si l'image ne charge pas
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
    // Fonction utilitaire pour gérer l'ajout de score et la récompense
    const addScoreAndCheckReward = (points) => {
        score += points;
        scoreDisplay.textContent = `Score: ${score}`;
        
        // Vérifie si le score est un multiple de 10 et si la récompense n'a pas déjà été donnée pour ce score
        if (score > 0 && score % WIN_SCORE === 0 && score > rewardDrawnAtScore) {
            isRewardVisible = true;
            rewardStartTime = performance.now(); 
            rewardDrawnAtScore = score; 
        }
    }

    // Collisions avec les Diplômes (Gain de 1 point)
    for (let i = diplomas.length - 1; i >= 0; i--) {
        if (checkCollision(player, diplomas[i])) { 
            addScoreAndCheckReward(1); 
            diplomas.splice(i, 1);
        }
    }

    // Collisions avec les Mambz (Gain de 3 points)
    for (let i = mambzItems.length - 1; i >= 0; i--) {
        if (checkCollision(player, mambzItems[i])) {
            addScoreAndCheckReward(MAMBZ_SCORE_VALUE); 
            mambzItems.splice(i, 1);
        }
    }

    // Collisions avec les Flèches (Perte de points)
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
    
    // Dessiner le fond (ciel bleu)
    ctx.fillStyle = '#FFFFCB'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height); 

    // Dessiner le sol (maintenant vert)
    ctx.fillStyle = 'green'; 
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);

    // 2. Mettre à jour les positions (joueur, diplômes, mambz, flèches)
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

            // Positionnement au centre du Canvas
            const rewardWidth = 100;
            const rewardHeight = 100;
            const rewardX = (canvas.width / 2) - (rewardWidth / 2);
            const rewardY = (canvas.height / 2) - (rewardHeight / 2);

            ctx.drawImage(gainImg, rewardX, rewardY, rewardWidth, rewardHeight);
            
            ctx.restore(); 
        }
    }
    // Fin de la gestion de la récompense

    // 5. Continuer la boucle
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

// ====================================================================
// --- CORRECTION: INITIALISATION AVEC PRÉCHARGEMENT DES IMAGES ---
// ====================================================================

const imagesToLoad = [playerImg, diplomaImg, gainImg, mambzImg]; 
let imagesLoadedCount = 0;

function imageLoaded() {
    imagesLoadedCount++;
    if (imagesLoadedCount === imagesToLoad.length) {
        // Toutes les images sont chargées, on démarre le jeu.
        startGame();
    }
}

function startGame() {
    console.log("Démarrage du jeu : Toutes les images sont chargées.");
    // Génération aléatoire des objets
    setInterval(spawnDiploma, 2000); 
    setInterval(spawnArrow, 1500);    
    setInterval(spawnMambz, 3000);    

    // Lancement de la boucle principale du jeu
    requestAnimationFrame(gameLoop);
}

// Vérifie chaque image et attache l'événement 'onload'
imagesToLoad.forEach(img => {
    if (img.complete) {
        // L'image est déjà chargée (e.g. cache)
        imageLoaded();
    } else {
        // L'image n'est pas encore chargée
        img.onload = imageLoaded;
        img.onerror = () => {
            console.error(`Erreur de chargement pour l'image: ${img.src}. Vérifiez le chemin et la casse.`);
            // On compte l'image comme "traitée" pour ne pas bloquer le jeu
            imageLoaded(); 
        };
    }
});
