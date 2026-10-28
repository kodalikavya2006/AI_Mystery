import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import mongoose from 'mongoose';
import { config } from './config.js';
import { Mystery, Attempt, InvestigationProgress } from './models.js';
import { generateMystery, generateHint } from './ai.js';

const api=express.Router();
const sessionSecret=process.env.SESSION_SECRET||'local-development-only-change-me-please';
const sessionCookie={httpOnly:true,secure:config.nodeEnv==='production',sameSite:config.nodeEnv==='production'?'none':'lax',path:'/',maxAge:30*24*60*60*1000};
const generationLimit=rateLimit({windowMs:60*60*1000,limit:config.nodeEnv==='production'?5:20,standardHeaders:true,legacyHeaders:false,message:{success:false,error:{code:'RATE_LIMITED',message:'Too many case generation requests. Try again later.'}}});
const hintLimit=rateLimit({windowMs:60*60*1000,limit:30,standardHeaders:true,legacyHeaders:false,message:{success:false,error:{code:'RATE_LIMITED',message:'Too many hint requests. Try again later.'}}});
const retrievalLimit=rateLimit({windowMs:15*60*1000,limit:120,standardHeaders:true,legacyHeaders:false,message:{success:false,error:{code:'RATE_LIMITED',message:'Too many case retrieval requests. Try again shortly.'}}});
const accusationLimit=rateLimit({windowMs:60*60*1000,limit:10,standardHeaders:true,legacyHeaders:false,message:{success:false,error:{code:'RATE_LIMITED',message:'Too many accusation requests. Try again later.'}}});
const defaultError=(res,status,code,message)=>res.status(status).json({success:false,error:{code,message}});
const ok=(res,data,status=200)=>res.status(status).json({success:true,data});
const objectId=id=>mongoose.isValidObjectId(id);
const sessionId=req=>req.signedCookies?.[config.cookieName];

export function publicMystery(m,progress,attempt){
  const result=['solved','failed'].includes(m.status)&&attempt?{isCorrect:attempt.isCorrect,selectedSuspectId:attempt.selectedSuspectId,verdict:attempt.isCorrect?'correct':'incorrect',solution:{culpritId:m.solution.culpritId,culpritName:m.suspects.find(s=>s.id===m.solution.culpritId)?.name,motive:m.solution.motive,method:m.solution.method,explanation:m.solution.explanation,supportingEvidenceIds:m.solution.supportingEvidenceIds}}:undefined;
  const out={id:String(m._id),title:m.title,scenario:m.scenario,synopsis:m.synopsis,genre:m.genre,difficulty:m.difficulty,length:m.length,status:m.status,incident:m.incident,suspects:m.suspects, evidence:m.publicEvidence,timeline:m.timeline,hintsUsed:m.hintsUsed,createdAt:m.createdAt,updatedAt:m.updatedAt,progress:progress?{reviewedEvidenceIds:progress.reviewedEvidenceIds,notes:progress.notes}: {reviewedEvidenceIds:[],notes:''}};
  if(result)out.result=result;
  return out;
}
async function owned(req,res){
  if(!objectId(req.params.id)){defaultError(res,400,'INVALID_ID','That case reference is invalid.');return null;}
  const mystery=await Mystery.findOne({_id:req.params.id,sessionId:sessionId(req)});
  if(!mystery){defaultError(res,404,'CASE_NOT_FOUND','Case file not found.');return null;}
  return mystery;
}

export function createApp({generationService=generateMystery}={}){
  const app=express();
  app.disable('x-powered-by');
  if(config.nodeEnv==='production')app.set('trust proxy',1);
  app.use(helmet());
  app.use(cors({origin:config.clientUrl,credentials:true,methods:['GET','POST','PATCH','DELETE','OPTIONS'],allowedHeaders:['Content-Type']}));
  app.use(express.json({limit:'32kb'}));app.use(cookieParser(sessionSecret));
  app.use((req,res,next)=>{
    let sid=sessionId(req);
    if(typeof sid!=='string'||!/^[-_a-zA-Z0-9]{40,100}$/.test(sid)){sid=crypto.randomBytes(32).toString('base64url');res.cookie(config.cookieName,sid,{...sessionCookie,signed:true});req.signedCookies[config.cookieName]=sid;}
    if(!['GET','HEAD','OPTIONS'].includes(req.method)){
      const origin=req.get('origin')||(req.get('referer')?new URL(req.get('referer')).origin:null);if(origin!==new URL(config.clientUrl).origin)return defaultError(res,403,'ORIGIN_REJECTED','Request origin is not allowed.');
    }
    next();
  });
  app.get('/api/v1/health',(req,res)=>ok(res,{status:'ok',database:mongoose.connection.readyState===1?'connected':'disconnected'}));

  api.post('/mysteries',generationLimit,async(req,res,next)=>{
    try{
      const {scenario,genre='general',difficulty='medium',suspectCount=4,length='standard'}=req.body||{};
      if(typeof scenario!=='string'||scenario.trim().length<30||scenario.trim().length>2000)return defaultError(res,400,'VALIDATION_ERROR','Scenario must be between 30 and 2,000 characters.');
      if(!['easy','medium','hard'].includes(difficulty)||!['short','standard'].includes(length)||!Number.isInteger(suspectCount)||suspectCount<3||suspectCount>6)return defaultError(res,400,'VALIDATION_ERROR','Choose a valid difficulty, length, and 3–6 suspects.');
      const genres=['general','theft','missing-object','corporate-espionage','art-mystery','fictional-murder','cyber'];if(!genres.includes(genre))return defaultError(res,400,'VALIDATION_ERROR','Choose a valid mystery genre.');
      const requestId=crypto.randomUUID();const request={scenario:scenario.trim(),genre,difficulty,suspectCount,length};
      const generated=await generationService(request);
      const m=await Mystery.create({sessionId:sessionId(req),title:generated.title,scenario:request.scenario,synopsis:generated.synopsis,genre,difficulty,length,status:'active',incident:generated.incident,suspects:generated.suspects,publicEvidence:generated.evidence,timeline:generated.timeline,solution:generated.solution,generationRequestId:requestId});
      await InvestigationProgress.create({mysteryId:m._id,sessionId:sessionId(req),reviewedEvidenceIds:[],notes:''});
      return ok(res,publicMystery(m,null,null),201);
    }catch(e){if(e.code==='AI_NOT_CONFIGURED')return defaultError(res,503,e.code,e.message);if(e.code==='AI_TIMEOUT')return defaultError(res,504,e.code,e.message);if(e.code==='AI_QUOTA')return defaultError(res,429,e.code,'The mystery service has reached its current quota. Please try again later.');if(e.code==='AI_UNAVAILABLE')return defaultError(res,503,e.code,'The mystery service is temporarily busy. Please retry in a minute.');if(e.code==='AI_PROVIDER')return defaultError(res,502,e.code,'The mystery service could not complete this request. Check the configured model and retry.');if(e.code==='AI_INVALID_RESPONSE')return defaultError(res,502,e.code,e.message);next(e);}
  });
  api.get('/mysteries',retrievalLimit,async(req,res,next)=>{try{const page=Math.max(1,Number.parseInt(req.query.page)||1),limit=Math.min(20,Math.max(1,Number.parseInt(req.query.limit)||10));const filter={sessionId:sessionId(req)};if(['active','solved','failed','abandoned'].includes(req.query.status))filter.status=req.query.status;if(['easy','medium','hard'].includes(req.query.difficulty))filter.difficulty=req.query.difficulty;const [items,total]=await Promise.all([Mystery.find(filter).sort({createdAt:-1}).skip((page-1)*limit).limit(limit).select('title synopsis genre difficulty status createdAt'),Mystery.countDocuments(filter)]);return ok(res,{items:items.map(m=>({id:String(m._id),title:m.title,synopsis:m.synopsis,genre:m.genre,difficulty:m.difficulty,status:m.status,createdAt:m.createdAt})),page,limit,total});}catch(e){next(e);}});
  api.get('/mysteries/:id',retrievalLimit,async(req,res,next)=>{try{const m=await owned(req,res);if(!m)return;const [progress,attempt]=await Promise.all([InvestigationProgress.findOne({mysteryId:m._id,sessionId:sessionId(req)}),Attempt.findOne({mysteryId:m._id,sessionId:sessionId(req)})]);return ok(res,publicMystery(m,progress,attempt));}catch(e){next(e);}});
  api.patch('/mysteries/:id/progress',async(req,res,next)=>{try{const m=await owned(req,res);if(!m)return;const{reviewedEvidenceIds,notes}=req.body||{};if(reviewedEvidenceIds!==undefined&&(!Array.isArray(reviewedEvidenceIds)||reviewedEvidenceIds.length>12||reviewedEvidenceIds.some(id=>!m.publicEvidence.some(e=>e.id===id))))return defaultError(res,400,'VALIDATION_ERROR','Reviewed evidence must belong to this case.');if(notes!==undefined&&(typeof notes!=='string'||notes.length>5000))return defaultError(res,400,'VALIDATION_ERROR','Notes must be 5,000 characters or fewer.');const update={$set:{updatedAt:new Date()}};if(notes!==undefined)update.$set.notes=notes;if(reviewedEvidenceIds?.length)update.$addToSet={reviewedEvidenceIds:{$each:reviewedEvidenceIds}};const progress=await InvestigationProgress.findOneAndUpdate({mysteryId:m._id,sessionId:sessionId(req)},update,{upsert:true,new:true,setDefaultsOnInsert:true});return ok(res,{reviewedEvidenceIds:progress.reviewedEvidenceIds,notes:progress.notes});}catch(e){next(e);}});
  api.post('/mysteries/:id/hints',hintLimit,async(req,res,next)=>{try{const m=await owned(req,res);if(!m)return;if(m.status!=='active')return defaultError(res,409,'CASE_CLOSED','Hints are available only for active cases.');const level=req.body?.level;if(!Number.isInteger(level)||level!==m.hintsUsed+1||level>3)return defaultError(res,400,'HINT_LIMIT','Hints must be requested in order, up to three per case.');const hint=await generateHint(m,level);m.hintsUsed=level;await m.save();return ok(res,hint);}catch(e){next(e);}});
  api.post('/mysteries/:id/accusation',accusationLimit,async(req,res,next)=>{try{const m=await owned(req,res);if(!m)return;if(m.status!=='active')return defaultError(res,409,'CASE_CLOSED','An accusation has already been recorded for this case.');const suspectId=req.body?.suspectId;if(!m.suspects.some(s=>s.id===suspectId))return defaultError(res,400,'INVALID_SUSPECT','Choose a suspect from this case.');const isCorrect=suspectId===m.solution.culpritId;const attempt=await Attempt.create({mysteryId:m._id,sessionId:sessionId(req),selectedSuspectId:suspectId,isCorrect,hintsUsed:m.hintsUsed});m.status=isCorrect?'solved':'failed';m.completedAt=new Date();await m.save();return ok(res,{isCorrect,selectedSuspectId:suspectId,verdict:isCorrect?'correct':'incorrect',solution:{culpritId:m.solution.culpritId,culpritName:m.suspects.find(s=>s.id===m.solution.culpritId)?.name,motive:m.solution.motive,method:m.solution.method,explanation:m.solution.explanation,supportingEvidenceIds:m.solution.supportingEvidenceIds}});}catch(e){if(e.code===11000)return defaultError(res,409,'ACCUSATION_RECORDED','A final accusation has already been recorded.');next(e);}});
  api.delete('/mysteries/:id',async(req,res,next)=>{try{const m=await owned(req,res);if(!m)return;if(m.status==='active')m.status='abandoned';m.updatedAt=new Date();await m.save();return ok(res,{id:String(m._id),status:m.status});}catch(e){next(e);}});
  app.use('/api/v1',api);
  app.use((req,res)=>defaultError(res,404,'NOT_FOUND','This API route does not exist.'));
  app.use((err,req,res,next)=>{if(res.headersSent)return next(err);const requestId=crypto.randomUUID();console.error(JSON.stringify({requestId,error:err.message,code:err.code}));return defaultError(res,500,'INTERNAL_ERROR',`The request could not be completed. Reference: ${requestId}`);});
  return app;
}

export const app=createApp();
