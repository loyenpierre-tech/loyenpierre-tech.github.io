// --- FONCTION DE COMPTAGE (Appelée par body onload) ---
function CompterJusquaDix() {
    let compteur = 0;
    const elementCompteur = document.getElementById("leCompteur");
    
    if (!elementCompteur) return; 

    function afficherProchainNombre() {
        compteur++; 
        elementCompteur.innerHTML += compteur + "<br>";
        
        if (compteur < 10) {
            setTimeout(afficherProchainNombre, 1000); 
        }
    }
    
    setTimeout(afficherProchainNombre, 1000); 
}

// --- LOGIQUE DE GÉOLOCALISATION ---
function afficherSucces(position) {
    const lat = position.coords.latitude;
    const long = position.coords.longitude;
    if (document.getElementById("latitude")) {
        document.getElementById("latitude").innerHTML = lat.toFixed(6);
        document.getElementById("longitude").innerHTML = long.toFixed(6);
    }
}

function afficherErreur(error) {
    let message;
    switch (error.code) {
        case error.PERMISSION_DENIED: message = "Accès refusé par l'utilisateur."; break;
        case error.POSITION_UNAVAILABLE: message = "Position non disponible."; break;
        case error.TIMEOUT: message = "Délai expiré."; break;
        default: message = "Erreur inconnue."; break;
    }
    if (document.getElementById("latitude")) {
        document.getElementById("latitude").innerHTML = message;
        document.getElementById("longitude").innerHTML = "Erreur.";
    }
}

function afficherLocalisation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(afficherSucces, afficherErreur);
    } else {
        if (document.getElementById("latitude")) {
            document.getElementById("latitude").innerHTML = "Géolocalisation non supportée.";
            document.getElementById("longitude").innerHTML = "Géolocalisation non supportée.";
        }
    }
}


// --- EXECUTION SÉCURISÉE DE LA DATE ET DE LA POSITION ---
// Attend que le HTML soit entièrement chargé avant d'essayer de manipuler les ID
document.addEventListener('DOMContentLoaded', (event) => {
    
    // 1. Logique et Affichage de la Date
    const dateActuelle = new Date();
    const jourDuMois = dateActuelle.getDate();
    const numeroDuMois = dateActuelle.getMonth() + 1;
    const annee = dateActuelle.getFullYear();
    let dateDuJour = jourDuMois + "/" + numeroDuMois + "/" + annee;
    
    if (document.getElementById("dateAffichee")) {
        document.getElementById("dateAffichee").innerHTML = dateDuJour;
    }

    // 2. Lancement de la Géolocalisation
    afficherLocalisation();
});
