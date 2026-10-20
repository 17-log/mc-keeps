'use strict';
const crypto=require('node:crypto');
function payload(result){
 if(result?.isError)throw new Error('麦当劳工具返回失败，请稍后重试');
 let data=result?.structuredContent;
 if(!data){for(const b of result?.content||[]){if(b.type==='text'){try{data=JSON.parse(b.text);break;}catch{}}}}
 if(!data||data.success===false||data.code!=null&&data.code!==200)throw new Error('订单响应未成功，未导入任何资料');
 return data.data??data;
}
function yuan(value){if(typeof value!=='string'&&typeof value!=='number')return null;const s=String(value);if(!/^\d+(\.\d{1,2})?$/.test(s))return null;const amount=Math.round(Number(s)*100);return Number.isSafeInteger(amount)?amount:null;}
function localDate(value){if(typeof value!=='string')return null;const m=/^(\d{4})-(\d{2})-(\d{2})(?:[ T]|$)/.exec(value);if(!m)return null;const date=new Date(+m[1],+m[2]-1,+m[3]);return date.getFullYear()===+m[1]&&date.getMonth()===+m[2]-1&&date.getDate()===+m[3]?m[0].slice(0,10):null;}
function kind(name){if(/薯/.test(name))return'fries';if(/咖啡|拿铁|美式|卡布/.test(name))return'coffee';if(/可乐|汽水|雪碧|饮/.test(name))return'cola';if(/麦乐鸡|鸡块/.test(name))return'nuggets';if(/冰淇淋|甜筒|麦旋风/.test(name))return'icecream';if(/派/.test(name))return'pie';if(/早|松饼|麦满分/.test(name))return'breakfast';return'burger';}
function items(list){if(!Array.isArray(list))return[];return list.slice(0,100).map((p,i)=>({key:String(i),name:typeof p.productName==='string'?p.productName.slice(0,160):typeof p.name==='string'?p.name.slice(0,160):'未命名餐品',quantity:Number.isSafeInteger(p.quantity)&&p.quantity>0?p.quantity:null,children:Array.isArray(p.comboItemList)?p.comboItemList.slice(0,50).map(c=>({name:String(c.name||c.productName||'套餐子项').slice(0,160),quantity:Number.isSafeInteger(c.quantity)?c.quantity:null})):[]}));}
function normalize(row,namespace){
 if(!row||typeof row.orderId!=='string'||!row.orderId)throw new Error('订单缺少稳定编号，不能自动关联');
 const id='mcp-'+crypto.createHash('sha256').update(namespace+'\0'+row.orderId).digest('hex').slice(0,28);
 const productList=items(row.orderProductList),status=String(row.orderStatus||row.status||'未知').slice(0,80);
 return {id,source:'mcp',date:localDate(row.createTime),sourceTimeMeaning:'下单时间（用餐日期需用户确认）',createdAt:typeof row.createTime==='string'?row.createTime:null,timezone:'Asia/Shanghai',status,completed:/^(订单已完成|已完成|COMPLETED)$/i.test(status),storeName:typeof row.storeName==='string'?row.storeName.slice(0,160):null,totalMinor:yuan(row.realTotalAmount),currency:'CNY',items:productList,kind:kind(productList[0]?.name||''),fetchedAt:new Date().toISOString()};
}
function normalizeList(result,namespace){const p=payload(result);if(!Array.isArray(p.list))throw new Error('订单列表格式与已验证 schema 不一致，未导入');const seen=new Set();return p.list.slice(0,100).map(row=>normalize(row,namespace)).filter(row=>!seen.has(row.id)&&seen.add(row.id));}
module.exports={payload,yuan,localDate,kind,items,normalize,normalizeList};
