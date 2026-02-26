// Landing Page Interactions
document.addEventListener('DOMContentLoaded', () => {
    // Intersection Observer for Section Reveals
    const observerOptions = {
        threshold: 0.15
    };

    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                
                // If it's the community section, trigger counters
                if (entry.target.id === 'community') {
                    startCounters();
                }
                
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(section => {
        sectionObserver.observe(section);
    });

    // Numerical Counter Animation
    function startCounters() {
        const counters = document.querySelectorAll('.counter');
        const speed = 200;

        counters.forEach(counter => {
            const updateCount = () => {
                const target = +counter.getAttribute('data-target');
                const count = +counter.innerText;
                const inc = target / speed;

                if (count < target) {
                    counter.innerText = Math.ceil(count + inc);
                    setTimeout(updateCount, 1);
                } else {
                    counter.innerText = target + (target === 24 ? '' : (target === 98 ? '%' : '+'));
                }
            };
            updateCount();
        });
    }

    // Mobile Navigation Toggle
    const mobileToggle = document.getElementById('mobileNavToggle');
    const landingNav = document.getElementById('landingNav');

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            landingNav.classList.toggle('active');
            const icon = mobileToggle.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });
    }

    // Smooth Scroll for Nav Links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            
            // Close mobile menu on click
            if (landingNav) landingNav.classList.remove('active');
            if (mobileToggle) {
                const icon = mobileToggle.querySelector('i');
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-times');
            }

            const targetId = link.getAttribute('href');
            const targetChar = targetId.charAt(0);
            
            if (targetChar === '#') {
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    window.scrollTo({
                        top: targetSection.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
});
