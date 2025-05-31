import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '$env/static/private';
import { getDb } from './db.js';

export async function hashPassword(password) {
    return await bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
}

export function generateToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

export async function createUser(email, password, firstName, lastName) {
    const db = await getDb();
    const users = db.collection('customers');
    
    // Check if user exists
    const existingUser = await users.findOne({ email });
    if (existingUser) {
        throw new Error('User already exists');
    }
    
    const hashedPassword = await hashPassword(password);
    const user = {
        email,
        password_hash: hashedPassword,
        firstname: firstName,
        lastname: lastName,
        created_at: new Date(),
        last_login: null
    };
    
    const result = await users.insertOne(user);
    return { id: result.insertedId, email, firstName, lastName };
}

export async function authenticateUser(email, password) {
    const db = await getDb();
    const users = db.collection('customers');
    
    const user = await users.findOne({ email });
    if (!user) {
        throw new Error('Invalid credentials');
    }
    
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
        throw new Error('Invalid credentials');
    }
    
    // Update last login
    await users.updateOne(
        { _id: user._id },
        { $set: { last_login: new Date() } }
    );
    
    return {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstname,
        lastName: user.lastname
    };
}