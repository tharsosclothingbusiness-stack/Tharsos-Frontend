import { db } from './global.js';
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const grid = document.getElementById('collections-list');
onSnapshot(collection(db, "collections"), (snapshot) => {
  grid.innerHTML = '';
  if (snapshot.empty) return grid.innerHTML = '<p style="text-align: center; width: 100%; color: var(--muted);">No collections found.</p>';
  
  let index = 0;
  snapshot.forEach(doc => {
    const col = doc.data();
    
    // Alternate layout (Image Left / Image Right) for editorial feel
    const isEven = index % 2 === 0;
    const block = document.createElement('a');
    block.href = `collection.html?name=${encodeURIComponent(col.name)}`;
    block.className = `editorial-block ${isEven ? 'layout-image-left' : 'layout-image-right'}`;
    
    block.innerHTML = `
      <div class="editorial-image" style="background-image: url('${col.banner_image}')"></div>
      <div class="editorial-content">
        <h3>${col.name}</h3>
        <p>${col.description}</p>
        <span class="btn btn-ghost" style="margin-top: 24px;">Discover Collection</span>
      </div>
    `;
    grid.appendChild(block);
    index++;
  });
});
