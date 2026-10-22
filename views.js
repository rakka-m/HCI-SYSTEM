/* PLMun Business Center — views
   HTML templates, screens, dialogs and the render loop. */

/* ---------- Formatting and DOM helpers ---------- */

function esc(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function money(n){return "₱"+n.toFixed(2)}
function ft(t){return new Date(t).toLocaleString()}
function val(i){return document.getElementById(i).value}
function go(t){tab=t;render()}
function stag(s){var c=s=="Pending"?"low":(s=="Rejected"||s=="Cancelled")?"out":(s=="Ready"||s=="Claimed")?"good":"";return '<span class="tag '+c+'">'+s+'</span>'}
function tag(p){return p.stock==0?'<span class="tag out">Sold out</span>':p.stock<=lim(p)?'<span class="tag low">Low: '+p.stock+'</span>':'<span class="mu">'+p.stock+' in stock</span>'}
function items(o){return o.items.map(x=>x.qty+"× "+esc(x.name)).join(", ")}

/* Product thumbnails. The seeded paths end in .png; if that file is missing
   the same name with .jpg is tried, then a neutral placeholder tile. */
function fixImg(el){
  var s=el.getAttribute("src")||"";
  if(/\.png$/i.test(s)){el.src=s.replace(/\.png$/i,".jpg");return}
  el.src="images/placeholder.svg";
}
function pic(p,sm,alt){return '<img class="thumb'+(sm?" sm":"")+'" src="'+esc(p.img||"images/placeholder.svg")+'" alt="'+esc(alt||p.name)+'" loading="lazy" decoding="async" onerror="fixImg(this)">'}
function itemPics(o){return '<div class="ithumbs">'+o.items.map(x=>{var p=prod(x.id);return p?pic(p,1,x.name):""}).join("")+'</div>'}

/* ---------- Dialogs ---------- */

function ask(m,fn){dlg={type:"c",msg:m,fn:fn};render()}
function info(m){dlg={type:"i",msg:m};render()}
function runDlg(){var f=dlg.fn;dlg=null;if(f)f();else render()}
function closeDlg(shop){dlg=null;if(shop)q="";tab="shop";render();window.scrollTo(0,0)}
function showRcp(id){dlg={type:"rcp",id:id};render()}
function saveOrderNumber(id){
  var ro=db.orders.find(x=>x.id==id);
  if(!ro)return;
  var text="PLMun Business Center - Order #"+ro.id+" | Total: ₱"+ro.total.toFixed(2)+" | Status: "+ro.status+" | Student: "+ro.name+" ("+ro.sid+")";
  try{
    navigator.clipboard.writeText(text);
    var btn=document.getElementById("saveOrderBtn");
    if(btn)btn.textContent="✓ Saved to Clipboard!";
  }catch(e){
    info("Order #"+ro.id+" details could not be copied automatically.");
  }
}
function showCsv(){var e=s=>'"'+String(s==null?"":s).replace(/"/g,'""')+'"',lt=(o,s)=>{var x=(o.log||[]).find(l=>l.s==s);return x?new Date(x.t).toISOString():""};
 var rows=[["Order","Channel","Student ID","Name","Items","Total","Payment","Reference","Pickup slot","Status","Placed","Verified","Ready","Claimed"]].concat(db.orders.map(o=>[o.id,o.channel||"Online",o.sid,o.name,o.items.map(x=>x.qty+" x "+x.name).join("; "),o.total.toFixed(2),o.method,o.ref,o.slot||"",o.status,new Date(o.created).toISOString(),lt(o,"Verified"),lt(o,"Ready"),lt(o,"Claimed")]));
 dlg={type:"csv",txt:rows.map(r=>r.map(e).join(",")).join("\n")};render()}
function copyCsv(){var t=document.getElementById("csv");t.select();try{navigator.clipboard.writeText(t.value)}catch(e){try{document.execCommand("copy")}catch(e2){}}document.getElementById("cpb").textContent="Copied"}
function vDlg(){if(!dlg)return"";var b;
 if(dlg.type=="thanks")b='<h2>Thank you for your purchase!</h2><p class="mu" style="font-size:15px;margin:0">'+esc(dlg.msg)+'</p><div class="perf"></div><div class="stubrow"><span class="mu">Order number</span><b class="no">'+dlg.id+'</b></div><div class="f"><button class="pb sec" id="saveOrderBtn" onclick="saveOrderNumber('+dlg.id+')">💾 Save order number</button></div><div class="f"><button class="pb" onclick="closeDlg(1)">Shop again</button><button class="pb sec" onclick="closeDlg(0)">Back to home</button></div>';
 else if(dlg.type=="rcp"){var ro=db.orders.find(x=>x.id==dlg.id);b=vRcp(ro)+'<div class="f nop"><button class="pb" onclick="try{window.print()}catch(e){}">Print</button><button class="pb sec" onclick="dlg=null;render()">Close</button></div>'}
 else if(dlg.type=="posrcp"){var po=db.orders.find(x=>x.id==dlg.id);b=vPosRcp(po)+'<div class="f nop"><button class="pb" onclick="try{window.print()}catch(e){}">Print receipt</button><button class="pb sec" onclick="dlg=null;render()">New sale</button></div>'}
 else if(dlg.type=="csv")b='<h2 style="font-size:26px">Order export</h2><div class="mu">Copy this, then paste it into Excel or Google Sheets, or save it as a .csv file.</div><textarea id="csv" readonly rows="8">'+esc(dlg.txt)+'</textarea><div class="f"><button class="pb" id="cpb" onclick="copyCsv()">Copy to clipboard</button><button class="pb sec" onclick="dlg=null;render()">Close</button></div>';
 else if(dlg.type=="i")b=
'<div>'+esc(dlg.msg)+'</div><div class="f"><button class="pb" onclick="runDlg()">OK</button></div>';
 else b='<div>'+esc(dlg.msg)+'</div><div class="f"><button class="pb sec" onclick="dlg=null;render()">No</button><button class="pb" onclick="runDlg()">Yes</button></div>';
 return '<div class="ov"><div class="card dl">'+b+'</div></div>'}

/* ---------- Shop ---------- */

function shopTag(p){var a=p.stock-Object.keys(cart).reduce((t,k)=>t+(kp(k).p.id==p.id?cart[k]:0),0);return a<=0?'<span class="tag out">Sold out</span>':a<=lim(p)?'<span class="tag low">Low: '+a+'</span>':'<span class="mu">'+a+' in stock</span>'}
function szSel(p){if(!p.sizes)return"";var c=pk(p);return '<select class="szs" aria-label="Size" onchange="pick['+p.id+']=this.value;render()">'+Object.keys(p.sizes).map(z=>'<option value="'+z+'"'+(z==c?" selected":"")+(av(p,z)<=0?" disabled":"")+'>Size '+z+(av(p,z)<=0?" (none left)":" ("+av(p,z)+" left)")+'</option>').join("")+'</select>'}
function vBundles(){var L=bl();if(!L.length)return"";return '<h2 class="sh">Bundles</h2><div class="items">'+L.map(b=>{var zs=bsizes(b),sz=bpick[b.id]||zs[0]||"",b0=prod(b.items[0]);return '<div class="item">'+(b0?pic(b0,1,b.name):"")+'<div class="ibody"><div class="ihead"><h3>'+esc(b.name)+'</h3><span class="price">'+money(bprice(b))+'</span></div><div class="mu">'+b.items.map(i=>esc(prod(i).name)).join(", ")+'. Save '+money(b.discount)+'.</div>'+(zs.length?'<select class="szs" aria-label="Bundle size" onchange="bpick[\''+b.id+'\']=this.value;render()">'+zs.map(z=>'<option value="'+z+'"'+(z==sz?" selected":"")+'>Size '+z+'</option>').join("")+'</select>':'')+'</div><div class="btns"><button class="pb" '+(bok(b,sz)?"":"disabled")+' onclick="addBundle(\''+b.id+'\')">Add bundle to cart</button></div></div>'}).join("")+'</div>'}
function vShop(){var h="";if(note){h+='<div class="msg">'+esc(note)+'</div>';note=""}
 if(db.ann)h+='<div class="msg"><b>Announcement:</b> '+esc(db.ann)+'</div>';
 h+='<input id="sq" class="srch" placeholder="Search the catalog" value="'+esc(q)+'" oninput="q=this.value;render();var e=document.getElementById(\'sq\');e.focus();e.setSelectionRange(q.length,q.length)">';
 if(!q)h+=vBundles();
 var l=db.products.filter(p=>p.name.toLowerCase().indexOf(q.toLowerCase())>-1),cats=[];
 l.forEach(p=>{if(cats.indexOf(p.cat)<0)cats.push(p.cat)});
 if(!l.length)return h+'<p class="empty">Nothing matches &ldquo;'+esc(q)+'&rdquo;. Try a shorter word, like polo or manual.</p>';
 cats.forEach(c=>{h+='<h2 class="sh">'+esc(c)+'</h2><div class="items">'+l.filter(p=>p.cat==c).map(p=>'<div class="item">'+pic(p)+'<div class="ibody"><div class="ihead"><h3>'+esc(p.name)+'</h3><span class="price">'+money(p.price)+'</span></div>'+shopTag(p)+szSel(p)+'</div><div class="btns"><button class="pb" '+(stk(p,pk(p))<=0?"disabled":"")+' onclick="buy('+p.id+')">Buy now</button><button class="pb sec" '+(stk(p,pk(p))-(cart[ky(p.id,pk(p))]||0)<=0?"disabled":"")+' onclick="add('+p.id+')">Add to cart</button>'+(stk(p,pk(p))<=0?'<button class="pb sec" onclick="notifyMe('+p.id+')">Notify me</button>':'')+'</div></div>').join("")+'</div>'});
 return h}

/* ---------- Cart ---------- */

function vCart(){var ids=Object.keys(cart);
 if(!ids.length)return '<p class="mu">Nothing in your cart yet.</p><button class="pb" onclick="go(\'shop\')">Browse the catalog</button>';
 var me=db.me;
 return '<div class="cols"><div class="card">'+ids.map(k=>{var o=kp(k),p=o.p;return '<div class="row">'+pic(p,1)+'<div style="flex:1;min-width:0"><b>'+esc(p.name)+(o.sz?' (size '+o.sz+')':'')+'</b><div class="mu">'+money(p.price)+' each</div></div><div class="q"><button onclick="chg(\''+k+'\',-1)">−</button> '+cart[k]+' <button onclick="chg(\''+k+'\',1)">+</button></div></div>'}).join("")+(disc()?'<div class="row"><span>Bundle discount</span><b>−'+money(disc())+'</b></div>':'')+'<div class="row"><b>Total</b><b>'+money(total())+'</b></div></div>'
 +'<div class="card"><b>Payment method</b><div class="mu">'+(pay=="Cash"?"Pay in cash at the Business Center counter when you pick up your order.":"Send the total to the Business Center GCash/Maya account (0917 000 0000), then enter the reference number and upload your receipt screenshot.")+'</div>'
 +(me.in?'<div class="mu" style="margin-top:8px">Ordering as <b>'+esc(me.name)+'</b>, ID '+esc(me.sid)+'</div>':'<button class="pb sec" style="margin-top:8px" onclick="go(\'acct\')">Sign in to order</button>')
 +'<select onchange="pay=this.value;render()"><option value="GCash"'+(pay=="GCash"?" selected":"")+'>GCash</option><option value="Maya"'+(pay=="Maya"?" selected":"")+'>Maya</option><option value="Cash"'+(pay=="Cash"?" selected":"")+'>Pay at counter (cash)</option></select>'
 +'<select onchange="slot=this.value"><option value="">Choose a pickup time</option>'+slots().map(s=>'<option value="'+s+'"'+(used(s)>=CAP?" disabled":"")+(slot==s?" selected":"")+'>'+s+(used(s)>=CAP?" (full)":" ("+(CAP-used(s))+" left)")+'</option>').join("")+'</select>'
 +(pay=="Cash"?'':'<input placeholder="Payment reference number" value="'+esc(ref)+'" oninput="ref=this.value"><input type="file" accept="image/*" onchange="pickFile(this)">')
 +(rcpt&&pay!="Cash"?'<div class="mu">Receipt attached ✓</div><img class="rc" src="'+rcpt+'" alt="Receipt preview">':'')
 +'<div class="f"><button class="pb" onclick="checkout()">Submit order</button></div><div class="f"><button class="pb sec" onclick="go(\'shop\')">Keep shopping</button><button class="pb sec" onclick="clearCart()">Clear cart</button></div></div></div>'}

/* ---------- Pickup slots ---------- */

function slots(){var o=[],h=new Date().getHours();["Today","Tomorrow"].forEach((d,i)=>SL.forEach(s=>{if(i==1||s[0]>h)o.push(d+", "+s[1])}));return o}

/* ---------- Student screens ---------- */

function vMy(){var me=db.me,h="";if(note){h+='<div class="msg">'+esc(note)+'</div>';note=""}
 if(!me.in)return h+'<div class="card one"><b>Track your orders</b><div class="mu">Sign in with your student ID to see your orders, pickup codes and notifications.</div><div class="f"><button class="pb" onclick="go(\'acct\')">Sign in</button></div></div>';
 var ns=db.notifs.filter(n=>n.sid==me.sid).slice(0,6),os=db.orders.filter(o=>o.sid==me.sid),done=db.sus.some(x=>x.sid==me.sid);
 h+='<div class="card one"><b>Notifications</b>'+(ns.length?ns.map(n=>'<div class="nt">'+esc(n.msg)+'<div class="mu">'+ft(n.t)+'</div></div>').join(""):'<div class="mu">No notifications yet.</div>')+'</div>';
 if(os.length&&!done)h+='<div class="card one"><b>Rate the system</b><div class="mu">Ten short questions, about two minutes.</div><div class="f"><button class="pb sec" onclick="go(\'sus\')">Take the survey</button></div></div>';
 return h+'<div class="ogrid">'+(os.length?os.map(o=>'<div class="card tk s'+o.status+'"><div class="row" style="border:0;padding:0"><b>Order #'+o.id+'</b>'+stag(o.status)+'</div><div class="mu">'+ft(o.created)+', '+o.method+(o.ref?' ref '+esc(o.ref):'')+'</div><div class="mu">Pickup: '+esc(o.slot||"any time")+'</div><div>'+items(o)+'</div><b>'+money(o.total)+'</b>'+(o.status=="Ready"?'<div class="pk"><div><div class="mu">Pickup code</div><b class="no">'+o.code+'</b></div><div class="qr" data-q="PLMUN-'+o.id+'-'+o.code+'"></div></div>':'')+'<div class="f"><button class="pb sec" onclick="reorder('+o.id+')">Order again</button><button class="pb sec" onclick="showRcp('+o.id+')">Receipt slip</button>'+(o.status=="Pending"?'<button class="pb sec" onclick="cancelMine('+o.id+')">Cancel order</button>':'')+'</div></div>').join(""):'<p class="mu">No orders yet.</p>')+'</div>'}
function vRcp(o){var d=o.discount||0,r=(a,b)=>'<div class="rl"><span>'+a+'</span><span>'+b+'</span></div>';return '<div class="rcp"><h2>PLMun Business Center</h2><div class="mu">Order slip</div><div class="perf"></div>'+r("Order","<b>#"+o.id+"</b>")+r("Date",ft(o.created))+r("Student",esc(o.name)+", "+esc(o.sid))+'<div class="perf"></div>'+o.items.map(x=>r(x.qty+" x "+esc(x.name),money(x.qty*x.price))).join("")+(d?r("Bundle discount","−"+money(d)):'')+r("<b>Total</b>","<b>"+money(o.total)+"</b>")+'<div class="perf"></div>'+r("Payment",o.method+(o.ref?", ref "+esc(o.ref):""))+r("Pickup",esc(o.slot||"any time"))+r("Status",o.status)+(o.status=="Ready"?r("Pickup code","<b>"+o.code+"</b>"):"")+'</div>'}
function vAcct(){var me=db.me;if(me.in)return '<div class="card one"><b>'+esc(me.name)+'</b><div class="mu">Student ID '+esc(me.sid)+'</div><div class="f"><button class="pb sec" onclick="signOut()">Sign out</button></div></div><div class="card one"><b>Your data</b><div class="mu">You can delete your account and personal data at any time. Past orders stay in the sales records without your name or ID.</div><div class="f"><button class="pb sec" onclick="delMe()">Delete my account and data</button></div></div>';

 return '<div class="card one"><b>Student sign in</b><div class="mu">Use your student ID. New here? Enter your name and choose a 4-digit PIN to create your account.</div><input placeholder="Student ID" inputmode="numeric" value="'+esc(af.i)+'" oninput="af.i=this.value"><input placeholder="Full name (new accounts only)" value="'+esc(af.n)+'" oninput="af.n=this.value"><input type="password" inputmode="numeric" maxlength="4" placeholder="4-digit PIN" value="'+esc(af.p)+'" oninput="af.p=this.value"><label class="chk"><input type="checkbox" onchange="af.c=this.checked"'+(af.c?" checked":"")+'><span>I agree to the privacy notice below (needed for new accounts).</span></label><div class="mu" style="margin-top:8px">We collect your student ID, name, orders and survey answers to run the PLMun Business Center ordering system and for this research study. They are used only for these purposes and kept confidential. You may ask for them to be deleted at any time under the Data Privacy Act of 2012 (RA 10173).</div><div class="f"><button class="pb" onclick="signIn()">Sign in</button></div></div>'}

function sa(i,v){susA[i]=v;render()}
function vSus(){var h='<div class="card one"><h2 style="font-size:26px;margin:0">Usability survey</h2><div class="mu">Rate each statement from 1 (strongly disagree) to 5 (strongly agree).</div></div>';
 SQ.forEach((t,i)=>{h+='<div class="card one"><div>'+(i+1)+'. '+esc(t)+'</div><div class="f sc">'+[1,2,3,4,5].map(n=>'<button class="tag'+(susA[i]==n?' on':'')+'" onclick="sa('+i+','+n+')">'+n+'</button>').join("")+'</div></div>'});
 return h+'<div class="one"><div class="f"><button class="pb" onclick="sendSus()">Send survey</button></div><div class="f"><button class="pb sec" onclick="go(\'my\')">Back to my orders</button></div></div>'}
function vLogin(){var t=PAGE=="admin"?"Inventory and report sign in":"Cashier sign in";return '<div class="card one"><b>'+t+'</b><div class="mu">Demo accounts: <b>staff1</b> or <b>staff2</b> with password <b>1234</b>, and <b>admin</b> with password <b>admin123</b> (manager, can also open the Activity tab).</div><input placeholder="Username" value="'+esc(lu)+'" oninput="lu=this.value"><input type="password" placeholder="Password" value="'+esc(lp)+'" oninput="lp=this.value">'+(lerr?'<div class="mu" style="color:var(--er);margin-top:8px">'+esc(lerr)+'</div>':'')+'<div class="f"><button class="pb" onclick="doLogin()">Log in</button></div><div class="f"><a class="pb sec" style="display:flex;align-items:center;justify-content:center;text-decoration:none" href="index.html">Back to the shop site</a></div></div>'}

/* ---------- POS screens ---------- */

function posRerender(id){render();var e=document.getElementById(id);if(e){e.focus();try{e.setSelectionRange(e.value.length,e.value.length)}catch(x){}}}

function posTile(p){
  var left=stk(p,pk(p))-posIn(p.id);
  return '<div class="ptile'+(left<=0?" off":"")+'"'+(left>0?' onclick="posAdd('+p.id+')" role="button" tabindex="0"':'')+'>'
    +pic(p,1)
    +'<b class="pname">'+esc(p.name)+'</b>'
    +'<span class="pprice">'+money(p.price)+'</span>'
    +'<span class="mu">'+(left<=0?"Out of stock":left+" left")+'</span>'
    +(p.sizes?'<select class="szs" onclick="event.stopPropagation()" onchange="pick['+p.id+']=this.value;render()">'+Object.keys(p.sizes).map(z=>'<option value="'+z+'"'+(z==pk(p)?" selected":"")+(stk(p,z)<=0?" disabled":"")+'>'+z+(stk(p,z)<=0?" (none)":"")+'</option>').join("")+'</select>':'')
    +'</div>'
}

function posRow(k){
  var o=kp(k),p=o.p;if(!p)return"";
  return '<div class="row"><div style="flex:1;min-width:0"><b>'+esc(p.name)+(o.sz?' ('+o.sz+')':'')+'</b><div class="mu">'+money(p.price)+' each</div></div><div class="q"><button onclick="posChg(\''+k+'\',-1)" aria-label="Remove one">−</button> '+posCart[k]+' <button onclick="posChg(\''+k+'\',1)" aria-label="Add one">+</button></div></div>'
}

function vPos(){
  var ks=Object.keys(posCart),tot=posTotal();
  var list=db.products.filter(p=>p.name.toLowerCase().indexOf(posSearch.toLowerCase())>-1),cats=[];
  list.forEach(p=>{if(cats.indexOf(p.cat)<0)cats.push(p.cat)});
  var h='<div class="posbar"><div><span class="mu">Taken at the counter today</span><b>'+money(posToday())+'</b></div><div class="mu">Cashier: '+esc(cur?cur.name:"—")+'</div></div>';
  h+='<input id="pq" class="srch" placeholder="Search a product to add to the sale" value="'+esc(posSearch)+'" oninput="posSearch=this.value;posRerender(\'pq\')">';
  h+='<div class="cols wide"><div class="card"><b>Products</b>';
  if(!list.length)h+='<p class="mu">No product matches that search.</p>';
  cats.forEach(c=>{h+='<h3 class="poscat">'+esc(c)+'</h3><div class="ptiles">'+list.filter(p=>p.cat==c).map(posTile).join("")+'</div>'});
  h+='</div><div class="card poscart">';
  h+='<div class="row"><b>Current sale</b><span class="tag">'+posCount()+' item'+(posCount()==1?"":"s")+'</span></div>';
  h+=ks.length?ks.map(posRow).join(""):'<p class="mu">Tap a product on the left to start a sale. No student account or pickup slot is needed here.</p>';
  h+='<div class="row"><b>Total</b><b>'+money(tot)+'</b></div>';
  h+='<select aria-label="Payment method" onchange="posPay=this.value;render()"><option'+(posPay=="Cash"?" selected":"")+'>Cash</option><option'+(posPay=="GCash"?" selected":"")+'>GCash</option><option'+(posPay=="Maya"?" selected":"")+'>Maya</option></select>';
  if(posPay=="Cash"){
    h+='<input id="pcash" type="number" min="0" step="0.01" inputmode="decimal" placeholder="Cash received" value="'+esc(posCash)+'" oninput="posCash=this.value;posRerender(\'pcash\')">';
    if(tot>0)h+='<div class="cashq">'+[tot,50,100,200,500,1000].filter((n,i,a)=>a.indexOf(n)==i).map((n,i)=>'<button class="tag" onclick="posCash=\''+n+'\';render()">'+(i==0?"Exact "+money(n):money(n))+'</button>').join("")+'</div>';
    if(posCashNum()>0)h+='<div class="row"><span>Change</span><b class="'+(posChange()<0?"out":"good")+'">'+money(Math.max(0,posChange()))+'</b></div>';
  }else{
    h+='<input id="pref" placeholder="E-wallet reference number" value="'+esc(posRef)+'" oninput="posRef=this.value;posRerender(\'pref\')">';
    h+='<div class="mu">Ask the buyer to show the GCash/Maya confirmation, then type its reference number here.</div>';
  }
  h+='<div class="f"><button class="pb" onclick="posComplete()">Complete sale</button></div>';
  h+='<div class="f"><button class="pb sec" onclick="posClear()">Clear sale</button></div>';
  h+='</div></div>';
  return h
}

function vPosRcp(o){
  if(!o)return"";
  var r=(a,b)=>'<div class="rl"><span>'+a+'</span><span>'+b+'</span></div>';
  return '<div class="rcp"><h2>PLMun Business Center</h2><div class="mu">Counter receipt · walk-in sale</div><div class="perf"></div>'
    +r("Sale","<b>#"+o.id+"</b>")+r("Date",ft(o.created))+r("Cashier",esc(cur?cur.name:"Staff"))
    +'<div class="perf"></div>'
    +o.items.map(x=>r(x.qty+" x "+esc(x.name),money(x.qty*x.price))).join("")
    +r("<b>Total</b>","<b>"+money(o.total)+"</b>")
    +r("Payment",o.method+(o.ref?", ref "+esc(o.ref):""))
    +(o.method=="Cash"?r("Cash received",money(o.cash||0))+r("<b>Change</b>","<b>"+money(o.change||0)+"</b>"):"")
    +'<div class="perf"></div><div class="mu">Thank you. Keep this receipt for your records.</div></div>'
}

/* ---------- Staff screens ---------- */

function acts(o){var b="",s=o.status;
 if(s=="Pending")b='<button class="pb" onclick="setStatus('+o.id+',\'Verified\')">'+(o.ref?"Verify payment":"Confirm cash received")+'</button><button class="pb dg" onclick="setStatus('+o.id+',\'Rejected\')">Reject</button>';
 if(s=="Verified")b='<button class="pb" onclick="setStatus('+o.id+',\'Ready\')">Mark ready for pickup</button>';
 if(s=="Ready")b='<input id="pc'+o.id+'" inputmode="numeric" placeholder="Pickup code from student"><button class="pb" onclick="claim('+o.id+')">Mark claimed</button>';
 return b}
function vOrd(){var h=lowBanner()+'<div class="f" style="margin:0 0 10px">'+["All","Pending","Verified","Ready","Claimed","Rejected","Cancelled"].map(s=>'<button class="tag" style="'+(s==flt?"background:var(--ac);color:var(--ac2)":"")+'" onclick="setF(\''+s+'\')">'+s+'</button>').join("")+'</div>';
 var l=db.orders.filter(o=>flt=="All"||o.status==flt);
 return h+'<div class="ogrid">'+(l.length?l.map(o=>'<div class="card tk s'+o.status+'"><div class="row" style="border:0;padding:0"><b>#'+o.id+', '+esc(o.name)+'</b><span>'+(o.channel=="POS"?'<span class="tag">POS</span> ':'')+stag(o.status)+'</span></div><div class="mu">'+esc(o.sid)+', '+ft(o.created)+'</div><div class="mu">Pickup: '+esc(o.slot||"any time")+'</div>'+dupTag(o)+itemPics(o)+'<div>'+items(o)+'</div><b>'+money(o.total)+'</b><div class="mu">'+o.method+(o.ref?' ref: '+esc(o.ref):' (collect payment at counter)')+'</div><div class="f">'+(o.receipt?'<button class="pb sec" onclick="tg('+o.id+')">'+(shown==o.id?"Hide":"View")+' receipt</button>':'')+acts(o)+'</div>'+(shown==o.id&&o.receipt?'<img class="rc" src="'+o.receipt+'" alt="Payment receipt">':'')+'</div>').join(""):'<p class="mu">No orders in this view.</p>')+'</div>'}
function vInv(){return '<div class="cols wide"><div class="card">'+db.products.map(p=>'<div class="invp"><div class="row inv">'+pic(p,1)+'<div style="flex:1;min-width:150px"><b>'+esc(p.name)+'</b> '+tag(p)+'</div>'+(p.sizes?'':'<input class="sm" type="number" min="0" value="'+p.stock+'" onchange="setStock('+p.id+',\'\',this.value)" aria-label="Stock">')+'<input class="sm" type="number" step="0.01" value="'+p.price+'" onchange="setPrice('+p.id+',this.value)" aria-label="Price"><button class="tag" onclick="restock('+p.id+')">+10</button><button class="x" onclick="delProd('+p.id+')" aria-label="Remove product">✕</button></div>'+(p.sizes?'<div class="szrow">'+Object.keys(p.sizes).map(z=>'<label>'+z+'<input class="sm" type="number" min="0" value="'+p.sizes[z]+'" onchange="setStock('+p.id+',\''+z+'\',this.value)"></label>').join("")+'</div>':'')+'<div class="mu" style="padding-bottom:10px">Alert at or below<input type="number" min="0" value="'+lim(p)+'" onchange="setMin('+p.id+',this.value)" aria-label="Alert level"></div></div>').join("")+'</div><div class="card"><b>Add product</b><input id="np" placeholder="Name"><select id="nc"><option>Uniforms</option><option>Academic</option><option>Merchandise</option></select><div class="f"><input id="npr" type="number" step="0.01" placeholder="Price"><input id="ns" type="number" placeholder="Stock (each size)"></div><input id="nz" placeholder="Sizes, like S,M,L,XL (optional)"><input id="nim" placeholder="Image path (optional)"><div class="f"><button class="pb" onclick="addProd()">Add</button></div></div></div><div class="card one"><b>Shop announcement</b><input id="an2" placeholder="Example: uniform restock on Monday" value="'+esc(db.ann)+'"><div class="f"><button class="pb" onclick="setAnn()">Post</button><button class="pb sec" onclick="clearAnn()">Clear</button></div></div><p class="mu">Stock is held when an order is placed and returned if it is rejected or cancelled. +10 adds ten to every size.</p><button class="pb sec" onclick="resetData()">Reset to sample data</button>'}
function lowBanner(){var l=db.products.filter(p=>p.stock<=lim(p));if(!l.length)return"";return '<div class="msg">Restock needed: '+l.map(p=>esc(p.name)+(p.stock?" ("+p.stock+" left)":" (sold out)")).join(", ")+'. <button class="tag" onclick="go(\'ainv\')">Open inventory</button></div>'}
function vBase(){var m=db.base.filter(x=>x.type=="manual"),s=db.base.filter(x=>x.type=="system"),mean=a=>a.reduce((t,x)=>t+x.min,0)/a.length,cmp="Log at least one of each to compare.";
 if(m.length&&s.length){var d=(mean(m)-mean(s))/mean(m)*100;cmp=d>=0?"The system is "+d.toFixed(0)+"% faster than the manual counter.":"The system is "+Math.abs(d).toFixed(0)+"% slower than the manual counter."}
 return '<div class="card"><b>Counter time baseline</b><div class="mu">Time a real transaction at the counter and log it here, once the old manual way and once with this system.</div><div class="row"><span>Manual counter ('+m.length+' logged)</span><b>'+(m.length?mean(m).toFixed(1)+" min":"None yet")+'</b></div><div class="row"><span>With the system ('+s.length+' logged)</span><b>'+(s.length?mean(s).toFixed(1)+" min":"None yet")+'</b></div><div class="mu">'+cmp+'</div><select id="bt"><option value="manual">Manual counter</option><option value="system">With the system</option></select><input id="bm" type="number" step="0.1" min="0" placeholder="Minutes, like 4.5"><div class="f"><button class="pb" onclick="logBase()">Log transaction</button></div></div>'}
function relCard(){return '<div class="card"><b>Unpaid cash orders</b><div class="mu">Cancel a cash order and return its stock if it is still unpaid after<input type="number" min="1" value="'+db.cfg.hours+'" onchange="setHrs(this.value)" aria-label="Hours">hours.</div></div>'}
function avgT(a,b){var d=[];db.orders.forEach(o=>{var l=o.log||[],x=l.find(e=>e.s==a),y=l.find(e=>e.s==b);if(x&&y&&y.t>=x.t)d.push(y.t-x.t)});return d.length?(d.reduce((p,c)=>p+c,0)/d.length/60000).toFixed(1)+" min":"No data yet"}
function vRep(){var paid=db.orders.filter(o=>["Verified","Ready","Claimed"].indexOf(o.status)>-1),sum=paid.reduce((a,o)=>a+o.total,0),m={};
 var posSales=db.orders.filter(o=>o.channel=="POS"),posSum=posSales.reduce((a,o)=>a+o.total,0),posN=posSales.length;
 paid.forEach(o=>o.items.forEach(x=>m[x.name]=(m[x.name]||0)+x.qty));
 var top=Object.keys(m).sort((a,b)=>m[b]-m[a]).slice(0,5),low=db.products.filter(p=>p.stock<=lim(p)),ss=db.sus,sc=ss.length?ss.reduce((a,x)=>a+x.score,0)/ss.length:0;
 return '<div class="st"><div class="card"><span class="mu">Total sales</span><b>'+money(sum)+'</b></div><div class="card"><span class="mu">Paid orders</span><b>'+paid.length+'</b></div><div class="card"><span class="mu">POS counter sales</span><b>'+money(posSum)+'</b><span class="mu">'+posN+' walk-in sale'+(posN==1?"":"s")+'</span></div><div class="card"><span class="mu">Awaiting verification</span><b>'+pend()+'</b></div><div class="card"><span class="mu">SUS score</span><b>'+(ss.length?sc.toFixed(1):"None yet")+'</b><span class="mu">'+ss.length+' responses'+(ss.length?(sc>=68?", above the 68 benchmark":", below the 68 benchmark"):"")+'</span></div></div>'
 +'<div class="card"><b>Average transaction times</b><div class="row"><span>Placed to verified</span><b>'+avgT("Pending","Verified")+'</b></div><div class="row"><span>Verified to ready</span><b>'+avgT("Verified","Ready")+'</b></div><div class="row"><span>Placed to claimed</span><b>'+avgT("Pending","Claimed")+'</b></div></div>'
 +'<div class="cols"><div class="card"><b>Top items sold</b>'+(top.length?top.map(n=>'<div class="row"><span>'+esc(n)+'</span><b>'+m[n]+'</b></div>').join(""):'<div class="mu">No sales yet.</div>')+'</div><div class="card"><b>Low stock</b>'+(low.length?low.map(p=>'<div class="row"><span>'+esc(p.name)+'</span>'+tag(p)+'</div>').join(""):'<div class="mu">All items are above their alert level.</div>')+'</div></div>'
 +vBase()+relCard()+'<div class="f"><button class="pb sec" onclick="showCsv()">Export orders (CSV)</button></div>'}
function vLog(){if(!cur||cur.r!="manager")return '<p class="empty">Only managers can see this page.</p>';
 return '<div class="cols"><div class="card"><b>Activity log</b>'+(db.audit.length?db.audit.slice(0,60).map(a=>'<div class="nt"><b>'+esc(a.who)+'</b> '+esc(a.act)+'<div class="mu">'+ft(a.t)+'</div></div>').join(""):'<div class="mu">Nothing recorded yet.</div>')+'</div><div class="card"><b>Staff accounts</b>'+db.staff.map(u=>'<div class="row"><div><b>'+esc(u.name)+'</b><div class="mu">'+esc(u.u)+', '+u.r+'</div></div>'+(u.u==cur.u?'':'<button class="x" onclick="delStaff(\''+u.u+'\')" aria-label="Remove account">✕</button>')+'</div>').join("")+'<input id="sn" placeholder="Full name"><input id="su" placeholder="Username"><input id="sp" type="password" placeholder="Password"><select id="sr"><option value="staff">Staff</option><option value="manager">Manager</option></select><div class="f"><button class="pb" onclick="addStaff()">Add account</button></div></div></div>'}

/* ---------- Render ---------- */

function drawQR(){document.querySelectorAll(".qr").forEach(e=>{e.innerHTML="";if(window.QRCode)new QRCode(e,{text:e.dataset.q,width:110,height:110})})}
function render(){
 var nav=document.getElementById("nav"),app=document.getElementById("app"),rl=document.getElementById("rl"),T=[];
 updateThemeButton();
 if(PAGE=="shop"){
  T=[["shop","Shop"],["cart","Cart"+(cartCount()?" ("+cartCount()+")":"")],["my","My Orders"],["acct",db.me.in?"Account":"Sign in"]];
  if(tab!="sus"&&T.every(t=>t[0]!=tab))tab="shop";
  rl.textContent="Staff login";rl.onclick=function(){location.href="cashier.html"};
 }else{
  if(!cur){
   nav.innerHTML="";rl.textContent="Staff sign in";rl.onclick=null;
   app.innerHTML=vLogin()+vDlg();drawQR();return;
  }
  if(PAGE=="cashier")T=[["pos","POS"],["aord","Orders"+(pend()?" ("+pend()+")":"")]];
  else T=[["ainv","Inventory"],["arep","Report"]].concat(cur.r=="manager"?[["alog","Activity"]]:[]);
  if(T.every(t=>t[0]!=tab))tab=T[0][0];
  rl.textContent="Sign out, "+cur.name.split(" ")[0];rl.onclick=doLogout;
 }
 nav.innerHTML=T.map(t=>'<button class="'+(t[0]==tab?"on":"")+'" onclick="go(\''+t[0]+'\')">'+t[1]+'</button>').join("");
 var v={shop:vShop,cart:vCart,my:vMy,acct:vAcct,sus:vSus,pos:vPos,aord:vOrd,ainv:vInv,arep:vRep,alog:vLog};
 app.innerHTML=(v[tab]||vShop)()+vDlg();drawQR()}
