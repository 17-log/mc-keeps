'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const mcp=require('./lib/mcp.cjs');const port=Number(process.env.PORT||4880),host='127.0.0.1';
const csrf=crypto.randomBytes(24).toString('hex');let busy=false,lastRead=0;
function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));}
function localRequest(req){return req.headers.host===host+':'+port&&(!req.headers.origin||req.headers.origin==='http://'+host+':'+port);}
const server=http.createServer(async(req,res)=>{
 if(!localRequest(req)){json(res,403,{error:'仅接受同源本机访问'});return;}
 const url=new URL(req.url,'http://'+host+':'+port);
 if(req.method==='GET'&&url.pathname==='/api/status'){json(res,200,{local:true,configured:mcp.configured(),csrf});return;}
 if(url.pathname.startsWith('/api/')){
  if(req.method!=='POST'||req.headers['x-mc-keeps-csrf']!==csrf){json(res,403,{error:'请在本机页面重新打开订单连接'});return;}
  if(!['/api/orders','/api/order-detail'].includes(url.pathname)){json(res,404,{error:'没有这个接口'});return;}
  if(busy||Date.now()-lastRead<1000){json(res,429,{error:'请稍候再读取'});return;}
  busy=true;lastRead=Date.now();
  try{let result;if(url.pathname==='/api/orders')result=await mcp.sync();else{let text='';for await(const chunk of req){text+=chunk;if(text.length>1000)throw new Error('请求过大');}const args=JSON.parse(text);if(!/^mcp-[a-f0-9]{28}$/.test(args.id))throw new Error('无效订单');result=await mcp.detail(args.id);}json(res,200,result);}catch(error){json(res,502,{error:mcp.safeError(error)});}finally{busy=false;}return;
 }
 if(req.method==='GET'&&(url.pathname==='/'||url.pathname==='/index.html')){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});fs.createReadStream(path.join(__dirname,'index.html')).pipe(res);return;}
 if(url.pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}res.writeHead(404);res.end('Not found');
});
server.listen(port,host,()=>console.log(`麦味拾光本机版：http://${host}:${port}（凭据仅在本机使用）`));
module.exports={server,localRequest};
