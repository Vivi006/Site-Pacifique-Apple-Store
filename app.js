
    // Product Data
    const PRODUCTS = window.PRODUCTS || [];

    // State
    let currentCategory = 'tous';
    let currentSubcategory = 'all';
    let searchQuery = '';
    let currentSort = 'featured';
    let cart = JSON.parse(localStorage.getItem('pacifique_cart') || '[]');
    let currentModalProduct = null;
    let selectedStorage = null;
    let selectedColor = null;
    let selectedSize = null;

    // Format FCFA
    function formatFCFA(val) {
      return new Intl.NumberFormat('fr-FR').format(val) + ' FCFA';
    }

    // Render Subcategories
    function renderSubcategories() {
      const container = document.getElementById('subcategoriesContainer');
      if (!container) return;
      const subcatsMap = window.SUBCATS || {};

      if (currentCategory === 'tous' || !subcatsMap[currentCategory]) {
        container.innerHTML = `<span class="text-neutral-500">Tous les rayons du magasin</span>`;
        return;
      }

      const list = subcatsMap[currentCategory];
      let html = `<button onclick="setSubcategory('all')" class="px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${currentSubcategory === 'all' ? 'bg-neutral-800 text-amber-300 border border-neutral-700' : 'bg-neutral-900/60 text-neutral-400'}">Tous</button>`;
      list.forEach(s => {
        html += `<button onclick="setSubcategory('${s.id}')" class="px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${currentSubcategory === s.id ? 'bg-neutral-800 text-amber-300 border border-neutral-700' : 'bg-neutral-900/60 text-neutral-400'}">${s.label}</button>`;
      });
      container.innerHTML = html;
    }

    function setSubcategory(sub) {
      currentSubcategory = sub;
      renderSubcategories();
      renderProducts();
    }

    // Filter & Render Products
    function renderProducts() {
      const grid = document.getElementById('productsGrid');
      if (!grid) return;
      let filtered = PRODUCTS.filter(p => {
        if (currentCategory !== 'tous' && p.category !== currentCategory) return false;
        if (currentSubcategory !== 'all' && p.subcategory !== currentSubcategory) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
        }
        return true;
      });

      if (currentSort === 'price-asc') filtered.sort((a,b) => a.price - b.price);
      else if (currentSort === 'price-desc') filtered.sort((a,b) => b.price - a.price);

      if (filtered.length === 0) {
        grid.innerHTML = `
          <div class="col-span-full py-16 text-center bg-neutral-900/40 rounded-3xl border border-neutral-800 p-8">
            <p class="font-bold text-white text-base">Aucun produit ne correspond</p>
            <button onclick="selectCategory('tous')" class="mt-3 px-4 py-2 bg-amber-500 text-neutral-950 font-bold text-xs rounded-xl">Réinitialiser les filtres</button>
          </div>
        `;
        return;
      }

      grid.innerHTML = filtered.map(p => `
        <div onclick="openProductModal('${p.id}')" class="group bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between">
          <div class="relative w-full aspect-[4/3] bg-neutral-950 overflow-hidden">
            <img onerror="this.onerror=null;this.src='logo.jpeg'" src="${p.image}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            ${p.badge ? `<span class="absolute top-2.5 left-2.5 text-[10px] sm:text-[11px] font-bold uppercase px-2 py-0.5 rounded-md bg-neutral-950/85 text-amber-300 border border-amber-500/30">${p.badge}</span>` : ''}
          </div>
          <div class="p-3.5 sm:p-5 flex flex-col flex-1 justify-between gap-3">
            <div>
              <div class="text-[10px] sm:text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-1">${p.subcategoryLabel} · ${p.condition}</div>
              <h3 class="font-semibold text-neutral-100 text-sm sm:text-base group-hover:text-amber-300 line-clamp-1">${p.name}</h3>
              <p class="text-[11px] sm:text-xs text-neutral-400 line-clamp-2 mt-1">${p.shortDesc}</p>
            </div>
            <div class="pt-2 border-t border-neutral-800 flex flex-col gap-2.5">
              <div class="flex items-baseline justify-between">
                <span class="text-base sm:text-lg font-bold text-white font-display">${formatFCFA(p.price)}</span>
                <span class="text-[10px] text-emerald-400 flex items-center gap-1 font-medium"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> En stock</span>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <button onclick="event.stopPropagation(); orderSingleWhatsApp('${p.id}')" class="py-2.5 px-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5">
                  <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
                  <span>WhatsApp</span>
                </button>
                <button onclick="event.stopPropagation(); addToCart('${p.id}')" class="py-2.5 px-2 rounded-xl bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-neutral-200 border border-neutral-700 font-semibold text-xs transition-all flex items-center justify-center gap-1.5">
                  <i data-lucide="shopping-bag" class="w-3.5 h-3.5"></i>
                  <span>+ Panier</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      `).join('');

      lucide.createIcons();
    }

    // Select Main Category
    function selectCategory(cat) {
      currentCategory = cat;
      currentSubcategory = 'all';

      // Update navbar links
      document.querySelectorAll('.nav-link').forEach(el => {
        if (el.dataset.cat === cat) {
          el.className = 'nav-link transition-colors pb-1 border-b-2 text-amber-400 border-amber-400 font-semibold';
        } else {
          el.className = 'nav-link transition-colors pb-1 border-b-2 text-neutral-300 border-transparent hover:text-white';
        }
      });

      // Update cat tabs
      document.querySelectorAll('.cat-tab').forEach(el => {
        if (el.dataset.cat === cat) {
          el.className = 'cat-tab px-3.5 py-2 text-xs font-semibold rounded-lg transition-all bg-amber-500 text-neutral-950 shadow-sm whitespace-nowrap';
        } else {
          el.className = 'cat-tab px-3.5 py-2 text-xs font-semibold rounded-lg transition-all text-neutral-400 hover:text-white whitespace-nowrap';
        }
      });

      renderSubcategories();
      renderProducts();

      const el = document.getElementById('catalogue');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }

    // Handle Search & Sort
    function handleSearch(val) {
      searchQuery = val;
      renderProducts();
    }

    function handleSort(val) {
      currentSort = val;
      renderProducts();
    }

    // Product Modal Logic
    function openProductModal(id) {
      const p = PRODUCTS.find(x => x.id === id);
      if (!p) return;
      currentModalProduct = p;
      selectedStorage = p.options?.storage?.[0] || null;
      selectedColor = p.options?.colors?.[0] || null;
      selectedSize = p.options?.sizes?.[0] || null;

      document.getElementById('modalImg').src = p.image;
      document.getElementById('modalBadge').innerText = p.badge || 'Disponible';
      document.getElementById('modalSubcat').innerText = p.subcategoryLabel;
      document.getElementById('modalCondition').innerText = p.condition;
      document.getElementById('modalTitle').innerText = p.name;
      document.getElementById('modalPrice').innerText = formatFCFA(p.price);
      document.getElementById('modalOriginalPrice').innerText = p.originalPrice ? formatFCFA(p.originalPrice) : '';
      document.getElementById('modalDesc').innerText = p.description;

      // Storage
      const storageGroup = document.getElementById('modalStorageGroup');
      const storageOptions = document.getElementById('modalStorageOptions');
      if (p.options?.storage) {
        storageGroup.style.display = 'block';
        storageOptions.innerHTML = p.options.storage.map(s => `
          <button onclick="setModalStorage('${s}')" class="opt-storage px-3 py-1.5 text-xs font-semibold rounded-lg border ${selectedStorage === s ? 'bg-amber-500 text-neutral-950 border-amber-400' : 'bg-neutral-800 text-neutral-300 border-neutral-700'}">${s}</button>
        `).join('');
      } else {
        storageGroup.style.display = 'none';
      }

      // Colors
      const colorsGroup = document.getElementById('modalColorsGroup');
      const colorOptions = document.getElementById('modalColorOptions');
      if (p.options?.colors) {
        colorsGroup.style.display = 'block';
        colorOptions.innerHTML = p.options.colors.map(c => `
          <button onclick="setModalColor('${c}')" class="opt-color px-2.5 py-1.5 text-xs rounded-lg border ${selectedColor === c ? 'bg-neutral-800 text-white border-amber-400' : 'bg-neutral-900/60 text-neutral-400 border-neutral-800'}">${c}</button>
        `).join('');
      } else {
        colorsGroup.style.display = 'none';
      }

      // Sizes
      const sizesGroup = document.getElementById('modalSizesGroup');
      const sizeOptions = document.getElementById('modalSizeOptions');
      if (p.options?.sizes) {
        sizesGroup.style.display = 'block';
        sizeOptions.innerHTML = p.options.sizes.map(s => `
          <button onclick="setModalSize('${s}')" class="opt-size px-3 py-1.5 text-xs font-bold rounded-lg border ${selectedSize === s ? 'bg-teal-500 text-neutral-950 border-teal-400' : 'bg-neutral-800 text-neutral-300 border-neutral-700'}">${s}</button>
        `).join('');
      } else {
        sizesGroup.style.display = 'none';
      }

      // Specs
      document.getElementById('modalSpecsList').innerHTML = p.specs.map(s => `
        <li class="flex items-center gap-1.5"><i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-400"></i> ${s}</li>
      `).join('');

      // WhatsApp Button
      document.getElementById('modalWhatsAppBtn').onclick = () => {
        let opts = [];
        if (selectedStorage) opts.push(`Capacité: ${selectedStorage}`);
        if (selectedColor) opts.push(`Couleur: ${selectedColor}`);
        if (selectedSize) opts.push(`Taille: ${selectedSize}`);
        const optStr = opts.length ? `\n⚙️ Option : ${opts.join(' | ')}` : '';

        const msg = `Bonjour Pacifique Apple Store ! 👋\nJe souhaite commander cet article vu sur votre site web :\n🛍️ Produit : ${p.name}\n💰 Prix : ${formatFCFA(p.price)}\n✨ État : ${p.condition}${optStr}\n📍 Magasin : Marché Samsung Treichville N° 234\n\nL'article est-il disponible ? Merci !`;
        window.open(`https://wa.me/2250152589515?text=${encodeURIComponent(msg)}`, '_blank');
      };

      // Add to cart button
      document.getElementById('modalAddToCartBtn').onclick = () => {
        addToCart(p.id, { storage: selectedStorage, color: selectedColor, size: selectedSize });
        closeProductModal();
      };

      document.getElementById('productModal').classList.remove('hidden');
      lucide.createIcons();
    }

    function closeProductModal() {
      document.getElementById('productModal').classList.add('hidden');
    }

    function setModalStorage(s) {
      selectedStorage = s;
      document.querySelectorAll('.opt-storage').forEach(el => {
        el.className = el.innerText === s ? 'opt-storage px-3 py-1.5 text-xs font-semibold rounded-lg border bg-amber-500 text-neutral-950 border-amber-400' : 'opt-storage px-3 py-1.5 text-xs font-semibold rounded-lg border bg-neutral-800 text-neutral-300 border-neutral-700';
      });
    }

    function setModalColor(c) {
      selectedColor = c;
      document.querySelectorAll('.opt-color').forEach(el => {
        el.className = el.innerText === c ? 'opt-color px-2.5 py-1.5 text-xs rounded-lg border bg-neutral-800 text-white border-amber-400' : 'opt-color px-2.5 py-1.5 text-xs rounded-lg border bg-neutral-900/60 text-neutral-400 border-neutral-800';
      });
    }

    function setModalSize(s) {
      selectedSize = s;
      document.querySelectorAll('.opt-size').forEach(el => {
        el.className = el.innerText === s ? 'opt-size px-3 py-1.5 text-xs font-bold rounded-lg border bg-teal-500 text-neutral-950 border-teal-400' : 'opt-size px-3 py-1.5 text-xs font-bold rounded-lg border bg-neutral-800 text-neutral-300 border-neutral-700';
      });
    }

    // Direct WhatsApp Single Order
    function orderSingleWhatsApp(id) {
      const p = PRODUCTS.find(x => x.id === id);
      if (!p) return;
      const msg = `Bonjour Pacifique Apple Store ! 👋\nJe souhaite commander cet article :\n🛍️ Produit : ${p.name}\n💰 Prix : ${formatFCFA(p.price)}\n✨ État : ${p.condition}\n📍 Magasin : Marché Samsung Treichville N° 234\n\nEst-il disponible pour livraison ou retrait ? Merci !`;
      window.open(`https://wa.me/2250152589515?text=${encodeURIComponent(msg)}`, '_blank');
    }

    // Cart Management
    function addToCart(id, options = {}) {
      const p = PRODUCTS.find(x => x.id === id);
      if (!p) return;

      const storage = options.storage || p.options?.storage?.[0] || null;
      const color = options.color || p.options?.colors?.[0] || null;
      const size = options.size || p.options?.sizes?.[0] || null;

      const existing = cart.find(x => x.id === id && x.storage === storage && x.color === color && x.size === size);
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({ id: p.id, name: p.name, price: p.price, image: p.image, storage, color, size, qty: 1 });
      }

      saveCart();
      updateCartUI();
      openCart();
    }

    function saveCart() {
      localStorage.setItem('pacifique_cart', JSON.stringify(cart));
    }

    function updateCartUI() {
      const count = cart.reduce((sum, i) => sum + i.qty, 0);
      document.getElementById('cartCountBadge').innerText = count;
      document.getElementById('mobileCartBadge').innerText = count;

      const content = document.getElementById('cartContent');
      if (cart.length === 0) {
        content.innerHTML = `
          <div class="text-center py-12 space-y-3">
            <i data-lucide="shopping-bag" class="w-12 h-12 mx-auto text-neutral-600"></i>
            <p class="font-semibold text-neutral-300">Votre panier est vide</p>
            <button onclick="closeCart()" class="px-4 py-2 bg-amber-500 text-neutral-950 font-bold text-xs rounded-xl">Continuer les achats</button>
          </div>
        `;
        document.getElementById('cartTotal').innerText = '0 FCFA';
        lucide.createIcons();
        return;
      }

      let total = 0;
      let itemsHtml = cart.map((item, idx) => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        let opt = [];
        if (item.storage) opt.push(item.storage);
        if (item.color) opt.push(item.color);
        if (item.size) opt.push(`T.${item.size}`);

        return `
          <div class="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex gap-3 items-center justify-between">
            <img onerror="this.onerror=null;this.src='logo.jpeg'" src="${item.image}" alt="${item.name}" class="w-12 h-12 rounded-lg object-cover bg-neutral-900 shrink-0">
            <div class="flex-1 min-w-0">
              <h4 class="text-xs font-semibold text-neutral-100 truncate">${item.name}</h4>
              <p class="text-[10px] text-neutral-400 truncate">${opt.join(' · ')}</p>
              <p class="text-xs font-bold text-amber-400 mt-0.5">${formatFCFA(itemTotal)}</p>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="flex items-center bg-neutral-800 rounded-lg p-0.5 border border-neutral-700">
                <button onclick="changeQty(${idx}, -1)" class="w-7 h-7 flex items-center justify-center text-neutral-400 hover:text-white">-</button>
                <span class="text-xs font-bold px-1.5">${item.qty}</span>
                <button onclick="changeQty(${idx}, 1)" class="w-7 h-7 flex items-center justify-center text-neutral-400 hover:text-white">+</button>
              </div>
              <button onclick="removeCartItem(${idx})" class="p-1.5 text-neutral-500 hover:text-red-400">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        `;
      }).join('');

      content.innerHTML = `
        <div class="space-y-2.5">
          <div class="flex justify-between text-xs text-neutral-400">
            <span>Articles sélectionnés (${cart.length})</span>
            <button onclick="clearCart()" class="text-red-400 hover:text-red-300">Vider</button>
          </div>
          ${itemsHtml}
        </div>

        <div class="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2.5 text-xs">
          <p class="font-bold uppercase text-neutral-300 text-[11px]">Coordonnées client (facultatif)</p>
          <input type="text" id="custName" placeholder="Votre nom complet" class="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white">
          <input type="tel" id="custPhone" placeholder="Numéro de téléphone" class="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white">
          <input type="text" id="custAddress" placeholder="Quartier / Ville de livraison (ou Retrait Magasin)" class="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white">
        </div>
      `;

      document.getElementById('cartTotal').innerText = formatFCFA(total);
      lucide.createIcons();
    }

    function changeQty(idx, delta) {
      cart[idx].qty += delta;
      if (cart[idx].qty <= 0) cart.splice(idx, 1);
      saveCart();
      updateCartUI();
    }

    function removeCartItem(idx) {
      cart.splice(idx, 1);
      saveCart();
      updateCartUI();
    }

    function clearCart() {
      cart = [];
      saveCart();
      updateCartUI();
    }

    function openCart() {
      updateCartUI();
      document.getElementById('cartDrawer').classList.remove('hidden');
    }

    function closeCart() {
      document.getElementById('cartDrawer').classList.add('hidden');
    }

    function checkoutWhatsApp() {
      if (cart.length === 0) return;
      let total = 0;
      const list = cart.map((item, i) => {
        const lineTotal = item.price * item.qty;
        total += lineTotal;
        let opt = [];
        if (item.storage) opt.push(item.storage);
        if (item.color) opt.push(item.color);
        if (item.size) opt.push(`T.${item.size}`);
        const optStr = opt.length ? ` (${opt.join(', ')})` : '';
        return `${i+1}. *${item.name}*${optStr}\n   Quantité : ${item.qty} × ${formatFCFA(item.price)} = *${formatFCFA(lineTotal)}*`;
      }).join('\n\n');

      const name = document.getElementById('custName')?.value || 'Client site web';
      const phone = document.getElementById('custPhone')?.value || 'Ce numéro WhatsApp';
      const address = document.getElementById('custAddress')?.value || 'À convenir (Livraison Abidjan ou Retrait Magasin N°234 Treichville)';

      const msg = `Bonjour Pacifique Apple Store ! 👋\nJe souhaite valider ma commande préparée sur votre site :\n\n📦 *DÉTAIL DU PANIER (${cart.length} articles) :*\n${list}\n\n━━━━━━━━━━━━━━━━━━━\n💰 *MONTANT TOTAL ESTIMÉ :* *${formatFCFA(total)}*\n━━━━━━━━━━━━━━━━━━━\n\n👤 *INFOS CLIENT :*\n• *Nom :* ${name}\n• *Contact :* ${phone}\n• *Adresse / Modalité :* ${address}\n\nMerci de me confirmer la disponibilité pour finaliser !`;

      window.open(`https://wa.me/2250152589515?text=${encodeURIComponent(msg)}`, '_blank');
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
      renderSubcategories();
      renderProducts();
      updateCartUI();
      lucide.createIcons();
    });
  
// ===== Navigation multi-pages =====
(function () {
  const surCatalogue = !!document.getElementById('productsGrid');
  const champs = ['desktopSearch', 'mobileSearch'];
  if (!surCatalogue) {
    window.selectCategory = c => { location.href = 'catalogue.html' + (c && c !== 'tous' ? '?cat=' + c : ''); };
    window.handleSearch = () => {};
    document.addEventListener('DOMContentLoaded', () => champs.forEach(id => {
      const i = document.getElementById(id);
      if (i) i.addEventListener('keydown', e => {
        if (e.key === 'Enter' && i.value.trim()) location.href = 'catalogue.html?q=' + encodeURIComponent(i.value.trim());
      });
    }));
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      const p = new URLSearchParams(location.search);
      if (p.get('cat')) selectCategory(p.get('cat'));
      const q = p.get('q');
      if (q) { champs.forEach(id => { const i = document.getElementById(id); if (i) i.value = q; }); handleSearch(q); }
    });
  }
})();
