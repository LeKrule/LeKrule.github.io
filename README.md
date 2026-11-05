# Adrián Medina — Portfolio

Web estática (HTML, CSS y JS sin dependencias ni build). Se publica tal cual en GitHub Pages.

## Estructura

```
index.html            Inicio: hero, proyectos, otros trabajos, contacto
about.html            Sobre mí + experiencia, formación, herramientas
work/forte.html       Casos de estudio
work/namu.html
work/todoo.html
assets/css/style.css  Todo el diseño (colores y fuentes arriba del todo, en :root)
assets/js/main.js     Fondo interactivo, idioma, cambio de tema, animaciones
assets/img/           Imágenes, una carpeta por proyecto
```

## Verla en local

```bash
cd ~/Desktop/adrianmedina-portfolio
python3 -m http.server 4321
# abre http://localhost:4321
```

## Editar textos (EN / ES)

Cada texto está escrito dos veces, una por idioma:

```html
<span data-l="en">View case study</span><span data-l="es">Ver caso de estudio</span>
```

Cambia los dos. El botón EN/ES de la cabecera alterna entre ellos y recuerda la elección.

## Añadir un proyecto nuevo

1. Copia `work/forte.html` como `work/nuevo.html` y cambia textos e imágenes.
2. Mete sus imágenes en `assets/img/nuevo/`.
3. En `index.html`, duplica un bloque `<article class="project">` y cambia enlace, imagen y textos.
4. Actualiza el enlace "Siguiente proyecto" al final de cada caso para que formen un ciclo.

## Ajustes rápidos

- **Colores:** `assets/css/style.css`, variables `--paper`, `--ink`, `--accent`.
- **Sección oscura:** cualquier `<section data-theme="dark">` invierte la página al pasar por ella con el scroll.
- **Fondo interactivo:** en `main.js`, `GAP` (separación de puntos) y `RADIUS` (alcance del ratón).

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub. Si lo llamas `TU-USUARIO.github.io`, la web queda en esa dirección; si no, en `TU-USUARIO.github.io/NOMBRE-REPO`.
2. Sube el código:
   ```bash
   cd ~/Desktop/adrianmedina-portfolio
   git remote add origin https://github.com/TU-USUARIO/NOMBRE-REPO.git
   git push -u origin main
   ```
3. En GitHub: **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`** → Save.
4. Al cabo de un minuto la web está en línea. Cada `git push` la actualiza.

**Dominio propio (adrianmedina.io):** en Settings → Pages → Custom domain, escribe `adrianmedina.io` y configura los DNS de tu proveedor como indica GitHub (registros A a las IP de GitHub Pages y un CNAME de `www` a `TU-USUARIO.github.io`).
