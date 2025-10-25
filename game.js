// game.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');

// --- DÉCLARATION ET CHARGEMENT DES IMAGES ---
// ASSUREZ-VOUS que ces chemins et noms de fichiers correspondent exactement à ceux sur GitHub (casse-sensitive)
const playerImg = new Image();
playerImg.src = 'images/perso.png';
const diplomaImg = new Image();
diplomaImg.src = 'images/icone.png';
const gainImg = new Image();
gainImg.src = 'images/gain.png'; 
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
const REWARD_DURATION = 1000; 

// État du jeu
let score = 0;
let gameOver = false;

// Variables pour l'affichage de la récompense
let isRewardVisible = false;
let rewardStartTime = 0;
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
    // Sécurité: Si l'image n'est pas chargée, dessiner un carré
    if (playerImg.complete && playerImg.naturalWidth > 0) {
        ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    } else {
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

// --- drawObjects (CORRIGÉE: Sécurité anti-blocage) ---
function drawObjects(array) {
    array.forEach(obj => {

        if (obj.text) {
            ctx.fillStyle = 'red'; 
            ctx.font = '15px Arial'; 
            ctx.fillText(obj.text, obj.x, obj.y + obj.height * 0.75);

        // DIPLÔMES : Vérifie si l'image est complète ET valide (naturalWidth > 0)
        } else if (obj.type === 'diploma' && diplomaImg.complete && diplomaImg.naturalWidth > 0) {
            ctx.drawImage(diplomaImg, obj.x, obj.y, obj.width, obj.height);
            
        // MAMBZ : Vérifie si l'image est complète ET valide (naturalWidth > 0)
        } else if (obj.type === 'mambz' && mambzImg.complete && mambzImg.naturalWidth > 0) {
            ctx.drawImage(mambzImg, obj.x, obj.y, obj.width, obj.height);
        } else {
            // Option de secours (carré) si l'image n'est pas trouvée (404) ou n'est pas chargée
            ctx.fillStyle = obj.type === 'mambz' ? 'orange' : 'yellow'; 
            ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        }
    });
}

// --- GESTION DES COLLISIONS ET DU SCORE (Pas de changement) ---

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

    for (let i = diplomas.length - 1; i >= 0; i--) {
        if (checkCollision(player, diplomas[i])) { 
            addScoreAndCheckReward(1); 
            diplomas.splice(i, 1);
        }
    }

    for (let i = mambzItems.length - 1; i >= 0; i--) {
        if (checkCollision(player, mambzItems[i])) {
            addScoreAndCheckReward(MAMBZ_SCORE_VALUE); 
            mambzItems.splice(i, 1);
        }
    }

    for (let i = arrows.length - 1; i >= 0; i--) {
        if (checkCollision(player, arrows[i])) {
            score = Math.max(0, score - 1);
            scoreDisplay.textContent = `Score: ${score}`;
            arrows.splice(i, 1);
        }
    }
} 

// --- BOUCLE PRINCIPALE DU JEU (gameLoop) ---

function gameLoop(currentTime) { 
    if (gameOver) {
        return;
    }

    // 1. Nettoyage et dessin du fond/sol
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FFFFCB'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height); 
    ctx.fillStyle = 'green'; 
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);

    // 2. Mise à jour des positions
    updatePlayer();
    updateObjects(diplomas, DIPLOMA_SPEED);
    updateObjects(mambzItems, MAMBZ_SPEED); 
    updateObjects(arrows, ARROW_SPEED);

    // 3. Dessin
    drawPlayer();
    drawObjects(diplomas);
    drawObjects(mambzItems); 
    drawObjects(arrows);

    // 4. Collisions
    handleCollisions();

    // 5. Gestion et Dessin de la récompense (Sécurité: naturalWidth > 0)
    if (isRewardVisible && gainImg.complete && gainImg.naturalWidth > 0) { 
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

    // 6. Continuer la boucle
    requestAnimationFrame(gameLoop);
}

// --- GESTION DES CONTRÔLES CLAVIER (PC) ET TACTILE (MOBILE) ---

// CLAVIER (PC)
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

// TACTILE (MOBILE)
canvas.addEventListener('touchstart', (e) => {
    if (gameOver) return;
    // Empêche le défilement de la page mobile
    e.preventDefault(); 

    const touchX = e.touches[0].clientX;
    const canvasRect = canvas.getBoundingClientRect(); 
    const relativeX = touchX - canvasRect.left;
    const touchZoneWidth = canvas.width / 4; // 25% des bords pour le mouvement

    if (relativeX < touchZoneWidth) {
        // Mouvement à gauche (Zone gauche)
        player.xVelocity = -PLAYER_SPEED;
    } else if (relativeX > canvas.width - touchZoneWidth) {
        // Mouvement à droite (Zone droite)
        player.xVelocity = PLAYER_SPEED;
    } else {
        // Saut (Zone centrale)
        jump();
    }
});

canvas.addEventListener('touchend', (e) => {
    if (gameOver) return;

    // Arrête le mouvement si le joueur retire le doigt
    if (e.touches.length === 0) {
        player.xVelocity = 0;
    }
});


// ====================================================================
// --- INITIALISATION SÉCURISÉE AVEC PRÉCHARGEMENT DES IMAGES ---
// ====================================================================

const imagesToLoad = [playerImg, diplomaImg, gainImg, mambzImg]; 
let imagesLoadedCount = 0;

function imageLoaded() {
    imagesLoadedCount++;
    if (imagesLoadedCount === imagesToLoad.length) {
        startGame();
    }
}

function startGame() {
    console.log("Démarrage du jeu : Toutes les images sont chargées.");
    // Initialisation des intervalles de spawn
    setInterval(spawnDiploma, 2000); 
    setInterval(spawnArrow, 1500);    
    setInterval(spawnMambz, 3000);    

    // Lancement de la boucle
    requestAnimationFrame(gameLoop);
}

// Déclenche le chargement
imagesToLoad.forEach(img => {
    if (img.complete) {
        imageLoaded();
    } else {
        img.onload = imageLoaded;
        img.onerror = () => {
            console.error(`Erreur de chargement pour l'image: ${img.src}. Vérifiez le chemin et la casse.`);
            // Si l'image échoue (404), on la compte comme "traitée" pour ne pas bloquer le jeu
            imageLoaded(); 
        };
    }
});
