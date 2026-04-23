import { useState } from "react";

const CATALOG = {
  Paint: [
    { id: "p1",  name: "Level 1 Paint — Walls Only",        unit: "sqft", price: 1.19, desc: "Walls only, level 1 prep" },
    { id: "p2",  name: "Level 2 Paint — Walls + Trim",      unit: "sqft", price: 1.49, desc: "Walls and trim" },
    { id: "p3",  name: "Level 3 Paint — Walls/Trim/Doors",  unit: "sqft", price: 1.60, desc: "Walls, trim, doors, and cabinets" },
    { id: "p4",  name: "Ceiling Paint",                     unit: "sqft", price: 0.22, desc: "Per sq ft" },
    { id: "p5",  name: "Level 2 Prep",                      unit: "sqft", price: 0.21, desc: "2 hours per room" },
    { id: "p6",  name: "Level 3 Prep",                      unit: "sqft", price: 0.35, desc: "3 hours per room" },
    { id: "p7",  name: "Prime Paneling Before Paint",        unit: "sqft", price: 0.50, desc: "Per sq ft" },
    { id: "p8",  name: "Wall Repair Charge",                 unit: "each", price: 60,   desc: "Flat rate" },
    { id: "p9",  name: "Caulking",                           unit: "lnft", price: 0.52, desc: "Per linear foot" },
    { id: "p10", name: "Paint Kitchen Cabinets (In + Out)",  unit: "lnft", price: 21.42, desc: "Per linear foot" },
    { id: "p11", name: "Paint Cabinets Outside Only",        unit: "lnft", price: 16.00, desc: "Per linear foot" },
    { id: "p12", name: "Kilz Cabinets Prior to Paint",       unit: "lnft", price: 6.00,  desc: "Per linear foot" },
    { id: "p13", name: "Paint Tub",                          unit: "each", price: 60,   desc: "Flat rate" },
    { id: "p14", name: "Paint Surround",                     unit: "each", price: 60,   desc: "Flat rate" },
    { id: "p15", name: "Clean Walls Before Paint",           unit: "sqft", price: 0.20, desc: "Per sq ft" },
    { id: "p16", name: "Kilz Spot Spray Before Paint",       unit: "sqft", price: 0.20, desc: "Per sq ft" },
  ],
  Drywall: [
    { id: "d1", name: "Remove Sheetrock",          unit: "sqft", price: 0.40, desc: "Demo per sq ft" },
    { id: "d2", name: "Install + Finish Sheetrock", unit: "sqft", price: 1.20, desc: "Hang, mud, sand per sq ft" },
  ],
  Flooring: [
    { id: "f1",  name: "Lay LVP",                            unit: "sqft", price: 1.90, desc: "Install only" },
    { id: "f2",  name: "Replace Subfloor",                   unit: "sqft", price: 7.14, desc: "Per sq ft" },
    { id: "f3",  name: "Remove Carpet",                      unit: "sqft", price: 0.10, desc: "Per sq ft" },
    { id: "f4",  name: "Remove Staples",                     unit: "sqft", price: 0.30, desc: "Per sq ft" },
    { id: "f5",  name: "Remove Tack Strips",                 unit: "lnft", price: 1.00, desc: "Per linear foot" },
    { id: "f6",  name: "Paint Floor",                        unit: "sqft", price: 0.48, desc: "Per sq ft" },
    { id: "f7",  name: "Kilz Floors",                        unit: "sqft", price: 0.15, desc: "Per sq ft" },
    { id: "f8",  name: "Quarter Round",                      unit: "lnft", price: 0.60, desc: "Per linear foot" },
    { id: "f9",  name: "Install Trim",                       unit: "lnft", price: 1.00, desc: "Per linear foot" },
    { id: "f10", name: "Remove/Repair Joists + New Subfloor", unit: "sqft", price: 5.19, desc: "Full framing repair per sq ft" },
  ],
  Bathroom: [
    { id: "b1",  name: "Vanity Install",             unit: "each", price: 100, desc: "Flat rate" },
    { id: "b2",  name: "Caulk Tub",                  unit: "each", price: 20,  desc: "Flat rate" },
    { id: "b3",  name: "Install Toilet",             unit: "each", price: 75,  desc: "Flat rate" },
    { id: "b4",  name: "Swap Sink",                  unit: "each", price: 40,  desc: "Flat rate" },
    { id: "b5",  name: "Remove Toilet",              unit: "each", price: 37,  desc: "Flat rate" },
    { id: "b6",  name: "Install Toilet Paper Holder", unit: "each", price: 20, desc: "Flat rate" },
    { id: "b7",  name: "Replace Shower Surround",    unit: "each", price: 120, desc: "Flat rate" },
    { id: "b8",  name: "Install Toilet Seat",        unit: "each", price: 10,  desc: "Flat rate" },
    { id: "b9",  name: "Install Toilet Tank Top",    unit: "each", price: 10,  desc: "Flat rate" },
    { id: "b10", name: "Replace Shower Head",        unit: "each", price: 10,  desc: "Flat rate" },
    { id: "b11", name: "Replace Sink Stopper",       unit: "each", price: 10,  desc: "Flat rate" },
    { id: "b12", name: "Caulk Shower",               unit: "each", price: 15,  desc: "Flat rate" },
  ],
  Electrical: [
    { id: "e1",  name: "Replace Bulb",          unit: "each", price: 5,  desc: "Flat rate" },
    { id: "e2",  name: "Ceiling Fan Swap",      unit: "each", price: 60, desc: "Flat rate" },
    { id: "e3",  name: "Light Switch",          unit: "each", price: 15, desc: "Flat rate" },
    { id: "e4",  name: "Replace Fixture",       unit: "each", price: 25, desc: "Flat rate" },
    { id: "e5",  name: "Wire for New Fixture",  unit: "each", price: 25, desc: "Flat rate" },
    { id: "e6",  name: "Add Switch",            unit: "each", price: 30, desc: "Flat rate" },
    { id: "e7",  name: "Outlet Replacement",    unit: "each", price: 15, desc: "Flat rate" },
    { id: "e8",  name: "Outlet Cover",          unit: "each", price: 3,  desc: "Flat rate" },
    { id: "e9",  name: "Light Switch Cover",    unit: "each", price: 3,  desc: "Flat rate" },
    { id: "e10", name: "Install Smoke Detector", unit: "each", price: 20, desc: "Flat rate" },
  ],
  Doors: [
    { id: "dr1", name: "Install Bifold Doors",       unit: "each", price: 100, desc: "Flat rate" },
    { id: "dr2", name: "Frame New Door (small)",      unit: "each", price: 125, desc: "Flat rate" },
    { id: "dr3", name: "Install Door",                unit: "each", price: 35,  desc: "Flat rate" },
    { id: "dr4", name: "Install Door Handle",         unit: "each", price: 20,  desc: "Flat rate" },
    { id: "dr5", name: "Frame + Finish Door Opening", unit: "each", price: 140, desc: "Flat rate" },
  ],
  Windows: [
    { id: "w1", name: "Install Small Window (3 ft)", unit: "each", price: 100, desc: "Flat rate" },
    { id: "w2", name: "Install Blind",               unit: "each", price: 10,  desc: "Per blind" },
    { id: "w3", name: "Finish Window Unit Opening",  unit: "each", price: 100, desc: "Flat rate" },
    { id: "w4", name: "Install Curtain Rod",         unit: "each", price: 25,  desc: "Flat rate" },
  ],
  General: [
    { id: "g1",  name: "Frame New Closet (small 3x6)", unit: "each", price: 150, desc: "Flat rate" },
    { id: "g2",  name: "Install Closet Rod",            unit: "each", price: 20,  desc: "Flat rate" },
    { id: "g3",  name: "Install Closet Shelf",          unit: "lnft", price: 5,   desc: "Per linear foot" },
    { id: "g4",  name: "Install Insulation",            unit: "sqft", price: 1.25, desc: "Per sq ft" },
    { id: "g5",  name: "Install Mirror",                unit: "each", price: 25,  desc: "Flat rate" },
    { id: "g6",  name: "Remove Gas Line",               unit: "each", price: 20,  desc: "Flat rate" },
    { id: "g7",  name: "Cap Gas Line",                  unit: "each", price: 10,  desc: "Flat rate" },
    { id: "g8",  name: "Replace Dishwasher",            unit: "each", price: 150, desc: "Flat rate" },
    { id: "g9",  name: "Install Drip Pans",             unit: "each", price: 5,   desc: "Flat rate" },
    { id: "g10", name: "Install Burner Grate",          unit: "each", price: 5,   desc: "Flat rate" },
  ],
  Countertops: [
    { id: "c1", name: "Remove + Replace Laminate Countertop", unit: "lnft", price: 16.66, desc: "Per linear foot" },
  ],
  Plumbing: [
    { id: "pl1", name: "Move Toilet Plumbing",              unit: "each", price: 150, desc: "Flat rate" },
    { id: "pl2", name: "Remove Hot Water Heater",           unit: "each", price: 50,  desc: "Flat rate" },
    { id: "pl3", name: "Install Hot Water Heater",          unit: "each", price: 200, desc: "Flat rate" },
    { id: "pl4", name: "Move Hot Water Heater (same room)", unit: "each", price: 150, desc: "Flat rate" },
    { id: "pl5", name: "Install Toilet (plumbing)",         unit: "each", price: 37,  desc: "Flat rate" },
  ],
  Exterior: [
    { id: "ex1", name: "Clean Gutters", unit: "lnft", price: 1.00, desc: "Per linear foot" },
  ],
};

const ROOM_TEMPLATES = [
  "Living Room", "Kitchen", "Master Bed", "Bed 2", "Bed 3",
  "Master Bath", "Bathroom 2", "Half Bath", "Dining Room",
  "Hallway", "Laundry Room", "Basement", "Garage",
  "Front Exterior", "Back Exterior", "Other"
];

const UNIT_LABELS = { sqft: "sq ft", lnft: "ln ft", each: "ea" };

function fmt(n) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;700;800&family=Barlow:wght@400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
  :root{
    --bg:#111;--s1:#1c1c1c;--s2:#242424;--border:#2a2a2a;
    --yellow:#f5c518;--yellow2:#c9a000;
    --text:#f2ede5;--muted:#777;--red:#e05252;--green:#52c077;
  }
  body{background:var(--bg);color:var(--text);font-family:'Barlow',sans-serif;overscroll-behavior:none;}
  .app{max-width:430px;margin:0 auto;min-height:100svh;display:flex;flex-direction:column;}
  .hdr{background:var(--bg);border-bottom:2px solid var(--yellow);padding:11px 16px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:20;}
  .hdr-logo{font-family:'Barlow Condensed',sans-serif;font-size:26px;font-weight:800;letter-spacing:3px;color:var(--yellow);line-height:1;text-transform:uppercase;}
  .hdr-sub{font-size:10px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;font-weight:500;}
  .back{background:none;border:none;color:var(--yellow);font-size:20px;cursor:pointer;padding:4px 8px 4px 0;line-height:1;}
  .scr{flex:1;padding:16px;display:flex;flex-direction:column;gap:14px;padding-bottom:80px;}
  .big-label{font-family:'Barlow Condensed',sans-serif;font-size:48px;font-weight:800;letter-spacing:2px;color:var(--yellow);line-height:.95;text-transform:uppercase;}
  .field{background:var(--s1);border:1.5px solid var(--border);border-radius:10px;padding:14px 16px;font-size:17px;color:var(--text);width:100%;font-family:'Barlow',sans-serif;outline:none;}
  .field:focus{border-color:var(--yellow);}
  .btn-y{background:var(--yellow);color:#000;border:none;border-radius:10px;padding:15px;font-size:16px;font-weight:700;font-family:'Barlow Condensed',sans-serif;letter-spacing:1.5px;text-transform:uppercase;width:100%;cursor:pointer;transition:background .12s;}
  .btn-y:hover{background:var(--yellow2);}
  .btn-y:disabled{background:#333;color:var(--muted);cursor:not-allowed;}
  .btn-ghost{background:none;border:1.5px solid var(--border);border-radius:10px;padding:13px;font-size:14px;color:var(--muted);font-family:'Barlow',sans-serif;width:100%;cursor:pointer;text-align:left;}
  .btn-ghost:hover{border-color:var(--yellow);color:var(--yellow);}
  .room-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
  .room-chip{background:var(--s1);border:1.5px solid var(--border);border-radius:10px;padding:13px 10px;font-size:13px;font-weight:600;cursor:pointer;text-align:center;color:var(--text);font-family:'Barlow',sans-serif;transition:all .12s;}
  .room-chip:hover,.room-chip:active{border-color:var(--yellow);color:var(--yellow);background:#1e1a09;}
  .room-card{background:var(--s1);border:1.5px solid var(--border);border-radius:12px;padding:14px;}
  .rc-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;}
  .rc-name{font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;}
  .rc-total{font-family:'Barlow Condensed',sans-serif;font-size:20px;color:var(--yellow);}
  .rc-meta{font-size:11px;color:var(--muted);letter-spacing:1px;}
  .item-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);gap:8px;}
  .item-row:last-child{border-bottom:none;}
  .item-name{font-size:13px;flex:1;}
  .item-detail{font-size:11px;color:var(--muted);}
  .item-amt{font-family:'Barlow Condensed',sans-serif;font-size:15px;color:var(--yellow);white-space:nowrap;}
  .del{background:none;border:none;color:var(--red);font-size:20px;cursor:pointer;line-height:1;padding:2px 4px;}
  .add-btn{border:1.5px dashed var(--yellow);border-radius:8px;padding:10px;font-size:13px;color:var(--yellow);background:transparent;cursor:pointer;width:100%;font-family:'Barlow',sans-serif;font-weight:600;margin-top:10px;transition:background .12s;}
  .add-btn:hover{background:#1e1a09;}
  .cat-tabs{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none;}
  .cat-tabs::-webkit-scrollbar{display:none;}
  .tab{background:var(--s1);border:1.5px solid var(--border);border-radius:20px;padding:7px 14px;font-size:12px;font-weight:600;white-space:nowrap;cursor:pointer;color:var(--muted);font-family:'Barlow',sans-serif;text-transform:uppercase;letter-spacing:.5px;transition:all .12s;}
  .tab.on{background:var(--yellow);border-color:var(--yellow);color:#000;}
  .cat-item{background:var(--s1);border:1.5px solid var(--border);border-radius:10px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;transition:border-color .12s;}
  .cat-item:hover,.cat-item:active{border-color:var(--yellow);}
  .ci-name{font-size:14px;font-weight:600;}
  .ci-desc{font-size:11px;color:var(--muted);margin-top:2px;}
  .ci-price{font-family:'Barlow Condensed',sans-serif;font-size:16px;color:var(--yellow);white-space:nowrap;margin-left:12px;text-align:right;}
  .ci-unit{font-size:11px;color:var(--muted);}
  .overlay{position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:50;display:flex;align-items:flex-end;}
  .sheet{background:var(--s1);border-top:2.5px solid var(--yellow);border-radius:20px 20px 0 0;padding:22px 18px 38px;width:100%;max-width:430px;margin:0 auto;}
  .sh-title{font-family:'Barlow Condensed',sans-serif;font-size:28px;font-weight:800;letter-spacing:1px;color:var(--yellow);text-transform:uppercase;margin-bottom:4px;}
  .sh-desc{font-size:13px;color:var(--muted);margin-bottom:18px;}
  .num-field{background:var(--bg);border:1.5px solid var(--border);border-radius:10px;padding:16px;font-size:28px;text-align:center;color:var(--text);width:100%;font-family:'Barlow Condensed',sans-serif;outline:none;}
  .num-field:focus{border-color:var(--yellow);}
  .calc-line{font-size:13px;color:var(--muted);margin-top:6px;text-align:center;font-family:'Barlow Condensed',sans-serif;letter-spacing:.5px;}
  .sh-btns{display:flex;gap:10px;margin-top:16px;}
  .btn-cancel{background:var(--s2);border:1.5px solid var(--border);border-radius:10px;padding:14px;font-size:14px;color:var(--muted);font-family:'Barlow',sans-serif;flex:1;cursor:pointer;}
  .tot-bar{background:var(--s1);border:1.5px solid var(--yellow);border-radius:12px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;}
  .tot-label{font-size:11px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;}
  .tot-amt{font-family:'Barlow Condensed',sans-serif;font-size:40px;color:var(--yellow);letter-spacing:1px;}
  .div{height:1px;background:var(--border);}
  .sec-label{font-size:10px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;font-weight:600;}
  .sent-wrap{display:flex;flex-direction:column;align-items:center;gap:18px;padding-top:60px;}
  .sent-icon{font-size:72px;}
  .sent-title{font-family:'Barlow Condensed',sans-serif;font-size:52px;font-weight:800;color:var(--green);letter-spacing:3px;text-transform:uppercase;text-align:center;line-height:1;}
  .sent-body{text-align:center;color:var(--muted);font-size:14px;line-height:1.7;}
  .sent-total{font-family:'Barlow Condensed',sans-serif;font-size:32px;color:var(--yellow);}
  .empty{color:var(--muted);font-size:13px;text-align:center;padding:24px 0;letter-spacing:.5px;}
  .custom-form{background:var(--s2);border:1.5px solid var(--border);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:10px;}
  .custom-row{display:flex;gap:8px;}
  .field-sm{background:var(--s1);border:1.5px solid var(--border);border-radius:8px;padding:10px 12px;font-size:14px;color:var(--text);font-family:'Barlow',sans-serif;outline:none;flex:1;}
  .field-sm:focus{border-color:var(--yellow);}
  select.field-sm option{background:#1c1c1c;}
`;

export default function App() {
  const [screen, setScreen] = useState("start");
  const [address, setAddress] = useState("");
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState("");
  const [rooms, setRooms] = useState([]);
  const [activeIdx, setActiveIdx] = useState(null);
  const [catTab, setCatTab] = useState(Object.keys(CATALOG)[0]);
  const [pending, setPending] = useState(null);
  const [meas, setMeas] = useState("");
  const [notes, setNotes] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState({ name: "", price: "", qty: "", unit: "each" });

  const active = rooms[activeIdx];
  const grand = rooms.reduce((s, r) => s + r.items.reduce((a, i) => a + i.lineTotal, 0), 0);

  async function getLocation() {
    if (!navigator.geolocation) { setLocError("Geolocation not supported on this device."); return; }
    setLocLoading(true);
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          const a = data.address;
          const street = [a.house_number, a.road].filter(Boolean).join(" ");
          const city = a.city || a.town || a.village || "";
          const state = a.state || "";
          const zip = a.postcode || "";
          setAddress(`${street}, ${city} ${state} ${zip}`.trim());
        } catch {
          setLocError("Couldn't fetch address. Enter manually.");
        }
        setLocLoading(false);
      },
      () => { setLocError("Location denied. Enter address manually."); setLocLoading(false); }
    );
  }

  function addRoom(t) {
    const r = { name: t, items: [], id: Date.now() };
    const next = [...rooms, r];
    setRooms(next);
    setActiveIdx(next.length - 1);
    setScreen("room");
  }

  function removeRoom(idx) { setRooms(rooms.filter((_, i) => i !== idx)); }
  function startItem(item) { setPending(item); setMeas(""); }

  function confirmItem() {
    const q = parseFloat(meas);
    if (!q || q <= 0) return;
    const updated = rooms.map((r, i) =>
      i === activeIdx ? { ...r, items: [...r.items, { ...pending, qty: q, lineTotal: q * pending.price, iid: Date.now() }] } : r
    );
    setRooms(updated);
    setPending(null);
    setMeas("");
  }

  function addCustomItem() {
    const q = parseFloat(custom.qty);
    const p = parseFloat(custom.price);
    if (!custom.name || !q || !p) return;
    const item = { id: "cust-" + Date.now(), name: custom.name, unit: custom.unit, price: p, desc: "Custom item", qty: q, lineTotal: q * p, iid: Date.now() };
    const updated = rooms.map((r, i) => i === activeIdx ? { ...r, items: [...r.items, item] } : r);
    setRooms(updated);
    setCustom({ name: "", price: "", qty: "", unit: "each" });
    setShowCustom(false);
  }

  function removeItem(roomIdx, iid) {
    setRooms(rooms.map((r, i) => i === roomIdx ? { ...r, items: r.items.filter(it => it.iid !== iid) } : r));
  }

  function buildText() {
    let t = `TENANTURN ESTIMATE\n${address}\n\n`;
    rooms.forEach(r => {
      if (!r.items.length) return;
      t += `-- ${r.name.toUpperCase()} -- ${fmt(r.items.reduce((s, i) => s + i.lineTotal, 0))}\n`;
      r.items.forEach(i => { t += `  ${i.name}: ${i.qty} ${UNIT_LABELS[i.unit] || i.unit} = ${fmt(i.lineTotal)}\n`; });
      t += "\n";
    });
    if (notes) t += `NOTES: ${notes}\n\n`;
    t += `TOTAL: ${fmt(grand)}`;
    return t;
  }

  function handleSend() {
    const subject = encodeURIComponent(`Tenanturn Estimate -- ${address}`);
    const body = encodeURIComponent(buildText());
    window.open(`mailto:ian@franklinhomesict.com?subject=${subject}&body=${body}`, "_blank");
    setScreen("sent");
  }

  const measVal = parseFloat(meas);
  const liveCalc = pending && meas && measVal > 0 ? fmt(measVal * pending.price) : "--";

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="hdr">
          {screen !== "start" && screen !== "sent" && (
            <button className="back" onClick={() => {
              if (screen === "catalog") setScreen("room");
              else if (screen === "room") setScreen("rooms");
              else if (screen === "rooms") setScreen("start");
              else if (screen === "review") setScreen("rooms");
            }}>←</button>
          )}
          <div>
            <div className="hdr-logo">Tenanturn</div>
            <div className="hdr-sub">
              {screen === "start" && "Field Estimator"}
              {screen === "rooms" && (address || "Walkthrough")}
              {screen === "room" && (active?.name || "")}
              {screen === "catalog" && "Catalog -- " + (active?.name || "")}
              {screen === "review" && "Review + Send"}
              {screen === "sent" && "Sent"}
            </div>
          </div>
          {screen === "rooms" && grand > 0 && (
            <div style={{ marginLeft: "auto", fontFamily: "'Barlow Condensed',sans-serif", color: "var(--yellow)", fontSize: 20, fontWeight: 700 }}>
              {fmt(grand)}
            </div>
          )}
        </div>

        {screen === "start" && (
          <div className="scr">
            <div>
              <div className="big-label">New<br />Walkthrough</div>
              <div style={{ marginTop: 6, fontSize: 13, color: "var(--muted)", letterSpacing: 1 }}>Enter the property address</div>
            </div>
            <button className="btn-y" onClick={getLocation} disabled={locLoading}>
              {locLoading ? "Getting Location..." : "USE MY LOCATION"}
            </button>
            {locError && <div style={{ fontSize: 12, color: "var(--red)", textAlign: "center" }}>{locError}</div>}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              <span style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 1 }}>OR ENTER MANUALLY</span>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>
            <input className="field" placeholder="123 Main St, Wichita KS" value={address} onChange={e => setAddress(e.target.value)} style={{ fontSize: 18 }} />
            <button className="btn-y" disabled={!address.trim()} onClick={() => setScreen("rooms")}>START WALKTHROUGH</button>
          </div>
        )}

        {screen === "rooms" && (
          <div className="scr">
            <div className="sec-label">Rooms Added ({rooms.length})</div>
            {rooms.length === 0 && <div className="empty">No rooms yet -- tap a room below to start</div>}
            {rooms.map((room, idx) => {
              const rt = room.items.reduce((s, i) => s + i.lineTotal, 0);
              return (
                <div className="room-card" key={room.id}>
                  <div className="rc-head">
                    <div>
                      <div className="rc-name">{room.name}</div>
                      <div className="rc-meta">{room.items.length} item{room.items.length !== 1 ? "s" : ""}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="rc-total">{fmt(rt)}</span>
                      <button className="del" onClick={() => removeRoom(idx)}>x</button>
                    </div>
                  </div>
                  {room.items.slice(0, 3).map(it => (
                    <div key={it.iid} className="item-row">
                      <span className="item-name">{it.name}</span>
                      <span className="item-amt">{fmt(it.lineTotal)}</span>
                    </div>
                  ))}
                  {room.items.length > 3 && <div style={{ fontSize: 11, color: "var(--muted)", paddingTop: 6 }}>+{room.items.length - 3} more...</div>}
                  <button className="add-btn" onClick={() => { setActiveIdx(idx); setScreen("room"); }}>
                    {room.items.length ? "Edit Room" : "+ Add Items"}
                  </button>
                </div>
              );
            })}
            <div className="div" />
            <div className="sec-label">Add a Room</div>
            <div className="room-grid">
              {ROOM_TEMPLATES.map(t => (
                <button key={t} className="room-chip" onClick={() => addRoom(t)}>{t}</button>
              ))}
            </div>
            {grand > 0 && (
              <>
                <div className="div" />
                <div className="tot-bar">
                  <div>
                    <div className="tot-label">Total Estimate</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                      {rooms.reduce((s, r) => s + r.items.length, 0)} items
                    </div>
                  </div>
                  <div className="tot-amt">{fmt(grand)}</div>
                </div>
                <button className="btn-y" onClick={() => setScreen("review")}>REVIEW + SEND TO IAN</button>
              </>
            )}
          </div>
        )}

        {screen === "room" && active && (
          <div className="scr">
            {active.items.length === 0 && <div className="empty">No items yet. Use catalog or add custom below.</div>}
            {active.items.map(it => (
              <div key={it.iid} className="item-row" style={{ background: "var(--s1)", borderRadius: 8, padding: "10px 12px", border: "1.5px solid var(--border)" }}>
                <div style={{ flex: 1 }}>
                  <div className="item-name">{it.name}</div>
                  <div className="item-detail">{it.qty} {UNIT_LABELS[it.unit] || it.unit} x {fmt(it.price)}/{it.unit}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="item-amt">{fmt(it.lineTotal)}</span>
                  <button className="del" onClick={() => removeItem(activeIdx, it.iid)}>x</button>
                </div>
              </div>
            ))}
            {active.items.length > 0 && (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", color: "var(--yellow)", fontSize: 18 }}>
                  Room: {fmt(active.items.reduce((s, i) => s + i.lineTotal, 0))}
                </span>
              </div>
            )}
            <button className="btn-y" onClick={() => { setCatTab(Object.keys(CATALOG)[0]); setScreen("catalog"); }}>+ ADD FROM CATALOG</button>
            <div className="sec-label" style={{ marginTop: 4 }}>Custom / Unlisted Item</div>
            {!showCustom ? (
              <button className="btn-ghost" onClick={() => setShowCustom(true)}>+ Add custom item...</button>
            ) : (
              <div className="custom-form">
                <input className="field-sm" placeholder="Item name" value={custom.name} onChange={e => setCustom({ ...custom, name: e.target.value })} />
                <div className="custom-row">
                  <input className="field-sm" type="number" inputMode="decimal" placeholder="Price per unit" value={custom.price} onChange={e => setCustom({ ...custom, price: e.target.value })} />
                  <select className="field-sm" style={{ flex: 0, minWidth: 90 }} value={custom.unit} onChange={e => setCustom({ ...custom, unit: e.target.value })}>
                    <option value="each">each</option>
                    <option value="sqft">sq ft</option>
                    <option value="lnft">ln ft</option>
                  </select>
                </div>
                <input className="field-sm" type="number" inputMode="decimal" placeholder="Quantity" value={custom.qty} onChange={e => setCustom({ ...custom, qty: e.target.value })} />
                {custom.price && custom.qty && parseFloat(custom.price) > 0 && parseFloat(custom.qty) > 0 && (
                  <div style={{ fontSize: 13, color: "var(--yellow)", fontFamily: "'Barlow Condensed',sans-serif", textAlign: "center" }}>
                    Total: {fmt(parseFloat(custom.price) * parseFloat(custom.qty))}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-cancel" style={{ flex: 1 }} onClick={() => setShowCustom(false)}>Cancel</button>
                  <button className="btn-y" style={{ flex: 2 }} disabled={!custom.name || !custom.price || !custom.qty} onClick={addCustomItem}>ADD ITEM</button>
                </div>
              </div>
            )}
            <button className="btn-ghost" onClick={() => setScreen("rooms")}>Back to All Rooms</button>
          </div>
        )}

        {screen === "catalog" && (
          <div className="scr" style={{ gap: 10 }}>
            <div className="cat-tabs">
              {Object.keys(CATALOG).map(k => (
                <button key={k} className={`tab ${catTab === k ? "on" : ""}`} onClick={() => setCatTab(k)}>{k}</button>
              ))}
            </div>
            {CATALOG[catTab].map(item => (
              <div key={item.id} className="cat-item" onClick={() => startItem(item)}>
                <div style={{ flex: 1 }}>
                  <div className="ci-name">{item.name}</div>
                  <div className="ci-desc">{item.desc}</div>
                </div>
                <div className="ci-price">
                  {fmt(item.price)}
                  <div className="ci-unit">/{item.unit}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {screen === "review" && (
          <div className="scr">
            <div className="sec-label">Estimate -- {address}</div>
            {rooms.filter(r => r.items.length).map(room => (
              <div className="room-card" key={room.id}>
                <div className="rc-head">
                  <div className="rc-name">{room.name}</div>
                  <div className="rc-total">{fmt(room.items.reduce((s, i) => s + i.lineTotal, 0))}</div>
                </div>
                {room.items.map(it => (
                  <div key={it.iid} className="item-row">
                    <div>
                      <div className="item-name">{it.name}</div>
                      <div className="item-detail">{it.qty} {UNIT_LABELS[it.unit] || it.unit} x {fmt(it.price)}</div>
                    </div>
                    <span className="item-amt">{fmt(it.lineTotal)}</span>
                  </div>
                ))}
              </div>
            ))}
            <div className="sec-label">Notes (optional)</div>
            <textarea className="field" style={{ resize: "none", minHeight: 80 }} placeholder="Any notes for Ian..." value={notes} onChange={e => setNotes(e.target.value)} />
            <div className="tot-bar">
              <div>
                <div className="tot-label">Total</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                  {rooms.reduce((s, r) => s + r.items.length, 0)} items
                </div>
              </div>
              <div className="tot-amt">{fmt(grand)}</div>
            </div>
            <button className="btn-y" onClick={handleSend}>EMAIL TO IAN</button>
            <button className="btn-ghost" onClick={() => setScreen("rooms")}>Edit Estimate</button>
          </div>
        )}

        {screen === "sent" && (
          <div className="scr">
            <div className="sent-wrap">
              <div className="sent-icon">✅</div>
              <div className="sent-title">Sent to<br />Ian</div>
              <div className="sent-body">
                <div>{address}</div>
                <div className="sent-total" style={{ marginTop: 8 }}>{fmt(grand)}</div>
              </div>
              <button className="btn-y" style={{ maxWidth: 240, marginTop: 20 }}
                onClick={() => { setScreen("start"); setAddress(""); setRooms([]); setNotes(""); }}>
                NEW WALKTHROUGH
              </button>
            </div>
          </div>
        )}

        {pending && (
          <div className="overlay" onClick={e => { if (e.target.className === "overlay") { setPending(null); setMeas(""); } }}>
            <div className="sheet">
              <div className="sh-title">{pending.name}</div>
              <div className="sh-desc">{pending.desc} -- {fmt(pending.price)} per {pending.unit}</div>
              <input
                className="num-field"
                type="number"
                inputMode="decimal"
                placeholder={pending.unit === "each" ? "Qty" : `Enter ${UNIT_LABELS[pending.unit]}`}
                value={meas}
                onChange={e => setMeas(e.target.value)}
                autoFocus
              />
              <div className="calc-line">
                {meas && measVal > 0
                  ? `${measVal} ${UNIT_LABELS[pending.unit] || pending.unit} x ${fmt(pending.price)} = ${liveCalc}`
                  : `${UNIT_LABELS[pending.unit] || pending.unit} x ${fmt(pending.price)}/unit`
                }
              </div>
              <div className="sh-btns">
                <button className="btn-cancel" onClick={() => { setPending(null); setMeas(""); }}>Cancel</button>
                <button className="btn-y" style={{ flex: 2 }} disabled={!meas || measVal <= 0} onClick={confirmItem}>ADD -- {liveCalc}</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
