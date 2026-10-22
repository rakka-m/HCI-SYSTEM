/* PLMun Business Center — data
   Sample catalog, fixed text, pickup slots and the in-memory app state. */

/* Storage key and the default staff PIN. */
var KEY="plmun_bc_v2",PIN="1234";

/* Which of the three sites is open: "shop", "cashier" or "admin".
   Each HTML file sets window.PAGE in an inline script before this file loads,
   so all three sites can share one store.js without showing each other's tabs. */
var PAGE=(typeof window!=="undefined"&&window.PAGE)||"shop";

/* Product photos live in the images/ folder. Save them under these names:
     uniform-polo.png, pe-shirt.png, lanyard.png,
     lab-manual.png, tote-bag.png, blue-book.png
   A missing file falls back to images/placeholder.svg, so the page looks
   finished even before the photos are added. A .jpg with the same name is
   picked up too (see fixImg() in views.js). */
var seed={
   products:[
      {id:1,
         name:"PLMun Uniform (Polo)",
         price:350,
         stock:30,
         cat:"Uniforms",
         sizes:{S:8,M:10,L:8,XL:4},
         img:"images/plmun_polo.jfif"},

      {id:2,
         name:"PE Shirt",
         price:280,
         tock:25,
         cat:"Uniforms",
         sizes:{S:6,M:9,L:7,XL:3},
         img:"images/plmun_pe.jfif"},
         
      {id:3,
         name:"Lanyard and ID Holder",
         price:80,
         stock:50,
         cat:"Merchandise",
         img:"images/plmun_idlace.webp"},

      {id:4,
         name:"Laboratory Manual",
         price:150,
         stock:15,
         cat:"Academic",
         img:"images/lab-manual.png"},
      
      {id:5,
         name:"PLMun Tote Bag",
         price:220,
         stock:4,
         cat:"Merchandise",
         img:"images/tote-bag.png"},
         
      {id:6,
         name:"Blue Book (Exam)",
         price:10,
         stock:100,
         cat:"Academic",
         img:"images/blue-book.png"}],
         orders:[],
         notifs:[],
         me:{sid:"",name:""},
         next:7,
         nextO:1001,ann:"",
         cfg:{hours:24},
         audit:[],
         base:[],
         watch:[],
         bundles:[{id:"b1",

            name:"Starter set",
            items:[1,2,3],
            discount:50}],
            staff:[{u:"admin",p:"admin123",
               
            name:"Business Center Manager",
            r:"manager"},

            {u:"staff1",
               p:"1234",
               name:"Staff One",
               r:"staff"},
               {u:"staff2",
                  p:"1234",
                  name:"Staff Two",
                  r:"staff"}]};

/* Notification text for each order status. */
var MSG={
   Verified:"Payment verified. Your order is being prepared.",
   Ready:"Ready for pickup at the Business Center. Bring your student ID.",
   Claimed:"Order claimed. Thank you!",
   Rejected:"Payment could not be verified. Check your reference number and reorder.",
   Cancelled:"Order cancelled."};

/* SUS usability survey statements. */
var SQ=["I think I would like to use this system frequently.",
   "I found the system unnecessarily complex.",
   "I thought the system was easy to use.",
   "I think I would need technical support to use this system.",
   "I found the various functions in this system well integrated.",
   "I thought there was too much inconsistency in this system.",
   "I imagine most people would learn to use this system very quickly.",
   "I found the system very cumbersome to use.",
   "I felt very confident using the system.",
   "I needed to learn a lot of things before I could get going with this system."];

/* Pickup slots (hour, label) and how many orders each slot can take. */
var SL=[
   [8,"8 to 9 AM"],
   [9,"9 to 10 AM"],
   [10,"10 to 11 AM"],
   [11,"11 AM to 12 PM"],
   [13,"1 to 2 PM"],
   [14,"2 to 3 PM"],
   [15,"3 to 4 PM"],
   [16,"4 to 5 PM"]],
   CAP=6;

/* Session, cart and UI state. Reset on page reload, same as before. */
var role="student",
    tab="shop",cart={},
    q="",
    note="",
    rcpt="",
    ref="",
    pay="GCash",
    flt="All",
    shown=0,
    slot="",
    pick={},
    susA=[],
    bpick={},
    af={i:"",n:"",p:"",c:false},
    cur=null;

/* POS (cashier terminal) state. Lives only while the cashier page is open. */
var posCart={},
    posPay="Cash",
    posCash="",
    posRef="",
    posSearch="";

/* Staff login form state. */
var lu="staff1",
    lp="1234",lerr="";

/* The open dialog, or null. */
var dlg=null;
