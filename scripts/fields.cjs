const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:2});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:5199/',{waitUntil:'networkidle'});
await p.evaluate(()=>localStorage.clear());await p.reload({waitUntil:'networkidle'});
await p.goto('http://localhost:5199/wm/new?demo=1',{waitUntil:'networkidle'});

await p.getByRole('button',{name:'Create and write invite'}).click();await p.waitForURL(/invite/);
await p.getByRole('button',{name:'Send invite'}).click();await p.waitForTimeout(500);
const t=await p.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('nevis-onboarding-v1')).state.cases).find(c=>c.token!=='gallery').token);
await p.goto('http://localhost:5199/c/'+t+'?step=id',{waitUntil:'networkidle'});
await p.getByRole('button',{name:'Use camera'}).click();await p.waitForTimeout(2200);
await p.goto('http://localhost:5199/c/'+t+'?step=about',{waitUntil:'networkidle'});
await p.waitForTimeout(400);
await p.screenshot({path:'shots/fields-rest.png',fullPage:true});await p.locator('#f-city').focus();await p.waitForTimeout(400);await p.screenshot({path:'shots/fields-draft-focus.png',clip:{x:420,y:820,width:900,height:200}});
await p.goto('http://localhost:5199/c/'+t+'?step=work',{waitUntil:'networkidle'});
await p.waitForTimeout(400);
await p.screenshot({path:'shots/fields-work.png',fullPage:true});
await p.locator('#f-annualIncome').focus();await p.waitForTimeout(400);
await p.screenshot({path:'shots/fields-focus.png',fullPage:true});
console.log(errs.join('\n')||'ok');await b.close()})()
