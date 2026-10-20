'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
async function main(){
 const base=path.resolve(__dirname,'..');
 if(fs.existsSync(path.join(base,'.env.local')))process.loadEnvFile(path.join(base,'.env.local'));
 const token=process.env.MCD_MCP_TOKEN;
 if(!token||token.startsWith('${'))throw new Error('请在本机 .env.local 配置 MCD_MCP_TOKEN');
 const {Client}=await import('@modelcontextprotocol/sdk/client/index.js');
 const {StreamableHTTPClientTransport}=await import('@modelcontextprotocol/sdk/client/streamableHttp.js');
 const client=new Client({name:'mc-keeps',version:'1.0.0'},{capabilities:{}});
 try{
  await client.connect(new StreamableHTTPClientTransport(new URL('https://mcp.mcd.cn'),{requestInit:{headers:{Authorization:'Bearer '+token}}}),{timeout:25000});
  const tools=[];let cursor;do{const batch=await client.listTools(cursor?{cursor}:{});tools.push(...batch.tools);cursor=batch.nextCursor;}while(cursor);
  const relevant=tools.filter(t=>['order-list','query-order','now-time-info'].includes(t.name));
  const priv=path.join(base,'private');fs.mkdirSync(priv,{recursive:true});
  fs.writeFileSync(path.join(priv,'tool-schemas.json'),JSON.stringify(relevant,null,2));
  const action=process.argv[2]||'discover';
  if(action==='discover'){console.log(JSON.stringify({connected:true,totalTools:tools.length,tools:relevant},null,2));return;}
  if(!['order-list','query-order','now-time-info'].includes(action))throw new Error('只允许只读订单与时间工具');
  const args=process.argv[3]?JSON.parse(fs.readFileSync(path.resolve(process.argv[3]),'utf8')):{};
  const result=await client.callTool({name:action,arguments:args},undefined,{timeout:30000});
  const raw=JSON.stringify(result,null,2);fs.writeFileSync(path.join(priv,action+'-raw.json'),raw);
  const audit={checkedAt:new Date().toISOString(),server:'https://mcp.mcd.cn',transport:'Streamable HTTP',tool:action,isError:!!result.isError,resultBytes:Buffer.byteLength(raw),resultSha256:crypto.createHash('sha256').update(raw).digest('hex'),rawSavedLocally:true};
  fs.writeFileSync(path.join(priv,action+'-audit.json'),JSON.stringify(audit,null,2));
  console.log(JSON.stringify(audit,null,2));
 }finally{await client.close();}
}
main().catch(error=>{let text=String(error.message||error).replace(/Bearer\s+[^\s"']+/gi,'Bearer [redacted]');if(process.env.MCD_MCP_TOKEN)text=text.split(process.env.MCD_MCP_TOKEN).join('[redacted]');console.error(text);process.exitCode=1;});
