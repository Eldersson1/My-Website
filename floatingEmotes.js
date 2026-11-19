const FloatingPNG = (() => {
    // =========================
    // CONFIG
    // =========================

    const config = {
        images: [
            "images/emote_salute.png",
            "images/emote_salute.png",
            "images/emote_salute.png",
            "images/emote_salute.png",
            "images/POGGERS.png",
            "images/compressed_images/catJAM.webp",
            "images/PogChamp.png"
        ],

        // Size of the PNGs
        size: 150,

        // How far away from the profile card they should stay
        cardPadding: 35,

        // Minimum distance between PNGs
        pngPadding: 25,

        // Movement speed
        speed: 2,

        // How much they smoothly bob/rotate
        bobAmount: 8,

        // Rotation amount
        rotation: 10,

        // Element class
        className: "floating-png"
    };


    // =========================
    // INTERNAL STATE
    // =========================

    const elements = [];
    let card;
    let animationFrame;


    // =========================
    // GET CARD
    // =========================

    function getCard() {
        card = document.querySelector(".profile-card");

        if (!card) {
            console.warn("FloatingPNG: .profile-card was not found.");
            return false;
        }

        return true;
    }


    // =========================
    // CHECK COLLISION
    // =========================

    function rectanglesOverlap(a, b, padding = 0) {
        return !(
            a.right + padding < b.left ||
            a.left - padding > b.right ||
            a.bottom + padding < b.top ||
            a.top - padding > b.bottom
        );
    }


    // =========================
    // GET CARD RECTANGLE
    // =========================

    function getCardRect() {
        return card.getBoundingClientRect();
    }


    // =========================
    // FIND VALID POSITION
    // =========================

    function findPosition(existing) {
        const cardRect = getCardRect();

        const width = config.size;
        const height = config.size;

        const maxX = window.innerWidth - width;
        const maxY = window.innerHeight - height;

        // Try lots of random positions
        for (let attempt = 0; attempt < 1000; attempt++) {

            const x = Math.random() * maxX;
            const y = Math.random() * maxY;

            const rect = {
                left: x,
                top: y,
                right: x + width,
                bottom: y + height
            };

            // Don't spawn on top of the card
            const cardCollision = rectanglesOverlap(
                rect,
                cardRect,
                config.cardPadding
            );

            if (cardCollision) {
                continue;
            }

            // Don't spawn on other PNGs
            let overlapsPNG = false;

            for (const other of existing) {
                if (
                    rectanglesOverlap(
                        rect,
                        other,
                        config.pngPadding
                    )
                ) {
                    overlapsPNG = true;
                    break;
                }
            }

            if (overlapsPNG) {
                continue;
            }

            return {
                x,
                y
            };
        }

        // If the screen is VERY crowded,
        // use a fallback position.
        return {
            x: Math.max(0, (window.innerWidth - width) / 2),
            y: 20
        };
    }


    // =========================
    // CREATE PNG
    // =========================

    function createPNG(src, index, occupied) {

        const img = document.createElement("img");

        img.src = src;
        img.className = config.className;

        img.draggable = false;

        img.style.width = `${config.size}px`;
        img.style.height = `${config.size}px`;

        img.style.position = "fixed";
        img.style.left = "0";
        img.style.top = "0";

        img.style.pointerEvents = "none";
        img.style.userSelect = "none";

        img.style.zIndex = "1";

        // Find a position that doesn't collide
        const position = findPosition(occupied);

        const rect = {
            left: position.x,
            top: position.y,
            right: position.x + config.size,
            bottom: position.y + config.size
        };

        occupied.push(rect);

        img.dataset.x = position.x;
        img.dataset.y = position.y;

        img.dataset.vx =
            (Math.random() > 0.5 ? 1 : -1) *
            config.speed *
            (0.7 + Math.random() * 0.6);

        img.dataset.vy =
            (Math.random() > 0.5 ? 1 : -1) *
            config.speed *
            (0.7 + Math.random() * 0.6);

        img.dataset.rotation =
            Math.random() * 360;

        img.dataset.rotationSpeed =
            (Math.random() > 0.5 ? 1 : -1) *
            (0.2 + Math.random() * 0.4);

        img.dataset.phase =
            Math.random() * Math.PI * 2;

        img.dataset.index = index;

        document.body.appendChild(img);

        elements.push({
            element: img,
            x: position.x,
            y: position.y,

            vx: Number(img.dataset.vx),
            vy: Number(img.dataset.vy),

            rotation: Number(img.dataset.rotation),
            rotationSpeed: Number(img.dataset.rotationSpeed),

            phase: Number(img.dataset.phase)
        });
    }


    // =========================
    // KEEP OUTSIDE CARD
    // =========================

    function keepOutsideCard(obj) {

        const cardRect = getCardRect();

        const size = config.size;

        const rect = {
            left: obj.x,
            top: obj.y,
            right: obj.x + size,
            bottom: obj.y + size
        };

        if (!rectanglesOverlap(
            rect,
            cardRect,
            config.cardPadding
        )) {
            return;
        }

        /*
         * Determine which side of the card
         * the PNG is closest to and push it out.
         */

        const distances = {
            left: Math.abs(rect.right - cardRect.left),
            right: Math.abs(rect.left - cardRect.right),
            top: Math.abs(rect.bottom - cardRect.top),
            bottom: Math.abs(rect.top - cardRect.bottom)
        };

        let closest = "left";

        for (const side in distances) {
            if (distances[side] < distances[closest]) {
                closest = side;
            }
        }

        if (closest === "left") {
            obj.x =
                cardRect.left -
                size -
                config.cardPadding;

            obj.vx = -Math.abs(obj.vx);
        }

        if (closest === "right") {
            obj.x =
                cardRect.right +
                config.cardPadding;

            obj.vx = Math.abs(obj.vx);
        }

        if (closest === "top") {
            obj.y =
                cardRect.top -
                size -
                config.cardPadding;

            obj.vy = -Math.abs(obj.vy);
        }

        if (closest === "bottom") {
            obj.y =
                cardRect.bottom +
                config.cardPadding;

            obj.vy = Math.abs(obj.vy);
        }
    }


    // =========================
    // PNG ↔ PNG COLLISION
    // =========================

    function handlePNGCollisions() {

        const size = config.size;

        for (let i = 0; i < elements.length; i++) {

            for (let j = i + 1; j < elements.length; j++) {

                const a = elements[i];
                const b = elements[j];

                const aRect = {
                    left: a.x,
                    top: a.y,
                    right: a.x + size,
                    bottom: a.y + size
                };

                const bRect = {
                    left: b.x,
                    top: b.y,
                    right: b.x + size,
                    bottom: b.y + size
                };

                if (!rectanglesOverlap(
                    aRect,
                    bRect,
                    config.pngPadding
                )) {
                    continue;
                }

                // Find centers
                const ax = a.x + size / 2;
                const ay = a.y + size / 2;

                const bx = b.x + size / 2;
                const by = b.y + size / 2;

                let dx = bx - ax;
                let dy = by - ay;

                const distance = Math.sqrt(
                    dx * dx + dy * dy
                );

                // Avoid division by zero
                if (distance === 0) {
                    dx = 1;
                    dy = 0;
                }

                const nx = dx / (distance || 1);
                const ny = dy / (distance || 1);

                // Push them apart
                const push = 1.5;

                a.x -= nx * push;
                a.y -= ny * push;

                b.x += nx * push;
                b.y += ny * push;

                // Bounce velocity
                const tempX = a.vx;

                a.vx = b.vx;
                b.vx = tempX;

                const tempY = a.vy;

                a.vy = b.vy;
                b.vy = tempY;
            }
        }
    }


    // =========================
    // ANIMATION
    // =========================

    let lastTime = performance.now();

    function animate(now) {

        const delta =
            Math.min((now - lastTime) / 16.67, 2);

        lastTime = now;

        for (const obj of elements) {

            obj.x += obj.vx * delta;
            obj.y += obj.vy * delta;

            const size = config.size;

            // Screen boundaries
            if (obj.x <= 0) {
                obj.x = 0;
                obj.vx = Math.abs(obj.vx);
            }

            if (obj.x + size >= window.innerWidth) {
                obj.x = window.innerWidth - size;
                obj.vx = -Math.abs(obj.vx);
            }

            if (obj.y <= 0) {
                obj.y = 0;
                obj.vy = Math.abs(obj.vy);
            }

            if (obj.y + size >= window.innerHeight) {
                obj.y = window.innerHeight - size;
                obj.vy = -Math.abs(obj.vy);
            }

            // Card collision
            keepOutsideCard(obj);
        }

        // PNG collisions
        handlePNGCollisions();

        // Render
        for (const obj of elements) {

            obj.rotation +=
                obj.rotationSpeed * delta;

            obj.phase += 0.035 * delta;

            const bob =
                Math.sin(obj.phase) *
                config.bobAmount;

            obj.element.style.transform =
                `translate3d(
                    ${obj.x}px,
                    ${obj.y + bob}px,
                    0
                )
                rotate(${obj.rotation}deg)`;
        }

        animationFrame =
            requestAnimationFrame(animate);
    }


    // =========================
    // RESIZE
    // =========================

    function handleResize() {

        for (const obj of elements) {

            const size = config.size;

            obj.x = Math.max(
                0,
                Math.min(
                    obj.x,
                    window.innerWidth - size
                )
            );

            obj.y = Math.max(
                0,
                Math.min(
                    obj.y,
                    window.innerHeight - size
                )
            );

            keepOutsideCard(obj);
        }
    }


    // =========================
    // START
    // =========================

    function start() {

        if (!getCard()) {
            return;
        }

        // Remove old ones
        for (const obj of elements) {
            obj.element.remove();
        }

        elements.length = 0;

        const occupied = [];

        // One PNG for each DIFFERENT image
        for (let i = 0; i < config.images.length; i++) {
            createPNG(
                config.images[i],
                i,
                occupied
            );
        }

        cancelAnimationFrame(animationFrame);

        lastTime = performance.now();

        animationFrame =
            requestAnimationFrame(animate);
    }


    // =========================
    // PUBLIC API
    // =========================

    return {
        start,

        config
    };

})();


// Start it
document.addEventListener("DOMContentLoaded", () => {
    FloatingPNG.start();
});


// Keep things sane when resizing
window.addEventListener("resize", () => {
    FloatingPNG.start();
});