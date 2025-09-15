const BIN_ID = "68c30442ae596e708feb5d00";
const API_KEY = "$2a$10$chQYHlc4IMp3aSZnO8xdWuEyNYirsSLYgwK/K0pdqBO2xrD0VrJxO";
const API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

let PRODUCTS = {};
let CURRENT_USER = {};
let MYBOUGHTS = [];


//    vv    JSONBIN FONCTIONS    vv
async function fetchJSONBIN() {
  try {
    const res = await fetch(API_URL + '/latest', {
      headers: {
        'X-Access-Key': API_KEY
      }
    });
    if (!res.ok) throw new Error('Erreur lecture jsonbin: ' + res.status);
    const data = await res.json();
    const products = data && data.record ? data.record : data;
    return products;
  } catch (err) {
    alert("Impossible de charger depuis la base de donnée");
  }
}
async function updateProducts() {
  await fetch(API_URL, {
    method: 'PUT',
    headers: { 'Content-Type':'application/json', 'X-Access-Key': API_KEY },
    body: JSON.stringify(PRODUCTS)
  });
}
//    ^^    JSONBIN FONCTIONS    ^^
//    vv    APIS FONCTIONS    vv
async function getAllProducts(force) {
	if(force === true) {
		PRODUCTS = await fetchJSONBIN();
		return PRODUCTS;
	}
	if(Object.keys(PRODUCTS).length === 0)
		PRODUCTS = await fetchJSONBIN();
		
	return PRODUCTS;
}

async function getAllBoughtsByUser(user) {
	let userHash = userToHash(user);
	let buyers = PRODUCTS.buyers;

	let boughtByUser = [];

	buyers.forEach(buyer => {
		let buyerHash = userToHash(buyer);
		if(buyerHash == userHash) {
			let p = PRODUCTS.products.find(product => product.id === buyer.product_id);
			p.amount = buyer.amount;
			boughtByUser.push(p);
		}
	});

	return boughtByUser;
}

function getAllBuyersForProduct(product_id) {
	let buyers = PRODUCTS.buyers;

	return buyers.filter(b => b.product_id === product_id) || [];
}

async function buy(user, product_id, amount) {
	PRODUCTS = await getAllProducts(true); //ON SI JAMAIS QUELQU'UN A DEJA ACHETE ENTRE TEMPS

	let products = PRODUCTS.products;
	let buyers = PRODUCTS.buyers;

	let product = products.find(p => p.id === product_id);
	if(product.remainQuantity >= amount) {
		product.remainQuantity -= amount;
	}else {
		return {"success": false, "reason": "toomuch"};
	}

	buyers.push({
		"firstname": user.firstname,
		"lastname": user.lastname,
		"phone": user.phone,
		"mail": user.mail,
		"product_id": product_id,
		"amount": amount
	});

	await updateProducts();
	reloadPage();
	return {"success": true, "reason": null};
}

async function cancelBuy(user, product_id, noReload) {
	PRODUCTS = await getAllProducts(true); //ON SI JAMAIS QUELQU'UN A DEJA ACHETE ENTRE TEMPS

	let userHash = userToHash(user);

	let products = PRODUCTS.products;
	let buyers = PRODUCTS.buyers;

	let amount = 0;

	for(let i = 0; i < buyers.length; i++) {
		if(buyers[i].product_id == product_id) {
			if(userToHash(buyers[i]) == userHash) {
				amount = parseFloat(buyers[i].amount);
				buyers.splice(i, 1);
			}
		}
	}

	for(let i = 0; i < products.length; i++) {
		if(products[i].id == product_id) {
			products[i].remainQuantity += amount;
		}
	}

	await updateProducts();
	if(noReload != true)
		reloadPage();	
	return {"success": true, "reason": null};
}
//    ^^    APIS FONCTIONS    ^^
//    vv    USER FONCTIONS    vv
function userToHash(user) {
	let str = user.firstname + user.lastname + user.phone + user.mail;
	let hash = 0;
  	for (let i = 0; i < str.length; i++) {
    	hash = ((hash << 5) - hash) + str.charCodeAt(i);
    	hash |= 0; // force 32-bit
  	}
	return Math.abs(hash).toString(36);
}
function isLoginValid(u) {
	const rePhone = /^(?:(?:0[1-9]\d{8})|\+33[1-9]\d{8})$/;
	const reMail = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
	return {
    	firstname: u.firstname ? u.firstname.trim().length > 2 : false,
    	lastname: u.lastname ? u.lastname.trim().length > 2 : false,
    	phone: u.phone ? rePhone.test(u.phone.trim().replaceAll(".", "").replaceAll("-", "").replaceAll(" ", "")) : false,
    	mail: u.mail ? reMail.test(u.mail.trim().replaceAll(" ", "")) : false
	};
}
function showIncorrectLoginInputs(i) {
  document.getElementById("input-firstname").style.border = i.firstname ? '1px solid black' : '2px solid red';
  document.getElementById("input-lastname").style.border = i.lastname ? '1px black' : '2px solid red'
  document.getElementById("input-phone").style.border = i.phone ? '1px solid black' : '2px solid red';
  document.getElementById("input-mail").style.border = i.mail ? '1px solid black' : '2px solid red';
}
function loadUser() {
  	CURRENT_USER = sessionStorage.getItem('registry_user') ? JSON.parse(sessionStorage.getItem('registry_user')) : {};

  	if (!(Object.values(isLoginValid(CURRENT_USER)).every(value => value === true))) {
    	sessionStorage.removeItem('registry_user');
    	document.getElementById('btn-save-user').style.display = 'inherit';
    	return;
  	}

  	unlockGrid();
  	document.getElementById('btn-remove-user').style.display = 'inherit';

  	document.getElementById("input-firstname").value = CURRENT_USER.firstname;
  	document.getElementById("input-lastname").value = CURRENT_USER.lastname;
  	document.getElementById("input-phone").value = CURRENT_USER.phone;
  	document.getElementById("input-mail").value = CURRENT_USER.mail;

  	document.getElementById("welcomeUser").innerHTML = `Bienvenue <b>${CURRENT_USER.firstname}</b>`;
}
function login() {
	let registryUser = {
    	firstname: document.getElementById("input-firstname").value,
    	lastname: document.getElementById("input-lastname").value,
    	phone: document.getElementById("input-phone").value,
    	mail: document.getElementById("input-mail").value
  	};
  	let u = isLoginValid(registryUser);
  	if (!(Object.values(u).every(value => value === true))) {
    	showIncorrectLoginInputs(u);
  	} else {
    	sessionStorage.setItem('registry_user', JSON.stringify(registryUser));
    	reloadPage();
  	}
}
function logout() {
	sessionStorage.removeItem('registry_user');
	reloadPage();
}
//    ^^    USER FONCTIONS    ^^
//	  vv	PAGE FUNCTIONS 	  vv
function reloadPage() { window.location.reload(); }
function formatCurrency(n){ return Number(n).toLocaleString('fr-FR',{style:'currency',currency:'EUR'}); }
async function showCart() {
	let boughtList = await getAllBoughtsByUser(CURRENT_USER);
	generateModalCart(boughtList);
}
	//	  vv	GRID FUNCTIONS 	  vv
function unlockGrid() {
	document.getElementById('gridOverlay').style.display = 'none';
}

function orderProductsAndDisplay() {
	PRODUCTS.products.sort((a, b) => {
	    const remA = a.remainQuantity;
	    const remB = b.remainQuantity;
	    if ((remA > 0) !== (remB > 0)) return remB > 0 ? 1 : -1;
  	});
  	PRODUCTS.products.sort((a, b) => {
	    const remA = a.remainQuantity,
	    remB = b.remainQuantity;
	    if ((remA > 0) !== (remB > 0)) return (remB > 0) ? 1 : -1;
	    const ta = a.title.toLowerCase(),
	    tb = b.title.toLowerCase();
	    return ta < tb ? -1 : ta > tb ? 1 : 0;
  	});

  	const grid = document.getElementById("grid");

  	PRODUCTS.products.forEach(prod=>{
    	grid.appendChild(renderSingleCard(prod));
  	});
}

function encodeProduct(product) {
	return encodeURI(JSON.stringify(product));
}
function decodeProduct(product) {
	return JSON.parse(decodeURI(product));
}

function renderSingleCard(product) {
	let alreadyBought = MYBOUGHTS.find(b => b.id == product.id) || null;

	const card = document.createElement('div');
  	card.className='card';
  	if(product.remainQuantity <= 0)
  		card.classList.add('grayed');
  	if(product.link != null && product.link != undefined && product.link.length > 10) {
	    card.addEventListener('click', (e)=>{
	    	if(e.target.tagName.toLowerCase() === 'button' || e.target.closest('button')) return;
	      	window.open(product.link, '_blank');
		});
	}

	let canBuy = alreadyBought == null && product.remainQuantity > 0;
	let canBuyAgain = alreadyBought != null && product.remainQuantity > 0;
	let canCancelBuy = alreadyBought != null;

	card.innerHTML = `
	    <div class="media">
	      <center>
	        <img src="${product.image}" alt="${product.title}"/>
	      </center>
	    </div>
	    <div class="body">
	      <div style="display:flex;justify-content:space-between;align-items:center; height: 100%">
	        <div class="cardDetails">
	          <div class="infos">
	            <div class="title">${product.title}</div>
	            <div class="desc">${product.desc}</div>
	          </div>
	          <div class="bottom">
	            <div class="row two-cols">
	              <div class="price">${formatCurrency(product.price)}</div>
	              <div class="qty">Restant: <strong>${product.remainQuantity} / ${product.quantity}</strong></div>
	            </div>`
	if(canBuyAgain) {
		card.innerHTML += `<div class="row full"><button class="btn buy" data-action="buy" onclick="showModelBuy('')">Acheter à nouveau</button></div>`;
	}else if(canBuy) {
		card.innerHTML += `<div class="row full"><button class="btn buy" data-action="buy" onclick="generateModalBuy('${encodeProduct(product)}')">Acheter</button></div>`;
	}

	if(canCancelBuy) {
		card.innerHTML += `<div class="row full" style="z-index:99 !important"><button class="btn secondary" data-action="cancel" onclick="generateModalCancelBuy('${encodeProduct(product)}')">Annuler mon achat</button></div>`;	
	}
	card.innerHTML += `</div></div></div></div>`;

	if(product.remainQuantity <= 0){
	    const ov = document.createElement('div'); 
	    ov.className='overlay'; 
	    ov.textContent='Épuisé'; 
	    card.appendChild(ov);
  	}

	return card;
}

	//	  ^^	GRID FUNCTIONS 	  ^^
	//	  vv	MODAL FUNCTIONS   vv	
function showModal(title, innerHTML, onConfirm, confirmLibelle, noCancel, classList) {
	let modal = document.getElementById("modal");
	let modalContent = document.getElementById("modal-content");
	if(classList) {
		modalContent.classList.add(classList);
	}else {
		modalContent.setAttribute("class", "modal-content");
	}

	modalContent.innerHTML = `<div id="modal-title">${title}</div>` + innerHTML + `<div id="modal-action">`;
	if(noCancel != true) {
		modalContent.innerHTML += `<button id="modal-cancel" class="btn secondary">Annuler</button>`;
	}
	modalContent.innerHTML += `<button id="modal-confirm" class="btn">${confirmLibelle}</button></div>`;;
	modal.style.display='flex';

	document.getElementById("modal-confirm").onclick = () => {
		onConfirm();
	}
	if(noCancel != true) {
		document.getElementById("modal-cancel").onclick = () => {
			modalContent.innerHTML = "";
			modal.style.display='none';
		}
	}
}
function updateTotal(price) {
  const modalQuantity = document.getElementById("modalQuantity");
  const modalSelectedQty = document.getElementById("modalSelectedQty");
  const modalTotalPrice = document.getElementById("modalTotalPrice");

  modalSelectedQty.textContent = modalQuantity.value;
  modalTotalPrice.textContent = formatCurrency(price * modalQuantity.value);
}	
function generateModalBuy(product) {
	product = decodeProduct(product);	
	let innerHTML = 
		`<div class="product">
            <img src="${product.image}" alt="${product.title}" class="product-img">
            <div class="product-info">
	            <h3 class="product-title">${product.title}</h3>
	            <p class="product-desc">${product.desc}</p>
	            <p class="product-price">Prix unitaire : <span id="unitPrice" data-price="${product.price}">${formatCurrency(product.price)}</span></p>
	            <p class="product-stock">Quantité restante : <strong>${product.remainQuantity}</strong></p>
            </div>
        </div>
        <div class="reservation">
            <label for="quantity">Quantité :</label>
            <input type="range" id="modalQuantity" min="0.25" max="${product.remainQuantity}" step="0.25" value="${product.remainQuantity >=1 ? 1 : product.remainQuantity}" onchange="updateTotal(${product.price})">
            <span id="modalSelectedQty">${product.remainQuantity >=1 ? 1 : product.remainQuantity}</span>
        </div>

        <div class="total">
            Total : <span id="modalTotalPrice">${formatCurrency(product.price * (product.remainQuantity >=1 ? 1 : product.remainQuantity))}</span>
        </div>`;
     showModal("Acheter", innerHTML, ()=>{buy(CURRENT_USER, product.id, document.getElementById("modalQuantity").value);}, "Confirmer");
     document.getElementById("modalQuantity").focus();
}
function generateModalCancelBuy(product) {
	product = decodeProduct(product);
	let innerHTML = `<div>Validez vous l'annulation de votre achat ?</div>`;

	showModal("Annuler l'achat", innerHTML, ()=>{cancelBuy(CURRENT_USER, product.id);}, "Confirmer");
}
function generateModalCart(products) {
  	let table = `<table>
			  		<thead>
			  			<tr>
			  				<th>Produit</th>
			  				<th>Quantité</th>
			  				<th>Prix</th>
			  				<th></th>
			  			</tr>
			  		</thead>
			  		<tbody>`;
	let totalPrice = 0;

  	products.forEach(p => {
  		let allBuyers = getAllBuyersForProduct(p.id);
  		let curPrice = p.amount * p.price;
  		totalPrice += curPrice;
  		table += `<tr>
  					<td>${p.title}</td>
  					<td>${p.amount}</td>
  					<td class="cartPrice">${formatCurrency(curPrice)}</td>
  					<td><image src="img/bin.png" onclick="removeItemFromCart('${p.id}', this)"/></td>
  				 </tr>`;
  		
  		let phones = allBuyers.map(item => ({
  			"name": (item.firstname + " " + item.lastname.charAt(0) + "."),
  			"phone": item.phone
  		}));
  		for(let i = 0; i < phones.length; i++){
  			if(phones[i].phone == CURRENT_USER.phone) {
  				phones.splice(i, 1);
  				break;
  			}
  		}
  		if(phones.length > 0) {
  			table += `<tr class="cobuyer">
  						<td rowspan="${phones.length}">☝🏿 Co-acheteurs à contacter</td>`;
  			phones.forEach(ph => {
  				table += `<td>${ph.name}</td><td colspan="2">${ph.phone}</td>`;
  			});
  			table += `</tr>`;
  		}
  	});

  	table += `<tfoot>
  				<tr>
  					<th colspan="2">Total</th>
  					<th id="cartTotalPrice">${formatCurrency(totalPrice)}</th>
  					<th></th>
  				</tr>
  			  </tfoot>
  			</table>`;
  	
  	showModal("Panier", table, ()=>{reloadPage()}, "Fermer le panier", true, "modal-cart");
}

function removeItemFromCart(product_id, event) {
	try{
		if(event.parentElement.parentElement.nextSibling.classList.contains("cobuyer")) {
			event.parentElement.parentElement.nextSibling.remove();
		}
	} catch(error) {}

	event.parentElement.parentElement.remove();
	let totalCartPrice = document.getElementById("cartTotalPrice");

	let total = 0;
	let cartPrices = document.getElementsByClassName("cartPrice");
	for(let i = 0; i < cartPrices.length; i++) {
		total += parseFloat(cartPrices[i].innerText.replaceAll(",", ".").replaceAll(" €", ""));
	}

	totalCartPrice.innerText = formatCurrency(total);

	cancelBuy(CURRENT_USER, product_id, true);
}
	//	  ^^	MODAL FUNCTIONS   ^^

async function init() {
	loadUser();
	await getAllProducts();
	MYBOUGHTS = await getAllBoughtsByUser(CURRENT_USER);
	orderProductsAndDisplay();

	if(MYBOUGHTS.length > 0) {
		document.getElementById("btn-chart").innerHTML += " <sup><sup>" + (MYBOUGHTS.length > 9 ? "9+" : MYBOUGHTS.length) +"</sup></sup>";
	}
}
//	  ^^	PAGE FUNCTIONS    ^^

init();


function envoyerEmail(nom, email, cc, message) {
    const formData = new FormData();
    formData.append('nom', nom);
    formData.append('email', email);
    formData.append('message', message);
    formData.append('_subject', 'Nouveau message depuis mon site !');
    formData.append('_captcha', 'false');
    if(cc) formData.append('_cc', 'pro.maxime.mons@gmail.com');

    fetch('https://formsubmit.co/pro.maxime.mons@gmail.com', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (response.ok) {
            console.log('Email envoyé avec succès !');
        } else {
            throw new Error("Erreur lors de l'envoi de l'email.");
        }
    })
    .catch(error => {
        console.error('Erreur :', error);
    });
}