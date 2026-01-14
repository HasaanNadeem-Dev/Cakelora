
let slideIndex = 1;
showSlides(slideIndex);

// Auto slide every 5 seconds
let slideInterval = setInterval(function () {
    plusSlides(1);
}, 5000);

function plusSlides(n) {
    showSlides(slideIndex += n);
    resetTimer();
}

function currentSlide(n) {
    showSlides(slideIndex = n);
    resetTimer();
}

function showSlides(n) {
    let i;
    let slides = document.getElementsByClassName("slide");
    let dots = document.getElementsByClassName("dot");

    if (n > slides.length) { slideIndex = 1 }
    if (n < 1) { slideIndex = slides.length }

    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
        slides[i].className = slides[i].className.replace(" active", "");
    }

    for (i = 0; i < dots.length; i++) {
        dots[i].className = dots[i].className.replace(" active", "");
    }

    slides[slideIndex - 1].style.display = "block";
    slides[slideIndex - 1].className += " active";
    dots[slideIndex - 1].className += " active";
}

function resetTimer() {
    clearInterval(slideInterval);
    slideInterval = setInterval(function () {
        plusSlides(1);
    }, 5000);
}

// Expose functions to global scope for HTML onclick attributes
window.moveSlide = function (n) {
    plusSlides(n);
}

// Product Card Slider Logic
function initProductSlider(container) {
    const track = container.querySelector('.product-slider-track');
    // Get distinct cards currently in DOM (user might have manual duplicates, but we treat current set as the sequence)
    const originalCards = container.querySelectorAll('.cards');

    // Safety check
    if (!track || originalCards.length === 0) return;

    // Auto-duplicate for seamless infinite loop
    // We clone the entire set and append it to the end.
    // This handles any sequence the user creates and ensures the loop point matches the start.
    originalCards.forEach(card => {
        const clone = card.cloneNode(true);
        // Mark clone to identify if needed, though not strictly necessary
        clone.classList.add('clone');
        track.appendChild(clone);
    });

    const allCards = container.querySelectorAll('.cards');
    const uniqueCardsCount = originalCards.length;

    let startX;
    let scrollLeft;
    let scrollInterval;
    let currentIndex = 0;

    // Dynamic Card Width Calculation
    function getCardWidth() {
        const firstCard = container.querySelector('.cards');
        if (!firstCard) return 300; // Fallback
        const trackStyle = window.getComputedStyle(track);
        const gap = parseFloat(trackStyle.gap) || 30;
        return firstCard.offsetWidth + gap;
    }

    let cardWidth = getCardWidth();

    // Update on resize
    window.addEventListener('resize', () => {
        cardWidth = getCardWidth();
        updatePosition(false); // Re-align without animation
    });

    function startAutoScroll() {
        stopAutoScroll();
        if (isHovering || isPressed) return;

        scrollInterval = setInterval(() => {
            currentIndex++;
            updatePosition(true);
        }, 5000);
    }

    function stopAutoScroll() {
        clearInterval(scrollInterval);
    }

    function updatePosition(withTransition) {
        if (withTransition) {
            track.style.transition = 'transform 0.5s ease';
        } else {
            track.style.transition = 'none';
        }
        const newTransform = -(currentIndex * cardWidth);
        track.style.transform = `translateX(${newTransform}px)`;
    }

    function getTransformValue() {
        const style = window.getComputedStyle(track);
        const matrix = new WebKitCSSMatrix(style.transform);
        return matrix.m41;
    }

    function snapToNearestCard() {
        const currentX = getTransformValue();
        let newIndex = Math.round(-currentX / cardWidth);

        if (newIndex < 0) newIndex = 0;

        // Loop logic for drag end
        // If we dragged past the first set
        if (newIndex >= uniqueCardsCount * 2) {
            newIndex = 0;
        }

        currentIndex = newIndex;
        updatePosition(true);
        startAutoScroll();
    }

    // Events
    track.addEventListener('transitionend', () => {
        // If we have slid past the original set
        if (currentIndex >= uniqueCardsCount) {
            // Calculate equivalent index in the first set
            // usually currentIndex - uniqueCardsCount
            // But we specifically want the exact moment we hit the start of the clones to reset to the start of originals
            // However, setInterval increments by 1.
            // If we are at uniqueCardsCount (the first clone), it looks exactly like index 0.
            // So we swap INSTANTLY to index 0.

            // Note: If we drag way past, we might be at uniqueCardsCount + 2.
            // We should reset to (currentIndex % uniqueCardsCount).

            track.style.transition = 'none';
            currentIndex = currentIndex % uniqueCardsCount;
            updatePosition(false);
            void track.offsetWidth;
        }
    });

    // Hover on Cards (Attach to ALL cards including clones)
    allCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            isHovering = true;
            stopAutoScroll();
        });
        card.addEventListener('mouseleave', () => {
            isHovering = false;
            if (!isPressed) startAutoScroll();
        });
    });

    // Container interactions
    container.addEventListener('mousedown', (e) => {
        isPressed = true;
        stopAutoScroll();
        track.style.transition = 'none';
        startX = e.pageX - container.offsetLeft;
        scrollLeft = getTransformValue();
        container.style.cursor = "grabbing";
    });

    container.addEventListener('mouseleave', () => {
        if (isPressed) {
            isPressed = false;
            isHovering = false; // Force unhover if dragged out
            snapToNearestCard();
            container.style.cursor = "grab";
        }
    });

    container.addEventListener('mouseup', () => {
        if (!isPressed) return;
        isPressed = false;
        snapToNearestCard();
        container.style.cursor = "grab";
    });

    container.addEventListener('mousemove', (e) => {
        if (!isPressed) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 2;
        track.style.transform = `translateX(${scrollLeft + walk}px)`;
    });

    // Touch
    container.addEventListener('touchstart', (e) => {
        isHovering = true;
        isPressed = true;
        stopAutoScroll();
        track.style.transition = 'none';
        startX = e.touches[0].pageX - container.offsetLeft;
        scrollLeft = getTransformValue();
    });

    container.addEventListener('touchend', () => {
        isPressed = false;
        isHovering = false;
        snapToNearestCard();
    });

    container.addEventListener('touchmove', (e) => {
        if (!isPressed) return;
        const x = e.touches[0].pageX - container.offsetLeft;
        const walk = (x - startX) * 2;
        track.style.transform = `translateX(${scrollLeft + walk}px)`;
    });

    // Initialize
    startAutoScroll();
}

// Sidebar Menu Logic
const hamburgerBtn = document.getElementById('hamburger-btn');
const closeMenuBtn = document.getElementById('close-menu-btn');
const sideMenu = document.getElementById('side-menu');
const menuOverlay = document.getElementById('menu-overlay');

function openMenu() {
    sideMenu.classList.add('active');
    menuOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeMenu() {
    sideMenu.classList.remove('active');
    menuOverlay.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
}

if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', openMenu);
}

if (closeMenuBtn) {
    closeMenuBtn.addEventListener('click', closeMenu);
}

if (menuOverlay) {
    menuOverlay.addEventListener('click', closeMenu);
}

// Scroll to Top Logic
const scrollTopBtn = document.getElementById("scrollTopBtn");

window.onscroll = function () { scrollFunction() };

function scrollFunction() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        if (scrollTopBtn) scrollTopBtn.style.display = "flex";
    } else {
        if (scrollTopBtn) scrollTopBtn.style.display = "none";
    }
}

if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', function () {
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    });
}

// Initialize Product Cards (Desktop logic + Cloning)
document.querySelectorAll('.product-slider-container').forEach(initProductSlider);

// Prepare Corporate Logos for Infinite Scroll (Mobile)
function initCorporateSlider() {
    const logoContainer = document.querySelector('.corporate-customers-section .logos');
    if (!logoContainer) return;

    // Clone logos to enable infinite check
    // We only want to do this once
    if (logoContainer.getAttribute('data-cloned') === 'true') return;

    const originals = Array.from(logoContainer.children);
    originals.forEach(logo => {
        const clone = logo.cloneNode(true);
        clone.classList.add('clone');
        logoContainer.appendChild(clone);
    });

    logoContainer.setAttribute('data-cloned', 'true');
}
initCorporateSlider();

// Native Auto Scroll for Mobile (Product Slider & Logos)
function initNativeAutoScroll() {
    // Select containers
    const sliders = [
        ...document.querySelectorAll('.product-slider-container'),
        document.querySelector('.corporate-customers-section .logos')
    ].filter(el => el);

    sliders.forEach(slider => {
        let isPaused = false;

        // Only run if overflow/content is sufficient
        if (slider.scrollWidth <= slider.clientWidth) return;

        setInterval(() => {
            if (isPaused) return;

            // Infinite Loop Logic:
            // Calculate precise loop point using the first clone
            const firstClone = slider.querySelector('.clone');
            let loopPoint = slider.scrollWidth / 2; // Fallback

            if (firstClone) {
                // The loop point is exactly where the clones start
                // We need to account for the container's own padding/offset possibly,
                // but offsetLeft is relative to the scroll parent usually.
                loopPoint = firstClone.offsetLeft;
            }

            // Check if we have scrolled past the loop point
            // Tolerance of 5px for safety
            if (slider.scrollLeft >= loopPoint - 5) {
                // Instant Reset: Jump back by the exact width of the original set
                // We don't set to 0, we subtract loopPoint.
                // This preserves any "extra" scroll we might have accumulated (though with discrete steps it should be clean).
                // Actually, simply setting to (current - loopPoint) is safest.
                slider.scrollLeft -= loopPoint;
            }

            // Now Calculate Scroll Step (Item Width)
            const firstItem = slider.querySelector('.cards') || slider.querySelector('img');
            let itemWidth = 0;
            if (firstItem) {
                // Calculate width + gap
                const style = window.getComputedStyle(firstItem);
                // We rely on the difference between two items to get the full step
                const next = firstItem.nextElementSibling;
                if (next) {
                    itemWidth = next.offsetLeft - firstItem.offsetLeft;
                } else {
                    itemWidth = firstItem.offsetWidth + 10; // Fallback
                }
            } else {
                itemWidth = slider.clientWidth / 2;
            }

            // Scroll Smoothly
            slider.scrollBy({ left: itemWidth, behavior: 'smooth' });

        }, 5000);

        // Pause interactions
        const pause = () => isPaused = true;
        const resume = () => isPaused = false;

        slider.addEventListener('touchstart', pause);
        slider.addEventListener('touchend', () => setTimeout(resume, 5000));
        slider.addEventListener('mousedown', pause);
        slider.addEventListener('mouseup', resume);
    });
}


// Call after a slight delay to ensure layout is applied
setTimeout(initNativeAutoScroll, 1000);
