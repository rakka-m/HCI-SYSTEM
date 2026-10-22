/* PLMun Business Center — store
   Saved data, inventory, cart maths, orders and every state change. */

/* ---------- Saved data ---------- */

function reloadDb(){
var d;try{d=JSON.parse(localStorage.getItem(KEY))}catch(e){d=null}
if(!d||!d.products)d=JSON.parse(JSON.stringify(seed));
d.products.forEach(p=>{if(!p.cat){var s0=seed.products.find(x=>x.id==p.id);p.cat=s0?s0.cat:"Other"}});
d.products.forEach(p=>{if(!p.img){var s2=seed.products.find(x=>x.id==p.id);if(s2&&s2.img)p.img=s2.img}});
if(!d.sus)d.sus=[];if(!d.users)d.users={};
["audit","base","watch","orders","notifs"].forEach(k=>{if(!d[k])d[k]=[]});if(d.ann==null)d.ann="";if(!d.cfg)d.cfg={hours:24};
if(!d.bundles)d.bundles=JSON.parse(JSON.stringify(seed.bundles));if(!d.staff)d.staff=JSON.parse(JSON.stringify(seed.staff));
d.products.forEach(p=>{var s1=seed.products.find(x=>x.id==p.id);if(s1&&s1.sizes&&!p.sizes)p.sizes=Object.assign({},s1.sizes);sync(p)});
return d}
var db=reloadDb();
function save(){try{localStorage.setItem(KEY,JSON.stringify(db))}catch(e){}}

/* ---------- Keeping the three sites in step ----------

   The shop, cashier and admin sites are separate pages, so each keeps its own
   copy of db in memory. When one of them calls save(), the browser fires a
   "storage" event in the other open tabs; we reload from localStorage and
   redraw, which is what makes the three screens react to each other with no
   server. */

function pruneCart(){
 [cart,posCart].forEach(function(c){
  Object.keys(c).forEach(function(k){
   var o=kp(k);
   if(!o.p){delete c[k];return}
   var max=stk(o.p,o.sz);
   if(c[k]>max){if(max<=0)delete c[k];else c[k]=max}
  });
 });
}
function pull(){db=reloadDb();pruneCart();render()}
if(typeof window!=="undefined"&&window.addEventListener)window.addEventListener("storage",function(e){if(e.key===KEY)pull()});

/* ---------- Lookups and inventory helpers ---------- */

function prod(id){return db.products.find(p=>p.id==id)}
function cartCount(){return Object.values(cart).reduce((a,b)=>a+b,0)}
function pend(){return db.orders.filter(o=>o.status=="Pending").length}
function lim(p){return p.min==null?5:p.min}
function ky(id,sz){return sz?id+"|"+sz:""+id}
function kp(k){var a=String(k).split("|");return {p:prod(a[0]),sz:a[1]||""}}
function stk(p,sz){return sz?p.sizes[sz]:p.stock}
function av(p,z){return stk(p,z)-(cart[ky(p.id,z)]||0)}
function sync(p){if(p.sizes)p.stock=Object.values(p.sizes).reduce((a,b)=>a+b,0)}
function take(p,sz,n){if(sz&&p.sizes)p.sizes[sz]+=n;else p.stock+=n;sync(p)}
function pk(p){if(!p.sizes)return"";var c=pick[p.id];if(c&&p.sizes[c]!==undefined)return c;return Object.keys(p.sizes).find(z=>av(p,z)>0)||Object.keys(p.sizes)[0]}

/* ---------- Cart ---------- */

function clearCart(){cart={};rcpt="";ref="";render()}
function add(id){var p=prod(id),sz=pk(p),k=ky(id,sz);if((cart[k]||0)<stk(p,sz))cart[k]=(cart[k]||0)+1;render()}
function buy(id){var p=prod(id),sz=pk(p),k=ky(id,sz);if(stk(p,sz)>0)cart[k]=Math.min(stk(p,sz),Math.max(1,cart[k]||0));tab="cart";render()}
function chg(k,d){var o=kp(k),n=(cart[k]||0)+d;if(n<=0)delete cart[k];else if(n<=stk(o.p,o.sz))cart[k]=n;render()}
function total(){return Object.keys(cart).reduce((a,k)=>a+kp(k).p.price*cart[k],0)-disc()}
function inCart(i){return Object.keys(cart).reduce((s,k)=>s+(String(k).split("|")[0]==i?cart[k]:0),0)}
function disc(){return bl().reduce((t,b)=>t+Math.min.apply(null,b.items.map(inCart))*b.discount,0)}

/* ---------- Bundles ---------- */

function bl(){return db.bundles.filter(b=>b.items.every(i=>prod(i)))}
function bprice(b){return b.items.reduce((t,i)=>t+prod(i).price,0)-b.discount}
function bsizes(b){var a=null;b.items.forEach(i=>{var p=prod(i);if(p.sizes){var z=Object.keys(p.sizes);a=a?a.filter(x=>z.indexOf(x)>-1):z}});return a||[]}
function bok(b,sz){return b.items.every(i=>{var p=prod(i);return av(p,p.sizes?sz:"")>0})}
function addBundle(bid){var b=db.bundles.find(x=>x.id==bid),sz=bpick[bid]||bsizes(b)[0]||"";if(!bok(b,sz)){info("This bundle is not fully in stock right now.");return}b.items.forEach(i=>{var p=prod(i),k=ky(i,p.sizes?sz:"");cart[k]=(cart[k]||0)+1});tab="cart";render()}

/* ---------- POS (cashier terminal) ---------- */

function posIn(id){return Object.keys(posCart).reduce((s,k)=>s+(String(k).split("|")[0]==id?posCart[k]:0),0)}
function posCount(){return Object.values(posCart).reduce((a,b)=>a+b,0)}
function posTotal(){return Object.keys(posCart).reduce((a,k)=>{var o=kp(k);return a+(o.p?o.p.price*posCart[k]:0)},0)}
function posCashNum(){return parseFloat(posCash)||0}
function posChange(){return +(posCashNum()-posTotal()).toFixed(2)}
function posAdd(id){var p=prod(id);if(!p)return;var sz=pk(p),k=ky(id,sz);if(stk(p,sz)-(posCart[k]||0)<=0){info("That item is out of stock.");return}posCart[k]=(posCart[k]||0)+1;render()}
function posChg(k,d){var o=kp(k);if(!o.p){delete posCart[k];render();return}var n=(posCart[k]||0)+d;if(n<=0)delete posCart[k];else if(n<=stk(o.p,o.sz))posCart[k]=n;render()}
function posClear(){posCart={};posCash="";posRef="";render()}
function posToday(){var t=new Date().toDateString();return db.orders.filter(o=>o.channel=="POS"&&new Date(o.created).toDateString()==t).reduce((a,o)=>a+o.total,0)}
function posComplete(){
 if(!cur){info("Sign in as staff before making a sale.");return}
 var ks=Object.keys(posCart);if(!ks.length){info("Add at least one item to the sale.");return}
 var items=[];
 for(var i=0;i<ks.length;i++){
  var o=kp(ks[i]),p=o.p;if(!p)continue;
  if(posCart[ks[i]]>stk(p,o.sz)){info("Not enough stock for "+p.name+(o.sz?" ("+o.sz+")":"")+".");return}
  items.push({id:p.id,sz:o.sz,name:p.name+(o.sz?" ("+o.sz+")":""),qty:posCart[ks[i]],price:p.price});
 }
 if(!items.length){info("Add at least one item to the sale.");return}
 var tot=posTotal();
 if(posPay=="Cash"){
  if(posCashNum()<tot){info("Cash received is less than the total of "+money(tot)+". Enter the amount handed over.");return}
 }else if(posRef.trim().length<6){
  info("Enter the e-wallet reference number (at least 6 characters).");return
 }
 items.forEach(x=>take(prod(x.id),x.sz,-x.qty));
 var o={id:db.nextO++,sid:"WALK-IN",name:"Walk-in customer",items:items,total:tot,method:posPay,
  ref:posPay=="Cash"?"":posRef.trim(),receipt:"",discount:0,slot:"",channel:"POS",
  cash:posPay=="Cash"?posCashNum():0,change:posPay=="Cash"?posChange():0,code:"",
  status:"Claimed",created:Date.now(),verifiedAt:Date.now(),
  log:[{s:"Pending",t:Date.now()},{s:"Claimed",t:Date.now()}]};
 db.orders.unshift(o);
 aud("POS sale #"+o.id+" — "+money(tot)+" ("+o.method+(o.ref?" ref "+o.ref:"")+")");
 posCart={};posCash="";posRef="";save();dlg={type:"posrcp",id:o.id};render()
}

/* ---------- Orders ---------- */

function notify(o,m){db.notifs.unshift({sid:o.sid,oid:o.id,msg:m,t:Date.now()})}
function checkout(){var me=db.me;
 if(!me.in){tab="acct";info("Sign in with your student ID to place an order.");return}
 var dig=pay!="Cash";if(dig&&ref.trim().length<6){info("Enter the e-wallet reference number (at least 6 characters).");return}
 if(dig&&!rcpt){info("Upload your payment receipt screenshot.");return}
 if(!slot){info("Choose a pickup time.");return}
 if(used(slot)>=CAP){info("That pickup time just filled up. Choose another.");return}
 var dp=dig&&db.orders.find(x=>x.ref&&x.ref.toLowerCase()==ref.trim().toLowerCase()&&["Rejected","Cancelled"].indexOf(x.status)<0);
 if(dp){info("This reference number was already used on order #"+dp.id+". Enter the reference from your own payment.");return}
 var items=[];for(var k in cart){var o2=kp(k),p=o2.p;if(cart[k]>stk(p,o2.sz)){info("Not enough stock for "+p.name+(o2.sz?" ("+o2.sz+")":"")+".");return}items.push({id:p.id,sz:o2.sz,name:p.name+(o2.sz?" ("+o2.sz+")":""),qty:cart[k],price:p.price})}
 if(!items.length)return;
 items.forEach(i=>take(prod(i.id),i.sz,-i.qty));
 var o={id:db.nextO++,sid:me.sid.trim(),name:me.name.trim(),items:items,total:total(),method:dig?pay:"Pay at counter",ref:dig?ref.trim():"",receipt:dig?rcpt:"",discount:disc(),slot:slot,code:String(1000+Math.floor(Math.random()*9000)),status:"Pending",created:Date.now(),verifiedAt:0,log:[{s:"Pending",t:Date.now()}]};
 db.orders.unshift(o);notify(o,"Order #"+o.id+(dig?" received. Waiting for payment verification.":" received. Please pay in cash at the Business Center counter."));
 cart={};ref="";rcpt="";slot="";save();tab="shop";dlg={type:"thanks",id:o.id,msg:(dig?"We will verify your payment shortly. ":"Please pay in cash at the counter. ")+"Pickup: "+o.slot+"."};note="Order #"+o.id+(dig?" submitted. You will be notified when payment is verified.":" placed. Pay in cash at the counter when you pick up.");render()}
function setStatus(id,s){var o=db.orders.find(x=>x.id==id);
 if(s=="Rejected"||s=="Cancelled")o.items.forEach(x=>{var p=prod(x.id);if(p)take(p,x.sz||"",x.qty)});
 if(s=="Verified")o.verifiedAt=Date.now();
 if(s=="Rejected"||s=="Cancelled")checkWatch();aud("Order #"+id+" marked "+s,cur?null:"Student "+o.sid);o.status=s;(o.log=o.log||[]).push({s:s,t:Date.now()});notify(o,"Order #"+id+": "+MSG[s]+(s=="Ready"?" Pickup code: "+o.code+".":""));save();render()}
function cancelMine(id){ask("Cancel this order?",function(){setStatus(id,"Cancelled")})}
function autoRelease(){var ms=db.cfg.hours*3600000,ch=false;db.orders.forEach(o=>{if(o.status=="Pending"&&!o.ref&&Date.now()-o.created>ms){o.items.forEach(x=>{var p=prod(x.id);if(p)take(p,x.sz||"",x.qty)});o.status="Cancelled";(o.log=o.log||[]).push({s:"Cancelled",t:Date.now()});notify(o,"Order #"+o.id+" was released because cash payment was not received within "+db.cfg.hours+" hours.");aud("Order #"+o.id+" released automatically (unpaid)","System");ch=true}});if(ch){checkWatch();save();render()}}
function reorder(id){var o=db.orders.find(x=>x.id==id),miss=0;o.items.forEach(x=>{var p=prod(x.id),z=x.sz||"";if(!p||(z&&!p.sizes)||(!z&&p.sizes)||(z&&p.sizes[z]===undefined)){miss++;return}var n=Math.min(x.qty,Math.max(0,av(p,z)));if(n<x.qty)miss++;if(n>0)cart[ky(p.id,z)]=(cart[ky(p.id,z)]||0)+n});tab="cart";render();if(miss)info("Some items were reduced or skipped because they are not fully in stock.")}
function used(sl){return db.orders.filter(o=>o.slot==sl&&["Pending","Verified","Ready"].indexOf(o.status)>-1).length}
function dupOf(o){return db.orders.find(x=>x.id!=o.id&&["Rejected","Cancelled"].indexOf(x.status)<0&&((o.ref&&x.ref&&x.ref.toLowerCase()==o.ref.toLowerCase())||(o.receipt&&x.receipt&&x.receipt===o.receipt)))}
function dupTag(o){var d=o.status=="Pending"&&(o.ref||o.receipt)&&dupOf(o);return d?'<span class="tag out">Possible duplicate of order #'+d.id+'</span>':''}
function claim(id){var o=db.orders.find(x=>x.id==id);if(val("pc"+id).trim()!==o.code){info("That pickup code does not match order #"+id+".");return}setStatus(id,"Claimed")}
function pickFile(el){var f=el.files[0];if(!f)return;var r=new FileReader();r.onload=function(){var im=new Image();im.onload=function(){var s=Math.min(1,640/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=im.width*s;c.height=im.height*s;c.getContext("2d").drawImage(im,0,0,c.width,c.height);rcpt=c.toDataURL("image/jpeg",.6);render()};im.src=r.result};r.readAsDataURL(f)}

/* ---------- Notifications and audit trail ---------- */

function aud(m,w){db.audit.unshift({who:w||(cur?cur.name:"System"),act:m,t:Date.now()});if(db.audit.length>300)db.audit.length=300}
function checkWatch(){var keep=[];db.watch.forEach(w=>{var p=prod(w.pid);if(!p)return;if(stk(p,w.sz)>0)db.notifs.unshift({sid:w.sid,oid:0,msg:p.name+(w.sz?" (size "+w.sz+")":"")+" is back in stock.",t:Date.now()});else keep.push(w)});db.watch=keep}
function notifyMe(id){var p=prod(id),sz=pk(p);if(!db.me.in){tab="acct";info("Sign in with your student ID first, then we can notify you.");return}if(!db.watch.some(w=>w.pid==id&&w.sz==sz&&w.sid==db.me.sid))db.watch.push({pid:id,sz:sz,sid:db.me.sid});save();info("Done. We will add a notice to My Orders when "+p.name+(sz?" (size "+sz+")":"")+" is back in stock.")}

/* ---------- Inventory admin ---------- */

function setStock(id,sz,v){var p=prod(id),n=Math.max(0,parseInt(v)||0);if(sz)p.sizes[sz]=n;else p.stock=n;sync(p);aud("Set stock of "+p.name+(sz?" size "+sz:"")+" to "+n);checkWatch();save();render()}
function restock(id){var p=prod(id);if(p.sizes)Object.keys(p.sizes).forEach(z=>p.sizes[z]+=10);else p.stock+=10;sync(p);aud("Added 10 to "+p.name);checkWatch();save();render()}
function setMin(id,v){var p=prod(id);p.min=Math.max(0,parseInt(v)||0);aud("Set alert level of "+p.name+" to "+p.min);save();render()}
function setPrice(id,v){var p=prod(id);p.price=Math.max(0,parseFloat(v)||0);aud("Set price of "+p.name+" to "+p.price);save()}
function addProd(){var n=val("np").trim(),pr=parseFloat(val("npr")),s=parseInt(val("ns")),zs=val("nz").split(",").map(x=>x.trim()).filter(Boolean);
 if(!n||isNaN(pr)||isNaN(s)){info("Fill in name, price and stock.");return}
 var p={id:db.next++,name:n,price:pr,stock:s,cat:val("nc"),img:(val("nim")||"").trim()||"images/placeholder.svg"};
 if(zs.length){p.sizes={};zs.forEach(z=>p.sizes[z]=s);sync(p)}
 db.products.push(p);aud("Added product "+n);save();render()}
function delProd(id){ask("Remove this product?",function(){aud("Removed product "+prod(id).name);Object.keys(cart).forEach(k=>{if(String(k).split("|")[0]==id)delete cart[k]});db.products=db.products.filter(p=>p.id!=id);save();render()})}
function resetData(){ask("Reset all products, orders and notifications to sample data?",function(){db=JSON.parse(JSON.stringify(seed));cart={};save();render()})}

/* ---------- Announcement, settings and baselines ---------- */

function setAnn(){db.ann=val("an2").trim();aud("Posted an announcement");save();render()}
function clearAnn(){db.ann="";aud("Cleared the announcement");save();render()}
function setHrs(v){db.cfg.hours=Math.max(1,parseInt(v)||24);aud("Set unpaid-order release to "+db.cfg.hours+" hours");save();render()}
function logBase(){var m=parseFloat(val("bm"));if(isNaN(m)||m<=0){info("Enter the time in minutes.");return}db.base.push({type:val("bt"),min:m,t:Date.now()});aud("Logged a "+val("bt")+" counter time of "+m+" min");save();render()}

/* ---------- Staff accounts and login ---------- */

function addStaff(){var n=val("sn").trim(),u=val("su").trim().toLowerCase(),p=val("sp");if(!n||!u||p.length<4){info("Enter a name, a username, and a password of at least 4 characters.");return}if(db.staff.some(x=>x.u==u)){info("That username is taken.");return}db.staff.push({u:u,p:p,name:n,r:val("sr")});aud("Created "+val("sr")+" account "+u);save();render()}
function delStaff(u){ask("Remove account "+u+"?",function(){db.staff=db.staff.filter(x=>x.u!=u);aud("Removed account "+u);save();render()})}
function doLogin(){var u=db.staff.find(x=>x.u==lu.trim().toLowerCase()&&x.p===lp);if(u){cur=u;role="admin";lerr="";aud("Signed in to the "+PAGE+" site");save();tab=PAGE=="admin"?"ainv":"pos"}else lerr="Wrong username or password.";render()}
function doLogout(){cur=null;role="student";tab=PAGE=="admin"?"ainv":(PAGE=="cashier"?"pos":"shop");render()}
function toggleRole(){if(PAGE=="shop"){location.href="cashier.html";return}doLogout()}

/* ---------- Student account ---------- */

function signIn(){var id=af.i.trim(),nm=af.n.trim(),pn=af.p;if(!id){
   info("Enter your student ID.");return}if(!/^\d{4}$/.test(pn)){
      info("Your PIN must be 4 digits.");return}var u=db.users[id];if(u){
         if(u.pin!==pn){info("Wrong PIN for this student ID.");
            return}}
            else{
               if(!nm){info("Enter your full name to create your account.");
                  return}if(!af.c){info("Please agree to the privacy notice to create an account.");
                     return}u=db.users[id]={name:nm,pin:pn,consent:Date.now()}}af={i:"",n:"",p:"",c:false};
                     db.me={sid:id,name:u.name,in:true};save();note="Signed in as "+u.name+".";tab="shop";
                     render()}

function signOut(){db.me={sid:"",name:"",in:false};
save();
tab="shop";
render()}

function delMe(){ask("Delete your account and personal data? Your past orders stay in the sales records without your name or ID.",function(){var s=db.me.sid;delete db.users[s];db.notifs=db.notifs.filter(n=>n.sid!=s);db.watch=db.watch.filter(w=>w.sid!=s);db.sus=db.sus.filter(x=>x.sid!=s);db.orders.forEach(o=>{if(o.sid==s){o.sid="deleted";o.name="Deleted student";o.receipt=""}});db.me={sid:"",name:"",in:false};save();tab="shop";note="Your account and personal data were deleted.";render()})}
function sendSus(){for(var i=0;i<10;i++)if(!susA[i]){info("Answer question "+(i+1)+" before sending.");return}var sum=0;susA.forEach((v,i)=>{sum+=(i%2==0?v-1:5-v)});db.sus.push({sid:db.me.sid,score:sum*2.5,t:Date.now(),a:susA.slice()});susA=[];save();note="Thank you. Your survey answers were sent.";tab="my";render()}

/* ---------- View state ---------- */

function setF(f){flt=f;render()}
function tg(id){shown=shown==id?0:id;render()}
