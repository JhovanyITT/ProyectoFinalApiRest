const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const { sendEmail } = require('../apis/mailjet');
const facturapi = require('../apis/facturapi');
const Twilio = require('../apis/twilio');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const { uploadFile } = require('../apis/firebase');

const cartController = {
    getAllCarts: async (req, res) => {
        try {
            const carts = await Cart.find()
                .populate('usuario')
                .populate('productos.producto');
    
            if (!carts) return res.status(404).json({ error: 'No hay carritos disponibles'});
            res.json({message: `Se han encontrado ${carts.length} carritos`, carts});
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getCartById: async (req, res) => {
        try {
            const cart = await Cart.findById(req.params.id)
                .populate('usuario')
                .populate('productos.producto');
            if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });
            res.json(cart);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getHistoryUserCarts: async (req, res) => {
        try {
            const carts = await Cart.find({ "usuario": req.params.id })
                .populate('usuario') 
                .populate('productos.producto');
            
            if (!carts) return res.status(404).json({ error: 'No se encontraron carritos para este usuario' });
            res.json({message: `Se han encontrado ${carts.length} carritos para este usuario`, carts});
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    

    createCart: async (req, res) => {
        try {
            const { usuario } = req.body;
            const existingCart = await Cart.findOne({ usuario, estatus: 'activo' });

            //Validar que un usuario no tenga dos carritos en activo
            if (existingCart) {
                return res.status(400).json({ message: 'El usuario ya tiene un carrito activo. Por favor, cierra el carrito actual antes de crear uno nuevo.' });
            }

            const newCart = new Cart({ usuario, productos: [] });
            await newCart.save();
            res.status(201).json(await Cart.findById(newCart._id).populate('usuario'));
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    addProduct: async (req, res) => {
        try {
            const { id_carrito, productoId, cantidad } = req.body;
            const cart = await Cart.findById(id_carrito);
            if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });
            
            // Verifica si el carrito ya esta cerrado
            if (cart.estatus === 'cerrado'){
                return res.status(400).json({ error: 'Este carrito ya ha sido cerrado, no se pueden agregar productos' });
            }

            const existingProduct = cart.productos.find((item) => item.producto.equals(productoId));
            if (existingProduct) {
                existingProduct.cantidad += cantidad;
            } else {
                cart.productos.push({ producto: productoId, cantidad });
            }
    
            await updateCartTotals(cart);
            await cart.save();
            res.json(await Cart.findById(id_carrito).populate('productos.producto'));
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    

    removeProduct: async (req, res) => {
        try {
            const { id_carrito, productoId } = req.body;
            const cart = await Cart.findById(id_carrito);
                if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });

            // Verifica si el carrito ya esta cerrado
            if (cart.estatus === 'cerrado'){
                return res.status(400).json({ error: 'Este carrito ya ha sido cerrado, no se pueden remover productos' });
            }
            
            // Verifica si el producto existe en el carrito
            const productIndex = cart.productos.findIndex((item) => item.producto.equals(productoId));
            if (productIndex === -1) {
                return res.status(400).json({ error: 'El producto no existe en el carrito' });
            }
    
            // Filtra el producto del array
            cart.productos.splice(productIndex, 1);
    
            // Actualiza los totales del carrito
            await updateCartTotals(cart);
            await cart.save();
    
            // Retorna el carrito actualizado con los productos poblados
            res.json(await Cart.findById(id_carrito).populate('productos.producto'));
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    

    closeCart: async (req, res) => {
        try {
            const { id_carrito } = req.body;
            const cart = await Cart.findById(id_carrito).populate('usuario').populate('productos.producto');
            if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });
            
            // Validar que exista stocke suficiente del producto
            for (const item of cart.productos) {
                const product = await Product.findById(item.producto);
                if (product.stock < item.cantidad) {
                    return res.status(400).json({ error: `No hay suficiente stock para: ${product.name}` });
                }
            }

            // Eliminar stock del producto en la base de datos
            for (const item of cart.productos) {
                const product = await Product.findById(item.producto);
                product.stock -= item.cantidad;
                await product.save();
            }

            // Colocar el estatus del carrito como cerrado
            cart.estatus = 'cerrado';
            cart.fecha_cierre = new Date();
            await cart.save();

            const user = await User.findById(cart.usuario._id);
            if (!user) {
              throw new Error('Usuario no encontrado');
            }
                        
            
            // Crear el modelo para la factura en facturapi
            const invoiceData = {
                customer: {
                    legal_name: cart.usuario.nombreCompleto,
                    email: cart.usuario.email,
                    tax_id: 'ABC101010111',
                    tax_system: '601',
                    address: {
                        street: cart.usuario.direccion,
                        zip: '12345'
                    }
                },
                items: cart.productos.map((item) => ({
                    quantity: item.cantidad,
                    product: {
                        description: item.producto.name,
                        product_key: '50221304',
                        price: item.producto.price,
                        taxes: [
                            {
                                type: 'IVA',
                                rate: 0.16
                            }
                        ]
                    }
                })),
                use: 'G01',
                payment_form: '28'
            };

            // Envia la factura a facturapi
            await facturapi.createInvoice(invoiceData);

            // Generar PDF de la factura de manera local
            await generateInvoicePDF(cart, user);

            // Subir PDF de la factura a firebase storage
            const facturaurl = await uploadFile(`./facturas/${cart._id}.pdf`);
            
            // Eliminar el PDF de manera local
            await deleteInvoicePDF (`./facturas/${cart._id}.pdf`);

            // Enviar un SMS
            const mensaje = `
                Gracias por su compra! Puede descargar su factura aqui:
                ${facturaurl}
            `;
            await Twilio.sendSMS(user.telefono,mensaje);

            // Crear el modelo para el contenido del email
            const emailContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .email-container {
                    max-width: 600px;
                    margin: 20px auto;
                    background-color: #ffffff;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    overflow: hidden;
                }
                .header {
                    background-color: #007BFF;
                    color: #ffffff;
                    text-align: center;
                    padding: 20px;
                }
                .header h1 {
                    margin: 0;
                    font-size: 24px;
                }
                .content {
                    padding: 20px;
                }
                .content h2 {
                    color: #333333;
                }
                .content p {
                    color: #555555;
                }
                .product-list {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                .product-list th, .product-list td {
                    padding: 10px;
                    text-align: left;
                    border-bottom: 1px solid #ddd;
                }
                .product-list th {
                    background-color: #f8f8f8;
                }
                .footer {
                    background-color: #007BFF;
                    color: #ffffff;
                    text-align: center;
                    padding: 10px;
                    font-size: 14px;
                }
                </style>
            </head>
            <body>
                <div class="email-container">
                <div class="header">
                    <h1>Gracias por tu compra</h1>
                </div>
                <div class="content">
                    <h2>Hola ${user.nombreCompleto},</h2>
                    <p>Tu carrito se ha cerrado exitosamente. Aquí tienes los detalles de tu compra:</p>
                    <table class="product-list">
                    <thead>
                        <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cart.productos
                        .map(
                            (item) =>
                            `<tr>
                                <td>${item.producto.name}</td>
                                <td>${item.cantidad}</td>
                                <td>$${item.producto.price.toFixed(2)}</td>
                            </tr>`
                        )
                        .join('')}
                    </tbody>
                    </table>
                    <p><strong>Subtotal:</strong> $${cart.subtotal.toFixed(2)}</p>
                    <p><strong>IVA:</strong> $${cart.iva.toFixed(2)}</p>
                    <p><strong>Total:</strong> $${cart.total.toFixed(2)}</p>
                    <p>Aqí puedes descargar tu factura:</p>
                    <a href="${facturaurl}">Descargar factura</a>
                </div>
                <div class="footer">
                    <p>Gracias por tu preferencia.</p>
                    <p>&copy; 2024 Tu Empresa</p>
                </div>
                </div>
            </body>
            </html>
            `;
            
            // Intentar enviar el correo de confirmación
            await sendEmail(user.email, 'Confirmación de Compra', emailContent);
            
            

            res.json(cart);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
};

// Función para actualizar subtotal, IVA y total
async function updateCartTotals(cart) {
    let subtotal = 0;

    for (const item of cart.productos) {
        const product = await Product.findById(item.producto);
        subtotal += product.price * item.cantidad;
    }

    cart.subtotal = subtotal;
    cart.iva = subtotal * 0.16; // Suponiendo un IVA del 16%
    cart.total = cart.subtotal + cart.iva;
}

// Funcion para generar el pdf de la factura
async function generateInvoicePDF(cart, user) {
    const doc = new PDFDocument();
    const filePath = `./facturas/${cart._id}.pdf`; // Ruta donde se generará el PDF localmente

    const fechaActual = new Date();
    const fechaFormateada = fechaActual.toLocaleString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    return new Promise((resolve, reject) => {
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Encabezado
        doc.fontSize(18).text('Factura de Compra', { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).text(`Nombre: ${user.nombreCompleto}`);
        doc.text(`Email: ${user.email}`);
        doc.text(`Fecha: ${fechaFormateada}`);
        doc.text(`Número de Factura: ${cart._id}`);
        doc.moveDown();

        // Productos
        doc.fontSize(16).text('Detalles de la Compra:');
        doc.moveDown();

        cart.productos.forEach((item) => {
            doc.fontSize(12).text(
                `${item.producto.name}`
            );
            doc.fontSize(12).text(
                `Cantidad: ${item.cantidad}`
            );
            doc.fontSize(12).text(
                `Precio: $${item.producto.price.toFixed(2)}`
            );
            doc.fontSize(21).text(
                `________________________________________`
            );
        });

        doc.moveDown();
        doc.fontSize(12).text(`Subtotal: $${cart.subtotal.toFixed(2)}`);
        doc.text(`IVA: $${cart.iva.toFixed(2)}`);
        doc.text(`Total: $${cart.total.toFixed(2)}`);

        // Finalizar
        doc.end();
        stream.on('finish', () => resolve(filePath));
        stream.on('error', (err) => reject(err));
    });
}

// Función para eliminar el PDF generado
async function deleteInvoicePDF(filePath) {
    return new Promise((resolve, reject) => {
        fs.unlink(filePath, (err) => {
            if (err) {
                reject(`Error al eliminar el archivo: ${err.message}`);
            } else {
                resolve('Archivo eliminado correctamente');
            }
        });
    });
}

module.exports = cartController;
