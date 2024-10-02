// Setup canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Function to resize the canvas and adjust positions dynamically
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// Load images
const fishImage = new Image();
fishImage.src = 'images/fish-with-cannon.png'; // Path to your fish image

const cannonballImage = new Image();
cannonballImage.src = 'images/cannonball.png'; // Path to your cannonball image

const monsterImage = new Image();
monsterImage.src = 'images/green-monster.png'; // Path to your monster image

// Fish object
let fish = {
  x: 100,
  y: canvas.height / 4,  // 1/4th of the canvas height for the fish
  width: 200,
  height: 100,
  speed: 5,
  dx: 0,  // horizontal movement (delta x)
  dy: 0   // vertical movement (delta y)
};

// Monster object with full movement across the screen
let monster = {
  x: 400,
  y: 100,  // Start higher up so it's not cut off
  width: 200,  // Adjusted to fit better on screen
  height: 100,  // Adjusted to fit better on screen
  speedX: 3, // Speed of the monster horizontally
  speedY: 3, // Speed of the monster vertically
  destroyed: false // Track if the monster has been destroyed
};

let cannonballs = [];

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
      monster.speedX *= -1; // Reverse horizontal direction
    }
    // Bounce off the walls vertically
    if (monster.y < 0 || monster.y + monster.height > canvas.height) {
      monster.speedY *= -1; // Reverse vertical direction
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
      // Mark the monster as destroyed
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
  ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill the entire canvas with the background color

  // Draw the fish or placeholder if the image fails
  if (fishImage.complete && fishImage.naturalWidth > 0) {
    ctx.drawImage(fishImage, fish.x, fish.y, fish.width, fish.height);
  } else {
    // Fallback to drawing a blue rectangle
    ctx.fillStyle = 'blue';
    ctx.fillRect(fish.x, fish.y, fish.width, fish.height);
  }

  // Draw the monster or placeholder if the image fails
  if (!monster.destroyed) {
    if (monsterImage.complete && monsterImage.naturalWidth > 0) {
      ctx.drawImage(monsterImage, monster.x, monster.y, monster.width, monster.height);
    } else {
      // Fallback to drawing a green rectangle
      ctx.fillStyle = 'green';
      ctx.fillRect(monster.x, monster.y, monster.width, monster.height);
    }
  }

  // Draw the cannonballs
  for (let i = 0; i < cannonballs.length; i++) {
    if (cannonballImage.complete && cannonballImage.naturalWidth > 0) {
      ctx.drawImage(cannonballImage, cannonballs[i].x, cannonballs[i].y, cannonballs[i].width, cannonballs[i].height);
    } else {
      // Fallback to drawing a gray rectangle for cannonballs
      ctx.fillStyle = 'gray';
      ctx.fillRect(cannonballs[i].x, cannonballs[i].y, cannonballs[i].width, cannonballs[i].height);
    }
  }
}

// Touch-based movement for mobile devices
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

// On mobile devices, a tap anywhere on the screen will shoot
canvas.addEventListener('touchstart', (event) => {
  shootCannonball();
  event.preventDefault(); // Prevent scrolling on tap
});

// Keyboard controls for movement (desktop)
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

// Start the game loop only after both images are loaded
fishImage.onload = function () {
  monsterImage.onload = function () {
    setTimeout(() => {
      resizeCanvas(); // Call resizeCanvas initially
      gameLoop(); // Start the game loop
    }, 500); // 500ms delay to ensure images load properly
  };
};
