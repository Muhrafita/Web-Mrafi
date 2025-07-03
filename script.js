document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const toggleModeBtn = document.getElementById('toggle-mode');
    const navLinks = document.querySelectorAll('.nav-links a');
    const slides = document.querySelectorAll('.slide');
    const instrListItems = document.querySelectorAll('.instr-list li');
    const subSlides = document.querySelectorAll('.sub-slide');
    const backToTopBtn = document.getElementById('backToTop');
    const progressBar = document.getElementById('progressBar');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.querySelector('.lightbox-img');
    const lightboxCaption = document.querySelector('.lightbox-caption');
    const lightboxClose = document.querySelector('.lightbox-close');
    const prevImgBtn = document.querySelector('.prev-img');
    const nextImgBtn = document.querySelector('.next-img');
    let currentGalleryImages = [];
    let currentImageIndex = 0;

    // --- Dark Mode Toggle ---
    toggleModeBtn.addEventListener('click', () => {
        body.classList.toggle('dark');
        const icon = toggleModeBtn.querySelector('i');
        if (body.classList.contains('dark')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            localStorage.setItem('theme', 'dark');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            localStorage.setItem('theme', 'light');
        }
    });

    // Apply saved theme on load
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark');
        toggleModeBtn.querySelector('i').classList.remove('fa-moon');
        toggleModeBtn.querySelector('i').classList.add('fa-sun');
    }

    // --- Smooth Scrolling for internal links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // --- Navigation Active State & Slide Switching ---
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navLinks.forEach(nav => nav.classList.remove('active-nav'));
            this.classList.add('active-nav');

            slides.forEach(slide => slide.classList.remove('active'));
            const targetSlideId = this.dataset.slide;
            const targetSlide = document.getElementById(targetSlideId);
            if (targetSlide) {
                targetSlide.classList.add('active');
            }

            // Hide all sub-slides when switching main navigation
            subSlides.forEach(sub => sub.classList.remove('active'));
        });
    });

    // --- Instrumentation Sub-slide Logic ---
    instrListItems.forEach(item => {
        item.addEventListener('click', function() {
            // Deactivate all sub-slides
            subSlides.forEach(sub => sub.classList.remove('active'));

            // Activate the corresponding sub-slide
            const targetSubSlideId = this.dataset.sub;
            const targetSubSlide = document.getElementById(targetSubSlideId);
            if (targetSubSlide) {
                targetSubSlide.classList.add('active');
            }
        });
    });

    // --- Back to Top Button ---
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }

        // Progress Bar
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + "%";
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // --- Dynamic Image Gallery and Uploader ---
    const galleries = document.querySelectorAll('.gallery');
    const uploadInputs = document.querySelectorAll('input[type="file"]');

    const storedGalleries = JSON.parse(localStorage.getItem('galleries')) || {};

    // Function to render images in a gallery
    function renderGallery(galleryElement, images) {
        galleryElement.innerHTML = ''; // Clear existing images
        images.forEach((img, index) => {
            const figure = document.createElement('figure');
            figure.innerHTML = `
                <img src="${img.src}" alt="${img.caption}" data-index="${index}">
                <figcaption>${img.caption}</figcaption>
                <button class="del-btn"><i class="fas fa-times"></i></button>
            `;
            galleryElement.appendChild(figure);
        });
    }

    // Initialize galleries from localStorage
    galleries.forEach(gallery => {
        const galleryType = gallery.dataset.galleryType;
        if (storedGalleries[galleryType]) {
            renderGallery(gallery, storedGalleries[galleryType]);
        }
    });

    // Handle file uploads
    uploadInputs.forEach(input => {
        input.addEventListener('change', (event) => {
            const files = event.target.files;
            const galleryType = event.target.closest('.sub-slide, section').querySelector('.gallery').dataset.galleryType;

            if (!storedGalleries[galleryType]) {
                storedGalleries[galleryType] = [];
            }

            Array.from(files).forEach(file => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const newImage = {
                            src: e.target.result,
                            caption: file.name // Or prompt for a custom caption
                        };
                        storedGalleries[galleryType].push(newImage);
                        localStorage.setItem('galleries', JSON.stringify(storedGalleries));
                        renderGallery(document.querySelector(`.gallery[data-gallery-type="${galleryType}"]`), storedGalleries[galleryType]);
                    };
                    reader.readAsDataURL(file);
                } else {
                    alert('Only image files are supported.');
                }
            });
        });
    });

    // Handle image deletion
    document.addEventListener('click', (event) => {
        if (event.target.closest('.del-btn')) {
            const button = event.target.closest('.del-btn');
            const figure = button.closest('figure');
            const galleryElement = button.closest('.gallery');
            const galleryType = galleryElement.dataset.galleryType;
            const imageIndex = Array.from(galleryElement.children).indexOf(figure);

            if (confirm('Are you sure you want to delete this image?')) {
                storedGalleries[galleryType].splice(imageIndex, 1);
                localStorage.setItem('galleries', JSON.stringify(storedGalleries));
                renderGallery(galleryElement, storedGalleries[galleryType]);
            }
        }
    });

    // --- Lightbox Functionality ---
    document.querySelectorAll('.gallery').forEach(gallery => {
        gallery.addEventListener('click', (event) => {
            const clickedImg = event.target.closest('img');
            if (clickedImg) {
                const galleryType = gallery.dataset.galleryType;
                currentGalleryImages = storedGalleries[galleryType] || [];
                currentImageIndex = parseInt(clickedImg.dataset.index);

                showImageInLightbox(currentImageIndex);
                lightbox.classList.add('active');
            }
        });
    });

    lightboxClose.addEventListener('click', () => {
        lightbox.classList.remove('active');
    });

    prevImgBtn.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length;
        showImageInLightbox(currentImageIndex);
    });

    nextImgBtn.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex + 1) % currentGalleryImages.length;
        showImageInLightbox(currentImageIndex);
    });

    function showImageInLightbox(index) {
        if (currentGalleryImages.length > 0) {
            const image = currentGalleryImages[index];
            lightboxImg.src = image.src;
            lightboxImg.alt = image.caption;
            lightboxCaption.textContent = image.caption;
        }
    }
});