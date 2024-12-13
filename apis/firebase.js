// Cargar los módulos de Firebase con require
const { initializeApp } = require("firebase/app");
const { getStorage, ref, uploadBytes, getDownloadURL } = require("firebase/storage");
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const firebaseConfig = {
  apiKey: `${process.env.FIREBASE_API_KEY}`,
  authDomain: `${process.env.FIREBASE_AUTH_DOMAIN}`,
  projectId: `${process.env.FIREBASE_PROJECT_ID}`,
  storageBucket: `${process.env.FIREBASE_STORAGE_BUCKET}`,
  messagingSenderId: `${process.env.FIREBASE_MESSAGING_SENDER_ID}`,
  appId: `${process.env.FIREBASE_APP_ID}`,
  measurementId: `${process.env.FIREBASE_MEASUREMENT_ID}`
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Obtener referencia de Firebase Storage
const storage = getStorage(app);

// Exportar la función para que pueda ser usada en otros archivos
const uploadFile = async (filePath) => {
  try {
    console.log('Uploading file:', filePath);

    // Usar ruta absoluta
    const fullPath = path.resolve(filePath);
    console.log('Full resolved path:', fullPath);

    // Verificar existencia del archivo con manejo de errores detallado
    if (!fs.existsSync(fullPath)) {
      console.error('Archivo no encontrado en:', fullPath);
      console.error('Contenido del directorio:', fs.readdirSync(path.dirname(fullPath)));
      throw new Error(`File not found: ${fullPath}`);
    }

    // Leer el archivo completo
    const fileBuffer = fs.readFileSync(fullPath);

    const fileName = path.basename(filePath);
    const storageRef = ref(storage, `facturas/${fileName}`);

    await uploadBytes(storageRef, fileBuffer);
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  } catch (error) {
    console.error('Error al subir el archivo:', error);
    console.error('Detalles del error:', {
      message: error.message,
      code: error.code,
      path: error.path
    });
    throw error;
  }
}; 


// Exportar la función uploadFile
module.exports = { uploadFile };
