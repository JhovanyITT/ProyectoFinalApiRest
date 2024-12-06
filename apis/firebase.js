// Cargar los módulos de Firebase con require
const { initializeApp } = require("firebase/app");
const { getStorage, ref, uploadBytes, getDownloadURL } = require("firebase/storage");
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuración de Firebase
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
    // Leer el archivo local (por ejemplo, 'pdfs/documento.pdf')
    const file = fs.readFileSync(filePath);
    const fileName = path.basename(filePath); // Obtener solo el nombre del archivo, por ejemplo 'documento.pdf'

    // Crear la referencia al archivo en Firebase Storage (en la carpeta 'pdfs' en Firebase)
    const storageRef = ref(storage, `facturas/${fileName}`);

    // Subir el archivo a Firebase
    await uploadBytes(storageRef, file);

    // Obtener la URL pública del archivo subido
    const downloadURL = await getDownloadURL(storageRef);

    // Devolver la URL pública
    return downloadURL;

  } catch (error) {
    console.error('Error al subir el archivo:', error);
  }
};

// Exportar la función uploadFile
module.exports = { uploadFile };
