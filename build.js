const fs=require('fs'),path=require('path');const base=__dirname;const read=p=>fs.readFileSync(path.join(base,p),'utf8');
const css=['styles.css','motion.css','orders-ui.css','persona.css'].map(read).join('\n');const js=['node_modules/qrcode-generator/dist/qrcode.js','art.js','motion.js','data.js','persona-engine.js','persona-art.js','persona-ui.js','app.js','orders-ui.js'].map(read).join('\n');
const license=read('THIRD_PARTY_NOTICES.md').match(/MIT License\r?\n\r?\n[\s\S]+?SOFTWARE\.\r?\n/);
if(!license)throw new Error('Missing qrcode-generator MIT notice');
const html=read('index.template.html').replace('/*STYLE*/',()=>css).replace('/*SCRIPT*/',()=>'/*\n'+license[0]+'*/\n'+js);fs.writeFileSync(path.join(base,'index.html'),html);console.log('Built mc-keeps/index.html: '+Buffer.byteLength(html)+' bytes');
