import { db } from './global.js';
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const urlParams = new URLSearchParams(window.location.search);
const collectionName = urlParams.get('name');

const titleEl = document.getElementById('collection-title');
const descEl = document.getElementById('collection-desc');
const grid = document.getElementById('collection-products-grid');
const heroBg = document.getElementById('collection-hero-bg');

if (!collectionName) {
  if (titleEl) titleEl.innerText = "Collection Not Found";
} else {
  if (titleEl) titleEl.innerText = collectionName;
  
  onSnapshot(collection(db, "collections"), (snapshot) => {
    snapshot.forEach(doc => {
      const c = doc.data();
      if (c.name === collectionName) {
        if (descEl) descEl.innerText = c.description;
        if (heroBg && c.banner_image) {
          // Use picture element for responsive background
          const mobImg = c.banner_image_mobile || c.banner_image;
          heroBg.innerHTML = `
            <picture>
              <source media="(max-width: 767px)" srcset="${mobImg}">
              <img src="${c.banner_image}" style="width:100%; height:100%; object-fit:cover; position:absolute; inset:0; z-index:1;">
            </picture>
            <div style="position:absolute; inset:0; background:rgba(0,0,0,0.4); z-index:2;"></div>
          `;
          document.getElementById('collection-hero').style.display = 'flex';
        }
      }
    });
  });

  onSnapshot(collection(db, "products"), (snapshot) => {
    if (!grid) return;
    grid.innerHTML = '';
    let count = 0;

    snapshot.forEach(docSnap => {
      const product = docSnap.data();
      const docId = docSnap.id;

      if (product.collection === collectionName) {
        count++;
        let priceHTML = `$${product.price}`;
        if (product.sale_price) priceHTML = `<span style="text-decoration: line-through; color: var(--muted); margin-right: 8px; font-size: 0.9em;">$${product.price}</span> <span style="color: var(--red); font-weight: 600;">$${product.sale_price}</span>`;
        let buttonText = product.status === 'preorder' ? 'Pre-Order' : 'View Item';
        let badgeHTML = product.status === 'preorder' ? `<span style="display: inline-block; background: var(--text); color: #fff; font-size: 0.65rem; padding: 2px 6px; margin-bottom: 8px; letter-spacing: 0.1em;">PRE-ORDER</span>` : '';

        const card = document.createElement('article');
        card.className = 'product';
        card.innerHTML = `
          <a href="product.html?id=${docId}" style="display: block; margin-bottom: 16px;">
            <div class="img-ph img-ph-product" style="position: relative; overflow: hidden; margin-bottom: 0; aspect-ratio: 3/4;">
              <img src="${product.images[0]}" style="width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; z-index: 2;" alt="${product.name}">
            </div>
          </a>
          <div style="margin-bottom: 8px; min-height: 20px;">${badgeHTML}</div>
          <a href="product.html?id=${docId}"><h3>${product.name}</h3></a>
          <p class="desc">${product.description}</p>
          <p class="price">${priceHTML}</p>
          <a href="product.html?id=${docId}" class="btn btn-solid btn-full" style="text-align: center;">${buttonText}</a>
        `;
        grid.appendChild(card);
      }
    });

    if (count === 0) grid.innerHTML = '<p style="text-align: center; width: 100%; color: var(--muted); grid-column: 1 / -1;">No products in this collection yet.</p>';
  });
}
