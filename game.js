// Setup canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Resize the canvas to fit the screen
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

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

const monsterImage = new Image();
monsterImage.src = 'images/green-monster.png'; // Ensure the path is correct

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

// Monster object
let monster = {
  x: 400,
  y: 100,
  width: 200,
  height: 100,
  speedX: 3, // Horizontal speed
  speedY: 3, // Vertical speed
  destroyed: false,
};

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

// Function to move the fish
function moveFish() {
  fish.x += fish.dx;
  fish.y += fish.dy;

  // Boundary detection to keep fish within canvas
  if (fish.x < 0) fish.x = 0;
  if (fish.y < 0) fish.y = 0;
  if (fish.x + fish.width > canvas.width) fish.x = canvas.width - fish.width;
  if (fish.y + fish.height > canvas.height) fish.y = canvas.height - fish.height;
}

// Function to move the monster and make it bounce
function moveMonster() {
  if (!monster.destroyed) {
    monster.x += monster.speedX;
    monster.y += monster.speedY;

    // Bounce off the walls horizontally
    if (monster.x < 0 || monster.x + monster.width > canvas.width) {
      monster.speedX *= -1;
    }

    // Bounce off the walls vertically
    if (monster.y < 0 || monster.y + monster.height > canvas.height) {
      monster.speedY *= -1;
    }
  }
}

// Function to detect collision between a cannonball and the monster
function detectCollision(cannonball, monster) {
  return (
    cannonball.x < monster.x + monster.width &&
    cannonball.x + cannonball.width > monster.x &&
    cannonball.y < monster.y + monster.height &&
    cannonball.y + cannonball.height > monster.y
  );
}

// Function to move cannonballs
function moveCannonballs() {
  for (let i = 0; i < cannonballs.length; i++) {
    cannonballs[i].x += cannonballs[i].speed;

    // Check for collision with the monster
    if (!monster.destroyed && detectCollision(cannonballs[i], monster)) {
      // Trigger explosion effect and mark monster as destroyed
      createExplosion(monster.x + monster.width / 2, monster.y + monster.height / 2);
      monster.destroyed = true;

      // Remove the cannonball that hit the monster
      cannonballs.splice(i, 1);
      break;
    }

    // Remove cannonballs that go off screen
    if (cannonballs[i].x > canvas.width) {
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

  // Draw the monster if it's not destroyed
  if (!monster.destroyed) {
    if (monsterImage.complete && monsterImage.naturalWidth > 0) {
      ctx.drawImage(monsterImage, monster.x, monster.y, monster.width, monster.height);
    } else {
      ctx.fillStyle = 'green';
      ctx.fillRect(monster.x, monster.y, monster.width, monster.height);
    }
  }

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
  moveMonster();
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
  monsterImage.onload = function () {
    resizeCanvas(); // Initial canvas size
    gameLoop(); // Start the game loop
  };
};
