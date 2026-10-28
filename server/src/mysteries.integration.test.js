import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { Mystery, Attempt, InvestigationProgress } from './models.js';
import { caseFixture } from './testCase.js';

const app=createApp({generationService:async requestSettings=>({...caseFixture,genre:requestSettings.genre,difficulty:requestSettings.difficulty})});
let memory;
const origin='http://localhost:5173';

beforeAll(async()=>{memory=await MongoMemoryServer.create();await mongoose.connect(memory.getUri());});
afterEach(async()=>{await Promise.all([Mystery.deleteMany({}),Attempt.deleteMany({}),InvestigationProgress.deleteMany({})]);});
afterAll(async()=>{await mongoose.disconnect();await memory?.stop();});

describe('mystery ownership and solution secrecy',()=>{
  it('keeps solutions private, isolates sessions, and records one accusation',async()=>{
    const detective=request.agent(app);
    const created=await detective.post('/api/v1/mysteries').set('Origin',origin).send({scenario:'A rare painting disappears during a private gallery event.',genre:'theft',difficulty:'medium',suspectCount:3,length:'standard'}).expect(201);
    const id=created.body.data.id;
    expect(created.body.data).not.toHaveProperty('solution');
    expect(JSON.stringify(created.body.data)).not.toContain('culpritId');

    const active=await detective.get(`/api/v1/mysteries/${id}`).expect(200);
    expect(active.body.data).not.toHaveProperty('solution');
    await request(app).get(`/api/v1/mysteries/${id}`).expect(404);

    const verdict=await detective.post(`/api/v1/mysteries/${id}/accusation`).set('Origin',origin).send({suspectId:'suspect_2'}).expect(200);
    expect(verdict.body.data.isCorrect).toBe(false);
    expect(verdict.body.data.solution.culpritId).toBe('suspect_1');
    expect((await detective.get(`/api/v1/mysteries/${id}`).expect(200)).body.data.result.isCorrect).toBe(false);
    await detective.post(`/api/v1/mysteries/${id}/accusation`).set('Origin',origin).send({suspectId:'suspect_1'}).expect(409);
  });
});
