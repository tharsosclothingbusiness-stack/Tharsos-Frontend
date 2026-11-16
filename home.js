import { db } from './global.js';
import { collection, onSnapshot, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let allProducts = [];
let collectionsData = {};
let bannersData = {};
let siteConfig = null;
let currentSlide = 0;
let slideInterval = null;

// 1. Fetch Banners Library
onSnapshot(collection(db, "banners"), (snapshot) => {
  snapshot.forEach(d => { bannersData[d.id] = d.data(); });
  renderHero(); // Re-render if data arrives late
});

// 2. Fetch Collections
onSnapshot(collection(db, "collections"), (snapshot) => {
  snapshot.forEach(d => { collectionsData[d.data().name] = d.data(); });
  renderHero(); // Re-render if data arrives late
});

// 3. Fetch Settings
onSnapshot(doc(db, "config", "site"), (docSnap) => {
  if (docSnap.exists()) {
    siteConfig = docSnap.data();
    renderHero();
  }
});

// 4. Master Hero Rendering Function
function renderHero() {
  const heroSection = document.getElementById('hero-section');
  const heroContainer = document.getElementById('hero-carousel-container');
  
  // Wait until we have config and at least one type of image data
  if (!siteConfig) return;

  if (siteConfig.enableHero === false) {
    heroSection.style.display = 'none';
    return;
  } else {
    heroSection.style.display = 'flex';
  }

  if (slideInterval) clearInterval(slideInterval);

  // A. Single Collection Hero
  if (siteConfig.heroType === 'collection' && siteConfig.heroCollection) {
    const col = collectionsData[siteConfig.heroCollection];
    if (col) {
      const deskImg = col.banner_image;
      const mobImg = col.banner_image_mobile || col.banner_image;
      heroContainer.innerHTML = `
        <picture>
          <source media="(max-width: 767px)" srcset="${mobImg}">
          <img src="${deskImg}" class="carousel-slide active" style="width:100%; height:100%; object-fit:cover; position:absolute; inset:0;">
        </picture>
        <div class="hero-text-overlay">
          <h1>${col.name}</h1>
          <a href="collection.html?name=${encodeURIComponent(col.name)}" class="btn btn-solid">Shop Now</a>
        </div>
      `;
    }
  } 
  // B. Carousel Hero
  else if (siteConfig.carouselBanners && siteConfig.carouselBanners.length > 0) {
    heroContainer.innerHTML = '';
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'carousel-dots';
    
    let validSlidesCount = 0;

    siteConfig.carouselBanners.forEach((bannerId, index) => {
      const b = bannersData[bannerId];
      if (!b) return; // Skip if banner was deleted

      // Create Slide
      const slide = document.createElement('div');
      slide.className = `carousel-slide ${index === 0 ? 'active' : ''}`;
      slide.innerHTML = `
        <picture>
          <source media="(max-width: 767px)" srcset="${b.mobileImage || b.desktopImage}">
          <img src="${b.desktopImage}" alt="${b.title}" style="width:100%; height:100%; object-fit:cover; position:absolute; inset:0;">
        </picture>
        <div class="hero-text-overlay">
          <h1>${b.title}</h1>
          <a href="${b.link}" class="btn btn-solid">${b.btnText}</a>
        </div>
      `;
      heroContainer.appendChild(slide);

      // Create Dot
      const dot = document.createElement('button');
      dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
      dot.onclick = () => goToSlide(index);
      dotsContainer.appendChild(dot);
      
      validSlidesCount++;
    });

    heroContainer.appendChild(dotsContainer);

    // Start Auto-play if more than 1 banner
    if (validSlidesCount > 1) {
      slideInterval = setInterval(() => {
        const slides = heroContainer.querySelectorAll('.carousel-slide');
        const dots = dotsContainer.querySelectorAll('.carousel-dot');
        if(!slides.length) return;
        
        slides[currentSlide].classList.remove('active');
        dots[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
      }, 5000);
    }
  }
}

function goToSlide(index) {
  const slides = document.querySelectorAll('.carousel-slide');
  const dots = document.querySelectorAll('.carousel-dot');
  if (!slides.length) return;
  
  clearInterval(slideInterval);
  slides[currentSlide].classList.remove('active');
  dots[currentSlide].classList.remove('active');
  currentSlide = index;
  slides[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');
}

// 5. Fetch Products
const bestsellersGrid = document.getElementById('bestsellers-grid');
const allProductsGrid = document.getElementById('all-products-grid');

onSnapshot(collection(db, "products"), (snapshot) => {
  allProducts = [];
  snapshot.forEach(docSnap => { allProducts.push({ id: docSnap.id, ...docSnap.data() }); });
  renderProducts(allProducts);
});

function renderProducts(products) {
  bestsellersGrid.innerHTML = '';
  allProductsGrid.innerHTML = '';

  if (products.length === 0) {
    allProductsGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--muted);">No products found.</p>';
    return;
  }

  products.forEach(product => {
    const docId = product.id;
    let priceHTML = `$${product.price}`;
    if (product.sale_price) priceHTML = `<span style="text-decoration: line-through; color: var(--muted); margin-right: 8px; font-size: 0.9em;">$${product.price}</span> <span style="color: var(--red); font-weight: 600;">$${product.sale_price}</span>`;
    let buttonText = product.status === 'preorder' ? 'Pre-Order' : 'View Item';
    let badgeHTML = product.status === 'preorder' ? `<span style="display: inline-block; background: var(--text); color: #fff; font-size: 0.65rem; padding: 2px 6px; margin-bottom: 8px; letter-spacing: 0.1em;">PRE-ORDER</span>` : '';

    const productCard = document.createElement('article');
    productCard.className = 'product';
    productCard.innerHTML = `
      <a href="product.html?id=${docId}" style="display: block; margin-bottom: 16px;">
        <div class="img-ph img-ph-product" style="position: relative; overflow: hidden; margin-bottom: 0; aspect-ratio: 3/4;">
          <img src="${product.images[0]}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; z-index: 2;">
        </div>
      </a>
      <div style="margin-bottom: 8px; min-height: 20px;">${badgeHTML}</div>
      <a href="product.html?id=${docId}"><h3>${product.name}</h3></a>
      <p class="desc">${product.description}</p>
      <p class="price">${priceHTML}</p>
      <a href="product.html?id=${docId}" class="btn btn-solid btn-full" style="text-align: center;">${buttonText}</a>
    `;
    if (product.isBestseller) bestsellersGrid.appendChild(productCard.cloneNode(true));
    allProductsGrid.appendChild(productCard);
  });
}

document.getElementById('searchInput').addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = allProducts.filter(p => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term));
  renderProducts(filtered);
  if(term) document.getElementById('bestsellers').style.display = 'none';
  else document.getElementById('bestsellers').style.display = 'block';
});
