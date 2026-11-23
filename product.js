// ... Inside renderProduct(product) after pdpContainer.innerHTML = ...

  // --- INJECT SEO STRUCTURED DATA ---
  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.images[0],
    "description": product.details || product.description,
    "brand": {
      "@type": "Brand",
      "name": "Tharsos"
    },
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "USD", // Change to EUR if you switch later
      "price": product.sale_price || product.price,
      "availability": product.status === 'preorder' ? "https://schema.org/PreOrder" : "https://schema.org/InStock",
      "itemCondition": "https://schema.org/NewCondition"
    }
  };

  let scriptTag = document.getElementById('product-schema');
  if (!scriptTag) {
    scriptTag = document.createElement('script');
    scriptTag.id = 'product-schema';
    scriptTag.type = 'application/ld+json';
    document.head.appendChild(scriptTag);
  }
  scriptTag.textContent = JSON.stringify(structuredData);
// ...
