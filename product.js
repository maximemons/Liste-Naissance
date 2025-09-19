let PRODUCTS = {};

let CURRENT_PRODUCT = null;
let BUYERS_CURRENT_PRODUCT = null;

async function initPoducts() {
	let params = new URLSearchParams(document.location.search);
	let product_id = params.get("p");

	PRODUCTS = await fetchJSONBIN();

	CURRENT_PRODUCT = PRODUCTS.products.find(p => p.id == product_id);
	BUYERS_CURRENT_PRODUCT = getAllBuyersForProduct(product_id);
}

function render() {
	if((CURRENT_PRODUCT.link || null) != null && CURRENT_PRODUCT.link.length > 3) {
		let iframe = document.createElement("iframe");
		iframe.src = CURRENT_PRODUCT.link;
		document.getElementById("productInspiration").appendChild(iframe);
	}else {
		let p = document.createElement("p");
		p.innerText = "Vous avez notre entière confiance ! Faites vous plaisir 😉";
		document.getElementById("productInspiration").appendChild(p);
	}

	let images = BUYERS_CURRENT_PRODUCT.filter(b => b.imageSrc != null);
	let table = document.createElement("table");
	table.innerHTML = `<thead>
						       <tr>
						           <th colspan="2">Qui</th>
						           <th>Quoi</th>
						       </tr>
						   </thead>`;
	if(images.length > 0) {

		let tbody = document.createElement("tbody");
		images.forEach(b => {
			let tr = document.createElement("tr");

			tr.innerHTML = `<td>${b.firstname} ${b.lastname.charAt(0) + "."}</td>
							<td>${b.phone}</td>
							<td><img src="${b.imageSrc}"/></td>`;
			tbody.appendChild(tr);
		});
		table.appendChild(tbody);

		document.getElementById("boughtProducts").appendChild(table);
		document.getElementById("boughtProducts").style.display = "inherit";
	}else {
		document.getElementById("emptyList").style.display = "inherit";
	}
}

async function init() {
	await initPoducts();
	render();
}

init();