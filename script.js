function load() {
    let type = "WebGL";
    if (!PIXI.utils.isWebGLSupported()) {
        type = "canvas"
    }

    PIXI.utils.sayHello(type);

    let app = new PIXI.Application({
            width: window.innerWidth,
            height: window.innerHeight,
            antialias: true,
            transparent: false,
            resolution: 1,
            sortableChildren: true
        }
    );

    document.body.appendChild(app.view);

    PIXI.loader
        .add("images/cat.png")
        .add("images/earth.png")
        .add("images/gun.png")
        .add("images/asteroid.png")
        .add("images/bullets.png")
        .add("images/boom.png")
        .add("images/back.png")
        .load(setup);

    let earth;
    let back;
    let text;
    let bestCount = localStorage.getItem("spaceGameBestCount");
    let bulletCount = 0;

    let phi = 0;

    let screenArr = [
        {
            left: 140,
            top: 290,
            width: 25,
            height: 25,
        },
        {
            left: 164,
            top: 290,
            width: 25,
            height: 25,
        },
        {
            left: 190,
            top: 290,
            width: 25,
            height: 25,
        },
        {
            left: 115,
            top: 290,
            width: 25,
            height: 25,
        }];

    let play = true;
    let state = "pause";
    let gameOver = false;

    let count = 0;
    let time = +(new Date());
    let timeInterval = 650;
    let newTime = time + timeInterval;
    let time1 = +(new Date());
    let timeInterval1 = 1000;
    let newTime1 = time1 + timeInterval1;
    let bulletSounds = [];
    let boomSounds = [];

    let asteroidsObj = {};
    let bulletsObj = {};

    let centerX = window.innerWidth / 2;
    let centerY = window.innerHeight / 2;

    function setup() {
        let cat = new PIXI.Sprite(PIXI.loader.resources["images/cat.png"].texture);
        let r = 40 * Math.cos(phi);
        let gun = new PIXI.Sprite(PIXI.loader.resources["images/gun.png"].texture);

        window.addEventListener('mousemove', (e) => {
            if (play) {
                let radian = Math.atan2(-centerX + e.clientX, centerY - e.clientY) - Math.PI / 2;
                gun.x = centerX + 120 * Math.cos(radian);
                gun.y = centerY + 120 * Math.sin(radian);
                gun.radian = radian;
                gun.rotation = radian + Math.PI / 2;
            }
        });


        class Earth {
            constructor(radius, obj) {
                this.current = obj;
                this.radius = radius;
                obj.width = radius * 2;
                obj.height = radius * 2;
                obj.anchor.x = .5;
                obj.anchor.y = .5;
                obj.x = centerX;
                obj.y = centerY;
            }

            update() {
                this.current.rotation = phi / 5;
            }
        }

        function asteroidDestroy(id, obj) {
            app.stage.removeChild(obj);
            delete asteroidsObj[id];
        }

        class Asteroid {
            constructor(x, y, radius, id, obj) {
                this.current = obj;
                this.id = id;
                this.phi = Math.atan2(y - centerY, x - centerX) + Math.random() * 0.2;
                this.radius = radius;
                this.speed = 5 * Math.random() + 1;
                this.active = true;
                this.rotationSpeed = (Math.random() - .5) / 10;
                obj.x = x;
                obj.y = y;
                obj.anchor.x = .5;
                obj.anchor.y = .5;
                obj.width = 2 * radius;
                obj.height = 2 * radius;
            }

            update() {
                this.current.rotation += this.rotationSpeed;
                this.current.x -= this.speed * Math.cos(this.phi);
                this.current.y -= this.speed * Math.sin(this.phi);
            }

            destroy() {
                this.active = false;

                if (boomSounds[count % boomSounds.length]) {
                    boomSounds[count % boomSounds.length].play();
                }

                animate({
                    duration: 200,
                    timing(timeFraction) {
                        return timeFraction;
                    },
                    draw: (progress) => {
                        let texture = PIXI.Texture.from('images/boom.png');
                        texture.frame = new PIXI.Rectangle(192 * ((Math.ceil(progress * 7 - .5)) % 5),
                            192 * Math.ceil((Math.ceil(progress * 7 - .5)) / 5 - .5), 192, 192);
                        this.current.texture = texture;
                    },
                    end: () => asteroidDestroy(this.id, this.current)
                });
            }
        }

        class Bullet {
            constructor(radian, radius, speed, id, obj) {
                this.current = obj;
                this.speed = speed;
                this.id = id;
                this.radius = radius;
                this.radian = radian;
                this.active = true;
                obj.anchor.x = .5;
                obj.anchor.y = .5;
                obj.x = centerX + 150 * Math.cos(radian);
                obj.y = centerY + 150 * Math.sin(radian);
                obj.width = radius * 2;
                obj.height = radius * 2;
            }

            update() {
                this.current.x += this.speed * Math.cos(this.radian);
                this.current.y += this.speed * Math.sin(this.radian);
            }
        }

        function init() {
            earth = new Earth(100, new PIXI.Sprite(PIXI.loader.resources["images/earth.png"].texture));
            back = new PIXI.Sprite(PIXI.loader.resources["images/back.png"].texture);

            back.x = 0;
            back.y = 0;

            gun.anchor.x = .5;
            gun.anchor.y = .5;
            gun.x = centerX;
            gun.y = centerY - 120;
            gun.radian = -Math.PI / 2;

            cat.x = centerX + r * Math.cos(phi);
            cat.y = centerY + r * Math.sin(phi);
            cat.anchor.x = .5;
            cat.anchor.y = .5;

            text = new PIXI.Text('Click to start', {
                fontFamily: 'Helvetica',
                fontSize: 24,
                fill: 'white',
                align: 'center',
            });
            text.x = window.innerWidth - text.width * 1.5;
            text.y = 30;
            text.zIndex = 1000;
            text.style.fontSize = 24;
            text.anchor.x = .5;

            app.stage.addChild(back);
            app.stage.addChild(text);
            app.stage.addChild(cat);
            app.stage.addChild(earth.current);
            app.stage.addChild(gun);


            for (let i = 1; i < 5; i++) {
                let start = 0;
                let end = 1;

                let sound = document.getElementById("laser" + i);
                sound.pause();
                if (sound) {
                    sound.currentTime = start;
                    sound.playbackRate = 1.0;

                    sound.addEventListener('timeupdate', function () {
                        if (this.currentTime >= end) {
                            this.pause();
                            this.currentTime = start;
                        }
                    });

                    bulletSounds.push(sound);
                }
            }

            for (let i = 1; i < 3; i++) {
                let end = .2;
                let sound = document.getElementById("boom" + i);
                if (sound) {
                    sound.pause();
                    sound.currentTime = 0;
                    sound.volume = .5;
                    sound.playbackRate = 1.5;
                    sound.addEventListener('timeupdate', function () {
                        if (this.currentTime >= end) {
                            this.pause();
                            this.currentTime = 0;
                        }
                    });
                    boomSounds.push(sound);
                }
            }
        }

        if (bulletSounds.length === 0) {
            init();
        }

        function loop() {
            app.stage.removeChild(text);
            text.text = "Count: " + count + (bestCount ? "\nBest: " + bestCount : '');
            phi += .005;
            r = 400 * Math.cos(6 * phi);
            let dr = -400 * 6 * Math.sin(6 * phi);
            let x = r * Math.cos(phi);
            let y = r * Math.sin(phi);

            if (Object.keys(bulletsObj).length < 20 && Math.abs(time - newTime) > timeInterval) {
                let param = screenArr[bulletCount % screenArr.length];
                let texture = new PIXI.Texture(PIXI.loader.resources["images/bullets.png"].texture,
                    new PIXI.Rectangle(param.left, param.top, param.width, param.height));
                let bullet = new Bullet(gun.radian, 20, 5, time, new PIXI.Sprite(texture));
                app.stage.addChild(bullet.current);
                bulletsObj[time] = bullet;
                time = newTime;
                if (bulletSounds[bulletCount % bulletSounds.length]) {
                    bulletSounds[bulletCount % bulletSounds.length].play();
                }
                bulletCount++;
            }
            newTime = +(new Date());

            if (Object.keys(asteroidsObj).length < 10 && Math.abs(time1 - newTime1) > timeInterval1) {
                let radius = 50 * Math.random() + 50;
                let phi = Math.random() * .5 * Math.PI;
                let angle = Math.atan2(window.innerHeight, window.innerWidth);
                let asteroid;
                if (phi <= angle) {
                    asteroid = Math.random() - .5 > 0 ?
                        new Asteroid(window.innerWidth + radius, window.innerHeight * Math.random(), radius, time1,
                            new PIXI.Sprite(PIXI.loader.resources["images/asteroid.png"].texture))
                        : new Asteroid(-radius, window.innerHeight * Math.random(), radius, time1,
                            new PIXI.Sprite(PIXI.loader.resources["images/asteroid.png"].texture))
                } else {
                    asteroid = Math.random() - .5 > 0 ?
                        new Asteroid(window.innerWidth * Math.random(), window.innerHeight + radius, radius, time1,
                            new PIXI.Sprite(PIXI.loader.resources["images/asteroid.png"].texture))
                        : new Asteroid(-window.innerWidth * Math.random(), -radius, radius, time1,
                            new PIXI.Sprite(PIXI.loader.resources["images/asteroid.png"].texture))
                }
                app.stage.addChild(asteroid.current);
                asteroidsObj[time1] = asteroid;
                time1 = newTime1;
            }
            newTime1 = +(new Date());

            let dx = dr - r * Math.sin(phi);
            let dy = dr + r * Math.cos(phi);

            cat.x = centerX - cat.width / 2 + x;
            cat.y = centerY - cat.height / 2 + y;
            cat.rotation = -Math.atan2(dx, dy);

            earth.update();
            Object.keys(asteroidsObj).forEach((asteroidKey) => {
                if (asteroidsObj[asteroidKey].active) {
                    if (asteroidsObj[asteroidKey].active) asteroidsObj[asteroidKey].update();
                    if (asteroidsObj[asteroidKey].radius + earth.radius - 20 >
                        Math.sqrt((earth.current.x - asteroidsObj[asteroidKey].current.x) ** 2 +
                            (earth.current.y - asteroidsObj[asteroidKey].current.y) ** 2)) {
                        play = false;
                    }
                    if (asteroidsObj[asteroidKey].radius + cat.width / 2 >
                        Math.sqrt((cat.x - asteroidsObj[asteroidKey].current.x) ** 2 +
                            (cat.y - asteroidsObj[asteroidKey].current.y) ** 2)) {
                        asteroidsObj[asteroidKey].destroy();
                        count++;
                    }
                    if (asteroidsObj[asteroidKey].current.x + 3 * asteroidsObj[asteroidKey].current.width < 0 ||
                        asteroidsObj[asteroidKey].current.x - 3 * asteroidsObj[asteroidKey].current.width > window.innerWidth ||
                        asteroidsObj[asteroidKey].current.y + 3 * asteroidsObj[asteroidKey].current.height < 0 ||
                        asteroidsObj[asteroidKey].current.y - 3 * asteroidsObj[asteroidKey].current.height > window.innerHeight) {
                        app.stage.removeChild(asteroidsObj[asteroidKey].current);
                        delete asteroidsObj[asteroidKey];
                    }
                }
            });

            Object.keys(bulletsObj).forEach((bulletKey) => {
                bulletsObj[bulletKey].update();
                if (bulletsObj[bulletKey].current.x + bulletsObj[bulletKey].current.width < 0 ||
                    bulletsObj[bulletKey].current.x - bulletsObj[bulletKey].current.width > window.innerWidth ||
                    bulletsObj[bulletKey].current.y + bulletsObj[bulletKey].current.height < 0 ||
                    bulletsObj[bulletKey].current.y - bulletsObj[bulletKey].current.height > window.innerHeight) {
                    app.stage.removeChild(bulletsObj[bulletKey].current);
                    delete bulletsObj[bulletKey];
                } else {
                    Object.keys(asteroidsObj).forEach((asteroidKey) => {
                        if (bulletsObj[bulletKey] && asteroidsObj[asteroidKey].active) {
                            if (asteroidsObj[asteroidKey].radius + bulletsObj[bulletKey].radius >
                                Math.sqrt((asteroidsObj[asteroidKey].current.x - bulletsObj[bulletKey].current.x) ** 2 +
                                    (asteroidsObj[asteroidKey].current.y - bulletsObj[bulletKey].current.y) ** 2)) {
                                app.stage.removeChild(bulletsObj[bulletKey].current);
                                delete bulletsObj[bulletKey];
                                asteroidsObj[asteroidKey].destroy();
                                count++;
                            }
                        }
                    })
                }
            });
            app.stage.addChild(text);
            app.renderer.render(app.stage);
        }

        function animate({timing, draw, duration, end}) {

            let start = performance.now();

            requestAnimationFrame(function animate(time) {
                let timeFraction = (time - start) / duration;
                if (timeFraction > 1) timeFraction = 1;

                let progress = timing(timeFraction);

                draw(progress);

                if (timeFraction < 1) {
                    requestAnimationFrame(animate);
                } else {
                    if (end) end();
                }
            });
        }

        function gameOverAnimate() {

            animate({
                duration: 500,
                timing(timeFraction) {
                    return timeFraction;
                },
                draw(progress) {
                    let texture = PIXI.Texture.from('images/boom.png');
                    texture.frame = new PIXI.Rectangle(192 * ((Math.ceil(progress * 7 - .5)) % 5),
                        192 * Math.ceil((Math.ceil(progress * 7 - .5)) / 5 - .5), 192, 192);
                    earth.current.texture = texture;
                },
                end: () => {
                    if (boomSounds[count % boomSounds.length]) {
                        boomSounds[count % boomSounds.length].play();
                    }
                    animate({
                        duration: 1000,
                        timing(timeFraction) {
                            return timeFraction;
                        },
                        draw(progress) {
                            text.style.fontSize = 24 + 50 * progress;
                            text.x = window.innerWidth - (centerX) * progress;
                            text.y = centerY / 2 * progress;
                        },
                        end: () => {
                            text.text = text.text + "\nClick to restart";
                            window.addEventListener('click', restart);
                        }
                    });
                }
            });
        }

        window.addEventListener("resize", () => {
            app.renderer.resize(window.innerWidth, window.innerHeight);
            centerX = window.innerWidth / 2;
            centerY = window.innerHeight / 2;
            earth.current.x = centerX;
            earth.current.y = centerY;
            gun.x = centerX + 120 * Math.cos(gun.radian);
            gun.y = centerY + 120 * Math.sin(gun.radian);
            if (window.innerWidth > back.width || window.innerHeight > back.height) {
                if (back.height * window.innerWidth / back.width > window.innerHeight) {
                    back.height = back.height * window.innerWidth / back.width;
                    back.width = window.innerWidth;
                } else {
                    back.width = back.width * window.innerHeight / back.height;
                    back.height = window.innerHeight;
                }
            }
            if ((window.innerWidth > 1920 && window.innerWidth < back.width) ||
                (window.innerHeight > 1080 && window.innerHeight < back.height)) {
                if (back.height * window.innerWidth / back.width > window.innerHeight) {
                    back.height = back.height * window.innerWidth / back.width;
                    back.width = window.innerWidth
                } else {
                    back.width = back.width * window.innerHeight / back.height;
                    back.height = window.innerHeight;
                }
            }
        });
        window.addEventListener('click', () => {
            state = "play";
        });
        window.addEventListener("mouseout", () => {
            if (play && state !== 'pause') {
                text.text = "Click to continue";
            }
            state = "pause";
        });

        function restart() {
            Object.values(bulletsObj).forEach((bullet) => {
                app.stage.removeChild(bullet.current);
            });
            bulletsObj = {};
            Object.values(asteroidsObj).forEach((asteroid) => {
                app.stage.removeChild(asteroid.current);
            });
            asteroidsObj = {};
            earth.current.texture = PIXI.Texture.from('images/earth.png');
            count = 0;
            state = "play";
            play = true;
            text.style.fontSize = 24;
            text.x = window.innerWidth - 1.5 * text.width;
            text.y = 30;
            gameOver = false;
            window.removeEventListener("click", restart);
        }

        app.ticker.add(delta => {
            if (state !== "pause") {
                if (play) {
                    loop(delta);
                } else {
                    if (!gameOver) {
                        if (count > bestCount) {
                            localStorage.setItem("spaceGameBestCount", count + '');
                        }
                        gameOverAnimate();
                        gameOver = true;
                    }
                }
            }
        });
    }
}

window.addEventListener('load', load);