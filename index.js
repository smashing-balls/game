const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

const Score = document.querySelector("#Score");
const startGameBtn = document.querySelector("#startGameBtn");
const RestartGameBtn = document.querySelector("#RestartGameBtn");

const modal = document.querySelector("#modal");
const modalEnd = document.querySelector("#modalEnd");

const LastScore = document.querySelector("#LastScore");

const username = document.getElementById("username");
const valueUsername = document.getElementById("usernameInput");
const usernameForm = document.getElementById("usernameForm");
const musicButton = document.getElementById("musicButton");
const musicIcon = document.getElementById("musicIcon");
const audio = document.getElementById("myAudio");

// Tambahkan event listener untuk mengatasi pengiriman formulir
usernameForm.addEventListener("submit", function (e) {
  e.preventDefault(); // Mencegah tindakan bawaan pengiriman formulir

  // Setel nilai elemen #username dengan nilai input
  username.innerHTML = valueUsername.value;
});

class Player {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
  }

  draw() {
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
  }
}

class Projectile {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }

  draw() {
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
  }

  update() {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}

class Enemy {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }

  draw() {
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
  }

  update() {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}

const friction = 0.98;
class Particle {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.alpha = 1;
  }

  draw() {
    c.save();
    c.globalAlpha = this.alpha;
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
    c.restore();
  }

  update() {
    this.draw();
    this.velocity.x *= friction;
    this.velocity.y *= friction;
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
    this.alpha -= 0.01;
  }
}

const x = canvas.width / 2;
const y = canvas.height / 2;

let player = new Player(x, y, 20, "white");
let projectiles = [];
let enemies = [];
let particles = [];

function init() {
  player = new Player(x, y, 20, "white");
  projectiles = [];
  enemies = [];
  particles = [];
  score = 0;
  Score.innerHTML = score;
  LastScore.innerHTML = score;
}

function spawnEnemies() {
  setInterval(() => {
    const radius = Math.random() * (30 - 7) + 7;

    let x;
    let y;

    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
      y = Math.random() * canvas.height;
      //  y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius
    } else {
      x = Math.random() * canvas.width;
      y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
    }

    // nge random warna musuh
    const color = `hsl(${Math.random() * 360}, 50%, 50%)`;

    const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);

    const velocity = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    };

    enemies.push(new Enemy(x, y, radius, color, velocity));
  }, 1000);
}

let animationId;
let score = 0;
function animate() {
  animationId = requestAnimationFrame(animate);
  c.fillStyle = "rgba(0, 0, 0, 0.1)";
  c.fillRect(0, 0, canvas.width, canvas.height);
  player.draw();
  particles.forEach((particle, index) => {
    if (particle.alpha <= 0) {
      particles.splice(index, 1);
    } else {
      particle.update();
    }
  });
  projectiles.forEach((projectile, index) => {
    projectile.update();

    // ngilangin peluru yang kluar dari layar

    if (projectile.x + projectile.radius < 0 || projectile.x - projectile.radius > canvas.width || projectile.y + projectile.radius < 0 || projectile.y - projectile.radius > canvas.height) {
      setTimeout(() => {
        projectiles.splice(index, 1);
      }, 0);
    }
  });

  enemies.forEach((enemy, index) => {
    enemy.update();

    const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);

    // end game
    if (dist - enemy.radius - player.radius < 1) {
      cancelAnimationFrame(animationId);
      audio.pause();

      LastScore.innerHTML = score;
      modalEnd.style.display = "flex";
    }

    projectiles.forEach((projectile, projectileIndex) => {
      const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);

      // peluru kena musuh
      if (dist - enemy.radius - projectile.radius < 1) {
        // buat ledakan partikel
        for (let i = 0; i < enemy.radius * 2; i++) {
          particles.push(
            new Particle(projectile.x, projectile.y, Math.random() * 2, enemy.color, {
              x: (Math.random() - 0.5) * (Math.random() * 6),
              y: (Math.random() - 0.5) * (Math.random() * 6),
            })
          );
        }

        if (enemy.radius - 10 > 5) {
          // naikin skor
          score += 100;
          Score.innerHTML = score;

          gsap.to(enemy, {
            radius: enemy.radius - 10,
          });
          setTimeout(() => {
            projectiles.splice(projectileIndex, 1);
          }, 0);
        } else {
          setTimeout(() => {
            // bonus point klo nembak yang gede
            score += 200;
            Score.innerHTML = score;
            enemies.splice(index, 1);
            projectiles.splice(projectileIndex, 1);
          }, 0);
        }
      }
    });
  });
}

addEventListener("click", (event) => {
  console.log(projectiles);
  const angle = Math.atan2(event.clientY - canvas.height / 2, event.clientX - canvas.width / 2);
  const velocity = {
    x: Math.cos(angle) * 6,
    y: Math.sin(angle) * 6,
  };
  projectiles.push(new Projectile(canvas.width / 2, canvas.height / 2, 5, "white", velocity));
});

startGameBtn.addEventListener("click", () => {
  init();
  animate();
  spawnEnemies();
  modal.style.display = "none";
  audio.play();

  socket.emit("initGame", document.querySelector("#usernameInput").value);
});

RestartGameBtn.addEventListener("click", function () {
  modalEnd.style.display = "none";
  audio.play();
  window.reload();
});

document.querySelector("#modal").addEventListener("submit", (event) => {
  event.preventDefault();
  console.log(document.querySelector("#usernameInput").value);
});
