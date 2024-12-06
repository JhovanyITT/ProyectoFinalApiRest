// a) Importa el paquete
const Facturapi = require('facturapi').default;
require('dotenv').config();

const facturapi = new Facturapi (
    `${process.env.FACTURAPI_CONFIG_KEY}`
);

async function createProduct(product) {
    const facturaProduct = {
        description: product.description,
        product_key: "50221304",
        price: product.price
    };
    return await facturapi.products.create(facturaProduct);
}

async function updateProduct(facturapiid, product) {
    const facturaProductUpdates = {
        description: product.description, 
        price: product.price
    };
    return await facturapi.products.update(facturapiid, facturaProductUpdates);
}

async function deleteProduct(facturapiid) {
    return await facturapi.products.del(facturapiid);
}

async function createUser(user) {
    const facturapiUser = {
        legal_name: user.nombreCompleto, 
        tax_id: 'ABC101010111',             
        tax_system: "601",
        email: user.email,     
        address: {
            street: user.direccion,
            zip: "12345"
          },     
        phone: user.telefono           
    };
    return await facturapi.customers.create(facturapiUser);
}

async function updateUser(id, user){
    const facturapiUser = {
        legal_name: user.nombreCompleto,
        address: {
            street: user.direccion,
        },
        email: user.email
    };
    return await facturapi.customers.update(id, facturapiUser);
}

async function deleteUser(facturapiid){
    return await facturapi.customers.del(facturapiid);
}

async function createInvoice (invoice){
    return await facturapi.invoices.create(invoice);
};


module.exports = { createProduct, updateProduct, deleteProduct, createUser, updateUser, deleteUser, createInvoice };