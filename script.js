let PRODUCTS = {};
let CURRENT_USER = {};
let MYBOUGHTS = [];

//    vv    APIS FONCTIONS    vv
async function buy(user, product_id, amount, fileInput) {
	PRODUCTS = await getAllProducts(true); //ON SI JAMAIS QUELQU'UN A DEJA ACHETE ENTRE TEMPS

	let products = PRODUCTS.products;
	let buyers = PRODUCTS.buyers;

	let product = products.find(p => p.id === product_id);
	if(product.remainQuantity >= amount) {
		product.remainQuantity -= amount;
	}else {
		alert("Oops, quelqu'un a acheté entre temps, il n'y a plus assez de ce produit !");
		reloadPage();
	}

	imageSrc = null;
	if(fileInput != undefined) {
		imageSrc = await fileInputToBase64(fileInput);
	}

	buyers.push({
		"firstname": user.firstname,
		"lastname": user.lastname,
		"phone": user.phone,
		"product_id": product_id,
		"amount": amount,
		"imageSrc": imageSrc
	});

	await updateProducts();
	reloadPage();
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
	let str = user.firstname + user.lastname + user.phone;
	let hash = 0;
  	for (let i = 0; i < str.length; i++) {
    	hash = ((hash << 5) - hash) + str.charCodeAt(i);
    	hash |= 0; // force 32-bit
  	}
	return Math.abs(hash).toString(36);
}
function isLoginValid(u) {
	const rePhone = /^(?:(?:0[1-9]\d{8})|\+33[1-9]\d{8})$/;
	return {
    	firstname: u.firstname ? u.firstname.trim().length >= 2 : false,
    	lastname: u.lastname ? u.lastname.trim().length >= 2 : false,
    	phone: u.phone ? rePhone.test(u.phone.trim().replaceAll(".", "").replaceAll("-", "").replaceAll(" ", "")) : false
	};
}
function showIncorrectLoginInputs(i) {
  document.getElementById("input-firstname").style.border = i.firstname ? '1px solid black' : '2px solid red';
  document.getElementById("input-lastname").style.border = i.lastname ? '1px black' : '2px solid red'
  document.getElementById("input-phone").style.border = i.phone ? '1px solid black' : '2px solid red';
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

  	document.getElementById("input-firstname").setAttribute("disabled", "true");
  	document.getElementById("input-lastname").setAttribute("disabled", "true");
  	document.getElementById("input-phone").setAttribute("disabled", "true");

  	document.getElementById("welcomeUser").innerHTML = `Bienvenue <b>${CURRENT_USER.firstname}</b>`;
}
function login() {
	let registryUser = {
    	firstname: document.getElementById("input-firstname").value,
    	lastname: document.getElementById("input-lastname").value,
    	phone: document.getElementById("input-phone").value
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

function showAdminIfRequired() {
	const admins = [
		{firstname: "Maxime", lastname: "Mons", phone: "0636960412"},
		{firstname: "Maurine", lastname: "Ceuninck", phone: "0781563277"}
	];

	if(userToHash(CURRENT_USER) == userToHash(admins[0]) ||
	   userToHash(CURRENT_USER) == userToHash(admins[1])) {
		let btn = document.createElement('button');
		btn.id = "admin-btn";
		btn.classList.add("btn");
		btn.onclick= () => { window.open("admin.html?u=" + userToHash(CURRENT_USER), "_blank"); };
		btn.innerText = "🌟";
		document.getElementById("right-controls").appendChild(btn);
	}
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
	return encodeURI(JSON.stringify(product)).replaceAll("'", "%27");
}
function decodeProduct(product) {
	return JSON.parse(decodeURI(product.replaceAll("%27", "'")));
}

function renderSingleCard(product) {
	let alreadyBought = MYBOUGHTS.find(b => b.id == product.id) || null;

	const card = document.createElement('div');
  	card.className='card';
  	if(product.remainQuantity <= 0)
  		card.classList.add('grayed');
  	if(product.noConstraint != undefined && product.noConstraint == true) {
		card.addEventListener('click', (e)=>{
	    	if(e.target.tagName.toLowerCase() === 'button' || e.target.closest('button')) return;
	      	window.open("product.html?p=" + product.id, '_blank');
		});
	}else if(product.link != null && product.link != undefined && product.link.length > 10) {
	    card.addEventListener('click', (e)=>{
	    	if(e.target.tagName.toLowerCase() === 'button' || e.target.closest('button')) return;
	      	window.open(product.link, '_blank');
		});
	}

	let canBuy = alreadyBought == null && product.remainQuantity > 0;
	let canCancelBuy = alreadyBought != null;

	card.innerHTML += `
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
	if(canCancelBuy) {
		card.innerHTML += `<div class="row full" style="z-index:99 !important"><button class="btn secondary" data-action="cancel" onclick="generateModalCancelBuy('${encodeProduct(product)}')">Annuler mon achat</button></div>`;
	}else {
			card.innerHTML += `<div class="row full"><button class="btn buy" data-action="buy" onclick="generateModalBuy('${encodeProduct(product)}', ${(product.noConstraint != undefined && product.noConstraint == true)})">Acheter</button></div>`;
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
	//	  vv	IMAGE FUNCTIONS   vv
async function fileInputToBase64(fileInput) {
	const file = fileInput.files[0];
    if (!file) return null;

	return await compressImage(file);
}
async function compressImage(file, maxWidth = 200, maxHeight = 200, quality = 0.5) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = event => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let { width, height } = img;

        // Redimensionnement proportionnel
        if (width > maxWidth || height > maxHeight) {
          const scale = Math.min(maxWidth / width, maxHeight / height);
          width = width * scale;
          height = height * scale;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        ctx.drawImage(img, 0, 0, width, height);

        // Compression en JPEG
        const base64 = canvas.toDataURL("image/jpeg", quality);
        resolve(base64);
      };

      img.onerror = err => reject(err);
    };

    reader.onerror = err => reject(err);
  });
}

	//	  ^^	IMAGE FUNCTIONS   ^^		
	//	  vv	MODAL FUNCTIONS   vv
function disableButtons() {
	Array.from(document.getElementById("modal").getElementsByTagName("button")).forEach(b=> {
		b.style.cursor = "wait";
		b.setAttribute("disabled", "true");
	});
}
function showModal(title, innerHTML, onConfirm, confirmLibelle, noCancel, classList, cancelLibelle) {
	let modal = document.getElementById("modal");
	let modalContent = document.getElementById("modal-content");
	if(classList) {
		modalContent.classList.add(classList);
	}else {
		modalContent.setAttribute("class", "modal-content");
	}

	modalContent.innerHTML = `<div id="modal-title">${title}</div>` + innerHTML + `<div id="modal-action">`;
	if(noCancel != true) {
		modalContent.innerHTML += `<button id="modal-cancel" class="btn secondary" style="margin-right: 10px;">${cancelLibelle || "Annuler"}</button>`;
	}
	modalContent.innerHTML += `<button id="modal-confirm" class="btn">${confirmLibelle}</button></div>`;;
	modal.style.display='flex';

	document.getElementById("modal-confirm").onclick = () => {
		disableButtons();
		onConfirm();
	}
	if(noCancel != true) {
		document.getElementById("modal-cancel").onclick = () => {
			disableButtons();
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
function generateModalBuy(product, addImage) {
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

    if(addImage != undefined && addImage == true) {
    	innerHTML += 
    	`<div style="border-top: 1px dashed black;margin-top: 10px;">
    		<p>Souhaitez vous partager vos achats : </p>
    		<div style="display: flex">
    			<div>
    				<input type="file" id="fileInput" accept="image/*" capture="environment" value="Ajoute une photo de ton achat" onchange="document.getElementById('rmvImg').style.display = 'inherit'">
    			</div>
    			<div id="rmvImg" style=" display: none; font-weight: bold; width: 100%; text-align: right;" onclick="removeImage(document.getElementById('fileInput'))">
    				x
    			</div>
    		</div>
    	</div>`;
    }
    showModal("Acheter", innerHTML, ()=>{buy(CURRENT_USER, product.id, document.getElementById("modalQuantity").value, document.getElementById("fileInput"));}, "Confirmer");
    document.getElementById("modalQuantity").focus();
}
function removeImage(fileInput) {
	fileInput.files = null;
	document.getElementById("rmvImg").style.display = "none";

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

  		if(p.noConstraint != undefined && p.noConstraint == true) {
  			table += 
  				`<tr>
  					<td><a href="product.html?p=${p.id}" target="_blank">${p.title}</a></td>
  					<td>${p.amount}</td>
  					<td class="cartPrice">${formatCurrency(curPrice)}</td>
  					<td><image src="img/bin.png" onclick="removeItemFromCart('${p.id}', this)"/></td>
  				</tr>`;
  		}else if(p.link != "") {
  			table += 
  				`<tr>
  					<td><a href="${p.link}" target="_blank">${p.title}</a></td>
  					<td>${p.amount}</td>
  					<td class="cartPrice">${formatCurrency(curPrice)}</td>
  					<td><image src="img/bin.png" onclick="removeItemFromCart('${p.id}', this)"/></td>
  				</tr>`;
  		}else {
  			table += 
  				`<tr>
  					<td>${p.title}</td>
  					<td>${p.amount}</td>
  					<td class="cartPrice">${formatCurrency(curPrice)}</td>
  					<td><image src="img/bin.png" onclick="removeItemFromCart('${p.id}', this)"/></td>
  				</tr>`;
  		}
  		
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

function showTutorialModal(idx) {
	if(sessionStorage.getItem("isTutorialDone") != undefined && sessionStorage.getItem("isTutorialDone") == "true")
		return;

	const tutorialSteps = [
		{text: "Bienvenue sur notre liste de naissance !<br/><br/>Le site permets a nos proches de se coordonner sur les achats.<br>Il se sert pas a acheter, juste à \"réserver\" des articles.<br/><br/>Bonne visite !", img: null},
		{text: "Voici une courte présentation du site :", img: "img/tuto/tuto_1.png"},
		{text: "Commence d'abord par d'authentifier :", img: "img/tuto/tuto_2.png"},
		{text: "Si un article d'interesse, tu peux cliquer sur l'objet :", img: "img/tuto/tuto_3_2.png"},
		{text: "Le lien vers un site d'achat de ce produit va s'ouvrir dand un nouvel onglet :", img: "img/tuto/tuto_4.png"},
		{text: "Si tu veux l'acheter, réserve le en cliquant sur \"Acheter\". Ça évitera de l'acheter en double.", img: "img/tuto/tuto_5_2.png"},
		{text: "Tu peux choisir d'en acheter un, plusieurs, ou une partie d'un article (certains articles peuvent être onéreux, d'où l'intéret de le partager) :", img: "img/tuto/tuto_6_2.png"},
		{text: "Tu retrouveras tes achats dans le panier en haut à droite :", img: "img/tuto/tuto_7_2.png"},
		{text: "Tu peux annuler un achat en cliquant sur la corbeille.", img: "img/tuto/tuto_8_2.png"},
		{text: "En cas d'achat partiel, si quelqu'un d'autre souhaite participer également, tu trouveras les coordonnées de la personne pour pouvoir vous organiser :", img: "img/tuto/tuto_9_2.png"},
		{text: "Pour rappel, ne te sens obligé de rien !<br/>Ta seule présence dans la vie de Johanne est déjà le plus beau des cadeaux ❤️", img:null}
	];

	if(idx >= tutorialSteps.length) {
		sessionStorage.setItem("isTutorialDone", "true");
		document.getElementById("modal-content").innerHTML = "";
		document.getElementById("modal").style.display='none';
		return;
	}

	let innerHTML = "";

	if(tutorialSteps[idx].text != null) {
		innerHTML += `<p>${tutorialSteps[idx].text}</p>`;
	}if(tutorialSteps[idx].img != null) {
		innerHTML += `<img src='${tutorialSteps[idx].img}'/>`;
	}

	showModal("Tutoriel", innerHTML, () => {showTutorialModal(idx +1)}, "Suivant", idx != 0, "modal-tutorial", idx == 0 ? "Fermer" : "Annuler");
}
	//	  ^^	MODAL FUNCTIONS   ^^
async function init() {
	loadUser();
	showTutorialModal(0);
	await getAllProducts();
	MYBOUGHTS = await getAllBoughtsByUser(CURRENT_USER);
	orderProductsAndDisplay();

	if(MYBOUGHTS.length > 0) {
		document.getElementById("btn-chart").innerHTML += " <sup><sup>" + (MYBOUGHTS.length > 9 ? "9+" : MYBOUGHTS.length) +"</sup></sup>";
	}

	showAdminIfRequired();
}
//	  ^^	PAGE FUNCTIONS    ^^

init();