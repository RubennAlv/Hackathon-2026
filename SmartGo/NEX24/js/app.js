const products=[
 {id:"frijol",name:"Frijol local",type:"Granos · A granel",price:35,unit:"kg",stock:18,emoji:"🫘",bulk:true},
 {id:"miel",name:"Miel regional",type:"Productor local",price:95,unit:"frasco",stock:12,emoji:"🍯",bulk:false},
 {id:"nuez",name:"Nuez",type:"Semillas · A granel",price:140,unit:"kg",stock:4,emoji:"🥜",bulk:true},
 {id:"dulces",name:"Dulces regionales",type:"Dulces · A granel",price:80,unit:"kg",stock:9,emoji:"🍬",bulk:true}
];
const locations=[
 {name:"NEX24 Centro",area:"Zona Centro",address:"Av. 20 de Noviembre · Durango, Dgo.",hours:"Abierto 24/7",distance:"Punto principal"},
 {name:"NEX24 Jardines",area:"Jardines de Durango",address:"Blvd. Domingo Arrieta · Durango, Dgo.",hours:"Abierto 24/7",distance:"A 2.4 km"},
 {name:"NEX24 Tecnológico",area:"Col. Tecnológico",address:"Av. Tecnológico · Durango, Dgo.",hours:"Abierto 24/7",distance:"A 4.1 km"}
];
const stateKey="nex24-state";
const stored=JSON.parse(localStorage.getItem(stateKey)||"null");
const state=stored||{inventory:Object.fromEntries(products.map(p=>[p.id,p.stock])),sales:0,orders:0};
const money=value=>`$${value.toFixed(2)}`;
const getProduct=id=>products.find(product=>product.id===id);
function saveState(){localStorage.setItem(stateKey,JSON.stringify(state));}
function renderLanding(){
 const grid=document.querySelector("#productGrid");
 if(!grid)return;
 products.forEach(p=>{const el=document.createElement("article");el.className="product-card";el.innerHTML=`<div class="emoji">${p.emoji}</div><h3>${p.name}</h3><p>${p.type}</p><strong>${money(p.price)} / ${p.unit}</strong>`;grid.appendChild(el);});
 renderLocations();
}
function renderLocations(query=""){
 const list=document.querySelector("#locationList");
 if(!list)return;
 const normalized=query.trim().toLowerCase();
 const filtered=locations.filter(location=>`${location.name} ${location.area} ${location.address}`.toLowerCase().includes(normalized));
 list.innerHTML=filtered.length?filtered.map(location=>`<article class="location-card"><div class="location-card-top"><span class="location-icon">⌖</span><span class="open-label">● ${location.hours}</span></div><h3>${location.name}</h3><p class="location-area">${location.area}</p><p>${location.address}</p><div class="location-meta"><span>${location.distance}</span><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}" target="_blank" rel="noopener">Cómo llegar ↗</a></div></article>`).join(""):`<div class="empty-location"><strong>No encontramos ese punto.</strong><p>Prueba con “Centro”, “Jardines” o “Tecnológico”.</p></div>`;
}
function setupLocations(){
 const input=document.querySelector("#locationSearch");
 if(!input)return;
 document.querySelector("#locationSearchButton").addEventListener("click",()=>renderLocations(input.value));
 input.addEventListener("input",()=>renderLocations(input.value));
 document.querySelectorAll(".map-pin").forEach(pin=>pin.addEventListener("click",()=>{input.value=pin.dataset.location;renderLocations(input.value);document.querySelector("#ubicaciones").scrollIntoView({behavior:"smooth"});}));
}
let cart=[];
function renderStore(){
 const grid=document.querySelector("#storeItems");
 if(!grid)return;
 document.querySelector("#stockSummary").textContent=`${products.length} productos locales`;
 grid.innerHTML=products.map(p=>`<article class="store-card"><div class="product-icon">${p.emoji}</div><div class="product-copy"><span class="tag">${p.bulk?"A granel":"Empaquetado"}</span><h3>${p.name}</h3><p>${p.type}</p><strong>${money(p.price)} / ${p.unit}</strong></div>${p.bulk?`<label class="weight-label" for="mode-${p.id}">Modalidad de pesaje<select id="mode-${p.id}"><option>Báscula digital (simulada)</option><option>Captura manual</option></select></label><label class="weight-label" for="weight-${p.id}">Peso neto (kg)<input id="weight-${p.id}" type="number" min=".05" max="${state.inventory[p.id]}" step=".05" value=".50"></label>`:""}<button class="add-button" data-product="${p.id}">${p.bulk?"Agregar peso":"Agregar al carrito"}</button></article>`).join("");
 grid.addEventListener("click",event=>{const button=event.target.closest("[data-product]");if(!button)return;const product=getProduct(button.dataset.product);const input=document.querySelector(`#weight-${product.id}`);const quantity=product.bulk?Number(input.value):1;if(!quantity||quantity<=0||quantity>state.inventory[product.id]){showMessage(`Ingresa una cantidad válida. Disponible: ${state.inventory[product.id]} ${product.unit}.`,"error");return;}const existing=cart.find(item=>item.id===product.id);if(existing)existing.quantity+=quantity;else cart.push({id:product.id,quantity});renderCart();});
 renderCart();
 document.querySelector("#payButton").addEventListener("click",pay);
}
function renderCart(){
 const container=document.querySelector("#cartItems");if(!container)return;
 const total=cart.reduce((sum,item)=>sum+getProduct(item.id).price*item.quantity,0);
 document.querySelector("#cartCount").textContent=cart.length;
 document.querySelector("#cartTotal").textContent=money(total);
 container.innerHTML=cart.length?cart.map(item=>{const p=getProduct(item.id);return `<div class="cart-line"><span>${p.emoji} ${p.name}<small>${item.quantity.toFixed(p.bulk?2:0)} ${p.unit}</small></span><b>${money(p.price*item.quantity)}</b><button aria-label="Quitar ${p.name}" data-remove="${p.id}">×</button></div>`;}).join(""):"<p>Tu carrito está vacío.</p>";
 document.querySelector("#payButton").disabled=!cart.length;
 container.querySelectorAll("[data-remove]").forEach(button=>button.addEventListener("click",()=>{cart=cart.filter(item=>item.id!==button.dataset.remove);renderCart();}));
}
function pay(){
 const total=cart.reduce((sum,item)=>sum+getProduct(item.id).price*item.quantity,0);
 cart.forEach(item=>{state.inventory[item.id]-=item.quantity;});
 state.sales+=total;state.orders+=1;saveState();cart=[];renderCart();showMessage(`Pago simulado aprobado por ${money(total)}. Inventario actualizado automáticamente.`,"success");
}
function showMessage(message,type){const box=document.querySelector("#purchaseMessage");if(!box)return;box.textContent=message;box.className=`notice ${type}`;box.hidden=false;}
function renderDashboard(){
 const table=document.querySelector("#inventoryTable");if(!table)return;
 const low=products.filter(p=>state.inventory[p.id]<=5).length;
 document.querySelector("#productCount").textContent=String(products.length).padStart(2,"0");
 document.querySelector("#salesTotal").textContent=money(state.sales);
 document.querySelector("#lowStock").textContent=String(low).padStart(2,"0");
 document.querySelector("#lastUpdate").textContent=state.orders?`${state.orders} compra${state.orders===1?"":"s"} registrada${state.orders===1?"":"s"}`:"Sin ventas aún";
 table.innerHTML=products.map(p=>{const stock=state.inventory[p.id];const isLow=stock<=5;return `<tr><td>${p.emoji} ${p.name}</td><td>${p.bulk?"A granel":"Empaquetado"}</td><td>${stock.toFixed(p.bulk?2:0)}</td><td>${p.unit}</td><td><span class="status-pill ${isLow?"warning":"available"}">${isLow?"Stock bajo":"Disponible"}</span></td></tr>`;}).join("");
}
renderLanding();setupLocations();renderStore();renderDashboard();