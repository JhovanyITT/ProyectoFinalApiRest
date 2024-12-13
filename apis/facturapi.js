// a) Importa el paquete
const Facturapi = require('facturapi').default;
const fs = require('fs');
const path = require('path');
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

async function downloadInvoice(invoiceId) {
    return new Promise(async (resolve, reject) => {
      try {
        // Crear directorio si no existe
        const directoryPath = path.resolve('./facturas');
        if (!fs.existsSync(directoryPath)) {
          fs.mkdirSync(directoryPath, { recursive: true });
        }
  
        const filePath = path.resolve(`./facturas/${invoiceId}.zip`);
  
        // Descargar PDF y XML comprimidos en archivo ZIP
        const zipStream = await facturapi.invoices.downloadZip(invoiceId);
  
        // Crear un stream de escritura con la ruta completa
        const zipFile = fs.createWriteStream(filePath);
  
        zipStream.pipe(zipFile);
  
        zipFile.on('finish', () => {
          zipFile.close();
          console.log(`Archivo ZIP guardado en: ${filePath}`);
  
          // Verificar que el archivo existe
          if (fs.existsSync(filePath)) {
            resolve(filePath);
          } else {
            reject(new Error('El archivo no se guardó correctamente'));
          }
        });
  
        zipFile.on('error', (err) => {
          console.error('Error al escribir el archivo ZIP:', err);
          reject(err);
        });
      } catch (error) {
        console.error('Error en la descarga de la factura:', error);
        reject(error);
      }
    });
  } 
  

module.exports = { createProduct, updateProduct, deleteProduct, createUser, updateUser, deleteUser, createInvoice, downloadInvoice};