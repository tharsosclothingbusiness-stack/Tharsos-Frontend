import { db } from './global.js';
import { collection, onSnapshot, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let allProducts = [];
let collectionsData = {};
let bannersData = {};
let siteConfig = null;
let currentSlide = 0;
let slideInterval = null;

onSnapshot(collection(db, "banners"), (snapshot) => {
  snapshot.forEach(d => { bannersData[d.id] = d.data(); });
  renderHero();
});

onSnapshot(collection(db, "collections"), (snapshot) => {
  snapshot.forEach(d => { collectionsData[d.data().name] = d.data(); });
  renderHero();
});

onSnapshot(doc(db, "config", "site"), (docSnap) => {
  if (docSnap.exists()) {
    siteConfig = docSnap.data();
    renderHero();
  }
});

function renderHero() {
  const heroSection = document.getElementById('hero-section');
  const heroContainer = document.getElementById('hero-carousel-container');
  
  if (!siteConfig) return;

  if (siteConfig.enableHero === false) {
    heroSection.style.display = 'none';
    return;
  } else {
    heroSection.style.display = 'flex';
  }

  if (slideInterval) clearInterval(slideInterval);

  // Single Collection Hero
  if (siteConfig.heroType === 'collection' && siteConfig.heroCollection) {
    const col = collectionsData[siteConfig.heroCollection];
    if (col && col.banner_image) {
      const mobImg = col.banner_image_mobile || col.banner_image;
      heroContainer.innerHTML = `
        <picture>
          <source media="(max-width: 767px)" srcset="${mobImg}">
          <img src="${col.banner_image}" class="carousel-slide active" style="width:100%; height:100%; object-fit:cover; position:absolute; inset:0;">
        </picture>
        <div class="hero-text-overlay">
          <h1>${col.name}</h1>
          <a href="collection.html?name=${encodeURIComponent(col.name)}" class="btn btn-solid">Shop Now</a>
        </div>
      `;
    } else {
      // Fallback if collection image is missing
      heroSection.style.backgroundColor = 'var(--blue-banner)';
    }
  } 
  
  // Carousel Hero
  else if (siteConfig.carouselBanners && siteConfig.carouselBanners.length > 0) {
    heroContainer.innerHTML = '';
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'carousel-dots';
    
    let validSlidesCount = 0;

    siteConfig.carouselBanners.forEach((bannerId, index) => {
      const b = bannersData[bannerId];
      if (!b) return; 

      const slide = document.createElement('div');
      slide.className = `carousel-slide ${index === 0 ? 'active' : ''}`;
      
      // Only render button if showBtn is true
      const btnHTML = b.showBtn ? `<a href="${b.link}" class="btn btn-solid">${b.btnText}</a>` : '';

      slide.innerHTML = `
        <picture>
          <source media="(max-width: 767px)" srcset="${b.mobileImage || b.desktopImage}">
          <img src="${b.desktopImage}" alt="" style="width:100%; height:100%; object-fit:cover; position:absolute; inset:0;">
        </picture>
        <div class="hero-text-overlay" style="${!b.showBtn ? 'justify-content: flex-end; padding-bottom: 60px;' : ''}">
          ${btnHTML}
        </div>
      `;
      heroContainer.appendChild(slide);

      const dot = document.createElement('button');
      dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
      dot.onclick = () => goToSlide(index);
      dotsContainer.appendChild(dot);
      
      validSlidesCount++;
    });

    heroContainer.appendChild(dotsContainer);

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
  } else {
    // Fallback if carousel is empty
    heroSection.style.backgroundColor = 'var(--blue-banner)';
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

// Product logic remains exactly the same
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
