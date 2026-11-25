(() => {
  const catalogs = [{key:'gunpla',label:'Gunpla Kits'},{key:'figure',label:'Figures'},{key:'beyblade',label:'Beyblade'}];
  const input = document.querySelector('#query');
  const grid = document.querySelector('#results');
  const count = document.querySelector('#resultCount');
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = value => String(value || '').normalize('NFKC').toLocaleLowerCase();
  let products = [];
  input.value = new URLSearchParams(location.search).get('q') || '';
  const render = () => {
    const words = normalize(input.value).trim().split(/\s+/).filter(Boolean);
    const found = products.filter(p => words.every(word => normalize([p.name,p.japaneseName,p.series,p.sku,p.id,p.category.label].join(' ')).includes(word)));
    count.textContent = `${found.length} products`;
    grid.innerHTML = found.length ? found.map(p => {
      const price = p.price == null ? 'Price unavailable' : new Intl.NumberFormat(p.category.key === 'beyblade' ? 'en-US' : 'en-PH', {style:'currency',currency:p.category.key === 'beyblade' ? 'USD':'PHP'}).format(p.price);
      const link = 'category.html?' + new URLSearchParams({catalog:p.category.key,q:p.name});
      return `<article class="product"><button class="product-image" type="button" data-enlarge aria-label="Enlarge ${escape(p.name)}"><img src="${escape(p.image)}?v=20261123c" alt="${escape(p.name)}" loading="lazy"></button><div class="product-info"><div><h3>${escape(p.name)}</h3><p class="product-brand">${escape(p.series)}</p></div><span class="price">${escape(price)}</span><div class="stock">${escape(p.category.label)}${p.category.key === 'beyblade' ? '' : p.stock > 0 ? ' · In stock' : ' · Sold out'}</div><a href="${escape(link)}">View product &amp; order →</a></div></article>`;
    }).join('') : '<div class="empty"><div><h2>No matching products.</h2><p>Try a product name, series or code, or clear your search to browse all products.</p></div></div>';
  };
  const updateURL = () => { const url = new URL(location.href); if(input.value.trim()) url.searchParams.set('q',input.value.trim()); else url.searchParams.delete('q'); history.replaceState(null,'',url); };
  document.querySelector('#searchForm').addEventListener('submit', event => {event.preventDefault();updateURL();render();});
  input.addEventListener('input', () => {updateURL();render();});
  Promise.allSettled(catalogs.map(async category => {const response = await fetch(`${category.key}-products.json`);if(!response.ok) throw new Error(category.label);return (await response.json()).map(p => ({...p,category}));})).then(results => {
    products = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
    const missing = results.flatMap((r,i) => r.status === 'rejected' ? [catalogs[i].label] : []);
    document.querySelector('#searchNotice').textContent = missing.length ? `Could not load ${missing.join(', ')}. Please refresh to try again.` : '';
    render();
  });
})();
