/**
 * firebase-real.js
 * ---------------------------------------------------------
 * Conexión REAL a Firebase (Authentication + Firestore) y a
 * Cloudinary (subida de imágenes). Se carga como módulo de
 * JavaScript SOLO cuando env.js detecta que la página ya no
 * está en local (es decir, ya está desplegada de verdad).
 *
 * Antes de que esto funcione, edita js/config.js con tus
 * credenciales reales. Ver CONFIGURACION.md para la guía
 * paso a paso completa.
 * ---------------------------------------------------------
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app = initializeApp(window.FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);

async function subirImagenCloudinary(archivo) {
  if (!archivo) return "";
  const { cloudName, uploadPreset } = window.CLOUDINARY_CONFIG;
  const formData = new FormData();
  formData.append("file", archivo);
  formData.append("upload_preset", uploadPreset);

  const respuesta = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!respuesta.ok) {
    throw new Error("No se pudo subir la imagen a Cloudinary. Revisa tu cloudName y upload preset en config.js");
  }
  const datos = await respuesta.json();
  return datos.secure_url;
}

window.FirebaseDB = {
  // ---------- Autenticación ----------
  async login(email, password) {
    const credencial = await signInWithEmailAndPassword(auth, email, password);
    return credencial.user;
  },

  async logout() {
    await signOut(auth);
  },

  getCurrentUser() {
    return auth.currentUser;
  },

  onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
  },

  // ---------- Productos ----------
  async getProductos() {
    const q = query(collection(db, "productos"), orderBy("creadoEn", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async agregarProducto(datos, archivoImagen) {
    const imagenUrl = await subirImagenCloudinary(archivoImagen);
    const nuevo = {
      nombre: datos.nombre,
      precio: Number(datos.precio),
      categoria: datos.categoria,
      marca: datos.marca || "",
      imagenUrl,
      creadoEn: Date.now(),
    };
    const ref = await addDoc(collection(db, "productos"), nuevo);
    return { id: ref.id, ...nuevo };
  },

  async actualizarProducto(id, datos, archivoImagen) {
    const cambios = {
      nombre: datos.nombre,
      precio: Number(datos.precio),
      categoria: datos.categoria,
      marca: datos.marca || "",
    };
    if (archivoImagen) {
      cambios.imagenUrl = await subirImagenCloudinary(archivoImagen);
    }
    await updateDoc(doc(db, "productos", id), cambios);
    return { id, ...cambios };
  },

  async eliminarProducto(id) {
    await deleteDoc(doc(db, "productos", id));
  },

  // ---------- Categorías ----------
  async getCategorias() {
    const snap = await getDocs(collection(db, "categorias"));
    if (snap.empty) {
      // Primera vez: nadie ha agregado categorías propias todavía.
      // Devolvemos las 5 categorías por defecto sin necesidad de
      // escribir nada en Firestore hasta que el admin cree la primera.
      return [
        { nombre: "Alimento", emoji: "🍖" },
        { nombre: "Juguetes", emoji: "🧸" },
        { nombre: "Accesorios", emoji: "🎀" },
        { nombre: "Higiene", emoji: "🧴" },
        { nombre: "Otros", emoji: "🐾" },
      ];
    }
    return snap.docs.map((d) => d.data());
  },

  async agregarCategoria(datos) {
    const nombre = (datos.nombre || "").trim();
    if (!nombre) throw new Error("El nombre de la categoría no puede estar vacío");
    const nueva = { nombre, emoji: datos.emoji || "🐾" };
    await addDoc(collection(db, "categorias"), nueva);
    return nueva;
  },
};
