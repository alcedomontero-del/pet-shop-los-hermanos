# Pet Shop Los Hermanos — Guía de configuración

Este proyecto tiene **dos modos**, y cambia entre ellos solo (no tienes que tocar nada):

- **Modo local (demostración):** cuando abres los archivos en tu computadora (doble clic, o con Live Server de VS Code), la tienda usa una base de datos falsa guardada en tu navegador (`localStorage`). Puedes probar todo — login, subir productos con foto, editar, eliminar — sin que nada viaje a internet ni exista una cuenta real todavía.
- **Modo producción (real):** en cuanto subas la página a un dominio real (Firebase Hosting, o cualquier otro), se activan automáticamente las conexiones reales a Firebase y Cloudinary.

La detección es automática (`js/env.js`) — nunca tienes que cambiar código para pasar de uno a otro.

---

## 1. Probar el modo local ahora mismo

1. Abre la carpeta del proyecto en VS Code.
2. Instala la extensión "Live Server" si no la tienes.
3. Clic derecho sobre `index.html` → "Open with Live Server".
4. Verás un aviso amarillo: **"🧪 Modo demostración local"**.
5. Ve a `login.html` y entra con:
   - Correo: `admin@demo.com`
   - Contraseña: `demo1234`
6. Sube un producto de prueba, con foto — se guarda en tu navegador. Da clic en "👀 Ver tienda" para verlo en la vitrina, en una pestaña nueva.

Para borrar los datos de prueba y volver al catálogo de ejemplo inicial, abre la consola del navegador (F12) y escribe:
```js
LocalDB.borrarDatosDeDemo()
```

---

## 2. Crear tu proyecto real de Firebase

1. Ve a [console.firebase.google.com](https://console.firebase.google.com) y crea un proyecto nuevo (plan **Spark**, gratis).
2. Dentro del proyecto, ve a **Compilación → Firestore Database** → "Crear base de datos" → modo producción → elige una región cercana.
3. Ve a **Compilación → Authentication** → pestaña "Sign-in method" → habilita **Correo electrónico/contraseña**.
4. En la pestaña "Users" de Authentication, crea manualmente tu usuario administrador (tu correo y una contraseña segura). **No hay formulario público de registro en este proyecto a propósito** — así solo tú puedes entrar al panel.
5. Ve a **Configuración del proyecto** (ícono de engranaje) → baja hasta "Tus apps" → clic en el ícono `</>` (Web) → registra la app → copia el objeto `firebaseConfig` que te muestra.
6. Pega esos valores en `js/config.js`, dentro de `window.FIREBASE_CONFIG`.

### Reglas de seguridad de Firestore

Ve a **Firestore Database → Reglas** y reemplaza el contenido por esto:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /productos/{productoId} {
      allow read: if true;                 // cualquiera puede ver el catálogo
      allow write: if request.auth != null; // solo un usuario logueado puede crear/editar/borrar
    }
  }
}
```

Esto es lo que reemplaza a un backend: en vez de un servidor validando permisos, estas reglas los validan directamente.

---

## 3. Crear tu cuenta real de Cloudinary

1. Crea una cuenta gratis en [cloudinary.com](https://cloudinary.com).
2. En el Dashboard, copia tu **Cloud Name**.
3. Ve a **Settings (⚙️) → Upload → Upload presets → Add upload preset**.
4. Ponle un nombre, y cambia **Signing Mode** de "Signed" a **"Unsigned"** — esto es lo que permite subir fotos directo desde el navegador sin backend.
5. Guarda, y copia el nombre del preset.
6. Pega ambos valores en `js/config.js`, dentro de `window.CLOUDINARY_CONFIG`.

---

## 4. Subir la página a Firebase Hosting, conectado a GitHub

1. Sube esta carpeta completa a un repositorio de GitHub.
2. Instala la herramienta de Firebase (una sola vez en tu computadora):
   ```
   npm install -g firebase-tools
   firebase login
   ```
3. Dentro de la carpeta del proyecto:
   ```
   firebase init hosting
   ```
   - Elige tu proyecto de Firebase.
   - Directorio público: `.` (la carpeta actual, donde está `index.html`).
   - Configurar como app de una sola página: `No`.
   - **"Set up automatic builds and deploys with GitHub?"** → responde `Yes`, y sigue las instrucciones para conectar tu repositorio. A partir de aquí, cada `git push` despliega solo.
4. Para desplegar manualmente en cualquier momento:
   ```
   firebase deploy
   ```
5. Firebase te da una URL como `https://tu-proyecto.web.app` — esa es tu tienda ya en producción. Ábrela y confirma que el aviso ahora dice **"🟢 Conectado en vivo"**.

---

## 5. Checklist final antes de compartir el link con clientes

- [ ] `js/config.js` tiene tus valores reales de Firebase y Cloudinary (ningún `TU_...` sin reemplazar).
- [ ] Creaste tu usuario administrador manualmente en Firebase Authentication.
- [ ] Las reglas de seguridad de Firestore están publicadas (paso 2).
- [ ] El upload preset de Cloudinary está en modo **Unsigned**.
- [ ] Probaste iniciar sesión y subir un producto real desde la URL de producción (no solo en local).
- [ ] Revisaste que `js/config.js` sí esté subido a GitHub (a diferencia del `.env` de otros proyectos, aquí no hay claves secretas que esconder — el Cloud Name y el upload preset "unsigned" están hechos para ser públicos; la única clave sensible, la de Firestore, queda protegida por las Reglas de seguridad, no por ocultarla).
