// --- FONCTION DE COMPTAGE (Appel�e par body onload) ---
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

// --- LOGIQUE DE G�OLOCALISATION ---
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
        case error.PERMISSION_DENIED: message = "Acc�s refus� par l'utilisateur."; break;
        case error.POSITION_UNAVAILABLE: message = "Position non disponible."; break;
        case error.TIMEOUT: message = "D�lai expir�."; break;
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
            document.getElementById("latitude").innerHTML = "G�olocalisation non support�e.";
            document.getElementById("longitude").innerHTML = "G�olocalisation non support�e.";
        }
    }
}


// --- EXECUTION S�CURIS�E DE LA DATE ET DE LA POSITION ---
// Attend que le HTML soit enti�rement charg� avant d'essayer de manipuler les ID
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

    // 2. Lancement de la G�olocalisation
    afficherLocalisation();
});
