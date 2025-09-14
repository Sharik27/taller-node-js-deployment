import mongoose from "mongoose";
import { UserInput } from "../interfaces"; // TODO

export enum UserRole{
    ADMIN = "admin",
    USER = "user"
}

export interface UserDocument extends UserInput, mongoose.Document {
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date | null,
    roles: UserRole[]
}

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true, select: false },
    deletedAt:{type: Date, default: null},
    roles:{type:[String], enum: Object.values(UserRole), default:[UserRole.USER]}

}, { timestamps: true, collection: 'users' })

export const UserModel = mongoose.model<UserDocument>("User", userSchema); 