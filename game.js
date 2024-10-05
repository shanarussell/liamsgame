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
    this.x += this.speedX; // Move fragment horizontally
    this.y += this.speedY; // Move fragment vertically
    this.opacity -= this.fadeRate; // Gradually fade out the fragment
  }

  draw() {
    if (this.opacity > 0) {
      ctx.globalAlpha = this.opacity; // Set the opacity for fade-out effect
      ctx.fillStyle = 'orange'; // Explosion fragment color
      ctx.fillRect(this.x, this.y, this.size, this.size); // Draw fragment
      ctx.globalAlpha = 1; // Reset opacity after drawing
    }
  }
}

let fragments = []; // Array to store explosion fragments

function createExplosion(x, y) {
  for (let i = 0; i < 20; i++) {
    fragments.push(new Fragment(x, y)); // Create multiple fragments
  }
}

// Load images
const fishImage = new Image();
fishImage.src = 'images/fish-with-cannon.png'; // Ensure the path is correct

const cannonballImage = new Image();
cannonballImage.src = 'images/cannonball.png'; // Ensure the path is correct

const monsterImages = [
  { src: 'images/green-monster.png', name: 'green', color: '#00FF00' }, // Green monster
  { src: 'images/monster-2.png', name: 'blue', color: '#0000FF' }, // Blue monster
  { src: 'images/monster-3.png', name: 'purple', color: '#800080' }, // Purple monster
  { src: 'images/monster-4.png', name: 'yellow', color: '#FFFF00' }, // Yellow monster
  { src: 'images/monster-5.png', name: 'magenta', color: '#FF00FF' }  // Magenta monster
].map(data => {
  const img = new Image();
  img.src = data.src;
  return { ...data, img };
});

// Fish object
let fish = {
  x: 100,
  y: canvas.height / 4,
  width: 200,
  height: 100,
  speed: 5,
  dx: 0, // Movement in X direction
  dy: 0, // Movement in Y direction
};

// Initialize hearts for every monster at the start of the game
function initializeHearts() {
  monsterImages.forEach(({ name }) => {
    updateLifeForce(name, 0); // Set all monsters to 0 hits (full hearts)
  });
}

// Function to update the CSS-based life force hearts for each monster
function updateLifeForce(monsterName, hitCount) {
  const heartsContainer = document.querySelector(`.hearts[data-monster="${monsterName}"]`);
  
  // Clear existing hearts
  heartsContainer.innerHTML = '';

  // Add hearts dynamically based on life left
  for (let i = 0; i < 5; i++) {
    const heart = document.createElement('div');
    heart.classList.add('heart');
    
    // Add the "lost" class for hearts that represent lost life
    if (i < hitCount) {
      heart.classList.add('lost');
    }
    
    heartsContainer.appendChild(heart);
  }
}

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
    this.hitCount = 0; // Track how many times the monster is hit
    this.maxLife = 5; // Total hearts
    this.name = name;
    this.color = color; // Name color
  }

  move() {
    if (!this.destroyed) {
      this.x += this.speedX;
      this.y += this.speedY;

      // Bounce off the walls horizontally
      if (this.x < 0 || this.x + this.width > canvas.width) {
        this.speedX *= -1;
      }

      // Bounce off the walls vertically and avoid the restricted area
      if (this.y < restrictedArea.height || this.y + this.height > canvas.height) {
        this.speedY *= -1;
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
    if (this.hitCount >= this.maxLife) {
      this.destroyed = true;
    } else {
      this.destroyed = true;
      setTimeout(() => {
        this.destroyed = false;
      }, 5000); // Respawn after 5 seconds
    }
  }
}

// Keep track of active monsters and the current monster index
let monsters = [];
let currentMonsterIndex = 0;

// Function to add a new monster every 5 seconds
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

    if (currentMonsterIndex < monsterImages.length) {
      setTimeout(addMonster, 5000);
    }
  }
}

let cannonballs = []; // Store the cannonballs

// Function to shoot cannonballs
function shootCannonball() {
  cannonballs.push({
    x: fish.x + fish.width,
    y: fish.y + fish.height / 2,
    width: 20,
    height: 20,
    speed: 10
  });
}

// Function to move the fish and prevent it from moving behind life bars
function moveFish() {
  fish.x += fish.dx;
  fish.y += fish.dy;

  // Prevent the fish from entering the restricted area at the top
  if (fish.y < restrictedArea.height) fish.y = restrictedArea.height;

  // Boundary detection to keep fish within canvas
  if (fish.x < 0) fish.x = 0;
  if (fish.y + fish.height > canvas.height) fish.y = canvas.height - fish.height;
  if (fish.x + fish.width > canvas.width) fish.x = canvas.width - fish.width;
}

// Function to move the cannonballs
function moveCannonballs() {
  for (let i = 0; i < cannonballs.length; i++) {
    cannonballs[i].x += cannonballs[i].speed;

    // Check for collision with any monster
    for (let monster of monsters) {
      if (!monster.destroyed && monster.checkCollision(cannonballs[i])) {
        createExplosion(monster.x + monster.width / 2, monster.y + monster.height / 2);
        monster.onHit();
        cannonballs.splice(i, 1);
        break;
      }
    }

    // Remove cannonballs that go off screen
    if (cannonballs[i] && cannonballs[i].x > canvas.width) {
      cannonballs.splice(i, 1);
      i--;
    }
  }
}

// Function to draw the game
function drawGame() {
  // Set background color
  ctx.fillStyle = '#34bcec';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw the fish
  if (fishImage.complete && fishImage.naturalWidth > 0) {
    ctx.drawImage(fishImage, fish.x, fish.y, fish.width, fish.height);
  } else {
    ctx.fillStyle = 'blue';
    ctx.fillRect(fish.x, fish.y, fish.width, fish.height);
  }

  // Draw the monsters
  monsters.forEach(monster => {
    monster.move();
    monster.draw();
  });

  // Draw the cannonballs
  for (let i = 0; i < cannonballs.length; i++) {
    if (cannonballImage.complete && cannonballImage.naturalWidth > 0) {
      ctx.drawImage(cannonballImage, cannonballs[i].x, cannonballs[i].y, cannonballs[i].width, cannonballs[i].height);
    } else {
      ctx.fillStyle = 'gray';
      ctx.fillRect(cannonballs[i].x, cannonballs[i].y, cannonballs[i].width, cannonballs[i].height);
    }
  }

  // Draw and update fragments for explosion
  for (let i = fragments.length - 1; i >= 0; i--) {
    fragments[i].update();
    fragments[i].draw();

    // Remove fragments once they are fully faded out
    if (fragments[i].opacity <= 0) {
      fragments.splice(i, 1);
    }
  }
}

// Main game loop
function gameLoop() {
  drawGame();
  moveFish();
  moveCannonballs();
  requestAnimationFrame(gameLoop);
}

// Resize the canvas when the window is resized
window.addEventListener('resize', resizeCanvas);

// Add keyboard controls for moving the fish (desktop)
window.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW':
      fish.dy = -fish.speed;
      break;
    case 'ArrowDown':
    case 'KeyS':
      fish.dy = fish.speed;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      fish.dx = -fish.speed;
      break;
    case 'ArrowRight':
    case 'KeyD':
      fish.dx = fish.speed;
      break;
    case 'Space':
      shootCannonball();
      break;
  }
});

window.addEventListener('keyup', (event) => {
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW':
    case 'ArrowDown':
    case 'KeyS':
      fish.dy = 0;
      break;
    case 'ArrowLeft':
    case 'KeyA':
    case 'ArrowRight':
    case 'KeyD':
      fish.dx = 0;
      break;
  }
});

// Touch-based movement for mobile
canvas.addEventListener('touchmove', (event) => {
  event.preventDefault(); // Prevent scrolling

  const touch = event.touches[0];
  const rect = canvas.getBoundingClientRect();

  // Set fish position to follow the touch position
  fish.x = touch.clientX - rect.left - fish.width / 2;
  fish.y = touch.clientY - rect.top - fish.height / 2;

  // Boundary detection to keep fish within canvas
  if (fish.x < 0) fish.x = 0;
  if (fish.y < 0) fish.y = 0;
  if (fish.x + fish.width > canvas.width) fish.x = canvas.width - fish.width;
  if (fish.y + fish.height > canvas.height) fish.y = canvas.height - fish.height;
});

// Touch-based shooting for mobile
canvas.addEventListener('touchstart', (event) => {
  event.preventDefault(); // Prevent scrolling

  // Shoot a cannonball when the user taps on the screen
  shootCannonball();
});

// Start the game loop after images are loaded
fishImage.onload = function () {
  Promise.all(monsterImages.map(({ img }) => new Promise(resolve => img.onload = resolve)))
    .then(() => {
      resizeCanvas(); // Initial canvas size
      initializeHearts(); // Initialize the life bars with hearts at the start
      addMonster(); // Start adding monsters every 5 seconds
      gameLoop(); // Start the game loop
    });
};
