import { app } from './app.js';
import { config } from './config.js';
import mongoose from 'mongoose';

if(config.nodeEnv==='production'&&(!process.env.SESSION_SECRET||process.env.SESSION_SECRET.length<32))throw new Error('SESSION_SECRET must be configured with at least 32 characters in production.');
try { await mongoose.connect(config.mongoUri,{serverSelectionTimeoutMS:10000});console.log('MongoDB connected.'); }
catch(error){console.error(`MongoDB connection failed: ${error.message}`);process.exit(1);}
app.listen(config.port,'0.0.0.0',()=>console.log(`AI Mystery Room listening on port ${config.port}.`));
