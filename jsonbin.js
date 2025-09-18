const BIN_ID = "68c30442ae596e708feb5d00";
const API_KEY = "$2a$10$chQYHlc4IMp3aSZnO8xdWuEyNYirsSLYgwK/K0pdqBO2xrD0VrJxO";
const API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

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

async function getAllProducts(force) {
  if(force === true) {
    PRODUCTS = await fetchJSONBIN();
    return PRODUCTS;
  }
  if(Object.keys(PRODUCTS).length === 0)
    PRODUCTS = await fetchJSONBIN();
    
  return PRODUCTS;
}

function getAllBuyersForProduct(product_id) {
  let buyers = PRODUCTS.buyers;

  return buyers.filter(b => b.product_id === product_id) || [];
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