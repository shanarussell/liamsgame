// Setup canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Resize the canvas to fit the screen
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// Define the restricted area where the life force boxes are located
const restrictedArea = {
  x: 0,
  y: 0,
  width: window.innerWidth,
  height: 80 // Adjust this based on the height of your life force boxes
};

// Fragment object to handle explosion particles
class Fragment {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 20 + 10; // Random size for fragments
    this.speedX = (Math.random() - 0.5) * 10; // Random speed/direction
    this.speedY = (Math.random() - 0.5) * 10; // Random speed/direction
    this.opacity = 1; // Initial opacity for fade-out
    this.fadeRate = 0.03; // Rate at which the fragment fades
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.opacity -= this.fadeRate; // Gradually fade out the fragment
  }

  draw() {
    if (this.opacity > 0) {
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = 'orange'; // Explosion fragment color
      ctx.fillRect(this.x, this.y, this.size, this.size);
      ctx.globalAlpha = 1; // Reset opacity after drawing
    }
  }
}

// Load sounds
const ackSound = new Audio('sounds/ack.m4a');
const greenMonsterSound = new Audio('sounds/Green monkey death line.m4a');
const magentaMonsterSound = new Audio('sounds/Magenta death line.m4a');
const purpleMonsterSound = new Audio('sounds/Gorlila death line.m4a');

// Assign a default death sound for monsters without a specific sound
const defaultDeathSound = magentaMonsterSound;

// Load revive sounds
const greenMonsterReviveSound = new Audio('sounds/Green monkey revive.m4a');
const magentaMonsterReviveSound = new Audio('sounds/Magenta revive line.m4a');
const genericReviveSound = new Audio('sounds/Monkey revive line.m4a');

// Array of revive sounds for random selection
const reviveSounds = [
    new Audio('sounds/Monkey revive line.m4a'),
    new Audio('sounds/Other revive sound 1.m4a'),
    new Audio('sounds/Other revive sound 2.m4a'),
];



let destroyedCount = 0;

let fragments = []; // Array to store explosion fragments

// Allow audio playback on user interaction
window.addEventListener('click', () => {
  greenMonsterSound.play().catch(() => {}); // Attempt playback silently
});

// Create explosion effect
function createExplosion(x, y) {
  for (let i = 0; i < 20; i++) {
    fragments.push(new Fragment(x, y));
  }
}

// Load images
const fishImage = new Image();
fishImage.src = 'images/fish-with-cannon.png';

const cannonballImage = new Image();
cannonballImage.src = 'images/cannonball.png';

const monsterImages = [
  { src: 'images/green-monster.png', name: 'green', color: '#00FF00' },
  { src: 'images/monster-2.png', name: 'blue', color: '#0000FF' },
  { src: 'images/monster-3.png', name: 'purple', color: '#800080' },
  { src: 'images/monster-4.png', name: 'yellow', color: '#FFFF00' },
  { src: 'images/monster-5.png', name: 'magenta', color: '#FF00FF' }
].map(data => {
  const img = new Image();
  img.src = data.src;
  return { ...data, img };
});

// Fish object
const fish = {
  x: 100,
  y: canvas.height / 4,
  width: 200,
  height: 100,
  speed: 5,
  dx: 0,
  dy: 0,
};

// Initialize hearts for each monster
function initializeHearts() {
  monsterImages.forEach(({ name }) => {
    updateLifeForce(name, 0);
  });
}

// Update life force hearts for each monster
function updateLifeForce(monsterName, hitCount) {
  const heartsContainer = document.querySelector(`.hearts[data-monster="${monsterName}"]`);
  heartsContainer.innerHTML = ''; // Clear existing hearts

  for (let i = 0; i < 5; i++) {
    const heart = document.createElement('div');
    heart.classList.add('heart');
    if (i < hitCount) heart.classList.add('lost'); // Mark as lost
    heartsContainer.appendChild(heart);
  }
}

// Monster class
class Monster {
  constructor(image, x, y, width, height, speedX, speedY, name, color) {
    this.image = image;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speedX = speedX;
    this.speedY = speedY;
    this.destroyed = false;
    this.hitCount = 0;
    this.maxLife = 5;
    this.name = name;
    this.color = color;
  }

  move() {
    if (!this.destroyed) {
      this.x += this.speedX;
      this.y += this.speedY;

      // Horizontal boundaries
      if (this.x < 0 || this.x + this.width > canvas.width) {
        this.speedX *= -1;
        this.x = Math.max(0, Math.min(this.x, canvas.width - this.width));
      }

      // Vertical boundaries
      if (this.y < restrictedArea.height || this.y + this.height > canvas.height) {
        this.speedY *= -1;
        this.y = Math.max(restrictedArea.height, Math.min(this.y, canvas.height - this.height));
      }
    }
  }

  draw() {
    if (!this.destroyed) {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
  }

  checkCollision(cannonball) {
    return (
      cannonball.x < this.x + this.width &&
      cannonball.x + cannonball.width > this.x &&
      cannonball.y < this.y + this.height &&
      cannonball.y + cannonball.height > this.y
    );
  }

  onHit() {
    this.hitCount++;
    updateLifeForce(this.name, this.hitCount); // Update the CSS hearts

    // Play "ack" sound for all monsters on hits 1 through 4
    if (this.hitCount < this.maxLife) {
        ackSound.play();
    }

    // Handle specific sounds for the 5th hit
    if (this.hitCount >= this.maxLife) {
        switch (this.name) {
            case 'green':
                greenMonsterSound.play();
                break;
            case 'magenta':
                magentaMonsterSound.play();
                break;
            case 'purple':
                purpleMonsterSound.play();
                break;
            default:
                defaultDeathSound.play(); // Default sound for others
                break;
        }
        this.destroyed = true;
        destroyedCount++; // Increment destroyed count

        // Check if all monsters are destroyed
        if (destroyedCount === monsterImages.length) {
            setTimeout(restartGame, 2000); // Restart game after delay
        }
    }
}



}


function restartGame() {
  destroyedCount = 0; // Reset destroyed count
  monsters = []; // Clear existing monsters
  currentMonsterIndex = 0; // Reset monster index

  // Add all monsters again
  monsterImages.forEach(({ img, name, color }) => {
      const newMonster = new Monster(
          img,
          Math.random() * canvas.width,
          Math.random() * (canvas.height - restrictedArea.height) + restrictedArea.height,
          200, 100,
          (Math.random() * 2 + 1) * (Math.random() > 0.5 ? 1 : -1),
          (Math.random() * 2 + 1) * (Math.random() > 0.5 ? 1 : -1),
          name, color
      );
      monsters.push(newMonster);

      // Play revive sound based on monster type
      switch (name) {
          case 'green':
              greenMonsterReviveSound.play();
              break;
          case 'magenta':
              magentaMonsterReviveSound.play();
              break;
          default:
              // Play a random revive sound for others
              const randomSound = reviveSounds[Math.floor(Math.random() * reviveSounds.length)];
              randomSound.play();
              break;
      }
  });

  // Start the game loop again
  gameLoop();
}


// Monsters array and index
let monsters = [];
let currentMonsterIndex = 0;

function addMonster() {
  if (currentMonsterIndex < monsterImages.length) {
    const { img, name, color } = monsterImages[currentMonsterIndex];
    const newMonster = new Monster(
      img,
      Math.random() * canvas.width,
      Math.random() * (canvas.height - restrictedArea.height) + restrictedArea.height,
      200, 100,
      (Math.random() * 2 + 1) * (Math.random() > 0.5 ? 1 : -1),
      (Math.random() * 2 + 1) * (Math.random() > 0.5 ? 1 : -1),
      name, color
    );
    monsters.push(newMonster);
    currentMonsterIndex++;
    if (currentMonsterIndex < monsterImages.length) setTimeout(addMonster, 5000);
  }
}

// Cannonballs array
let cannonballs = [];

// Cannonball shooting
function shootCannonball() {
  cannonballs.push({
    x: fish.x + fish.width,
    y: fish.y + fish.height / 2,
    width: 20,
    height: 20,
    speed: 10
  });
}

// Fish movement
function moveFish() {
  fish.x += fish.dx;
  fish.y += fish.dy;

  if (fish.y < restrictedArea.height) fish.y = restrictedArea.height;
  if (fish.x < 0) fish.x = 0;
  if (fish.x + fish.width > canvas.width) fish.x = canvas.width - fish.width;
  if (fish.y + fish.height > canvas.height) fish.y = canvas.height - fish.height;
}

// Cannonball movement
function moveCannonballs() {
  for (let i = 0; i < cannonballs.length; i++) {
    cannonballs[i].x += cannonballs[i].speed;

    for (const monster of monsters) {
      if (!monster.destroyed && monster.checkCollision(cannonballs[i])) {
        createExplosion(monster.x + monster.width / 2, monster.y + monster.height / 2);
        monster.onHit();
        cannonballs.splice(i, 1);
        break;
      }
    }

    if (cannonballs[i] && cannonballs[i].x > canvas.width) {
      cannonballs.splice(i, 1);
      i--;
    }
  }
}

// Draw the game
function drawGame() {
  ctx.fillStyle = '#34bcec';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (fishImage.complete && fishImage.naturalWidth > 0) {
    ctx.drawImage(fishImage, fish.x, fish.y, fish.width, fish.height);
  } else {
    ctx.fillStyle = 'blue';
    ctx.fillRect(fish.x, fish.y, fish.width, fish.height);
  }

  monsters.forEach(monster => {
    monster.move();
    monster.draw();
  });

  for (const cannonball of cannonballs) {
    if (cannonballImage.complete && cannonballImage.naturalWidth > 0) {
      ctx.drawImage(cannonballImage, cannonball.x, cannonball.y, cannonball.width, cannonball.height);
    } else {
      ctx.fillStyle = 'gray';
      ctx.fillRect(cannonball.x, cannonball.y, cannonball.width, cannonball.height);
    }
  }

  for (let i = fragments.length - 1; i >= 0; i--) {
    fragments[i].update();
    fragments[i].draw();
    if (fragments[i].opacity <= 0) fragments.splice(i, 1);
  }
}

// Main game loop
function gameLoop() {
  drawGame();
  moveFish();
  moveCannonballs();
  requestAnimationFrame(gameLoop);
}

// Event listeners
window.addEventListener('resize', resizeCanvas);

window.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW': fish.dy = -fish.speed; break;
    case 'ArrowDown':
    case 'KeyS': fish.dy = fish.speed; break;
    case 'ArrowLeft':
    case 'KeyA': fish.dx = -fish.speed; break;
    case 'ArrowRight':
    case 'KeyD': fish.dx = fish.speed; break;
    case 'Space': shootCannonball(); break;
  }
});

window.addEventListener('keyup', (event) => {
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW':
    case 'ArrowDown':
    case 'KeyS': fish.dy = 0; break;
    case 'ArrowLeft':
    case 'KeyA':
    case 'ArrowRight':
    case 'KeyD': fish.dx = 0; break;
  }
});

canvas.addEventListener('touchmove', (event) => {
  event.preventDefault();
  const touch = event.touches[0];
  const rect = canvas.getBoundingClientRect();
  fish.x = touch.clientX - rect.left - fish.width / 2;
  fish.y = touch.clientY - rect.top - fish.height / 2;

  if (fish.x < 0) fish.x = 0;
  if (fish.y < restrictedArea.height) fish.y = restrictedArea.height;
  if (fish.x + fish.width > canvas.width) fish.x = canvas.width - fish.width;
  if (fish.y + fish.height > canvas.height) fish.y = canvas.height - fish.height;
});

canvas.addEventListener('touchstart', (event) => {
  event.preventDefault();
  shootCannonball();
});

// Start game
fishImage.onload = function () {
  Promise.all(monsterImages.map(({ img }) => new Promise(resolve => img.onload = resolve)))
    .then(() => {
      resizeCanvas();
      initializeHearts();
      addMonster();
      gameLoop();
    });
};
