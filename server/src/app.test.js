import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, publicMystery } from './app.js';

describe('API surface',()=>{
  it('returns a public health response without infrastructure details',async()=>{
    const response=await request(app).get('/api/v1/health').expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
    expect(['connected','disconnected']).toContain(response.body.data.database);
    expect(JSON.stringify(response.body)).not.toMatch(/secret|key|stack/i);
  });
  it('uses the consistent JSON error shape for unknown routes',async()=>{
    const response=await request(app).get('/api/v1/missing').expect(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
  it('never serializes the hidden solution while a case is active',()=>{
    const active=publicMystery({_id:'case-id',status:'active',solution:{culpritId:'secret'},suspects:[],publicEvidence:[],timeline:[]},null,null);
    expect(active).not.toHaveProperty('solution');
    expect(JSON.stringify(active)).not.toContain('secret');
  });
});
