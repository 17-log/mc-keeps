const fs=require('fs'),path=require('path');const base=__dirname;const read=p=>fs.readFileSync(path.join(base,p),'utf8');
const css=['styles.css','motion.css','orders-ui.css'].map(read).join('\n');const js=['art.js','motion.js','data.js','app.js','orders-ui.js'].map(read).join('\n');
const html=read('index.template.html').replace('/*STYLE*/',()=>css).replace('/*SCRIPT*/',()=>js);fs.writeFileSync(path.join(base,'index.html'),html);console.log('Built mc-keeps/index.html: '+Buffer.byteLength(html)+' bytes');
