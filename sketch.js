// Motion-triggered dimmer pour p5.js (Web Editor)
// Déposer une image dans le sketch nommée "image.jpg"

let img;
let video;
let prevFrame;
let motionSmoothed = 0;
let overlayAlpha = 0;
let targetAlpha = 0;

// paramètres à ajuster
const captureScale = 0.25;   // taille de la caméra vs canvas (plus petit = plus rapide)
const motionMapMax = 60;     // valeur de diff qui mappe à 1. Ajuster si capteur trop sensible.
const motionThreshold = 0.08; // seuil (0..1) pour considérer "mouvement"
const fadeSpeed = 0.15;      // vitesse d'interpolation pour l'overlay

function preload() {
  // nom du fichier image à uploader dans l'éditeur : image.jpg
  img = loadImage('image_dispositif.jpg');
}

function setup() {
  // taille du canvas basée sur l'image
  createCanvas(img.width, img.height);
  // capture vidéo réduite (permet d'aller plus vite)
  video = createCapture(VIDEO);
  video.size(floor(width * captureScale), floor(height * captureScale));
  video.hide();

  // image pour stocker la frame précédente (taille réduite)
  prevFrame = createImage(video.width, video.height);
  prevFrame.loadPixels();
}

function draw() {
  background(0);

  // affiche l'image pleine toile
  image(img, 0, 0, width, height);

  // calcul de mouvement
  video.loadPixels();
  if (video.pixels.length > 0 && prevFrame) {
    let sumDiff = 0;
    let w = video.width, h = video.height;
    // parcours des pixels (on lit tous les pixels, step 4 = R G B A)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let i = 4 * (x + y * w);
        // luminance approximative pour frame courante
        let r = video.pixels[i];
        let g = video.pixels[i + 1];
        let b = video.pixels[i + 2];
        let lum = (0.299 * r + 0.587 * g + 0.114 * b);

        // luminance de la frame précédente
        let pr = prevFrame.pixels[i] || 0;
        let pg = prevFrame.pixels[i + 1] || 0;
        let pb = prevFrame.pixels[i + 2] || 0;
        let plum = (0.299 * pr + 0.587 * pg + 0.114 * pb);

        sumDiff += abs(lum - plum);
      }
    }

    // moyenne par pixel -> normalisation 0..1 (map)
    let avgDiff = sumDiff / (w * h);
    let motionNormalized = constrain(map(avgDiff, 0, motionMapMax, 0, 1), 0, 1);

    // lissage temporel du signal de mouvement
    motionSmoothed = lerp(motionSmoothed, motionNormalized, 0.25);

    // mettre à jour prevFrame = current frame (copie)
    prevFrame.loadPixels();
    for (let i = 0; i < video.pixels.length; i++) {
      prevFrame.pixels[i] = video.pixels[i];
    }
    prevFrame.updatePixels();

    // déterminer la cible d'alpha du voile : quand mouvement, voile quasi opaque
    if (motionSmoothed > motionThreshold) {
      // valeur d'alpha cible (0..255). 230 = très sombre mais laisse une faible visibilité
      targetAlpha = 230;
    } else {
      targetAlpha = 0;
    }

    // interpolation pour rendre la transition douce
    overlayAlpha = lerp(overlayAlpha, targetAlpha, fadeSpeed);
  }

  // dessine le voile noir semi-transparent sur l'image
  noStroke();
  fill(0, overlayAlpha);
  rect(0, 0, width, height);

  // --- (optionnel) affichage debug — désactiver en prod ---
  // showDebug();
}

function showDebug() {
  // affiche la capture en petit et un texte d'info (utile pour régler les paramètres)
  let sx = width - video.width - 10;
  let sy = 10;
  image(video, sx, sy);
  stroke(255);
  noFill();
  rect(sx, sy, video.width, video.height);

  fill(255);
  noStroke();
  textSize(12);
  textAlign(LEFT, TOP);
  text("motionSmoothed: " + nf(motionSmoothed, 1, 3), 10, 10);
  text("overlayAlpha: " + nf(overlayAlpha, 1, 1), 10, 26);
  text("threshold: " + motionThreshold, 10, 42);
}
