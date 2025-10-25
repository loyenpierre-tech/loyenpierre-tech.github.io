// game.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');
const playerImg = new Image();
playerImg.src = 'perso.png';
const diplomaImg = new Image();
diplomaImg.src = 'icone.png';

// NOUVEAU: Image du gain (le goûter)
const gainImg = new Image();
gainImg.src = 'gain.png'; // Assurez-vous que cette image est disponible

// NOUVEAU: Image pour l'objet "mambz"
const mambzImg = new Image();
mambzImg.src = 'mambz.png'; // ASSUMEZ que vous avez une image 'mambz.png'

// Vérification de la disponibilité du canvas et du contexte
if (!canvas || !ctx) {
    console.error("Erreur: Impossible de trouver l'élément Canvas ou son contexte 2D. Veuillez vérifier Page2.html.");
}

// Constantes du jeu
const GRAVITY = 0.8 ;          // Force de gravité (NOTE : La gravité a été modifiée dans le Canvas fourni)
const JUMP_POWER = -20;
const PLAYER_SPEED = 7;     // Vitesse de déplacement horizontal
const CANVAS_WIDTH = canvas.width; // Largeur du canvas
const GROUND_Y = canvas.height - 10; // Position Y du sol
const DIPLOMA_SPEED = 3;      // Vitesse de défilement des diplômes
const MAMBZ_SPEED = 10;
const ARROW_SPEED = 7;        // Vitesse de défilement des flèches
const WIN_SCORE = 10;         // Score cible pour gagner la récompense
const MAMBZ_SCORE_VALUE = 3;  // NOUVEAU: Valeur de score pour l'objet mambz

// État du jeu
let score = 0;
let gameOver = false;

// NOUVEAU: Variables pour l'affichage de la récompense
let isRewardVisible = false;
let rewardStartTime = 0;
const REWARD_DURATION = 1000; // 1000 ms = 1 seconde
let rewardDrawnAtScore = 0; // Pour s'assurer que la récompense n'apparaît qu'une fois par tranche de 10 points

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

let diplomas = []; // Tableau pour stocker les objets à collectionner
let arrows = [];   // Tableau pour stocker les obstacles
let mambzItems = []; // NOUVEAU: Tableau pour stocker les objets mambz

// --- GESTION DU PERSONNAGE (Mouvement et Saut) ---

function updatePlayer() {
    // 1. Appliquer la gravité
    player.yVelocity += GRAVITY;
    // 2. Mettre à jour la position Y et X
    player.y += player.yVelocity;
    player.x += player.xVelocity; // Applique le mouvement horizontal

    // 3. Gérer l'atterrissage
    if (player.y + player.height > GROUND_Y) {
        player.y = GROUND_Y - player.height;
        player.yVelocity = 0;
        player.isJumping = false;
    }

    // 4. Gérer les limites horizontales (empêcher le joueur de sortir)
    if (player.x < 0) { // <<< Correction pour la limite gauche
        player.x = 0;
    }
    if (player.x + player.width > CANVAS_WIDTH) {
        player.x = CANVAS_WIDTH - player.width;
    }
}

function drawPlayer() {
    // Remplacer le code du carré bleu (fillRect) par drawImage
    if (playerImg.complete) {
        ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    } else {
        // Option de secours (affiche un carré tant que l'image n'est pas chargée)
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
        type: 'diploma' // Ajout d'un type pour distinguer (utile pour le dessin et la collision)
    });
}

// NOUVEAU: Fonction pour faire apparaître l'objet mambz
function spawnMambz() {
    mambzItems.push({
        x: canvas.width,
        y: Math.random() * (canvas.height / 2) + 50,
        width: 200, // Taille légèrement différente
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
            ctx.fillStyle = 'red'; // Couleur du texte
            ctx.font = '15px Arial'; // Taille et police

            // On dessine le texte. On utilise 0.75 pour centrer la ligne de base du texte
            ctx.fillText(obj.text, obj.x, obj.y + obj.height * 0.75);

        // DESSIN DES DIPLÔMES (Image)
        } else if (obj.type === 'diploma' && diplomaImg.complete) {
            ctx.drawImage(diplomaImg, obj.x, obj.y, obj.width, obj.height);
        // NOUVEAU: DESSIN DES MAMBZ (Image)
        } else if (obj.type === 'mambz' && mambzImg.complete) {
            ctx.drawImage(mambzImg, obj.x, obj.y, obj.width, obj.height);
        } else {
            // Option de secours pour les diplômes/mambz si l'image ne charge pas
            ctx.fillStyle = obj.type === 'mambz' ? 'orange' : 'yellow'; // Couleur différente pour mambz
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
            rewardStartTime = performance.now(); // Démarre le chrono
            rewardDrawnAtScore = score; // Enregistre le score pour éviter la répétition
        }
    }

    // Collisions avec les Diplômes (Gain de 1 point)
    for (let i = diplomas.length - 1; i >= 0; i--) {
        if (checkCollision(player, diplomas[i])) { 
            addScoreAndCheckReward(1); // Ajout d'un point
            diplomas.splice(i, 1);
        }
    }

    // NOUVEAU: Collisions avec les Mambz (Gain de 3 points)
    for (let i = mambzItems.length - 1; i >= 0; i--) {
        if (checkCollision(player, mambzItems[i])) {
            addScoreAndCheckReward(MAMBZ_SCORE_VALUE); // Ajout de 3 points
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
} // Fin de la fonction handleCollisions()

// --- BOUCLE PRINCIPALE DU JEU ---

function gameLoop(currentTime) { // CORRECTION 1: Ajout de 'currentTime' comme argument
    if (gameOver) {
        return;
    }

    // 1. Nettoyer l'écran et dessiner le fond et le sol
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dessiner le fond (ciel bleu) (NOTE : La couleur a été modifiée dans le Canvas fourni)
    ctx.fillStyle = '#FFFFCB'; // Jaune très clair
    ctx.fillRect(0, 0, canvas.width, canvas.height); 

    // Dessiner le sol (maintenant vert) (NOTE : La couleur a été modifiée dans le Canvas fourni)
    ctx.fillStyle = 'green'; // Vert
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);

    // 2. Mettre à jour les positions (joueur, diplômes, mambz, flèches)
    updatePlayer();
    updateObjects(diplomas, DIPLOMA_SPEED);
    updateObjects(mambzItems, MAMBZ_SPEED); // NOUVEAU: Mise à jour des mambz (même vitesse que les diplômes)
    updateObjects(arrows, ARROW_SPEED);

    // 3. Dessiner tous les éléments
    drawPlayer();
    drawObjects(diplomas);
    drawObjects(mambzItems); // NOUVEAU: Dessin des mambz
    drawObjects(arrows);

    // 4. Vérifier les interactions
    handleCollisions();

    // Gestion et Dessin de la récompense (Goûter)
    if (isRewardVisible && gainImg.complete) {
        const timeElapsed = currentTime - rewardStartTime;
        let opacity = 1;

        if (timeElapsed >= REWARD_DURATION) {
            isRewardVisible = false; // Fin de l'affichage
        } else {
            // Commence le fondu après 500ms (la moitié de la durée)
            const fadeStart = REWARD_DURATION * 0.5;
            if (timeElapsed > fadeStart) {
                // Calcule l'opacité (de 1 à 0)
                opacity = 1 - (timeElapsed - fadeStart) / (REWARD_DURATION - fadeStart);
            }
        } // CORRECTION 2: Fermeture manquante du bloc 'else'
        
        if (isRewardVisible) {
            ctx.save(); // Sauvegarde l'état actuel du contexte
            ctx.globalAlpha = opacity; // Applique l'opacité

            // Positionnement au centre du Canvas
            const rewardWidth = 100;
            const rewardHeight = 100;
            const rewardX = (canvas.width / 2) - (rewardWidth / 2);
            const rewardY = (canvas.height / 2) - (rewardHeight / 2);

            ctx.drawImage(gainImg, rewardX, rewardY, rewardWidth, rewardHeight);
            
            ctx.restore(); // Restaure l'opacité à 1 pour le reste du dessin
        }
    }
    // Fin de la gestion de la récompense

    // 5. Continuer la boucle
    requestAnimationFrame(gameLoop);
}

// --- GESTION DES CONTRÔLES ---

// Gérer le saut et le mouvement horizontal avec les touches
document.addEventListener('keydown', (e) => {
    if (gameOver) return; // Ignore les commandes si le jeu est fini

    if (e.code === 'Space') {
        jump();
        e.preventDefault(); // Empêche le défilement de la page
    }
    // Gérer le mouvement horizontal
    if (e.code === 'ArrowRight') {
        player.xVelocity = PLAYER_SPEED;
    } else if (e.code === 'ArrowLeft') {
        player.xVelocity = -PLAYER_SPEED;
    }
});

// Arrêter le mouvement lorsque la touche est relâchée
document.addEventListener('keyup', (e) => {
    if (gameOver) return; // Ignore les commandes si le jeu est fini

    if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
        // Arrête immédiatement le mouvement horizontal
        player.xVelocity = 0;
    }
});

// --- INITIALISATION : DÉMARRAGE DU JEU ---

// Génération aléatoire des objets
setInterval(spawnDiploma, 20000); // NOTE : Revert aux valeurs de l'utilisateur (2000ms)
setInterval(spawnArrow, 15000);    // NOTE : Revert aux valeurs de l'utilisateur (1500ms)
setInterval(spawnMambz, 30000);    // NOUVEAU: Fait apparaître un Mambz toutes les 4 secondes (ajustez si besoin)

// Lancement de la boucle principale du jeu
// gameLoop() est maintenant appelée sans argument initial, performance.now() est géré par requestAnimationFrame

requestAnimationFrame(gameLoop);

