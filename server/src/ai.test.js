import { describe,it,expect } from 'vitest';
import { validateGenerated } from './ai.js';
import { caseFixture as sample } from './testCase.js';

describe('generated mystery validation',()=>{it('accepts a supported case with the requested suspect count',()=>{expect(validateGenerated(sample,{suspectCount:3,difficulty:'medium',genre:'theft'}).suspects).toHaveLength(3);});it('rejects a solution without two clues',()=>{sample.solution.supportingEvidenceIds=['evidence_1'];expect(()=>validateGenerated(sample,{suspectCount:3,difficulty:'medium',genre:'theft'})).toThrow(/two independent clues/);});});
