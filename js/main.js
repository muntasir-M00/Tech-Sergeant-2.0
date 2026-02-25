// js/main.js
// Main JavaScript file for Tech Sergeant website
// Handles navigation highlighting, smooth scrolling, login, admin features, dynamic content loading

// ────────────────────────────────────────────────
// 1. Utility Functions
// ────────────────────────────────────────────────

/**
 * Smooth scroll to top when clicking "Back to Top" links
 */
function initBackToTop() {
    const backToTop = document.querySelector('.back-to-top');
    if (backToTop) {
        backToTop.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

/**
 * Highlight the current page in the navbar
 */
function highlightActiveNavLink() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath || (currentPath === '' && href === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// ────────────────────────────────────────────────
// 2. Content Loading (used for dynamic sections)
// ────────────────────────────────────────────────

/**
 * Load site content from localStorage or content.json
 * @returns {Promise<Object>} site content object
 */
async function loadContent() {
    let content = JSON.parse(localStorage.getItem('siteContent'));

    if (!content) {
        try {
            const response = await fetch('data/content.json');
            if (!response.ok) {
                throw new Error(`Failed to fetch content.json: ${response.status}`);
            }
            content = await response.json();
            localStorage.setItem('siteContent', JSON.stringify(content));
        } catch (error) {
            console.warn('Could not load content.json → using fallback values', error);
            content = {
                // Default fallback values (prevents clearing important content)
                footerDesc: '© 2026 <span class="brand-tech">Tech&nbsp;</span><span class="brand-sergeant">Sergeant</span> – Student project by Mirza Muntasir Mahmud',
                carouselImages: [],
                homeCards: [],
                solutionCards: []
            };
        }
    }

    return content || {};
}

// ────────────────────────────────────────────────
// 3. Footer Rendering (FIXED - preserves hardcoded HTML if no dynamic value)
// ────────────────────────────────────────────────

/**
 * Render footer copyright — only updates if dynamic value exists
 */
async function renderFooter() {
    const content = await loadContent();
    const footers = document.querySelectorAll('.copyright');

    // Only update if we actually have a meaningful dynamic value
    if (content.footerDesc && content.footerDesc.trim() !== '') {
        footers.forEach(footer => {
            footer.innerHTML = content.footerDesc; // innerHTML to support <span> tags
        });
    }
    // Otherwise → keep the hardcoded HTML from the .html files
}

// ────────────────────────────────────────────────
// 4. Admin Login Modal (appears on pages with admin login form)
// ────────────────────────────────────────────────

const ADMIN_CREDENTIALS = {
    email: 'admin@example.com',
    password: 'password' // ← Change this in production or use proper auth
};

function initLoginModal() {
    const loginForm = document.getElementById('adminLoginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('adminEmail')?.value.trim();
        const password = document.getElementById('adminPassword')?.value.trim();

        if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
            localStorage.setItem('loggedIn', 'true');
            alert('Login successful! Redirecting to Admin Panel...');
            window.location.href = 'admin.html';
        } else {
            alert('Invalid credentials. Please try again.');
        }
    });
}

// ────────────────────────────────────────────────
// 5. Admin Panel Features (only runs on admin.html)
// ────────────────────────────────────────────────

function initAdminFeatures() {
    if (!document.getElementById('logoutBtn')) return; // Not admin page

    // Protect admin page
    if (!localStorage.getItem('loggedIn')) {
        window.location.href = 'index.html';
    }

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('loggedIn');
        window.location.href = 'index.html';
    });

    // Media type toggle for solution card form
    const mediaTypeSelect = document.getElementById('solution-media-type');
    if (mediaTypeSelect) {
        const videoField = document.getElementById('video-upload-field');
        const youtubeField = document.getElementById('youtube-embed-field');

        mediaTypeSelect.addEventListener('change', function () {
            if (this.value === 'video') {
                videoField?.classList.remove('d-none');
                youtubeField?.classList.add('d-none');
            } else {
                videoField?.classList.add('d-none');
                youtubeField?.classList.remove('d-none');
            }
        });
    }

    // ── Solution Cards Management ──
    let solutionCards = JSON.parse(localStorage.getItem('solutionCards')) || [];

    function renderAdminCards() {
        const list = document.getElementById('existing-cards');
        if (!list) return;
        list.innerHTML = '';

        solutionCards.forEach(card => {
            const li = document.createElement('li');
            li.className = 'list-group-item bg-dark text-light d-flex justify-content-between align-items-center';
            li.innerHTML = `
                ${card.title} (${card.mediaType})
                <div>
                    <button class="btn btn-sm btn-outline-primary me-2 edit-btn" data-id="${card.id}">Edit</button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${card.id}">Delete</button>
                </div>
            `;
            list.appendChild(li);
        });
    }

    renderAdminCards();

    // Edit / Delete delegation
    document.getElementById('existing-cards')?.addEventListener('click', (e) => {
        const id = parseInt(e.target.dataset.id);
        if (!id) return;

        if (e.target.classList.contains('delete-btn')) {
            if (confirm('Delete this card?')) {
                solutionCards = solutionCards.filter(c => c.id !== id);
                localStorage.setItem('solutionCards', JSON.stringify(solutionCards));
                renderAdminCards();
            }
        } else if (e.target.classList.contains('edit-btn')) {
            const card = solutionCards.find(c => c.id === id);
            if (card) {
                document.getElementById('solution-title').value = card.title;
                document.getElementById('solution-desc').value = card.desc;
                document.getElementById('solution-media-type').value = card.mediaType;
                document.getElementById('solution-media-type').dispatchEvent(new Event('change'));
                document.getElementById('solutionForm').dataset.editId = id;
            }
        }
    });

    // Form submit (add or update)
    document.getElementById('solutionForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('solution-title').value.trim();
        const desc = document.getElementById('solution-desc').value.trim();
        const mediaType = document.getElementById('solution-media-type').value;
        let media = '';

        if (mediaType === 'video') {
            const file = document.getElementById('video-upload')?.files[0];
            if (file) {
                media = await new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onload = ev => resolve(ev.target.result);
                    reader.readAsDataURL(file);
                });
            }
        } else {
            media = document.getElementById('youtube-embed')?.value.trim();
        }

        if (!title || !media) {
            alert('Title and media are required.');
            return;
        }

        const editId = parseInt(document.getElementById('solutionForm').dataset.editId);
        if (editId) {
            const card = solutionCards.find(c => c.id === editId);
            if (card) {
                card.title = title;
                card.desc = desc;
                card.mediaType = mediaType;
                card.media = media;
            }
        } else {
            const newId = solutionCards.length ? Math.max(...solutionCards.map(c => c.id)) + 1 : 1;
            solutionCards.push({ id: newId, title, desc, mediaType, media });
        }

        localStorage.setItem('solutionCards', JSON.stringify(solutionCards));
        renderAdminCards();
        e.target.reset();
        delete e.target.dataset.editId;
        alert('Card saved successfully!');
    });
}

// ────────────────────────────────────────────────
// 6. Initialize Everything
// ────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
    initBackToTop();
    highlightActiveNavLink();
    initLoginModal();
    initAdminFeatures();

    // Dynamic rendering (optional – only runs where needed)
    await renderFooter();           // Fixed version – won't erase hardcoded content
    // await renderCarousel();      // uncomment if you use dynamic carousel
    // await renderSolutionCards(); // uncomment if needed
});