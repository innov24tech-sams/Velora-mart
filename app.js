/* ===== Velora-Mart demo app ===== */
const LS = {
  get(k,d){try{const v=JSON.parse(localStorage.getItem(k));return v===null?d:v;}catch(e){return d;}},
  set(k,v){localStorage.setItem(k, JSON.stringify(v));}
};

const CATEGORIES = ['Electronics','Fashion','Home & Kitchen','Beauty','Sports','Books','Toys','Grocery'];
const SELLERS = [
  {id:'s1',name:'TechNova Store',rating:4.6,followers:1200,desc:'Premium electronics & gadgets.'},
  {id:'s2',name:'Urban Threads',rating:4.3,followers:800,desc:'Trendy fashion for everyone.'},
  {id:'s3',name:'HomeEase',rating:4.7,followers:560,desc:'Everything for a cozy home.'},
  {id:'s4',name:'GlowBox Beauty',rating:4.5,followers:950,desc:'Skincare & cosmetics curated.'}
];
const EMOJIS = ['📱','💻','🎧','⌚','👗','👟','👜','🛋️','🍳','🧴','💄','⚽','📚','🧸','🥫','📷','🖥️','🔌'];

function seedProducts(){
  let p = LS.get('vm_products', null);
  if(p) return p;
  p = [];
  let id=1;
  CATEGORIES.forEach(cat=>{
    for(let i=0;i<6;i++){
      const base = Math.floor(Math.random()*8000)+500;
      const discount = [0,10,15,20,30][Math.floor(Math.random()*5)];
      const seller = SELLERS[Math.floor(Math.random()*SELLERS.length)];
      p.push({
        id: 'p'+id++,
        title: `${cat} Item ${i+1}`,
        category: cat,
        brand: ['Velora','Nova','Zen','Pulse','Aero'][Math.floor(Math.random()*5)],
        price: base,
        discount,
        finalPrice: Math.round(base*(1-discount/100)),
        rating: (3.5+Math.random()*1.5).toFixed(1),
        reviews: [],
        stock: Math.floor(Math.random()*50),
        seller: seller.id,
        emoji: EMOJIS[Math.floor(Math.random()*EMOJIS.length)],
        colors: ['Red','Blue','Black'],
        sizes: ['S','M','L'],
        sku: 'SKU-'+Math.floor(Math.random()*90000+10000),
        createdAt: Date.now() - Math.floor(Math.random()*1e10),
        approved: true
      });
    }
  });
  LS.set('vm_products', p);
  return p;
}

let STATE = {
  products: seedProducts(),
  user: LS.get('vm_user', null),
  cart: LS.get('vm_cart', []),
  wishlist: LS.get('vm_wishlist', []),
  compare: LS.get('vm_compare', []),
  orders: LS.get('vm_orders', []),
  addresses: LS.get('vm_addresses', []),
  coupons: LS.get('vm_coupons', [{code:'VELORA10',type:'percent',value:10},{code:'FLAT200',type:'flat',value:200}]),
  recentlyViewed: LS.get('vm_recent', []),
  route: 'home',
  selectedAddr: null,
  pdState: {}
};
function persist(){
  LS.set('vm_products', STATE.products);
  LS.set('vm_cart', STATE.cart);
  LS.set('vm_wishlist', STATE.wishlist);
  LS.set('vm_compare', STATE.compare);
  LS.set('vm_orders', STATE.orders);
  LS.set('vm_addresses', STATE.addresses);
  LS.set('vm_coupons', STATE.coupons);
  LS.set('vm_recent', STATE.recentlyViewed);
  LS.set('vm_user', STATE.user);
}

function toast(msg){
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className='toast'; t.textContent=msg;
  c.appendChild(t);
  setTimeout(()=>t.remove(), 2800);
}

function fmt(n){ return '₹'+Number(n).toLocaleString('en-IN'); }
function sellerName(id){ const s=SELLERS.find(x=>x.id===id); return s?s.name:'Unknown Seller'; }
function sellerObj(id){ return SELLERS.find(x=>x.id===id); }

function go(route, params={}){
  STATE.route = route; STATE.params = params;
  render();
  window.scrollTo({top:0,behavior:'smooth'});
  document.getElementById('accountMenu').classList.add('hidden');
}

function renderMegaMenu(){
  const m = document.getElementById('megaMenu');
  m.innerHTML = CATEGORIES.map(c=>`<span onclick="go('listing',{category:'${c}'})">${c}</span>`).join('') + `<span onclick="go('flash')">⚡ Flash Deals</span><span onclick="go('sellers')">Sellers</span>`;
}
renderMegaMenu();

function updateHeaderCounts(){
  document.getElementById('cartCount').textContent = STATE.cart.reduce((a,c)=>a+c.qty,0);
  document.getElementById('wishCount').textContent = STATE.wishlist.length;
  document.getElementById('cmpCount').textContent = STATE.compare.length;
  document.getElementById('accInfo').textContent = STATE.user ? `${STATE.user.name} (${STATE.user.role})` : 'Guest';
}
function toggleAccountMenu(){ document.getElementById('accountMenu').classList.toggle('hidden'); }
document.addEventListener('click', e=>{
  const menu = document.getElementById('accountMenu');
  if(!menu.contains(e.target) && !e.target.closest('.icon-btn')) menu.classList.add('hidden');
});

function logout(){ STATE.user=null; persist(); toast('Logged out'); go('home'); }

/* ===== Search ===== */
function handleSearchInput(){
  const q = document.getElementById('searchInput').value.toLowerCase();
  const box = document.getElementById('autocomplete');
  if(!q){ box.innerHTML=''; return; }
  const matches = STATE.products.filter(p=>p.title.toLowerCase().includes(q)||p.category.toLowerCase().includes(q)||p.brand.toLowerCase().includes(q)).slice(0,6);
  box.innerHTML = matches.map(p=>`<div onclick="go('product',{id:'${p.id}'})">${p.emoji} ${p.title} <small style='color:#888'>(${p.category})</small></div>`).join('') || '<div>No results</div>';
}
function doSearch(){
  const q = document.getElementById('searchInput').value;
  if(!q) return;
  let hist = LS.get('vm_search_hist', []);
  hist.unshift(q); hist = [...new Set(hist)].slice(0,8);
  LS.set('vm_search_hist', hist);
  go('listing', {q});
  document.getElementById('autocomplete').innerHTML='';
}

/* ===== Render Router ===== */
function render(){
  updateHeaderCounts();
  const app = document.getElementById('app');
  const r = STATE.route;
  if(r==='home') app.innerHTML = pageHome();
  else if(r==='listing') app.innerHTML = pageListing();
  else if(r==='product') app.innerHTML = pageProduct();
  else if(r==='cart') app.innerHTML = pageCart();
  else if(r==='checkout') app.innerHTML = pageCheckout();
  else if(r==='orders') app.innerHTML = pageOrders();
  else if(r==='wishlist') app.innerHTML = pageWishlist();
  else if(r==='compare') app.innerHTML = pageCompare();
  else if(r==='login') app.innerHTML = pageLogin();
  else if(r==='profile') app.innerHTML = pageProfile();
  else if(r==='seller-dash') app.innerHTML = pageSellerDash();
  else if(r==='admin-dash') app.innerHTML = pageAdminDash();
  else if(r==='sellers') app.innerHTML = pageSellerList();
  else if(r==='seller-store') app.innerHTML = pageSellerStore();
  else if(r==='flash') app.innerHTML = pageListing({flash:true});
  else if(r==='returns') app.innerHTML = pageReturns();
  else app.innerHTML = `<div class='empty-state'><div>🚧</div><h3>Page not found</h3></div>`;
  attachPageEvents();
}

/* ===== HOME ===== */
function pageHome(){
  const trending = [...STATE.products].sort((a,b)=>b.rating-a.rating).slice(0,8);
  const bestSellers = [...STATE.products].sort(()=>0.5-Math.random()).slice(0,8);
  const newArrivals = [...STATE.products].sort((a,b)=>b.createdAt-a.createdAt).slice(0,8);
  const flash = STATE.products.filter(p=>p.discount>=20).slice(0,8);
  const recent = STATE.recentlyViewed.map(id=>STATE.products.find(p=>p.id===id)).filter(Boolean).slice(0,8);

  return `
  <div class="hero">
    <h1>Discover Everything You Love</h1>
    <p>Shop from thousands of trusted sellers across every category.</p>
    <button onclick="go('listing')">Start Shopping</button>
  </div>

  <section>
    <div class="section-head"><h2>Featured Categories</h2></div>
    <div class="grid">
      ${CATEGORIES.map(c=>`<div class="cat-card" onclick="go('listing',{category:'${c}'})"><div class="emoji">🛍️</div><h3>${c}</h3></div>`).join('')}
    </div>
  </section>

  <section>
    <div class="flash-banner"><div><strong>⚡ Flash Deals</strong> — Up to 30% off, today only!</div><a style="color:#fff;font-weight:700" onclick="go('flash')">Shop Now →</a></div>
    <div class="grid">${flash.map(productCard).join('')}</div>
  </section>

  <section>
    <div class="section-head"><h2>Trending Products</h2><a onclick="go('listing')">View all</a></div>
    <div class="grid">${trending.map(productCard).join('')}</div>
  </section>

  <section>
    <div class="section-head"><h2>Best Sellers</h2><a onclick="go('listing')">View all</a></div>
    <div class="grid">${bestSellers.map(productCard).join('')}</div>
  </section>

  <section>
    <div class="section-head"><h2>New Arrivals</h2><a onclick="go('listing')">View all</a></div>
    <div class="grid">${newArrivals.map(productCard).join('')}</div>
  </section>

  <section>
    <div class="section-head"><h2>Featured Vendors</h2><a onclick="go('sellers')">View all</a></div>
    <div class="grid">${SELLERS.map(s=>`<div class="cat-card" onclick="go('seller-store',{id:'${s.id}'})"><div class="emoji">🏪</div><h3>${s.name}</h3><div class="rating">★ ${s.rating}</div></div>`).join('')}</div>
  </section>

  ${recent.length?`<section><div class="section-head"><h2>Recently Viewed</h2></div><div class="grid">${recent.map(productCard).join('')}</div></section>`:''}
  `;
}

function productCard(p){
  const inWish = STATE.wishlist.includes(p.id);
  const inCmp = STATE.compare.includes(p.id);
  return `<div class="product-card">
    <button class="wish-btn ${inWish?'active':''}" onclick="toggleWishlist('${p.id}')">♥</button>
    <div class="product-img" onclick="go('product',{id:'${p.id}'})">${p.emoji}</div>
    <div class="product-body" onclick="go('product',{id:'${p.id}'})">
      <h3>${p.title}</h3>
      <div class="price-row">
        <span class="price">${fmt(p.finalPrice)}</span>
        ${p.discount?`<span class="old-price">${fmt(p.price)}</span><span class="discount-tag">${p.discount}% OFF</span>`:''}
      </div>
      <div class="rating">★ ${p.rating} <span class="seller-tag">· ${sellerName(p.seller)}</span></div>
    </div>
    <div class="card-actions">
      <button onclick="addToCart('${p.id}')" class="primary">Add to Cart</button>
      <button onclick="toggleCompare('${p.id}')">${inCmp?'Remove':'Compare'}</button>
    </div>
  </div>`;
}

function toggleWishlist(id){
  const i = STATE.wishlist.indexOf(id);
  if(i>-1){ STATE.wishlist.splice(i,1); toast('Removed from wishlist'); }
  else { STATE.wishlist.push(id); toast('Added to wishlist'); }
  persist(); render();
}
function toggleCompare(id){
  const i = STATE.compare.indexOf(id);
  if(i>-1){ STATE.compare.splice(i,1); }
  else { if(STATE.compare.length>=4){ toast('You can compare up to 4 products'); return;} STATE.compare.push(id); }
  persist(); render();
}
function addToCart(id, variant={}, qty=1){
  const existing = STATE.cart.find(c=>c.id===id && JSON.stringify(c.variant)===JSON.stringify(variant));
  if(existing) existing.qty += qty;
  else STATE.cart.push({id, variant, qty});
  persist(); updateHeaderCounts(); toast('Added to cart');
}

/* ===== LISTING ===== */
function pageListing(initParams){
  const params = Object.assign({}, STATE.params, initParams||{});
  const ui = pageListing.ui || (pageListing.ui = {
    category: params.category || 'All', q: params.q || '', minPrice:0, maxPrice:10000, brand:'All', rating:0, sort:'newest', view:'grid'
  });
  if(params.category) ui.category = params.category;
  if(params.q !== undefined) ui.q = params.q;

  let list = STATE.products.filter(p=>p.approved!==false);
  if(params.flash) list = list.filter(p=>p.discount>=20);
  if(ui.category && ui.category!=='All') list = list.filter(p=>p.category===ui.category);
  if(ui.q) list = list.filter(p=>p.title.toLowerCase().includes(ui.q.toLowerCase()));
  list = list.filter(p=>p.finalPrice>=ui.minPrice && p.finalPrice<=ui.maxPrice);
  if(ui.brand!=='All') list = list.filter(p=>p.brand===ui.brand);
  if(ui.rating>0) list = list.filter(p=>p.rating>=ui.rating);

  if(ui.sort==='price-asc') list.sort((a,b)=>a.finalPrice-b.finalPrice);
  else if(ui.sort==='price-desc') list.sort((a,b)=>b.finalPrice-a.finalPrice);
  else if(ui.sort==='rating') list.sort((a,b)=>b.rating-a.rating);
  else list.sort((a,b)=>b.createdAt-a.createdAt);

  const brands = [...new Set(STATE.products.map(p=>p.brand))];

  setTimeout(()=>{
    document.getElementById('f-minprice')?.addEventListener('input', e=>{ui.minPrice=+e.target.value; render();});
    document.getElementById('f-maxprice')?.addEventListener('input', e=>{ui.maxPrice=+e.target.value; render();});
  },0);

  return `
  <h2 style="margin:20px 0">${ui.category!=='All'?ui.category:(ui.q?`Results for \"${ui.q}\"`:'All Products')}</h2>
  <div class="listing-layout">
    <aside class="filters">
      <h4>Category</h4>
      <label><input type="radio" name="cat" ${ui.category==='All'?'checked':''} onchange="updateListingFilter('category','All')"> All</label>
      ${CATEGORIES.map(c=>`<label><input type="radio" name="cat" ${ui.category===c?'checked':''} onchange="updateListingFilter('category','${c}')"> ${c}</label>`).join('')}
      <h4>Price Range</h4>
      <input id="f-minprice" type="range" min="0" max="10000" value="${ui.minPrice}"> Min: ${fmt(ui.minPrice)}<br>
      <input id="f-maxprice" type="range" min="0" max="10000" value="${ui.maxPrice}"> Max: ${fmt(ui.maxPrice)}
      <h4>Brand</h4>
      <select onchange="updateListingFilter('brand',this.value)">
        <option ${ui.brand==='All'?'selected':''}>All</option>
        ${brands.map(b=>`<option ${ui.brand===b?'selected':''}>${b}</option>`).join('')}
      </select>
      <h4>Rating</h4>
      ${[4,3,2].map(r=>`<label><input type="radio" name="rt" ${ui.rating===r?'checked':''} onchange="updateListingFilter('rating',${r})"> ${r}★ & up</label>`).join('')}
      <label><input type="radio" name="rt" ${ui.rating===0?'checked':''} onchange="updateListingFilter('rating',0)"> Any</label>
    </aside>
    <div>
      <div class="toolbar">
        <span>${list.length} products found</span>
        <select onchange="updateListingFilter('sort',this.value)">
          <option value="newest" ${ui.sort==='newest'?'selected':''}>Newest</option>
          <option value="price-asc" ${ui.sort==='price-asc'?'selected':''}>Price: Low to High</option>
          <option value="price-desc" ${ui.sort==='price-desc'?'selected':''}>Price: High to Low</option>
          <option value="rating" ${ui.sort==='rating'?'selected':''}>Top Rated</option>
        </select>
      </div>
      ${list.length? `<div class="grid">${list.map(productCard).join('')}</div>` : `<div class="empty-state"><div>🔍</div><h3>No products match your filters</h3></div>`}
    </div>
  </div>`;
}
function updateListingFilter(key,val){
  const ui = pageListing.ui;
  ui[key]=val;
  render();
}

/* ===== PRODUCT DETAILS ===== */
function pageProduct(){
  const id = STATE.params.id;
  const p = STATE.products.find(x=>x.id===id);
  if(!p) return `<div class='empty-state'><div>❓</div><h3>Product not found</h3></div>`;
  if(!STATE.recentlyViewed.includes(id)){ STATE.recentlyViewed.unshift(id); STATE.recentlyViewed = STATE.recentlyViewed.slice(0,10); persist(); }
  STATE.pdState = STATE.pdState.id===id ? STATE.pdState : {id, color:p.colors[0], size:p.sizes[0], qty:1, tab:'desc'};
  const related = STATE.products.filter(x=>x.category===p.category && x.id!==p.id).slice(0,4);
  const seller = sellerObj(p.seller);

  return `
  <div class="pd-grid">
    <div class="pd-gallery">
      <div class="pd-main-img">${p.emoji}</div>
      <div class="pd-thumbs">${[1,2,3].map(i=>`<div class="${i===1?'active':''}">${p.emoji}</div>`).join('')}</div>
    </div>
    <div class="pd-info">
      <h1>${p.title}</h1>
      <div class="rating">★ ${p.rating} (${p.reviews.length} reviews) · <span class="seller-tag">Sold by <a onclick="go('seller-store',{id:'${p.seller}'})">${seller.name}</a></span></div>
      <div class="price-row" style="margin:10px 0">
        <span class="price">${fmt(p.finalPrice)}</span>
        ${p.discount?`<span class="old-price">${fmt(p.price)}</span><span class="discount-tag">${p.discount}% OFF</span>`:''}
      </div>
      <div class="pd-meta">SKU: ${p.sku} &nbsp;|&nbsp; ${p.stock>0?`In Stock (${p.stock})`:'Out of Stock'}</div>
      <div class="variant-group"><strong>Color</strong><div class="opts">${p.colors.map(c=>`<span class="${STATE.pdState.color===c?'active':''}" onclick="setPd('color','${c}')">${c}</span>`).join('')}</div></div>
      <div class="variant-group"><strong>Size</strong><div class="opts">${p.sizes.map(s=>`<span class="${STATE.pdState.size===s?'active':''}" onclick="setPd('size','${s}')">${s}</span>`).join('')}</div></div>
      <div class="qty-row"><button onclick="setPd('qty',${Math.max(1,STATE.pdState.qty-1)})">-</button><span>${STATE.pdState.qty}</span><button onclick="setPd('qty',${STATE.pdState.qty+1})">+</button></div>
      <div class="pd-actions">
        <button class="primary" onclick="addToCart('${p.id}',{color:STATE.pdState.color,size:STATE.pdState.size},STATE.pdState.qty)">Add to Cart</button>
        <button class="accent" onclick="buyNow('${p.id}')">Buy Now</button>
        <button class="ghost" onclick="toggleWishlist('${p.id}')">${STATE.wishlist.includes(p.id)?'♥ Wishlisted':'♡ Wishlist'}</button>
        <button class="ghost" onclick="toggleCompare('${p.id}')">${STATE.compare.includes(p.id)?'Remove Compare':'Compare'}</button>
      </div>
    </div>
  </div>

  <div class="tabs">
    <button class="${STATE.pdState.tab==='desc'?'active':''}" onclick="setPd('tab','desc')">Description</button>
    <button class="${STATE.pdState.tab==='spec'?'active':''}" onclick="setPd('tab','spec')">Specifications</button>
    <button class="${STATE.pdState.tab==='ship'?'active':''}" onclick="setPd('tab','ship')">Shipping & Returns</button>
    <button class="${STATE.pdState.tab==='rev'?'active':''}" onclick="setPd('tab','rev')">Reviews (${p.reviews.length})</button>
  </div>
  <div>${renderPdTab(p)}</div>

  <section><div class="section-head"><h2>Related Products</h2></div><div class="grid">${related.map(productCard).join('')}</div></section>
  `;
}
function setPd(key,val){ STATE.pdState[key]=val; render(); }
function buyNow(id){ addToCart(id, {color:STATE.pdState.color,size:STATE.pdState.size}, STATE.pdState.qty); go('checkout'); }
function renderPdTab(p){
  if(STATE.pdState.tab==='desc') return `<p>Premium quality ${p.title} from ${p.category} collection. Crafted with care for everyday use. Brand: ${p.brand}.</p>`;
  if(STATE.pdState.tab==='spec') return `<ul><li>Brand: ${p.brand}</li><li>Category: ${p.category}</li><li>SKU: ${p.sku}</li><li>Colors: ${p.colors.join(', ')}</li><li>Sizes: ${p.sizes.join(', ')}</li></ul>`;
  if(STATE.pdState.tab==='ship') return `<p>🚚 Free shipping on orders above ₹499. Estimated delivery: 3-7 business days.<br>↩️ Easy 7-day returns. No questions asked.</p>`;
  if(STATE.pdState.tab==='rev') return `
    <div>
      ${p.reviews.length? p.reviews.map(r=>`<div class="review-item"><strong>${r.user}</strong> — ★${r.rating}<p>${r.text}</p></div>`).join('') : '<p>No reviews yet. Be the first to review!</p>'}
      <div style="margin-top:16px">
        <select id="revRating"><option value="5">★★★★★</option><option value="4">★★★★</option><option value="3">★★★</option><option value="2">★★</option><option value="1">★</option></select>
        <textarea id="revText" placeholder="Write your review..." style="width:100%;margin-top:8px;padding:8px;border-radius:8px;border:1px solid #ddd"></textarea>
        <button class="primary" style="margin-top:8px;padding:10px 20px;border-radius:8px;color:#fff;background:var(--primary)" onclick="submitReview('${p.id}')">Submit Review</button>
      </div>
    </div>`;
}
function submitReview(id){
  const rating = +document.getElementById('revRating').value;
  const text = document.getElementById('revText').value || '';
  const p = STATE.products.find(x=>x.id===id);
  p.reviews.push({user: STATE.user?STATE.user.name:'Guest', rating, text, date: Date.now()});
  const avg = p.reviews.reduce((a,r)=>a+r.rating,0)/p.reviews.length;
  p.rating = avg.toFixed(1);
  persist(); toast('Review submitted'); render();
}

/* ===== CART ===== */
function pageCart(){
  if(!STATE.cart.length) return `<div class="empty-state"><div>🛒</div><h3>Your cart is empty</h3><p><a onclick="go('listing')">Continue Shopping</a></p></div>`;
  const bySeller = {};
  STATE.cart.forEach(c=>{
    const p = STATE.products.find(x=>x.id===c.id); if(!p) return;
    bySeller[p.seller] = bySeller[p.seller] || [];
    bySeller[p.seller].push({...c, product:p});
  });
  let subtotal=0;
  STATE.cart.forEach(c=>{ const p=STATE.products.find(x=>x.id===c.id); if(p) subtotal += p.finalPrice*c.qty; });
  const tax = Math.round(subtotal*0.05);
  const delivery = subtotal>499?0:49;
  const total = subtotal+tax+delivery;

  let html = `<h2 style="margin:20px 0">Shopping Cart</h2><div class="checkout-layout"><div>`;
  Object.entries(bySeller).forEach(([sellerId, items])=>{
    html += `<div class="cart-vendor-head">🏪 ${sellerName(sellerId)}</div>`;
    items.forEach(it=>{
      html += `<div class="cart-row">
        <div class="product-img" style="height:60px;border-radius:8px;font-size:1.6rem">${it.product.emoji}</div>
        <div><strong>${it.product.title}</strong><br><small style="color:#888">${it.variant.color||''} ${it.variant.size||''}</small></div>
        <div>
          <button onclick="changeQty('${it.id}','${JSON.stringify(it.variant).replace(/"/g,'&quot;')}',-1)">-</button>
          ${it.qty}
          <button onclick="changeQty('${it.id}','${JSON.stringify(it.variant).replace(/"/g,'&quot;')}',1)">+</button>
        </div>
        <div><strong>${fmt(it.product.finalPrice*it.qty)}</strong></div>
        <button onclick="removeFromCart('${it.id}','${JSON.stringify(it.variant).replace(/"/g,'&quot;')}')">🗑️</button>
      </div>`;
    });
  });
  html += `</div>
  <div class="cart-summary">
    <h3>Order Summary</h3>
    <div class="summary-row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
    <div class="summary-row"><span>Tax (5%)</span><span>${fmt(tax)}</span></div>
    <div class="summary-row"><span>Delivery</span><span>${delivery===0?'FREE':fmt(delivery)}</span></div>
    <div class="summary-row total"><span>Total</span><span>${fmt(total)}</span></div>
    <button class="primary" style="width:100%;padding:12px;border-radius:8px;color:#fff;background:var(--primary);margin-top:10px" onclick="go('checkout')">Proceed to Checkout</button>
  </div></div>`;
  return html;
}
function changeQty(id, variantStr, delta){
  const variant = JSON.parse(variantStr);
  const item = STATE.cart.find(c=>c.id===id && JSON.stringify(c.variant)===JSON.stringify(variant));
  if(item){ item.qty += delta; if(item.qty<=0) STATE.cart = STATE.cart.filter(c=>c!==item); }
  persist(); render();
}
function removeFromCart(id, variantStr){
  const variant = JSON.parse(variantStr);
  STATE.cart = STATE.cart.filter(c=>!(c.id===id && JSON.stringify(c.variant)===JSON.stringify(variant)));
  persist(); render(); toast('Item removed');
}

/* ===== CHECKOUT ===== */
function pageCheckout(){
  if(!STATE.cart.length) return `<div class="empty-state"><div>🛒</div><h3>Cart is empty</h3></div>`;
  if(!STATE.addresses.length){
    STATE.addresses.push({id:'a1', name: STATE.user?STATE.user.name:'Guest User', line:'221B Baker Street', city:'Mumbai', pincode:'400001', phone:'9999999999'});
    STATE.selectedAddr = 'a1'; persist();
  }
  if(!STATE.selectedAddr) STATE.selectedAddr = STATE.addresses[0].id;
  let subtotal=0;
  STATE.cart.forEach(c=>{ const p=STATE.products.find(x=>x.id===c.id); if(p) subtotal += p.finalPrice*c.qty; });
  const couponApplied = STATE.appliedCoupon;
  let discount = 0;
  if(couponApplied){
    discount = couponApplied.type==='percent'? Math.round(subtotal*couponApplied.value/100) : couponApplied.value;
  }
  const tax = Math.round((subtotal-discount)*0.05);
  const delivery = subtotal>499?0:49;
  const total = subtotal - discount + tax + delivery;

  return `
  <h2 style="margin:20px 0">Checkout</h2>
  <div class="checkout-layout">
    <div>
      <h3>Shipping Address</h3>
      ${STATE.addresses.map(a=>`<div class="addr-card ${STATE.selectedAddr===a.id?'selected':''}" onclick="selectAddr('${a.id}')"><strong>${a.name}</strong><br>${a.line}, ${a.city} - ${a.pincode}<br>📞 ${a.phone}</div>`).join('')}
      <button onclick="addAddress()" class="ghost" style="padding:8px 16px;border-radius:8px;background:var(--bg)">+ Add New Address</button>

      <h3 style="margin-top:24px">Payment Method</h3>
      <select id="payMethod" style="width:100%;padding:10px;border-radius:8px;border:1px solid #ddd">
        <option>Credit/Debit Card</option>
        <option>UPI</option>
        <option>Net Banking</option>
        <option>Wallet</option>
        <option>Cash on Delivery</option>
      </select>

      <h3 style="margin-top:24px">Coupon</h3>
      <div style="display:flex;gap:8px">
        <input id="couponInput" placeholder="Enter coupon code" style="flex:1;padding:10px;border-radius:8px;border:1px solid #ddd">
        <button onclick="applyCoupon()" style="padding:10px 18px;border-radius:8px;background:var(--primary);color:#fff">Apply</button>
      </div>
      <small style="color:#888">Try: VELORA10 or FLAT200</small>
    </div>
    <div class="cart-summary">
      <h3>Order Summary</h3>
      <div class="summary-row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
      ${discount?`<div class="summary-row"><span>Coupon Discount</span><span>-${fmt(discount)}</span></div>`:''}
      <div class="summary-row"><span>Tax</span><span>${fmt(tax)}</span></div>
      <div class="summary-row"><span>Delivery</span><span>${delivery===0?'FREE':fmt(delivery)}</span></div>
      <div class="summary-row total"><span>Total</span><span>${fmt(total)}</span></div>
      <button style="width:100%;padding:12px;border-radius:8px;color:#fff;background:var(--accent);margin-top:10px;font-weight:700" onclick="placeOrder(${total})">Place Order</button>
    </div>
  </div>`;
}
function selectAddr(id){ STATE.selectedAddr = id; render(); }
function addAddress(){
  const line = prompt('Address line:'); if(!line) return;
  const city = prompt('City:')||'City';
  const pincode = prompt('Pincode:')||'000000';
  const addr = {id:'a'+Date.now(), name:STATE.user?STATE.user.name:'Guest', line, city, pincode, phone:'9999999999'};
  STATE.addresses.push(addr); STATE.selectedAddr=addr.id; persist(); render();
}
function applyCoupon(){
  const code = document.getElementById('couponInput').value.trim().toUpperCase();
  const c = STATE.coupons.find(x=>x.code===code);
  if(c){ STATE.appliedCoupon = c; toast('Coupon applied!'); } else { toast('Invalid coupon'); STATE.appliedCoupon=null; }
  render();
}
function placeOrder(total){
  const COMMISSION_RATE = 0.10;
  const groups = {};
  STATE.cart.forEach(c=>{ const p = STATE.products.find(x=>x.id===c.id); if(!p) return; groups[p.seller]=groups[p.seller]||[]; groups[p.seller].push({...c, product:p}); });
  Object.entries(groups).forEach(([sellerId, items])=>{
    const orderTotal = items.reduce((a,i)=>a+i.product.finalPrice*i.qty,0);
    const commission = Math.round(orderTotal*COMMISSION_RATE);
    STATE.orders.push({
      id:'ORD'+Date.now()+Math.floor(Math.random()*999),
      seller: sellerId,
      items: items.map(i=>({id:i.product.id, title:i.product.title, qty:i.qty, price:i.product.finalPrice, variant:i.variant})),
      total: orderTotal,
      commission,
      sellerEarning: orderTotal-commission,
      status:'Pending',
      paymentStatus:'Paid',
      customer: STATE.user?STATE.user.name:'Guest',
      date: Date.now()
    });
  });
  STATE.cart = []; STATE.appliedCoupon=null;
  persist();
  toast('🎉 Order placed successfully!');
  go('orders');
}

/* ===== ORDERS ===== */
function pageOrders(){
  const myOrders = STATE.orders.filter(o=> !STATE.user || o.customer===STATE.user.name || true);
  if(!myOrders.length) return `<div class="empty-state"><div>📦</div><h3>No orders yet</h3></div>`;
  return `<h2 style="margin:20px 0">My Orders</h2>
  <table><thead><tr><th>Order ID</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead><tbody>
  ${myOrders.map(o=>`<tr>
    <td>${o.id}</td>
    <td>${o.items.map(i=>i.title).join(', ')}</td>
    <td>${fmt(o.total)}</td>
    <td><span class="status-pill status-${o.status.toLowerCase()}">${o.status}</span></td>
    <td>${new Date(o.date).toLocaleDateString()}</td>
    <td>
      ${o.status!=='Cancelled' && o.status!=='Delivered' ? `<button onclick="cancelOrder('${o.id}')" style="padding:4px 10px;border-radius:6px;background:#fee;font-size:.75rem">Cancel</button>` : ''}
      ${o.status==='Delivered' ? `<button onclick="requestReturn('${o.id}')" style="padding:4px 10px;border-radius:6px;background:#eef;font-size:.75rem">Return</button>` : ''}
    </td>
  </tr>`).join('')}
  </tbody></table>`;
}
function cancelOrder(id){ const o=STATE.orders.find(x=>x.id===id); if(o){ o.status='Cancelled'; persist(); toast('Order cancelled'); render(); } }
function requestReturn(id){ const o=STATE.orders.find(x=>x.id===id); if(o){ o.status='Returned'; persist(); toast('Return requested'); render(); } }
function pageReturns(){
  const returned = STATE.orders.filter(o=>o.status==='Returned');
  return `<h2 style="margin:20px 0">Returns & Refunds</h2>${returned.length? `<table><thead><tr><th>Order</th><th>Total</th><th>Status</th></tr></thead><tbody>${returned.map(o=>`<tr><td>${o.id}</td><td>${fmt(o.total)}</td><td>Processing Refund</td></tr>`).join('')}</tbody></table>` : `<div class="empty-state"><div>↩️</div><h3>No return requests</h3></div>`}`;
}

/* ===== WISHLIST / COMPARE ===== */
function pageWishlist(){
  const items = STATE.wishlist.map(id=>STATE.products.find(p=>p.id===id)).filter(Boolean);
  if(!items.length) return `<div class="empty-state"><div>♡</div><h3>Your wishlist is empty</h3></div>`;
  return `<h2 style="margin:20px 0">My Wishlist</h2><div class="grid">${items.map(productCard).join('')}</div>`;
}
function pageCompare(){
  const items = STATE.compare.map(id=>STATE.products.find(p=>p.id===id)).filter(Boolean);
  if(!items.length) return `<div class="empty-state"><div>⇄</div><h3>No products to compare</h3></div>`;
  return `<h2 style="margin:20px 0">Compare Products</h2>
  <table><thead><tr><th>Attribute</th>${items.map(p=>`<th>${p.title}</th>`).join('')}</tr></thead><tbody>
  <tr><td>Price</td>${items.map(p=>`<td>${fmt(p.finalPrice)}</td>`).join('')}</tr>
  <tr><td>Brand</td>${items.map(p=>`<td>${p.brand}</td>`).join('')}</tr>
  <tr><td>Rating</td>${items.map(p=>`<td>★ ${p.rating}</td>`).join('')}</tr>
  <tr><td>Seller</td>${items.map(p=>`<td>${sellerName(p.seller)}</td>`).join('')}</tr>
  <tr><td>Stock</td>${items.map(p=>`<td>${p.stock>0?'In Stock':'Out of Stock'}</td>`).join('')}</tr>
  </tbody></table>`;
}

/* ===== LOGIN / PROFILE ===== */
function pageLogin(){
  return `<form class="form-card" onsubmit="return doLogin(event)">
    <h2>Login to Velora-Mart</h2>
    <div class="role-tabs">
      <button type="button" id="rb-customer" class="active" onclick="setRole('customer')">Customer</button>
      <button type="button" id="rb-seller" onclick="setRole('seller')">Seller</button>
      <button type="button" id="rb-admin" onclick="setRole('admin')">Admin</button>
    </div>
    <input id="loginName" placeholder="Full name" required>
    <input id="loginEmail" type="email" placeholder="Email address" required>
    <input id="loginOtp" placeholder="Enter OTP (demo: 1234)" required>
    <button type="submit">Login / Sign up</button>
    <p style="margin-top:10px;text-align:center"><a onclick="go('home')">Continue as Guest</a></p>
  </form>`;
}
let selectedRole = 'customer';
function setRole(role){
  selectedRole = role;
  ['customer','seller','admin'].forEach(r=>document.getElementById('rb-'+r).classList.toggle('active', r===role));
}
function doLogin(e){
  e.preventDefault();
  const name = document.getElementById('loginName').value;
  const email = document.getElementById('loginEmail').value;
  const otp = document.getElementById('loginOtp').value;
  if(otp!=='1234'){ toast('Invalid OTP. Use 1234 for demo.'); return false; }
  STATE.user = {name, email, role: selectedRole};
  persist(); toast(`Welcome, ${name}!`);
  go(selectedRole==='seller'?'seller-dash': selectedRole==='admin'?'admin-dash':'home');
  return false;
}
function pageProfile(){
  if(!STATE.user) return `<div class="empty-state"><div>👤</div><h3>Please login to view profile</h3><p><a onclick="go('login')">Login</a></p></div>`;
  return `<form class="form-card">
    <h2>My Profile</h2>
    <input value="${STATE.user.name}" readonly>
    <input value="${STATE.user.email}" readonly>
    <input value="Role: ${STATE.user.role}" readonly>
    <h3 style="margin:14px 0 6px">Saved Addresses</h3>
    ${STATE.addresses.map(a=>`<div class="addr-card">${a.name}, ${a.line}, ${a.city} - ${a.pincode}</div>`).join('') || '<p>No addresses saved</p>'}
  </form>`;
}

/* ===== SELLERS ===== */
function pageSellerList(){
  return `<h2 style="margin:20px 0">All Sellers</h2><div class="grid">${SELLERS.map(s=>`<div class="cat-card" onclick="go('seller-store',{id:'${s.id}'})"><div class="emoji">🏪</div><h3>${s.name}</h3><div class="rating">★ ${s.rating} · ${s.followers} followers</div><p style="font-size:.85rem;color:#888">${s.desc}</p></div>`).join('')}</div>`;
}
function pageSellerStore(){
  const s = sellerObj(STATE.params.id);
  if(!s) return `<div class="empty-state"><h3>Seller not found</h3></div>`;
  const products = STATE.products.filter(p=>p.seller===s.id);
  return `<div class="seller-banner"></div>
  <div class="seller-head"><div class="seller-logo">🏪</div><div><h2>${s.name}</h2><div class="rating">★ ${s.rating} · ${s.followers} followers</div></div></div>
  <p style="margin:50px 0 20px;max-width:600px;color:#666">${s.desc}</p>
  <button style="padding:10px 20px;border-radius:8px;background:var(--primary);color:#fff;margin-bottom:20px" onclick="toast('Following ${s.name}!')">+ Follow</button>
  <h3 style="margin-bottom:12px">Products from ${s.name}</h3>
  <div class="grid">${products.map(productCard).join('')}</div>`;
}

/* ===== SELLER DASHBOARD ===== */
let sellerTab = 'overview';
function pageSellerDash(){
  if(!STATE.user || STATE.user.role!=='seller') return `<div class="empty-state"><div>🏪</div><h3>Seller login required</h3><p><a onclick="go('login')">Login as Seller</a></p></div>`;
  const mySellerId = 's1';
  const myProducts = STATE.products.filter(p=>p.seller===mySellerId);
  const myOrders = STATE.orders.filter(o=>o.seller===mySellerId);
  const revenue = myOrders.reduce((a,o)=>a+o.total,0);
  const earnings = myOrders.reduce((a,o)=>a+o.sellerEarning,0);
  const pending = myOrders.filter(o=>o.status==='Pending').length;

  let body = '';
  if(sellerTab==='overview'){
    body = `<div class="dash-grid">
      <div class="stat-card"><div class="val">${fmt(revenue)}</div><div class="lbl">Total Revenue</div></div>
      <div class="stat-card"><div class="val">${fmt(earnings)}</div><div class="lbl">Your Earnings</div></div>
      <div class="stat-card"><div class="val">${myOrders.length}</div><div class="lbl">Total Orders</div></div>
      <div class="stat-card"><div class="val">${pending}</div><div class="lbl">Pending Orders</div></div>
      <div class="stat-card"><div class="val">${myProducts.length}</div><div class="lbl">Active Products</div></div>
    </div>`;
  } else if(sellerTab==='products'){
    body = `<button onclick="addProduct()" style="padding:10px 18px;border-radius:8px;background:var(--primary);color:#fff;margin-bottom:14px">+ Add Product</button>
    <table><thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>SKU</th><th>Actions</th></tr></thead><tbody>
    ${myProducts.map(p=>`<tr><td>${p.emoji} ${p.title}</td><td>${fmt(p.finalPrice)}</td><td>${p.stock}</td><td>${p.sku}</td><td><button onclick="deleteProduct('${p.id}')" style="padding:4px 10px;background:#fee;border-radius:6px">Delete</button></td></tr>`).join('')}
    </tbody></table>`;
  } else if(sellerTab==='orders'){
    body = `<table><thead><tr><th>Order</th><th>Items</th><th>Total</th><th>Status</th><th>Update</th></tr></thead><tbody>
    ${myOrders.map(o=>`<tr><td>${o.id}</td><td>${o.items.map(i=>i.title).join(', ')}</td><td>${fmt(o.total)}</td><td><span class="status-pill status-${o.status.toLowerCase()}">${o.status}</span></td>
      <td><select onchange="updateOrderStatus('${o.id}',this.value)">
        ${['Pending','Processing','Packed','Shipped','Delivered','Cancelled'].map(s=>`<option ${o.status===s?'selected':''}>${s}</option>`).join('')}
      </select></td></tr>`).join('') || '<tr><td colspan=5>No orders yet</td></tr>'}
    </tbody></table>`;
  } else if(sellerTab==='earnings'){
    body = `<div class="dash-grid">
      <div class="stat-card"><div class="val">${fmt(revenue)}</div><div class="lbl">Gross Sales</div></div>
      <div class="stat-card"><div class="val">${fmt(revenue-earnings)}</div><div class="lbl">Commission Paid (10%)</div></div>
      <div class="stat-card"><div class="val">${fmt(earnings)}</div><div class="lbl">Withdrawable Balance</div></div>
    </div>
    <button onclick="toast('Withdrawal request submitted!')" style="padding:10px 20px;border-radius:8px;background:var(--accent);color:#fff">Request Withdrawal</button>`;
  } else if(sellerTab==='coupons'){
    body = `<div style="display:flex;gap:8px;margin-bottom:14px">
      <input id="newCoupon" placeholder="Coupon code">
      <input id="newCouponVal" type="number" placeholder="% off">
      <button onclick="createCoupon()" style="padding:10px 18px;background:var(--primary);color:#fff;border-radius:8px">Create</button>
    </div>
    <table><thead><tr><th>Code</th><th>Discount</th></tr></thead><tbody>${STATE.coupons.map(c=>`<tr><td>${c.code}</td><td>${c.type==='percent'?c.value+'%':fmt(c.value)}</td></tr>`).join('')}</tbody></table>`;
  }

  return `<h2 style="margin:20px 0">Seller Dashboard — TechNova Store</h2>
  <div class="tab-btns">
    ${['overview','products','orders','earnings','coupons'].map(t=>`<button class="${sellerTab===t?'active':''}" onclick="setSellerTab('${t}')">${t[0].toUpperCase()+t.slice(1)}</button>`).join('')}
  </div>
  ${body}`;
}
function setSellerTab(t){ sellerTab=t; render(); }
function addProduct(){
  const title = prompt('Product name:'); if(!title) return;
  const price = +prompt('Price:', '999') || 999;
  STATE.products.push({id:'p'+Date.now(), title, category:CATEGORIES[0], brand:'Velora', price, discount:0, finalPrice:price, rating:'4.0', reviews:[], stock:20, seller:'s1', emoji:'🆕', colors:['Black'], sizes:['M'], sku:'SKU-'+Math.floor(Math.random()*90000), createdAt:Date.now(), approved:true});
  persist(); toast('Product added'); render();
}
function deleteProduct(id){ STATE.products = STATE.products.filter(p=>p.id!==id); persist(); toast('Product deleted'); render(); }
function updateOrderStatus(id, status){ const o=STATE.orders.find(x=>x.id===id); if(o){ o.status=status; persist(); toast('Order updated'); render(); } }
function createCoupon(){
  const code = document.getElementById('newCoupon').value.trim().toUpperCase();
  const val = +document.getElementById('newCouponVal').value;
  if(!code||!val) return toast('Enter valid coupon details');
  STATE.coupons.push({code, type:'percent', value:val});
  persist(); toast('Coupon created'); render();
}

/* ===== ADMIN DASHBOARD ===== */
let adminTab = 'overview';
function pageAdminDash(){
  if(!STATE.user || STATE.user.role!=='admin') return `<div class="empty-state"><div>🛡️</div><h3>Admin login required</h3><p><a onclick="go('login')">Login as Admin</a></p></div>`;
  const totalRevenue = STATE.orders.reduce((a,o)=>a+o.total,0);
  const totalCommission = STATE.orders.reduce((a,o)=>a+o.commission,0);
  const pendingOrders = STATE.orders.filter(o=>o.status==='Pending').length;
  const returns = STATE.orders.filter(o=>o.status==='Returned').length;

  let body='';
  if(adminTab==='overview'){
    body = `<div class="dash-grid">
      <div class="stat-card"><div class="val">${fmt(totalRevenue)}</div><div class="lbl">Total Sales</div></div>
      <div class="stat-card"><div class="val">${fmt(totalCommission)}</div><div class="lbl">Commission Earned</div></div>
      <div class="stat-card"><div class="val">${STATE.orders.length}</div><div class="lbl">Total Orders</div></div>
      <div class="stat-card"><div class="val">${pendingOrders}</div><div class="lbl">Pending Orders</div></div>
      <div class="stat-card"><div class="val">${SELLERS.length}</div><div class="lbl">Active Sellers</div></div>
      <div class="stat-card"><div class="val">${STATE.products.length}</div><div class="lbl">Total Products</div></div>
      <div class="stat-card"><div class="val">${returns}</div><div class="lbl">Returns</div></div>
    </div>
    <h3 style="margin:20px 0 10px">Top Selling Products</h3>
    <table><thead><tr><th>Product</th><th>Rating</th><th>Price</th></tr></thead><tbody>
    ${[...STATE.products].sort((a,b)=>b.rating-a.rating).slice(0,5).map(p=>`<tr><td>${p.title}</td><td>★ ${p.rating}</td><td>${fmt(p.finalPrice)}</td></tr>`).join('')}
    </tbody></table>`;
  } else if(adminTab==='sellers'){
    body = `<table><thead><tr><th>Seller</th><th>Rating</th><th>Followers</th><th>Status</th></tr></thead><tbody>
    ${SELLERS.map(s=>`<tr><td>${s.name}</td><td>★ ${s.rating}</td><td>${s.followers}</td><td><span class="status-pill status-delivered">Approved</span></td></tr>`).join('')}
    </tbody></table>`;
  } else if(adminTab==='products'){
    body = `<table><thead><tr><th>Product</th><th>Category</th><th>Seller</th><th>Price</th><th>Action</th></tr></thead><tbody>
    ${STATE.products.slice(0,30).map(p=>`<tr><td>${p.title}</td><td>${p.category}</td><td>${sellerName(p.seller)}</td><td>${fmt(p.finalPrice)}</td><td><button onclick="deleteProduct('${p.id}')" style="padding:4px 10px;background:#fee;border-radius:6px">Remove</button></td></tr>`).join('')}
    </tbody></table>`;
  } else if(adminTab==='orders'){
    body = `<table><thead><tr><th>Order</th><th>Seller</th><th>Total</th><th>Commission</th><th>Status</th></tr></thead><tbody>
    ${STATE.orders.map(o=>`<tr><td>${o.id}</td><td>${sellerName(o.seller)}</td><td>${fmt(o.total)}</td><td>${fmt(o.commission)}</td><td><span class="status-pill status-${o.status.toLowerCase()}">${o.status}</span></td></tr>`).join('') || '<tr><td colspan=5>No orders yet</td></tr>'}
    </tbody></table>`;
  } else if(adminTab==='commission'){
    body = `<div class="form-card" style="margin:0">
      <h3>Global Commission Rate</h3>
      <input value="10" readonly> %
      <p style="color:#888;margin-top:8px">Per-category and per-seller overrides can be configured (demo value fixed at 10%).</p>
    </div>`;
  }

  return `<h2 style="margin:20px 0">Admin Dashboard</h2>
  <div class="tab-btns">
    ${['overview','sellers','products','orders','commission'].map(t=>`<button class="${adminTab===t?'active':''}" onclick="setAdminTab('${t}')">${t[0].toUpperCase()+t.slice(1)}</button>`).join('')}
  </div>
  ${body}`;
}
function setAdminTab(t){ adminTab=t; render(); }

function attachPageEvents(){}

/* Init */
render();
