import { useState, useRef, useEffect } from "react";

const CATALOG = [
  { id:"p1",  cat:"Paint",       name:"Level 1 Paint - Walls Only",       unit:"sqft", cost:1.19  },
  { id:"p2",  cat:"Paint",       name:"Level 2 Paint - Walls + Trim",     unit:"sqft", cost:1.49  },
  { id:"p3",  cat:"Paint",       name:"Level 3 Paint - Walls/Trim/Doors", unit:"sqft", cost:1.60  },
  { id:"p4",  cat:"Paint",       name:"Ceiling Paint",                    unit:"sqft", cost:0.22  },
  { id:"p5",  cat:"Paint",       name:"Level 2 Prep",                     unit:"sqft", cost:0.21  },
  { id:"p6",  cat:"Paint",       name:"Level 3 Prep",                     unit:"sqft", cost:0.35  },
  { id:"p7",  cat:"Paint",       name:"Prime Paneling",                   unit:"sqft", cost:0.50  },
  { id:"p8",  cat:"Paint",       name:"Wall Repair",                      unit:"each", cost:60    },
  { id:"p9",  cat:"Paint",       name:"Caulking",                         unit:"lnft", cost:0.52  },
  { id:"p10", cat:"Paint",       name:"Paint Cabinets In + Out",          unit:"lnft", cost:21.42 },
  { id:"p11", cat:"Paint",       name:"Paint Cabinets Outside Only",      unit:"lnft", cost:16.00 },
  { id:"p12", cat:"Paint",       name:"Kilz Cabinets",                    unit:"lnft", cost:6.00  },
  { id:"p13", cat:"Paint",       name:"Paint Tub",                        unit:"each", cost:60    },
  { id:"p14", cat:"Paint",       name:"Paint Surround",                   unit:"each", cost:60    },
  { id:"p15", cat:"Paint",       name:"Clean Walls Before Paint",         unit:"sqft", cost:0.20  },
  { id:"p16", cat:"Paint",       name:"Kilz Spot Spray",                  unit:"sqft", cost:0.20  },
  { id:"d1",  cat:"Drywall",     name:"Remove Sheetrock",                 unit:"sqft", cost:0.40  },
  { id:"d2",  cat:"Drywall",     name:"Install + Finish Sheetrock",       unit:"sqft", cost:1.20  },
  { id:"f1",  cat:"Flooring",    name:"Lay LVP",                          unit:"sqft", cost:1.90  },
  { id:"f2",  cat:"Flooring",    name:"Replace Subfloor",                 unit:"sqft", cost:7.14  },
  { id:"f3",  cat:"Flooring",    name:"Remove Carpet",                    unit:"sqft", cost:0.10  },
  { id:"f4",  cat:"Flooring",    name:"Remove Staples",                   unit:"sqft", cost:0.30  },
  { id:"f5",  cat:"Flooring",    name:"Remove Tack Strips",               unit:"lnft", cost:1.00  },
  { id:"f6",  cat:"Flooring",    name:"Paint Floor",                      unit:"sqft", cost:0.48  },
  { id:"f7",  cat:"Flooring",    name:"Kilz Floors",                      unit:"sqft", cost:0.15  },
  { id:"f8",  cat:"Flooring",    name:"Quarter Round",                    unit:"lnft", cost:0.60  },
  { id:"f9",  cat:"Flooring",    name:"Install Trim",                     unit:"lnft", cost:1.00  },
  { id:"f10", cat:"Flooring",    name:"Repair Joists + New Subfloor",     unit:"sqft", cost:5.19  },
  { id:"b1",  cat:"Bathroom",    name:"Vanity Install",                   unit:"each", cost:100   },
  { id:"b2",  cat:"Bathroom",    name:"Caulk Tub",                        unit:"each", cost:20    },
  { id:"b3",  cat:"Bathroom",    name:"Install Toilet",                   unit:"each", cost:75    },
  { id:"b4",  cat:"Bathroom",    name:"Swap Sink",                        unit:"each", cost:40    },
  { id:"b5",  cat:"Bathroom",    name:"Remove Toilet",                    unit:"each", cost:37    },
  { id:"b6",  cat:"Bathroom",    name:"Install Toilet Paper Holder",      unit:"each", cost:20    },
  { id:"b7",  cat:"Bathroom",    name:"Replace Shower Surround",          unit:"each", cost:120   },
  { id:"b8",  cat:"Bathroom",    name:"Install Toilet Seat",              unit:"each", cost:10    },
  { id:"b9",  cat:"Bathroom",    name:"Install Toilet Tank Top",          unit:"each", cost:10    },
  { id:"b10", cat:"Bathroom",    name:"Replace Shower Head",              unit:"each", cost:10    },
  { id:"b11", cat:"Bathroom",    name:"Replace Sink Stopper",             unit:"each", cost:10    },
  { id:"b12", cat:"Bathroom",    name:"Caulk Shower",                     unit:"each", cost:15    },
  { id:"e1",  cat:"Electrical",  name:"Replace Bulb",                     unit:"each", cost:5     },
  { id:"e2",  cat:"Electrical",  name:"Ceiling Fan Swap",                 unit:"each", cost:60    },
  { id:"e3",  cat:"Electrical",  name:"Light Switch",                     unit:"each", cost:15    },
  { id:"e4",  cat:"Electrical",  name:"Replace Fixture",                  unit:"each", cost:25    },
  { id:"e5",  cat:"Electrical",  name:"Wire for New Fixture",             unit:"each", cost:25    },
  { id:"e6",  cat:"Electrical",  name:"Add Switch",                       unit:"each", cost:30    },
  { id:"e7",  cat:"Electrical",  name:"Outlet Replacement",               unit:"each", cost:15    },
  { id:"e8",  cat:"Electrical",  name:"Outlet Cover",                     unit:"each", cost:3     },
  { id:"e9",  cat:"Electrical",  name:"Light Switch Cover",               unit:"each", cost:3     },
  { id:"e10", cat:"Electrical",  name:"Install Smoke Detector",           unit:"each", cost:20    },
  { id:"dr1", cat:"Doors",       name:"Install Bifold Doors",             unit:"each", cost:100   },
  { id:"dr2", cat:"Doors",       name:"Frame New Door (small)",           unit:"each", cost:125   },
  { id:"dr3", cat:"Doors",       name:"Install Door",                     unit:"each", cost:35    },
  { id:"dr4", cat:"Doors",       name:"Install Door Handle",              unit:"each", cost:20    },
  { id:"dr5", cat:"Doors",       name:"Frame + Finish Door Opening",      unit:"each", cost:140   },
  { id:"w1",  cat:"Windows",     name:"Install Small Window (3ft)",       unit:"each", cost:100   },
  { id:"w2",  cat:"Windows",     name:"Install Blind",                    unit:"each", cost:10    },
  { id:"w3",  cat:"Windows",     name:"Finish Window Unit Opening",       unit:"each", cost:100   },
  { id:"w4",  cat:"Windows",     name:"Install Curtain Rod",              unit:"each", cost:25    },
  { id:"g1",  cat:"General",     name:"Frame New Closet (3x6)",           unit:"each", cost:150   },
  { id:"g2",  cat:"General",     name:"Install Closet Rod",               unit:"each", cost:20    },
  { id:"g3",  cat:"General",     name:"Install Closet Shelf",             unit:"lnft", cost:5     },
  { id:"g4",  cat:"General",     name:"Install Insulation",               unit:"sqft", cost:1.25  },
  { id:"g5",  cat:"General",     name:"Install Mirror",                   unit:"each", cost:25    },
  { id:"g6",  cat:"General",     name:"Remove Gas Line",                  unit:"each", cost:20    },
  { id:"g7",  cat:"General",     name:"Cap Gas Line",                     unit:"each", cost:10    },
  { id:"g8",  cat:"General",     name:"Replace Dishwasher",               unit:"each", cost:150   },
  { id:"g9",  cat:"General",     name:"Install Drip Pans",                unit:"each", cost:5     },
  { id:"g10", cat:"General",     name:"Install Burner Grate",             unit:"each", cost:5     },
  { id:"c1",  cat:"Countertops", name:"Replace Laminate Countertop",      unit:"lnft", cost:16.66 },
  { id:"pl1", cat:"Plumbing",    name:"Move Toilet Plumbing",             unit:"each", cost:150   },
  { id:"pl2", cat:"Plumbing",    name:"Remove Hot Water Heater",          unit:"each", cost:50    },
  { id:"pl3", cat:"Plumbing",    name:"Install Hot Water Heater",         unit:"each", cost:200   },
  { id:"pl4", cat:"Plumbing",    name:"Move Hot Water Heater",            unit:"each", cost:150   },
  { id:"pl5", cat:"Plumbing",    name:"Install Toilet (plumbing)",        unit:"each", cost:37    },
  { id:"ex1", cat:"Exterior",    name:"Clean Gutters",                    unit:"lnft", cost:1.00  },
];

const CATS = [...new Set(CATALOG.map(i => i.cat))];
const UNIT_LABELS = { sqft:"sq ft", lnft:"ln ft", each:"ea" };
const ROOMS = ["Living Room","Kitchen","Master Bed","Bed 2","Bed 3","Master Bath","Bathroom 2","Half Bath","Dining Room","Hallway","Laundry Room","Basement","Garage","Front Exterior","Back Exterior","Other"];
const fmt = n => "$" + Number(n).toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0});
const fmtD = n => "$" + Number(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;700;800&family=Barlow:wght@400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
:root{--bg:#111;--s1:#1c1c1c;--s2:#242424;--border:#2a2a2a;--y:#f5c518;--y2:#c9a000;--text:#f2ede5;--muted:#bbb;--red:#e05252;--green:#52c077;}
body{background:var(--bg);color:var(--text);font-family:'Barlow',sans-serif;overscroll-behavior:none;}
.app{max-width:430px;margin:0 auto;min-height:100svh;display:flex;flex-direction:column;}
.hdr{background:var(--bg);border-bottom:2px solid var(--y);padding:11px 16px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:20;}
.logo{font-family:'Barlow Condensed',sans-serif;font-size:26px;font-weight:800;letter-spacing:3px;color:var(--y);line-height:1;text-transform:uppercase;}
.sub{font-size:10px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;font-weight:500;}
.back{background:none;border:none;color:var(--y);font-size:20px;cursor:pointer;padding:4px 8px 4px 0;line-height:1;transition:transform 0.15s;}
.back:active{transform:scale(0.95);}
.hdr-right{margin-left:auto;text-align:right;}
.hdr-sell{font-family:'Barlow Condensed',sans-serif;font-size:18px;color:var(--y);font-weight:700;transition:all 0.3s;}
.hdr-sell.pulse{animation:pulse 0.4s ease-out;}
.hdr-cost{font-size:10px;color:var(--muted);}
.scr{flex:1;padding:16px;display:flex;flex-direction:column;gap:14px;padding-bottom:120px;}
.big{font-family:'Barlow Condensed',sans-serif;font-size:48px;font-weight:800;letter-spacing:2px;color:var(--y);line-height:.95;text-transform:uppercase;}
.field{background:var(--s1);border:1.5px solid var(--border);border-radius:10px;padding:14px 16px;font-size:17px;color:var(--text);width:100%;font-family:'Barlow',sans-serif;outline:none;transition:border-color 0.2s;}
.field:focus{border-color:var(--y);}
.btn-y{background:var(--y);color:#000;border:none;border-radius:10px;padding:15px;font-size:16px;font-weight:700;font-family:'Barlow Condensed',sans-serif;letter-spacing:1.5px;text-transform:uppercase;width:100%;cursor:pointer;transition:all 0.15s;}
.btn-y:hover{background:var(--y2);}
.btn-y:active{transform:scale(0.98);}
.btn-y:disabled{background:#333;color:var(--muted);cursor:not-allowed;}
.btn-ghost{background:none;border:1.5px solid var(--border);border-radius:10px;padding:13px;font-size:15px;color:var(--text);font-family:'Barlow',sans-serif;width:100%;cursor:pointer;text-align:left;font-weight:500;transition:all 0.2s;}
.btn-ghost:hover{border-color:var(--y);color:var(--y);}
.btn-ghost:active{transform:scale(0.98);}
.btn-sm{background:var(--s2);border:1px solid var(--border);border-radius:6px;padding:5px 10px;font-size:11px;color:var(--text);font-family:'Barlow',sans-serif;cursor:pointer;font-weight:500;transition:all 0.15s;}
.btn-sm:hover{border-color:var(--y);color:var(--y);}
.btn-sm:active{transform:scale(0.95);}
.room-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.room-chip{background:var(--s1);border:1.5px solid var(--border);border-radius:10px;padding:13px 10px;font-size:13px;font-weight:600;cursor:pointer;text-align:center;color:var(--text);font-family:'Barlow',sans-serif;transition:all 0.15s;}
.room-chip:hover,.room-chip:active{border-color:var(--y);color:var(--y);background:#1e1a09;transform:scale(1.02);}
.card{background:var(--s1);border:1.5px solid var(--border);border-radius:12px;padding:14px;animation:slideIn 0.3s ease-out;}
.rc-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;}
.rc-name{font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:700;text-transform:uppercase;}
.rc-sell{font-family:'Barlow Condensed',sans-serif;font-size:18px;color:var(--y);}
.rc-cost{font-size:10px;color:var(--muted);text-align:right;}
.rc-meta{font-size:11px;color:var(--muted);margin-bottom:6px;}
.irow{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border);gap:8px;}
.irow:last-child{border-bottom:none;}
.iname{font-size:13px;font-weight:500;flex:1;}
.idetail{font-size:11px;color:var(--muted);margin-top:1px;}
.iprices{text-align:right;flex-shrink:0;}
.isell{font-family:'Barlow Condensed',sans-serif;font-size:14px;color:var(--y);}
.icost{font-size:10px;color:var(--muted);}
.del{background:none;border:none;color:var(--red);font-size:20px;cursor:pointer;line-height:1;padding:2px 4px;flex-shrink:0;transition:transform 0.2s;}
.del:active{transform:scale(1.2) rotate(10deg);}
.add-btn{border:1.5px dashed var(--y);border-radius:8px;padding:10px;font-size:13px;color:var(--y);background:transparent;cursor:pointer;width:100%;font-family:'Barlow',sans-serif;font-weight:600;margin-top:10px;transition:all 0.2s;}
.add-btn:hover{background:rgba(245,197,24,0.1);}
.add-btn:active{transform:scale(0.98);}
.search-wrap{position:relative;}
.search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--muted);font-size:14px;pointer-events:none;}
.search-field{background:var(--s1);border:1.5px solid var(--border);border-radius:10px;padding:12px 12px 12px 36px;font-size:15px;color:var(--text);width:100%;font-family:'Barlow',sans-serif;outline:none;transition:border-color 0.2s;}
.search-field:focus{border-color:var(--y);}
.cat-tabs{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none;}
.cat-tabs::-webkit-scrollbar{display:none;}
.tab{background:var(--s1);border:1.5px solid var(--border);border-radius:20px;padding:7px 14px;font-size:11px;font-weight:600;white-space:nowrap;cursor:pointer;color:var(--text);font-family:'Barlow',sans-serif;text-transform:uppercase;transition:all 0.15s;}
.tab.on{background:var(--y);border-color:var(--y);color:#000;}
.tab:active{transform:scale(0.95);}
.cat-item{background:var(--s1);border:1.5px solid var(--border);border-radius:10px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;transition:all 0.15s;}
.cat-item:hover,.cat-item:active{border-color:var(--y);transform:scale(1.01);}
.cat-item.no-price{border-color:var(--red);}
.ci-name{font-size:14px;font-weight:600;}
.ci-sub{font-size:11px;color:var(--muted);margin-top:2px;}
.ci-cost{font-family:'Barlow Condensed',sans-serif;font-size:15px;color:var(--y);margin-left:12px;text-align:right;flex-shrink:0;}
.ci-unit{font-size:10px;color:var(--muted);}
.ci-no-price{font-size:11px;color:var(--red);font-weight:700;margin-left:12px;}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:50;display:flex;align-items:flex-end;animation:fadeIn 0.2s;}
.sheet{background:var(--s1);border-top:2.5px solid var(--y);border-radius:20px 20px 0 0;padding:22px 18px 38px;width:100%;max-width:430px;margin:0 auto;max-height:90vh;overflow-y:auto;animation:slideUp 0.3s ease-out;}
.sh-title{font-family:'Barlow Condensed',sans-serif;font-size:24px;font-weight:800;color:var(--y);text-transform:uppercase;margin-bottom:2px;}
.sh-sub{font-size:12px;color:var(--muted);margin-bottom:14px;}
.num-field{background:var(--bg);border:1.5px solid var(--border);border-radius:10px;padding:14px;font-size:28px;text-align:center;color:var(--text);width:100%;font-family:'Barlow Condensed',sans-serif;outline:none;transition:border-color 0.2s;}
.num-field:focus{border-color:var(--y);}
.field-row{display:flex;align-items:center;gap:10px;background:var(--s2);border-radius:10px;padding:10px 14px;margin-top:8px;}
.field-row-label{font-size:12px;color:var(--muted);flex:1;}
.mini-input{background:var(--bg);border:1.5px solid var(--border);border-radius:8px;padding:8px 10px;font-size:16px;color:var(--text);width:80px;font-family:'Barlow Condensed',sans-serif;outline:none;text-align:center;transition:border-color 0.2s;}
.mini-input:focus{border-color:var(--y);}
.calc-box{background:var(--s2);border-radius:10px;padding:12px 14px;margin-top:10px;display:flex;justify-content:space-around;}
.calc-col{text-align:center;}
.calc-lbl{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;}
.calc-num{font-family:'Barlow Condensed',sans-serif;font-size:20px;margin-top:2px;}
.sh-btns{display:flex;gap:10px;margin-top:14px;}
.btn-cancel{background:var(--s2);border:1.5px solid var(--border);border-radius:10px;padding:14px;font-size:14px;color:var(--text);font-family:'Barlow',sans-serif;flex:1;cursor:pointer;font-weight:500;transition:all 0.15s;}
.btn-cancel:active{transform:scale(0.98);}
.tot-bar{background:var(--s1);border:1.5px solid var(--y);border-radius:12px;padding:14px 16px;}
.tot-top{display:flex;justify-content:space-between;align-items:flex-end;}
.tot-label{font-size:11px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;}
.tot-sell{font-family:'Barlow Condensed',sans-serif;font-size:40px;color:var(--y);line-height:1;}
.tot-detail{font-size:12px;color:var(--muted);margin-top:6px;}
.markup-global{background:var(--s2);border:2px solid var(--y);border-radius:10px;padding:14px;display:flex;align-items:center;gap:10px;box-shadow:0 0 20px rgba(245,197,24,0.15);}
.markup-label{font-size:14px;color:var(--text);flex:1;font-weight:600;}
.markup-pct{font-family:'Barlow Condensed',sans-serif;font-size:14px;color:var(--y);}
.div{height:1px;background:var(--border);}
.sec{font-size:12px;color:var(--text);letter-spacing:2px;text-transform:uppercase;font-weight:700;margin-bottom:4px;}
.notes-field{background:var(--s2);border:1.5px solid var(--border);border-radius:8px;padding:10px 12px;font-size:13px;color:var(--text);width:100%;font-family:'Barlow',sans-serif;outline:none;resize:none;min-height:60px;transition:border-color 0.2s;}
.notes-field:focus{border-color:var(--y);}
.no-price-banner{font-size:11px;color:var(--red);background:#2a1515;border:1px solid #e05252;border-radius:6px;padding:7px 12px;text-align:center;margin-bottom:10px;}
.edit-strip{display:flex;gap:6px;align-items:center;margin-top:5px;flex-wrap:wrap;}
.edit-label{font-size:11px;color:var(--muted);}
.edit-input{background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:4px 8px;font-size:13px;color:var(--text);width:65px;font-family:'Barlow Condensed',sans-serif;outline:none;text-align:center;transition:border-color 0.2s;}
.edit-input:focus{border-color:var(--y);}
.custom-form{background:var(--s2);border:1.5px solid var(--border);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:10px;}
.custom-row{display:flex;gap:8px;}
.field-sm{background:var(--s1);border:1.5px solid var(--border);border-radius:8px;padding:10px 12px;font-size:14px;color:var(--text);font-family:'Barlow',sans-serif;outline:none;flex:1;transition:border-color 0.2s;}
.field-sm:focus{border-color:var(--y);}
select.field-sm option{background:#1c1c1c;}
.sent-wrap{display:flex;flex-direction:column;align-items:center;gap:18px;padding-top:60px;}
.sent-icon{font-size:72px;animation:scaleIn 0.5s ease-out;}
.sent-title{font-family:'Barlow Condensed',sans-serif;font-size:52px;font-weight:800;color:var(--green);letter-spacing:3px;text-transform:uppercase;text-align:center;line-height:1;}
.sent-body{text-align:center;color:var(--muted);font-size:14px;line-height:1.7;}
.sent-sell{font-family:'Barlow Condensed',sans-serif;font-size:32px;color:var(--y);}
.empty{color:var(--muted);font-size:13px;text-align:center;padding:24px 0;}
.toast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--s1);border:1.5px solid var(--y);border-radius:10px;padding:12px 20px;font-size:14px;color:var(--text);z-index:100;animation:toastIn 0.3s ease-out;box-shadow:0 4px 20px rgba(0,0,0,0.5);}
.spinner{width:20px;height:20px;border:2px solid var(--border);border-top-color:var(--y);border-radius:50%;animation:spin 0.6s linear infinite;display:inline-block;margin-right:8px;}
.confetti{position:fixed;width:10px;height:10px;background:var(--y);z-index:200;pointer-events:none;animation:confettiFall 0.6s ease-out forwards;}
.voice-btn{background:var(--s2);border:1.5px solid var(--y);border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:var(--y);flex-shrink:0;transition:all 0.2s;margin-left:8px;}
.voice-btn:hover{background:rgba(245,197,24,0.1);}
.voice-btn:active{transform:scale(0.9);}
.voice-btn.recording{animation:pulseVoice 1.5s infinite;}
.notes-row{display:flex;gap:0;align-items:stretch;}
.notes-field.with-voice{border-radius:8px 0 0 8px;border-right:none;}
.voice-btn-wrapper{display:flex;}
.voice-btn.attached{border-radius:0 8px 8px 0;border-left:none;}
.footer{background:var(--bg);border-top:1px solid var(--border);padding:12px 16px;text-align:center;font-size:10px;color:var(--muted);position:fixed;bottom:0;left:0;right:0;z-index:10;}
.warning-banner{background:#2a1515;border:1px solid var(--red);border-radius:8px;padding:10px 14px;font-size:12px;color:var(--red);margin-bottom:14px;line-height:1.5;}
.resume-card{background:var(--s1);border:1.5px solid var(--y);border-radius:12px;padding:16px;margin-bottom:14px;}
.resume-title{font-size:14px;color:var(--text);font-weight:600;margin-bottom:4px;}
.resume-detail{font-size:12px;color:var(--muted);margin-bottom:12px;}
.resume-btns{display:flex;gap:8px;}
.btn-resume{background:var(--y);color:#000;border:none;border-radius:8px;padding:10px;font-size:13px;font-weight:700;font-family:'Barlow Condensed',sans-serif;letter-spacing:1px;text-transform:uppercase;flex:1;cursor:pointer;transition:all 0.15s;}
.btn-resume:active{transform:scale(0.98);}
.btn-fresh{background:var(--s2);color:var(--text);border:1.5px solid var(--border);border-radius:8px;padding:10px;font-size:13px;font-weight:600;font-family:'Barlow',sans-serif;flex:1;cursor:pointer;transition:all 0.15s;}
.btn-fresh:active{transform:scale(0.98);}
.copy-btn{background:var(--s2);border:1.5px solid var(--border);border-radius:10px;padding:13px;font-size:14px;color:var(--text);font-family:'Barlow',sans-serif;width:100%;cursor:pointer;font-weight:500;transition:all 0.2s;text-align:center;}
.copy-btn:hover{border-color:var(--y);color:var(--y);}
.copy-btn:active{transform:scale(0.98);}
.back-to-rooms{background:var(--y);color:#000;border:none;border-radius:10px;padding:14px;font-size:15px;font-weight:700;font-family:'Barlow Condensed',sans-serif;letter-spacing:1.5px;text-transform:uppercase;width:100%;cursor:pointer;transition:all 0.15s;margin-top:8px;box-shadow:0 2px 10px rgba(245,197,24,0.3);}
.back-to-rooms:active{transform:scale(0.98);}
@keyframes slideIn{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
@keyframes slideUp{from{transform:translateY(100%);}to{transform:translateY(0);}}
@keyframes spin{to{transform:rotate(360deg);}}
@keyframes pulse{0%,100%{transform:scale(1);}50%{transform:scale(1.05);}}
@keyframes scaleIn{from{transform:scale(0.5);opacity:0;}to{transform:scale(1);opacity:1;}}
@keyframes toastIn{from{opacity:0;transform:translate(-50%,20px);}to{opacity:1;transform:translate(-50%,0);}}
@keyframes confettiFall{to{transform:translateY(100vh) rotate(360deg);opacity:0;}}
@keyframes pulseVoice{0%,100%{box-shadow:0 0 0 0 rgba(245,197,24,0.7);}50%{box-shadow:0 0 0 8px rgba(245,197,24,0);}}
`;

export default function App() {
  const [screen, setScreen] = useState("start");
  const [address, setAddress] = useState("");
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState("");
  const [rooms, setRooms] = useState([]);
  const [activeIdx, setActiveIdx] = useState(null);
  const [catTab, setCatTab] = useState("Paint");
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState(null);
  const [meas, setMeas] = useState("");
  const [pendingCost, setPendingCost] = useState("");
  const [markup, setMarkup] = useState("1.6");
  const [globalMarkup, setGlobalMarkup] = useState("1.6");
  const [notes, setNotes] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState({ name:"", cost:"", sell:"", qty:"", unit:"each" });
  const [editingItem, setEditingItem] = useState(null);
  const [toast, setToast] = useState("");
  const [prevTotal, setPrevTotal] = useState(0);
  const [showResume, setShowResume] = useState(false);
  const [savedData, setSavedData] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const active = rooms[activeIdx];
  const grandSell = rooms.reduce((s,r) => s + r.items.reduce((a,i) => a + i.sell * i.qty, 0), 0);
  const grandCost = rooms.reduce((s,r) => s + r.items.reduce((a,i) => a + i.cost * i.qty, 0), 0);

  // LocalStorage auto-save
  useEffect(() => {
    if (address || rooms.length > 0) {
      const data = { address, rooms, notes, globalMarkup, timestamp: Date.now() };
      localStorage.setItem('tenanturn_draft', JSON.stringify(data));
    }
  }, [address, rooms, notes, globalMarkup]);

  // Check for saved data on mount
  useEffect(() => {
    const saved = localStorage.getItem('tenanturn_draft');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        const age = Date.now() - data.timestamp;
        if (age < 7 * 24 * 60 * 60 * 1000) { // 7 days
          setSavedData(data);
          setShowResume(true);
        }
      } catch (e) {}
    }

    // Warn about browser data clearing
    const hasSeenWarning = localStorage.getItem('tenanturn_warning_seen');
    if (!hasSeenWarning) {
      localStorage.setItem('tenanturn_warning_seen', 'true');
    }
  }, []);

  // Confetti on $100 milestones
  useEffect(() => {
    if (grandSell > 0 && grandSell !== prevTotal) {
      const prevHundred = Math.floor(prevTotal / 100);
      const currHundred = Math.floor(grandSell / 100);
      if (currHundred > prevHundred) {
        triggerConfetti();
      }
      setPrevTotal(grandSell);
    }
  }, [grandSell, prevTotal]);

  function triggerConfetti() {
    for (let i = 0; i < 30; i++) {
      setTimeout(() => {
        const c = document.createElement('div');
        c.className = 'confetti';
        c.style.left = Math.random() * 100 + '%';
        c.style.animationDelay = Math.random() * 0.3 + 's';
        c.style.background = `hsl(${45 + Math.random() * 20}, 100%, ${50 + Math.random() * 20}%)`;
        document.body.appendChild(c);
        setTimeout(() => c.remove(), 600);
      }, i * 15);
    }
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  }

  function resumeDraft() {
    setAddress(savedData.address);
    setRooms(savedData.rooms);
    setNotes(savedData.notes || "");
    setGlobalMarkup(savedData.globalMarkup || "1.6");
    setShowResume(false);
    showToast("Draft restored");
  }

  function startFresh() {
    localStorage.removeItem('tenanturn_draft');
    setShowResume(false);
  }

  async function getLocation() {
    if (!navigator.geolocation) { setLocError("Geolocation not supported."); return; }
    setLocLoading(true); setLocError("");
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          const a = data.address;
          const street = [a.house_number, a.road].filter(Boolean).join(" ");
          const city = a.city || a.town || a.village || "";
          setAddress(`${street}, ${city} ${a.state||""} ${a.postcode||""}`.trim());
        } catch { setLocError("Could not get address. Enter manually."); }
        setLocLoading(false);
      },
      () => { setLocError("Location denied. Enter manually."); setLocLoading(false); }
    );
  }

  function addRoom(name) {
    const r = { name, items:[], driveLink:"", notes:"", id:Date.now() };
    const next = [...rooms, r];
    setRooms(next); setActiveIdx(next.length - 1); setScreen("room");
  }

  function removeRoom(idx) {
    if (rooms[idx].items.length > 0) {
      if (!confirm(`Delete ${rooms[idx].name} with ${rooms[idx].items.length} items?`)) return;
    }
    setRooms(rooms.filter((_,i) => i !== idx));
    showToast("Room deleted");
  }

  function startItem(item) {
    setPending(item); setMeas("");
    setPendingCost(item.cost > 0 ? String(item.cost) : "");
    setMarkup(globalMarkup);
  }

  function confirmItem() {
    const q = parseFloat(meas), c = parseFloat(pendingCost);
    if (!q || q <= 0 || !c || c <= 0) return;
    const m = parseFloat(markup) || 1;
    const s = parseFloat((c * m).toFixed(2));
    setRooms(rooms.map((r,i) => i === activeIdx ? { ...r, items:[...r.items, { ...pending, qty:q, cost:c, sell:s, markup:m, iid:Date.now() }]} : r));
    setPending(null); setMeas(""); setPendingCost(""); setMarkup(globalMarkup);
    showToast("Item added");
  }

  function updateItem(roomIdx, iid, fields) {
    setRooms(rooms.map((r,i) => i !== roomIdx ? r : {
      ...r, items: r.items.map(it => {
        if (it.iid !== iid) return it;
        const updated = { ...it, ...fields };
        if (fields.markup !== undefined) updated.sell = parseFloat((updated.cost * updated.markup).toFixed(2));
        if (fields.sell !== undefined) updated.markup = parseFloat((updated.sell / updated.cost).toFixed(2));
        return updated;
      })
    }));
  }

  function removeItem(roomIdx, iid) {
    setRooms(rooms.map((r,i) => i === roomIdx ? { ...r, items: r.items.filter(it => it.iid !== iid) } : r));
    showToast("Item removed");
  }

  function addCustomItem() {
    const q = parseFloat(custom.qty), c = parseFloat(custom.cost), s = parseFloat(custom.sell);
    if (!custom.name || !q || !c || !s) return;
    const item = { id:"cust-"+Date.now(), cat:"Custom", name:custom.name, unit:custom.unit, cost:c, sell:s, markup:parseFloat((s/c).toFixed(2)), qty:q, iid:Date.now() };
    setRooms(rooms.map((r,i) => i === activeIdx ? { ...r, items:[...r.items, item]} : r));
    setCustom({ name:"", cost:"", sell:"", qty:"", unit:"each" }); setShowCustom(false);
    showToast("Custom item added");
  }

  function copyFromLastRoom() {
    if (rooms.length < 2 || activeIdx === 0) {
      showToast("No previous room to copy from");
      return;
    }
    const lastRoom = rooms[activeIdx - 1];
    if (lastRoom.items.length === 0) {
      showToast("Previous room has no items");
      return;
    }
    const newItems = lastRoom.items.map(it => ({ ...it, iid: Date.now() + Math.random() }));
    setRooms(rooms.map((r,i) => i === activeIdx ? { ...r, items: [...r.items, ...newItems] } : r));
    showToast(`Copied ${newItems.length} items from ${lastRoom.name}`);
  }

  function startVoiceInput() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      showToast("Voice input not supported");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => { setIsListening(false); showToast("Voice input failed"); };
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setRooms(rooms.map((r,i) => i===activeIdx ? {...r, notes: (r.notes ? r.notes + " " : "") + transcript} : r));
      showToast("Voice added to notes");
    };
    
    recognitionRef.current = recognition;
    recognition.start();
  }

  function buildEmail() {
    let t = `TENANTURN ESTIMATE\n${address}\n\n`;
    rooms.forEach(r => {
      if (!r.items.length) return;
      const rs = r.items.reduce((s,i) => s+i.sell*i.qty,0);
      const rc = r.items.reduce((s,i) => s+i.cost*i.qty,0);
      t += `-- ${r.name.toUpperCase()} -- Sell: ${fmt(rs)} | Cost: ${fmt(rc)}\n`;
      r.items.forEach(i => { t += `  ${i.name}: ${i.qty} ${UNIT_LABELS[i.unit]||i.unit} | Cost ${fmt(i.cost*i.qty)} -> Sell ${fmt(i.sell*i.qty)} (${i.markup}x)\n`; });
      if (r.notes) t += `  Notes: ${r.notes}\n`;
      if (r.driveLink) t += `  Photos: ${r.driveLink}\n`;
      t += "\n";
    });
    if (notes) t += `NOTES: ${notes}\n\n`;
    t += `SELL TOTAL: ${fmt(grandSell)}\nCOST TOTAL: ${fmt(grandCost)}\nMARGIN: ${fmt(grandSell-grandCost)} (${grandSell>0?Math.round((1-grandCost/grandSell)*100):0}%)`;
    return t;
  }

  async function handleSend() {
    if (rooms.filter(r => r.items.length > 0).length === 0) {
      showToast("Add items before sending");
      return;
    }
    const subject = `Tenanturn Estimate - ${address}`;
    const body = buildEmail();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: subject,
          text: `Send this to: ian@franklinhomesict.com\n\n${body}`,
        });
        localStorage.removeItem('tenanturn_draft');
        setScreen("sent");
      } catch (err) {
        if (err.name !== 'AbortError') {
          window.location.href = `mailto:ian@franklinhomesict.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          localStorage.removeItem('tenanturn_draft');
          setScreen("sent");
        }
      }
    } else {
      window.location.href = `mailto:ian@franklinhomesict.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      localStorage.removeItem('tenanturn_draft');
      setScreen("sent");
    }
  }

  function copyToClipboard() {
    const text = buildEmail();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showToast("Copied to clipboard");
      }).catch(() => {
        showToast("Copy failed - please use email");
      });
    } else {
      showToast("Clipboard not supported");
    }
  }

  const filteredCatalog = search.trim()
    ? CATALOG.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.cat.toLowerCase().includes(search.toLowerCase()))
    : CATALOG.filter(i => i.cat === catTab);

  const qVal = parseFloat(meas), cVal = parseFloat(pendingCost), mVal = parseFloat(markup)||1;
  const liveSellUnit = cVal > 0 ? cVal * mVal : 0;
  const liveCostTotal = qVal > 0 && cVal > 0 ? cVal * qVal : 0;
  const liveSellTotal = qVal > 0 && liveSellUnit > 0 ? liveSellUnit * qVal : 0;

  return (
    <>
      <style>{CSS}</style>
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
            <div className="logo">Tenanturn</div>
            <div className="sub">
              {screen === "start" && "Field Estimator"}
              {screen === "rooms" && (address || "Walkthrough")}
              {screen === "room" && (active?.name || "")}
              {screen === "catalog" && "Add Items"}
              {screen === "review" && "Review + Send"}
              {screen === "sent" && "Sent"}
            </div>
          </div>
          {["rooms","review"].includes(screen) && grandSell > 0 && (
            <div className="hdr-right">
              <div className={`hdr-sell ${grandSell !== prevTotal ? 'pulse' : ''}`}>{fmt(grandSell)}</div>
              <div className="hdr-cost">cost {fmt(grandCost)}</div>
            </div>
          )}
        </div>

        {screen === "start" && (
          <div className="scr">
            {showResume && savedData && (
              <div className="resume-card">
                <div className="resume-title">Resume draft?</div>
                <div className="resume-detail">{savedData.address} · {fmt(savedData.rooms.reduce((s,r) => s + r.items.reduce((a,i) => a + i.sell * i.qty, 0), 0))}</div>
                <div className="resume-btns">
                  <button className="btn-resume" onClick={resumeDraft}>RESUME</button>
                  <button className="btn-fresh" onClick={startFresh}>Start Fresh</button>
                </div>
              </div>
            )}
            {!localStorage.getItem('tenanturn_warning_seen') && (
              <div className="warning-banner">
                ⚠️ Don't clear your browser data or you'll lose in-progress estimates
              </div>
            )}
            <div>
              <div className="big">New<br />Walkthrough</div>
              <div style={{marginTop:6,fontSize:13,color:"var(--muted)"}}>Enter the property address</div>
            </div>
            <button className="btn-y" onClick={getLocation} disabled={locLoading}>
              {locLoading && <span className="spinner"></span>}
              {locLoading ? "Locating..." : "USE MY LOCATION"}
            </button>
            {locError && <div style={{fontSize:12,color:"var(--red)",textAlign:"center"}}>{locError}</div>}
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{flex:1,height:1,background:"var(--border)"}}/>
              <span style={{fontSize:11,color:"var(--muted)",letterSpacing:1}}>OR ENTER MANUALLY</span>
              <div style={{flex:1,height:1,background:"var(--border)"}}/>
            </div>
            <input className="field" placeholder="123 Main St, Wichita KS" value={address} onChange={e => setAddress(e.target.value)} style={{fontSize:18}}/>
            <div className="sec">Default Markup</div>
            <div className="markup-global">
              <span className="markup-label">Global multiplier</span>
              <input className="mini-input" type="number" step="0.1" value={globalMarkup} onChange={e => setGlobalMarkup(e.target.value)} />
              <span className="markup-pct">{globalMarkup ? Math.round((parseFloat(globalMarkup)-1)*100)+"%" : ""}</span>
            </div>
            <button className="btn-y" disabled={!address.trim()} onClick={() => setScreen("rooms")}>START WALKTHROUGH</button>
          </div>
        )}

        {screen === "rooms" && (
          <div className="scr">
            <div className="sec">Rooms ({rooms.length})</div>
            {rooms.length === 0 && <div className="empty">No rooms added yet</div>}
            {rooms.map((room, idx) => {
              const rs = room.items.reduce((s,i) => s+i.sell*i.qty,0);
              const rc = room.items.reduce((s,i) => s+i.cost*i.qty,0);
              return (
                <div className="card" key={room.id}>
                  <div className="rc-head">
                    <div>
                      <div className="rc-name">{room.name}</div>
                      <div className="rc-meta">{room.items.length} items{room.driveLink ? " · has photos" : ""}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
                      <div style={{textAlign:"right"}}>
                        <div className="rc-sell">{fmt(rs)}</div>
                        <div className="rc-cost">cost {fmt(rc)}</div>
                      </div>
                      <button className="del" onClick={() => removeRoom(idx)}>×</button>
                    </div>
                  </div>
                  {room.items.slice(0,3).map(it => (
                    <div key={it.iid} className="irow">
                      <span className="iname" style={{fontSize:12}}>{it.name}</span>
                      <span className="isell" style={{fontSize:13}}>{fmt(it.sell*it.qty)}</span>
                    </div>
                  ))}
                  {room.items.length > 3 && <div style={{fontSize:11,color:"var(--muted)",paddingTop:5}}>+{room.items.length-3} more</div>}
                  <button className="add-btn" onClick={() => { setActiveIdx(idx); setScreen("room"); }}>
                    {room.items.length ? "Edit Room →" : "+ Add Items"}
                  </button>
                </div>
              );
            })}
            <div className="div"/>
            <div className="sec">Add a Room</div>
            <div className="room-grid">
              {ROOMS.map(t => <button key={t} className="room-chip" onClick={() => addRoom(t)}>{t}</button>)}
            </div>
            {grandSell > 0 && (
              <>
                <div className="div"/>
                <div className="tot-bar">
                  <div className="tot-top">
                    <div className="tot-label">Total Sell</div>
                    <div className="tot-sell">{fmt(grandSell)}</div>
                  </div>
                  <div className="tot-detail">Cost: {fmt(grandCost)} · Margin: {fmt(grandSell-grandCost)} ({grandSell>0?Math.round((1-grandCost/grandSell)*100):0}%)</div>
                </div>
                <button className="btn-y" onClick={() => setScreen("review")}>REVIEW + SEND TO IAN</button>
              </>
            )}
          </div>
        )}

        {screen === "room" && active && (
          <div className="scr">
            {active.items.length === 0 && <div className="empty">Tap catalog to add items</div>}
            {active.items.map(it => (
              <div key={it.iid} style={{background:"var(--s1)",borderRadius:8,padding:"10px 12px",border:"1.5px solid var(--border)"}}>
                <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div className="iname">{it.name}</div>
                    <div className="idetail">{it.qty} {UNIT_LABELS[it.unit]||it.unit} · {it.markup}x</div>
                  </div>
                  <div className="iprices">
                    <div className="isell">{fmt(it.sell*it.qty)}</div>
                    <div className="icost">cost {fmt(it.cost*it.qty)}</div>
                  </div>
                  <button className="del" onClick={() => removeItem(activeIdx, it.iid)}>×</button>
                </div>
                {editingItem === it.iid ? (
                  <div className="edit-strip">
                    <span className="edit-label">Qty:</span>
                    <input className="edit-input" type="number" defaultValue={it.qty}
                      onBlur={e => { const v=parseFloat(e.target.value); if(v>0) updateItem(activeIdx,it.iid,{qty:v}); }} />
                    <span className="edit-label">Sell/unit:</span>
                    <input className="edit-input" type="number" step="0.01" defaultValue={it.sell}
                      onBlur={e => { const v=parseFloat(e.target.value); if(v>0) updateItem(activeIdx,it.iid,{sell:v}); }} />
                    <button className="btn-sm" onClick={() => setEditingItem(null)}>Done</button>
                  </div>
                ) : (
                  <button className="btn-sm" style={{marginTop:6}} onClick={() => setEditingItem(it.iid)}>Edit qty / price</button>
                )}
              </div>
            ))}
            {active.items.length > 0 && (
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",color:"var(--y)",fontSize:18}}>
                  Room Sell: {fmt(active.items.reduce((s,i)=>s+i.sell*i.qty,0))}
                </div>
                <div style={{fontSize:11,color:"var(--muted)"}}>
                  Cost: {fmt(active.items.reduce((s,i)=>s+i.cost*i.qty,0))}
                </div>
              </div>
            )}
            <button className="btn-y" onClick={() => { setSearch(""); setCatTab("Paint"); setScreen("catalog"); }}>+ ADD FROM CATALOG</button>
            {activeIdx > 0 && rooms[activeIdx - 1].items.length > 0 && (
              <button className="btn-ghost" onClick={copyFromLastRoom}>Copy items from {rooms[activeIdx - 1].name}</button>
            )}
            <div className="sec">Google Drive Link</div>
            <input className="field" placeholder="Paste Google Drive link here..." value={active.driveLink}
              onChange={e => setRooms(rooms.map((r,i) => i===activeIdx ? {...r,driveLink:e.target.value} : r))} 
              style={{background:"var(--s2)",border:"2px solid var(--y)",fontSize:14}}/>
            <div className="sec">Room Notes</div>
            <div className="notes-row">
              <textarea className={`notes-field ${('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) ? 'with-voice' : ''}`} 
                placeholder="Notes for this room..." value={active.notes}
                onChange={e => setRooms(rooms.map((r,i) => i===activeIdx ? {...r,notes:e.target.value} : r))} />
              {('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) && (
                <div className="voice-btn-wrapper">
                  <button className={`voice-btn attached ${isListening ? 'recording' : ''}`} onClick={startVoiceInput}>
                    🎤
                  </button>
                </div>
              )}
            </div>
            <div className="sec">Custom Item</div>
            {!showCustom ? (
              <button className="btn-ghost" onClick={() => setShowCustom(true)}>+ Add custom item</button>
            ) : (
              <div className="custom-form">
                <input className="field-sm" placeholder="Item name" value={custom.name} onChange={e => setCustom({...custom,name:e.target.value})} />
                <div className="custom-row">
                  <input className="field-sm" type="number" inputMode="decimal" placeholder="Your cost" value={custom.cost}
                    onChange={e => {
                      const c = e.target.value;
                      const s = c ? String(parseFloat((parseFloat(c)*(parseFloat(globalMarkup)||1.6)).toFixed(2))) : "";
                      setCustom({...custom,cost:c,sell:s});
                    }} />
                  <input className="field-sm" type="number" inputMode="decimal" placeholder="Sell price" value={custom.sell}
                    onChange={e => setCustom({...custom,sell:e.target.value})} />
                </div>
                <div className="custom-row">
                  <input className="field-sm" type="number" inputMode="decimal" placeholder="Qty" value={custom.qty}
                    onChange={e => setCustom({...custom,qty:e.target.value})} />
                  <select className="field-sm" style={{flex:0,minWidth:90}} value={custom.unit} onChange={e => setCustom({...custom,unit:e.target.value})}>
                    <option value="each">each</option>
                    <option value="sqft">sq ft</option>
                    <option value="lnft">ln ft</option>
                  </select>
                </div>
                {custom.cost && custom.sell && custom.qty && (
                  <div style={{fontSize:13,color:"var(--y)",fontFamily:"'Barlow Condensed',sans-serif",textAlign:"center"}}>
                    Sell: {fmt(parseFloat(custom.sell)*parseFloat(custom.qty))} · Cost: {fmt(parseFloat(custom.cost)*parseFloat(custom.qty))}
                  </div>
                )}
                <div style={{display:"flex",gap:8}}>
                  <button className="btn-cancel" style={{flex:1}} onClick={() => setShowCustom(false)}>Cancel</button>
                  <button className="btn-y" style={{flex:2}} disabled={!custom.name||!custom.cost||!custom.sell||!custom.qty} onClick={addCustomItem}>ADD ITEM</button>
                </div>
              </div>
            )}
            <button className="back-to-rooms" onClick={() => setScreen("rooms")}>← BACK TO ALL ROOMS</button>
          </div>
        )}

        {screen === "catalog" && (
          <div className="scr" style={{gap:10}}>
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input className="search-field" placeholder="Search all items..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {!search.trim() && (
              <div className="cat-tabs">
                {CATS.map(k => <button key={k} className={`tab ${catTab===k?"on":""}`} onClick={() => setCatTab(k)}>{k}</button>)}
              </div>
            )}
            {filteredCatalog.length === 0 && <div className="empty">No items found</div>}
            {filteredCatalog.map(item => (
              <div key={item.id} className={`cat-item ${item.cost===0?"no-price":""}`} onClick={() => startItem(item)}>
                <div style={{flex:1}}>
                  <div className="ci-name">{item.name}</div>
                  <div className="ci-sub">{item.cat} · per {item.unit}</div>
                </div>
                {item.cost > 0
                  ? <div className="ci-cost">{fmtD(item.cost)}<div className="ci-unit">cost/{item.unit}</div></div>
                  : <div className="ci-no-price">Set Price</div>
                }
              </div>
            ))}
            <button className="back-to-rooms" onClick={() => setScreen("room")}>← BACK TO {active?.name.toUpperCase()}</button>
          </div>
        )}

        {screen === "review" && (
          <div className="scr">
            <div className="sec">Estimate — {address}</div>
            {rooms.filter(r=>r.items.length).map(room => (
              <div className="card" key={room.id}>
                <div className="rc-head">
                  <div className="rc-name">{room.name}</div>
                  <div>
                    <div className="rc-sell">{fmt(room.items.reduce((s,i)=>s+i.sell*i.qty,0))}</div>
                    <div className="rc-cost">cost {fmt(room.items.reduce((s,i)=>s+i.cost*i.qty,0))}</div>
                  </div>
                </div>
                {room.items.map(it => (
                  <div key={it.iid} className="irow">
                    <div style={{flex:1}}>
                      <div className="iname">{it.name}</div>
                      <div className="idetail">{it.qty} {UNIT_LABELS[it.unit]||it.unit} · {it.markup}x markup</div>
                    </div>
                    <div className="iprices">
                      <div className="isell">{fmt(it.sell*it.qty)}</div>
                      <div className="icost">{fmt(it.cost*it.qty)}</div>
                    </div>
                  </div>
                ))}
                {room.driveLink && <div style={{fontSize:11,color:"var(--muted)",paddingTop:5,wordBreak:"break-all"}}>📷 {room.driveLink}</div>}
                {room.notes && <div style={{fontSize:11,color:"var(--muted)",paddingTop:4,fontStyle:"italic"}}>"{room.notes}"</div>}
              </div>
            ))}
            <div className="sec">Overall Notes</div>
            <textarea className="field" style={{resize:"none",minHeight:70}} placeholder="Any notes for Ian..." value={notes} onChange={e => setNotes(e.target.value)} />
            <div className="tot-bar">
              <div className="tot-top">
                <div className="tot-label">Total Sell</div>
                <div className="tot-sell">{fmt(grandSell)}</div>
              </div>
              <div className="tot-detail">Cost: {fmt(grandCost)} · Margin: {fmt(grandSell-grandCost)} ({grandSell>0?Math.round((1-grandCost/grandSell)*100):0}%)</div>
            </div>
            <button className="btn-y" onClick={handleSend}>EMAIL TO IAN</button>
            <button className="copy-btn" onClick={copyToClipboard}>📋 Copy to Clipboard</button>
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
                <div className="sent-sell" style={{marginTop:8}}>{fmt(grandSell)}</div>
                <div style={{fontSize:12,color:"var(--muted)",marginTop:4}}>cost {fmt(grandCost)}</div>
              </div>
              <button className="btn-y" style={{maxWidth:240,marginTop:20}}
                onClick={() => { setScreen("start"); setAddress(""); setRooms([]); setNotes(""); }}>
                NEW WALKTHROUGH
              </button>
            </div>
          </div>
        )}

        {pending && (
          <div className="overlay" onClick={e => { if(e.target.className==="overlay"){setPending(null);setMeas("");}}}>
            <div className="sheet">
              <div className="sh-title">{pending.name}</div>
              <div className="sh-sub">{pending.cat} · per {pending.unit}</div>
              {pending.cost === 0 && <div className="no-price-banner">No price on file — enter your cost below</div>}
              <input className="num-field" type="number" inputMode="decimal"
                placeholder={pending.unit==="each"?"Quantity":`Enter ${UNIT_LABELS[pending.unit]||pending.unit}`}
                value={meas} onChange={e => setMeas(e.target.value)} autoFocus />
              <div className="field-row">
                <span className="field-row-label">Your cost per {pending.unit}</span>
                <input className="mini-input" type="number" step="0.01" inputMode="decimal"
                  placeholder="0.00" value={pendingCost} onChange={e => setPendingCost(e.target.value)} />
              </div>
              <div className="field-row">
                <span className="field-row-label">Markup multiplier</span>
                <input className="mini-input" type="number" step="0.1" value={markup} onChange={e => setMarkup(e.target.value)} />
                <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,color:"var(--y)"}}>
                  {cVal>0?`= ${fmtD(cVal*mVal)}/unit`:""}
                </span>
              </div>
              {qVal > 0 && cVal > 0 && (
                <div className="calc-box">
                  <div className="calc-col">
                    <div className="calc-lbl">Qty</div>
                    <div className="calc-num" style={{color:"var(--text)"}}>{qVal}</div>
                  </div>
                  <div className="calc-col">
                    <div className="calc-lbl">Cost</div>
                    <div className="calc-num" style={{color:"var(--muted)"}}>{fmt(liveCostTotal)}</div>
                  </div>
                  <div className="calc-col">
                    <div className="calc-lbl">Sell</div>
                    <div className="calc-num" style={{color:"var(--y)"}}>{fmt(liveSellTotal)}</div>
                  </div>
                </div>
              )}
              <div className="sh-btns">
                <button className="btn-cancel" onClick={() => { setPending(null); setMeas(""); }}>Cancel</button>
                <button className="btn-y" style={{flex:2}}
                  disabled={!meas || qVal<=0 || !pendingCost || cVal<=0}
                  onClick={confirmItem}>
                  ADD {liveSellTotal>0 ? fmt(liveSellTotal) : ""}
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && <div className="toast">{toast}</div>}

        <div className="footer">
          TenantTurn v1.0 · © 2026 · Estimates auto-saved
        </div>

      </div>
    </>
  );
}
