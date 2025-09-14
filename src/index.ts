import express, { Express, Request, Response } from 'express';

import { db } from './config/connectionDB'; // Aún no está creado
import { authRouter, reservationRouter, restaurantRouter, userRouter } from './routes';
import dotenv from "dotenv";

dotenv.config();

const app: Express = express(); // Creación de una instancia de express

const port = process.env.PORT || 3000; // Definimos el puerto en el que escuchará el servidor, si no se especifica en las variables de entorno, usará el puerto 3000 por defecto.

app.use(express.json()); // Módulo de Express para manejar solicitudes JSON
app.use(express.urlencoded({ extended: true })); // Módulo de Express para manejar solicitudes URL codificadas


app.use("/api/users", userRouter.router);
app.use("/api/auth", authRouter.router);
app.use("/api/restaurants", restaurantRouter.router);
app.use("/api/reservations", reservationRouter.router);

app.get("/", (req: Request, res: Response) => { // Definimos una ruta raíz para probar que el servidor está funcionando correctamente.
    res.send('Hola Mundo');
});

// Conectamos a la base de datos y luego iniciamos el servidor
db.then(() =>
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    })
);