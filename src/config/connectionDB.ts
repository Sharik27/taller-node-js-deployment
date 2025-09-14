import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { UserModel, UserRole } from "../models";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.MONGO_URI || "";

export const db = mongoose.connect(connectionString, { dbName: 'restaurant-db'})
    .then(async () => {
        console.log("Connected to MongoDB");

        const adminEmail = "admin@example.com";
        let admin = await UserModel.findOne({ email: adminEmail });
        if (!admin) {
            admin = await UserModel.create({
                name: "Carlos",
                email: adminEmail,
                password: await bcrypt.hash("Carlos123", 10),
                roles: [UserRole.ADMIN],
            });
        
            console.log("Admin:", (admin._id as mongoose.Types.ObjectId).toString());

        } else {
            console.log(`Admin already exists with ${adminEmail}`);
        }    
    })
    .catch((error) => console.error(error));