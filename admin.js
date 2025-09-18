let PRODUCTS = {};

const validAdmins = [
	{firstname: "Maxime", lastname: "Mons", phone: "0636960412"},
	{firstname: "Maurine", lastname: "Ceuninck", phone: "0781563277"}
];

function userToHash(user) {
	let str = user.firstname + user.lastname + user.phone;
	let hash = 0;
  	for (let i = 0; i < str.length; i++) {
    	hash = ((hash << 5) - hash) + str.charCodeAt(i);
    	hash |= 0; // force 32-bit
  	}
	return Math.abs(hash).toString(36);
}


function isUserValid() {
	let params = new URLSearchParams(document.location.search);
	let user = params.get("u");

	if(user == userToHash(validAdmins[0]) ||
	   user == userToHash(validAdmins[1])) {
		return true;
	}

	return false;
}

async function displayResult() {
	PRODUCTS = await fetchJSONBIN();
	let buyers = PRODUCTS.buyers;

	document.getElementById("result").innerHTML = 
		`<table>
			<thead>
				<tr>
					<td><span onclick="window.location.reload()">🗘</span></td>
					<td>Qui</td>
					<td>Mail</td>
					<td>Tel</td>
					<td>Quoi</td>
					<td colspan="2">Combien</td>
				</tr>
			</thead>
			<tbody id='tbody'></tbody>
		</table>`;
	buyers.forEach(b => {
		if(b.imageSrc != undefined && b.imageSrc.length > 2) {
			document.getElementById("tbody").innerHTML += 
			`<tr>
				<td colspan="2">${b.firstname} ${b.lastname}</td>
				<td>${b.phone}</td>
				<td>${b.product_id}</td>
				<td>${b.amount}</td>
				<td><img src="${b.imageSrc}"/></td>
			</tr>`;
		}else {
			document.getElementById("tbody").innerHTML += 
			`<tr>
				<td colspan="2">${b.firstname} ${b.lastname}</td>
				<td>${b.phone}</td>
				<td>${b.product_id}</td>
				<td colspan="2">${b.amount}</td>
			</tr>`;
		}
	});
}

async function init() {
	if(isUserValid()) {
		await displayResult();
		return;
	}

	document.getElementById("result").innerText = "403 Forbidden";
	return;
}

init();