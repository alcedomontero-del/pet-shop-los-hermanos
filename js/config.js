/**
 * config.js
 * ---------------------------------------------------------
 * ÚNICO archivo que debes editar para conectar la tienda a
 * tus cuentas REALES de Firebase y Cloudinary.
 *
 * Mientras la página corre en local (localhost o archivo),
 * estos valores se ignoran por completo y se usa la base de
 * datos de demostración (local-db.js) — así que puedes dejar
 * los valores de ejemplo tal cual mientras solo estás probando.
 *
 * Antes de desplegar de verdad, reemplaza cada "TU_..." con
 * los datos reales de tu proyecto. Instrucciones completas en
 * CONFIGURACION.md.
 * ---------------------------------------------------------
 */

  
  
 
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyAEG0dLvCKps0uts0Tj4mIbf82l2Shixuw",
    authDomain: "pet-shop-los-hermanos.firebaseapp.com",
    projectId: "pet-shop-los-hermanos",
    storageBucket: "pet-shop-los-hermanos.firebasestorage.app",
    messagingSenderId: "552184215913",
    appId: "1:552184215913:web:6773b469352ed34629a5f8",
    measurementId: "G-1VM062401J"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);

  









window.CLOUDINARY_CONFIG = {
  // Lo encuentras en el Dashboard de Cloudinary, arriba a la izquierda
  cloudName: "nubeAmm",
  // Lo creas en Settings → Upload → Upload presets → Add upload preset
  // Debe estar configurado como "Unsigned" (sin firma)
  uploadPreset: " catalogoDeTienda",
  
};




 