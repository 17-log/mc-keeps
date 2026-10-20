'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {normalizeList,normalize,payload}=require('./orders.cjs');
const base=path.resolve(__dirname,'..'),privateDir=path.join(base,'private');
const allowed=new Set(['order-list','query-order']);
function getToken(){if(!process.env.MCD_MCP_TOKEN&&fs.existsSync(path.join(base,'.env.local')))process.loadEnvFile(path.join(base,'.env.local'));const t=process.env.MCD_MCP_TOKEN;return t&&!t.startsWith('${')?t:null;}
function configured(){return!!getToken();}
function safeError(error){const t=getToken();let s=String(error.message||error);if(t)s=s.split(t).join('[redacted]');if(/401|403|Unauthorized/i.test(s))return'麦当劳凭据无效或已过期，请在本机更新 .env.local';if(/429|Too Many/i.test(s))return'请求较多，请稍后再试';if(/timeout|abort/i.test(s))return'连接超时，现有手帐不受影响';return'订单服务暂时不可用，现有手帐不受影响';}
async function withClient(run){
 const token=getToken();if(!token)throw new Error('尚未配置本机麦当劳 MCP Token');
 const {Client}=await import('@modelcontextprotocol/sdk/client/index.js');
 const {StreamableHTTPClientTransport}=await import('@modelcontextprotocol/sdk/client/streamableHttp.js');
 const client=new Client({name:'mc-keeps',version:'1.0.0'},{capabilities:{}});
 try{await client.connect(new StreamableHTTPClientTransport(new URL('https://mcp.mcd.cn'),{requestInit:{headers:{Authorization:'Bearer '+token}}}),{timeout:20000});return await run(client,crypto.createHash('sha256').update(token).digest('hex'));}finally{await client.close();}
}
function audit(tool,result){fs.mkdirSync(privateDir,{recursive:true});const raw=JSON.stringify(result);fs.appendFileSync(path.join(privateDir,'calls.jsonl'),JSON.stringify({at:new Date().toISOString(),server:'https://mcp.mcd.cn',tool,isError:!!result.isError,bytes:Buffer.byteLength(raw),sha256:crypto.createHash('sha256').update(raw).digest('hex')})+'\n');}
async function call(client,name,args){if(!allowed.has(name))throw new Error('未授权的工具');const result=await client.callTool({name,arguments:args},undefined,{timeout:25000});payload(result);audit(name,result);return result;}
let cache={orders:[],ids:new Map(),namespace:null};
async function sync(){return withClient(async(client,namespace)=>{
 const schemas=await client.listTools();const tool=schemas.tools.find(t=>t.name==='order-list');if(!tool||tool.inputSchema.required?.length)throw new Error('订单 schema 已变化，请更新适配器');
 const result=await call(client,'order-list',{}),rows=payload(result).list;
 const orders=normalizeList(result,namespace),ids=new Map();for(const row of rows){if(typeof row.orderId==='string')ids.set(normalize(row,namespace).id,row.orderId);}
 cache={orders,ids,namespace};return {orders,fetchedAt:new Date().toISOString(),coverage:'仅本次接口可见的近期订单，不代表全部历史',tool:'order-list'};
 });}
async function detail(id){if(!cache.ids.has(id))throw new Error('请先刷新订单列表');return withClient(async(client,namespace)=>{if(namespace!==cache.namespace)throw new Error('账号已变化，请重新同步');const result=await call(client,'query-order',{orderId:cache.ids.get(id)});const order=normalize(payload(result),namespace);if(order.id!==id)throw new Error('详情订单编号与列表不一致');return {order,tool:'query-order'};});}
module.exports={configured,sync,detail,safeError};
