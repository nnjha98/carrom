let board;
let striker;
let coins;
let currentPlayer;
let gameState;
let aimAngle;
let powerLevel;

function setup() {
  createCanvas(600, 600);
  initializeGame();
}

function draw() {
  background(220);
  
  displayBoard();
  displayStriker();
  displayCoins();
  displayUI();
  
  switch (gameState) {
    case 'aiming':
      handleAiming();
      break;
    case 'power':
      handlePower();
      break;
    case 'shooting':
      handleShooting();
      break;
    case 'resolving':
      resolveCollisions();
      break;
  }
}

function initializeGame() {
  board = new Board(width * 0.9);
  striker = new Striker(board);
  initializeCoins();
  // coins = [];
  currentPlayer = 1;
  gameState = 'aiming';
  aimAngle = 0;
  powerLevel = 0;
}

function initializeCoins() {
  coins = [];
  let centerX = board.position.x + board.frameWidth + board.playAreaSize / 2;
  let centerY = board.position.y + board.frameWidth + board.playAreaSize / 2;
  let coinRadius = board.playAreaSize * 0.02;
  let gap = coinRadius * 2.2;

  // Queen (red)
  coins.push(new Coin(centerX, centerY, 'red'));

  // Arrange other coins in a circle around the queen
  for (let i = 0; i < 18; i++) {
    let angle = i * TWO_PI / 18;
    let x = centerX + cos(angle) * gap;
    let y = centerY + sin(angle) * gap;
    let color = i % 2 === 0 ? 'black' : 'white';
    coins.push(new Coin(x, y, color));
  }
}

function handleAiming() {
  // TODO: Implement aiming logic
  let dx = mouseX - striker.pos.x;
  let dy = mouseY - striker.pos.y;
  aimAngle = atan2(dy, dx);
}

function handlePower() {
  // TODO: Implement power control logic
  powerLevel = min(powerLevel + 0.02, 1);
}

function handleShooting() {
  // TODO: Implement shooting logic
  striker.shoot(aimAngle, powerLevel * striker.maxSpeed);
  gameState = 'resolving';
}

function resolveCollisions() {
  // TODO: Implement collision detection and resolution
  striker.update();
  striker.checkBoundaryCollision(board);
  
  for (let coin of coins) {
    coin.update();
    coin.checkBoundaryCollision(board);
    checkCollision(striker, coin);
  }
  
  for (let i = 0; i < coins.length; i++) {
    for (let j = i + 1; j < coins.length; j++) {
      checkCollision(coins[i], coins[j]);
    }
  }
  
  if (striker.vel.mag() < 0.1 && coins.every(coin => coin.vel.mag() < 0.1)) {
    striker.vel.set(0, 0);
    coins.forEach(coin => coin.vel.set(0, 0));
    switchTurn();
    gameState = 'aiming';
    powerLevel = 0;
  }
}

function checkCollision(obj1, obj2) {
    let distance = p5.Vector.dist(obj1.pos, obj2.pos);
    let minDistance = obj1.radius + obj2.radius;
    
    if (distance < minDistance) {
      let angle = atan2(obj2.pos.y - obj1.pos.y, obj2.pos.x - obj1.pos.x);
      let overlap = minDistance - distance;
      
      // Separate objects
      let separation = p5.Vector.fromAngle(angle).mult(overlap / 2);
      obj1.pos.sub(separation);
      obj2.pos.add(separation);
      
      // Calculate new velocities
      let normal = p5.Vector.fromAngle(angle);
      let tangent = normal.copy().rotate(HALF_PI);
      
      let v1n = p5.Vector.dot(obj1.vel, normal);
      let v1t = p5.Vector.dot(obj1.vel, tangent);
      let v2n = p5.Vector.dot(obj2.vel, normal);
      let v2t = p5.Vector.dot(obj2.vel, tangent);
      
      let m1 = obj1.mass;
      let m2 = obj2.mass;
      
      let v1nAfter = (v1n * (m1 - m2) + 2 * m2 * v2n) / (m1 + m2);
      let v2nAfter = (v2n * (m2 - m1) + 2 * m1 * v1n) / (m1 + m2);
      
      let v1nVector = normal.copy().mult(v1nAfter);
      let v1tVector = tangent.copy().mult(v1t);
      let v2nVector = normal.copy().mult(v2nAfter);
      let v2tVector = tangent.copy().mult(v2t);
      
      obj1.vel = v1nVector.add(v1tVector);
      obj2.vel = v2nVector.add(v2tVector);
      
      // Apply restitution (bounciness)
      let restitution = 0.8;
      obj1.vel.mult(restitution);
      obj2.vel.mult(restitution);
      
      // Apply speed limit
      obj1.vel.limit(obj1.maxSpeed);
      obj2.vel.limit(obj2.maxSpeed);
    }
  }

function displayBoard() {
  board.display();
}

function displayStriker() {
  // TODO: Draw the striker
  striker.display();
}

function displayCoins() {
  for (let coin of coins) {
    coin.display();
  }
}

function switchTurn() {
  currentPlayer = currentPlayer === 1 ? 2 : 1;
  striker.resetPosition(board, currentPlayer);
}

function displayUI() {
  // TODO: Draw UI elements (player turn, power meter, etc.)
  if (gameState === 'power') {
    fill(255, 0, 0);
    rect(10, height - 30, powerLevel * 100, 20);
  }

  textAlign(CENTER, CENTER);
  textSize(24);
  fill(0);
  text(`Team ${currentPlayer}'s Turn`, width / 2, 30);
}

class Board {
  constructor(size) {
    this.size = size;
    this.position = createVector((width - size) / 2, (height - size) / 2);
    this.frameWidth = size * 0.05;
    this.playAreaSize = size - 2 * this.frameWidth;
    this.pocketRadius = this.playAreaSize * 0.05;
    this.baseLineOffset = this.playAreaSize * 0.15;
    this.baseLineThickness = this.playAreaSize * 0.01;
    this.baseLineGap = this.baseLineThickness * 2;
    this.centerCircleRadius = this.playAreaSize * 0.08;
    this.arrowCircleRadius = this.playAreaSize * 0.02;
    this.restrictedAreaSize = this.playAreaSize * 0.02;
  }
  
  display() {
    push();
    translate(this.position.x, this.position.y);
    
    // Frame
    fill(150, 75, 0);  // Dark wood color
    noStroke();
    rect(0, 0, this.size, this.size);
    
    // Play area
    fill(210, 180, 140);  // Light wood color
    rect(this.frameWidth, this.frameWidth, this.playAreaSize, this.playAreaSize);
    
    // Pockets (sink holes)
    fill(0);
    noStroke();
    circle(this.frameWidth+this.pocketRadius, this.frameWidth+this.pocketRadius, this.pocketRadius * 2);
    circle(this.frameWidth + this.playAreaSize-this.pocketRadius, this.frameWidth+this.pocketRadius, this.pocketRadius * 2);
    circle(this.frameWidth+this.pocketRadius, this.frameWidth + this.playAreaSize-this.pocketRadius, this.pocketRadius * 2);
    circle(this.frameWidth + this.playAreaSize-this.pocketRadius, this.frameWidth + this.playAreaSize-this.pocketRadius, this.pocketRadius * 2);
    
    // Base lines (double lines for striker placement)
    stroke(0);
    strokeWeight(this.baseLineThickness);
    let baseLineStart = this.frameWidth + this.baseLineOffset;
    let baseLineEnd = this.frameWidth + this.playAreaSize - this.baseLineOffset;
    
    // Horizontal base lines
    line(baseLineStart, baseLineStart, baseLineEnd, baseLineStart);
    line(baseLineStart, baseLineStart + this.baseLineGap, baseLineEnd, baseLineStart + this.baseLineGap);
    line(baseLineStart, baseLineEnd, baseLineEnd, baseLineEnd);
    line(baseLineStart, baseLineEnd - this.baseLineGap, baseLineEnd, baseLineEnd - this.baseLineGap);
    
    // Vertical base lines
    line(baseLineStart, baseLineStart, baseLineStart, baseLineEnd);
    line(baseLineStart + this.baseLineGap, baseLineStart, baseLineStart + this.baseLineGap, baseLineEnd);
    line(baseLineEnd, baseLineStart, baseLineEnd, baseLineEnd);
    line(baseLineEnd - this.baseLineGap, baseLineStart, baseLineEnd - this.baseLineGap, baseLineEnd);
    
    // Center circle
    noFill();
    strokeWeight(this.baseLineThickness);
    circle(this.frameWidth + this.playAreaSize / 2, this.frameWidth + this.playAreaSize / 2, this.centerCircleRadius * 2);
    
    // Arrow circles
    let arrowCircleOffset = this.playAreaSize / 4;
    //TL
    circle(baseLineStart+this.baseLineGap*2, baseLineStart+this.baseLineGap/2, this.baseLineGap*1.2);
    circle(baseLineStart+this.baseLineGap/2, baseLineStart+this.baseLineGap*2, this.baseLineGap*1.2);
    
    //TR
    circle(baseLineEnd-this.baseLineGap*2, baseLineStart+this.baseLineGap/2, this.baseLineGap*1.2);
    circle(baseLineEnd-this.baseLineGap/2, baseLineStart+this.baseLineGap*2, this.baseLineGap*1.2);
    
    //BL
    circle(baseLineStart+this.baseLineGap*2, baseLineEnd-this.baseLineGap/2, this.baseLineGap*1.2);
    circle(baseLineStart+this.baseLineGap/2, baseLineEnd-this.baseLineGap*2, this.baseLineGap*1.2);
   
    //BR
    circle(baseLineEnd-this.baseLineGap*2,baseLineEnd-this.baseLineGap/2, this.baseLineGap*1.2);
    circle(baseLineEnd-this.baseLineGap/2,baseLineEnd-this.baseLineGap*2, this.baseLineGap*1.2);
    
    // Restricted areas
    fill(255, 0, 0, 100);  // Semi-transparent red
    noStroke();
    rect(this.frameWidth, this.frameWidth, this.restrictedAreaSize, this.restrictedAreaSize);
    rect(this.frameWidth + this.playAreaSize - this.restrictedAreaSize, this.frameWidth, this.restrictedAreaSize, this.restrictedAreaSize);
    rect(this.frameWidth, this.frameWidth + this.playAreaSize - this.restrictedAreaSize, this.restrictedAreaSize, this.restrictedAreaSize);
    rect(this.frameWidth + this.playAreaSize - this.restrictedAreaSize, this.frameWidth + this.playAreaSize - this.restrictedAreaSize, this.restrictedAreaSize, this.restrictedAreaSize);
    
    pop();
  }
}

class Striker {
  constructor(board) {
    this.radius = board.playAreaSize * 0.03;
    this.pos = createVector(board.position.x + board.frameWidth + board.playAreaSize / 2, 
                            board.position.y + board.frameWidth + board.playAreaSize - board.baseLineOffset);
    this.vel = createVector(0, 0);
    this.maxSpeed = 30;
    this.friction = 0.985;
    this.board = board;
    this.mass = 4;
    this.resetPosition(board, 1);
  }
  
  move(direction) {
    let newX = this.pos.x + direction * 5;
    let minX = this.board.position.x + this.board.frameWidth + this.board.baseLineOffset;
    let maxX = this.board.position.x + this.board.frameWidth + this.board.playAreaSize - this.board.baseLineOffset;
    this.pos.x = constrain(newX, minX, maxX);
  }
  
  shoot(angle, power) {
    this.vel = p5.Vector.fromAngle(angle).mult(power);
  }
  
  update() {
    this.pos.add(this.vel);
    this.vel.mult(this.friction);
    this.vel.limit(this.maxSpeed);
  }

  resetPosition(board, player) {
    let x = board.position.x + board.frameWidth + board.playAreaSize / 2;
    let y;
    if (player === 1) {
      y = board.position.y + board.frameWidth + board.playAreaSize - board.baseLineOffset;
    } else {
      y = board.position.y + board.frameWidth + board.baseLineOffset;
    }
    this.pos = createVector(x, y);
  }
  
  checkBoundaryCollision(board) {
    let minX = board.position.x + board.frameWidth + this.radius;
    let maxX = board.position.x + board.frameWidth + board.playAreaSize - this.radius;
    let minY = board.position.y + board.frameWidth + this.radius;
    let maxY = board.position.y + board.frameWidth + board.playAreaSize - this.radius;
    
    if (this.pos.x < minX || this.pos.x > maxX) {
      this.vel.x *= -1;
      this.pos.x = constrain(this.pos.x, minX, maxX);
    }
    if (this.pos.y < minY || this.pos.y > maxY) {
      this.vel.y *= -1;
      this.pos.y = constrain(this.pos.y, minY, maxY);
    }
  }
  
  display() {
    fill(255);
    stroke(0);
    strokeWeight(2);
    circle(this.pos.x, this.pos.y, this.radius * 2);
  }
}

class Coin {
  constructor(x, y, color) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.radius = 10;
    this.color = color;
    this.friction = 0.985;
    this.mass = 1;
    this.maxSpeed = 25;
  }
  
  update() {
    this.pos.add(this.vel);
    this.vel.mult(this.friction);
    this.vel.limit(this.maxSpeed);
  }
  
  checkBoundaryCollision(board) {
    let minX = board.position.x + board.frameWidth + this.radius;
    let maxX = board.position.x + board.frameWidth + board.playAreaSize - this.radius;
    let minY = board.position.y + board.frameWidth + this.radius;
    let maxY = board.position.y + board.frameWidth + board.playAreaSize - this.radius;
    
    if (this.pos.x < minX || this.pos.x > maxX) {
      this.vel.x *= -1;
      this.pos.x = constrain(this.pos.x, minX, maxX);
    }
    if (this.pos.y < minY || this.pos.y > maxY) {
      this.vel.y *= -1;
      this.pos.y = constrain(this.pos.y, minY, maxY);
    }
  }
  
  display() {
    fill(this.color);
    stroke(0);
    strokeWeight(1);
    circle(this.pos.x, this.pos.y, this.radius * 2);
  }
}

function mousePressed() {
  // TODO: Handle mouse input for aiming and shooting
  if (gameState === 'aiming') {
    gameState = 'power';
  }
}

function mouseReleased() {
  if (gameState === 'power') {
    gameState = 'shooting';
  }
}

function keyPressed() {
  if (gameState === 'aiming') {
    if (keyCode === LEFT_ARROW) {
      striker.move(-1);
    } else if (keyCode === RIGHT_ARROW) {
      striker.move(1);
    }
  }
}