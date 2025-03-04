# CompraJunts

**CompraJunts** és una aplicació web col·laborativa que permet gestionar llistes de compra compartides en temps real. Els usuaris poden crear llistes, convidar altres persones, afegir ítems i gestionar-los de manera conjunta.

![CompraJunts Screenshot](screenshot.png)

## 📋 Característiques

### Autenticació
- Registre i inici de sessió amb correu electrònic i contrasenya
- Gestió d'àlies d'usuari configurable
- Opció de mostrar/amagar contrasenya

### Gestió de Llistes
- Crear noves llistes de compra
- Veure totes les llistes on participa l'usuari
- Mostrar l'últim ítem afegit a cada llista
- Mostrar nombre de participants per llista
- Convidar altres usuaris per correu electrònic
- Abandonar llistes (excepte el propietari)

### Gestió d'Ítems
- Afegir nous ítems a la llista
- Marcar ítems com a completats
- Augmentar/disminuir quantitat per ítem
- Afegir/editar notes per ítem (límit 240 caràcters)
- Només el propietari de la llista o el creador de l'ítem poden modificar-lo
- Eliminar ítems
- Mostrar qui ha afegit cada ítem

### Invitacions
- Enviament d'invitacions per correu electrònic
- Visualització d'invitacions pendents
- Acceptar/rebutjar invitacions
- Reenviar invitacions expirades
- Notificacions quan s'accepten o rebutgen invitacions

### Actualitzacions en Temps Real
- Sincronització instantània d'ítems entre tots els participants
- Notificacions quan s'afegeixen, s'actualitzen o s'eliminen ítems
- Notificacions quan els usuaris s'uneixen o abandonen les llistes

## 🛠️ Tecnologies

### Frontend
- HTML5
- CSS amb Tailwind CSS
- JavaScript pur (Vanilla JS)
- WebSockets (Socket.IO client)

### Backend
- Node.js
- Express.js
- Sequelize ORM
- SQLite / MySQL (configurable)
- Socket.IO
- Nodemailer
- JSON Web Token (JWT)

## 📁 Estructura del Projecte

```
CompraJunts/
├── client/                        # Codi del frontend
│   ├── index.html                 # Pàgina principal
│   ├── login.html                 # Pàgina de login/registre
│   ├── css/
│   │   └── styles.css             # Estils personalitzats
│   ├── js/
│   │   ├── app.js                 # Punt d'entrada principal
│   │   ├── auth/                  # Mòduls d'autenticació
│   │   ├── lists/                 # Mòduls de llistes
│   │   ├── items/                 # Mòduls d'ítems
│   │   ├── ui/                    # Components UI
│   │   └── utils/                 # Utilitats
│   └── assets/                    # Recursos estàtics
│
├── server/                        # Codi del backend
│   ├── index.js                   # Punt d'entrada del servidor
│   ├── config/                    # Configuracions
│   ├── models/                    # Models de dades (Sequelize)
│   ├── controllers/               # Controladors
│   ├── routes/                    # Rutes API
│   ├── middlewares/               # Middlewares
│   └── services/                  # Serveis
│
├── package.json                   # Dependències del projecte
└── README.md                      # Documentació
```

## 🚀 Instal·lació

### Requisits previs
- Node.js (v14 o superior)
- npm (v6 o superior)

### Passos d'instal·lació

1. Clona el repositori:
```bash
git clone https://github.com/usuari/comprajunts.git
cd comprajunts
```

2. Instal·la les dependències:
```bash
npm install
```

3. Crea un arxiu `.env` a l'arrel del projecte amb les següents variables (o copia `.env.example`):
```
# Port del servidor
PORT=3000

# Clau secreta per a JWT
JWT_SECRET=comprajunts_secret
JWT_EXPIRATION=7d

# Configuració de base de dades (opcional per a MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=comprajunts
DB_USER=root
DB_PASSWORD=

# URL de l'aplicació
APP_URL=http://localhost:3000

# Configuració SMTP per a l'enviament de correus
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=el_teu_correu@gmail.com
SMTP_PASS=la_teva_contrasenya_o_clau_app
EMAIL_FROM=CompraJunts <notificacions@comprajunts.com>
```

4. Inicia l'aplicació:
```bash
npm start
```

L'aplicació estarà disponible a `http://localhost:3000`.

## 📧 Configuració del Servei d'Email

Per defecte, l'aplicació utilitzarà un servei de proves d'email (Ethereal) si no es proporcionen credencials SMTP. Per a l'enviament real de correus, configura les variables d'entorn SMTP al teu arxiu `.env`.

### Configuració per a Gmail

Si fas servir Gmail com a proveïdor de correu, has de:

1. Habilitar la verificació en dos passos: https://myaccount.google.com/security
2. Crear una "Contrasenya d'aplicació": https://myaccount.google.com/apppasswords
3. Utilitzar aquesta contrasenya generada com a valor de `SMTP_PASS`

## 💾 Configuració de Base de Dades

L'aplicació utilitza SQLite per defecte, que no requereix configuració addicional. Per canviar a MySQL:

1. Assegura't que tens un servidor MySQL en execució
2. Configura les variables `DB_*` al teu arxiu `.env`
3. Per canviar entre bases de dades, modifica `server/services/dbSwitchService.js`

## 🔌 API Endpoints

### Autenticació
- `POST /api/auth/register` - Registrar nou usuari
- `POST /api/auth/login` - Iniciar sessió
- `GET /api/auth/profile` - Obtenir perfil d'usuari
- `PUT /api/auth/update-alias` - Actualitzar àlies d'usuari

### Llistes
- `POST /api/lists` - Crear nova llista
- `GET /api/lists` - Obtenir llistes de l'usuari
- `GET /api/lists/:listId` - Obtenir detall d'una llista
- `POST /api/lists/:listId/invite` - Convidar usuari a una llista
- `POST /api/lists/:listId/leave` - Abandonar una llista
- `GET /api/lists/invitations` - Obtenir invitacions pendents
- `GET /api/lists/invitation/:token` - Acceptar invitació
- `POST /api/lists/invitation/:invitationId/reject` - Rebutjar invitació
- `POST /api/lists/invitation/:invitationId/resend` - Reenviar invitació
- `DELETE /api/lists/invitation/:invitationId` - Cancel·lar invitació

### Ítems
- `POST /api/items/list/:listId` - Afegir ítem a una llista
- `PUT /api/items/:itemId` - Actualitzar ítem
- `DELETE /api/items/:itemId` - Eliminar ítem

### Usuaris
- `GET /api/users/search` - Cercar usuaris per correu
- `GET /api/users/:userId` - Obtenir informació d'un usuari
- `GET /api/users/:userId/shared-lists` - Obtenir llistes compartides amb un usuari
- `PUT /api/users/:userId/lists/:listId/role` - Canviar rol d'un usuari en una llista

## 🔄 WebSockets (Temps Real)

L'aplicació utilitza Socket.IO per a la comunicació en temps real. Els esdeveniments principals són:

### Esdeveniments del servidor
- `item:added` - Quan s'afegeix un nou ítem
- `item:updated` - Quan s'actualitza un ítem
- `item:deleted` - Quan s'elimina un ítem
- `list:updated` - Quan s'actualitza una llista
- `user:joined` - Quan un usuari s'uneix a una llista
- `user:removed` - Quan un usuari abandona una llista
- `invitation:rejected` - Quan es rebutja una invitació

### Esdeveniments del client
- `joinList` - Unir-se a una sala específica de llista
- `leaveList` - Abandonar una sala específica de llista
- `joinLists` - Unir-se a múltiples sales de llistes

## 👥 Permisos i Rols

L'aplicació té tres rols d'accés a les llistes:

- **Propietari** (`owner`): Pot gestionar tots els aspectes de la llista, incloent tots els ítems i usuaris
- **Editor** (`editor`): Pot afegir ítems i editar els seus propis ítems
- **Visualitzador** (`viewer`): Només pot veure la llista i marcar ítems com a completats

Regles específiques:
- Només el propietari de la llista o el creador de l'ítem poden editar/eliminar un ítem
- Tots els usuaris poden marcar ítems com a completats o no
- Només el propietari pot canviar els rols dels participants
- Qualsevol membre, excepte el propietari, pot abandonar la llista

## 🤝 Contribució

Les contribucions són benvingudes! Si vols contribuir:

1. Fes fork del repositori
2. Crea una nova branca (`git checkout -b feature/nova-caracteristica`)
3. Fes els teus canvis i commit (`git commit -m 'Afegeix nova característica'`)
4. Puja els canvis (`git push origin feature/nova-caracteristica`)
5. Obre una Pull Request

## 📜 Llicència

Aquest projecte està llicenciat sota la llicència MIT - veure l'arxiu [LICENSE](LICENSE.md) per a més detalls.

## 📞 Contacte

Per a qualsevol dubte o suggeriment, pots contactar amb [el teu nom] a [el teu correu electrònic].

---

Desenvolupat amb ❤️ per [el teu nom]
