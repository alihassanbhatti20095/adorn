// @ts-nocheck
// Mock data + dependency rules for the Adorn Door Configurator (stand-in for /src/data/*.json)

  const CODES = 'AL1 88E,AM 32E,AR1 91E,AS 90E,AT 30E,AV2 89E,BA 39E,BE 24E,BG 52E,BI 13E,BN 19E,BO 40E,BR 41E,BR 97E,BU 53E,BX 66E,CA 35E,CB 86E,CN 96E,DU 27E,ED 67E,EM 92E,ES 93E,FI 88E,GN 43E,GR 74E,GT 44E,HA 18E,HE 31E,KL 68E,KO 50E,KR 69E,LA 87E,LE 94E,LI 45E,LJ 33E,LO 12E,LS 14E,LU 55E,LY 37E,LZ 75E,MA 46E,MB 21E,MD 16E,MI 38E,MN 70E,MO 26E,RH 16S,MS 76E,NA 71E,NI 47E,NU 56E,OS 11E,OX 85E,PA 23E,PD 84E,PG 57E,PR 29E,RE 58E,RI 59E,RO 22E,RU 95E,SA 28E,SK 61E,SM 60E,SO 72E,ST 73E,SU 82E,TA 62E,TI 78E,TN 77E,TO 15E,TR 98E,UT 79E,VA 25E,VE 36E,VG 80E,VI 20E,VL 81E,WA 17E,WE 83E,ZG 34E,ZU 48E'.split(',');
  const PATTERNS = ['stripV', 'slots', 'window', 'grooveDiag', 'porthole', 'grooveV', 'steps', 'solidH', 'stripL', 'grid', 'stripCentre', 'grooveFrame'];
  const SOLID = ['grooveDiag', 'solidH', 'grooveFrame'];
  const hash = s => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

  const TYPES = [
    { id: 'single', label: 'Single door', l: 0, r: 0, o: 0 },
    { id: 'sl-left', label: 'Door + left sidelight', l: 1, r: 0, o: 0 },
    { id: 'sl-right', label: 'Door + right sidelight', l: 0, r: 1, o: 0 },
    { id: 'sl-both', label: 'Door + both sidelights', l: 1, r: 1, o: 0 },
    { id: 'ol', label: 'Door + overlight', l: 0, r: 0, o: 1 },
    { id: 'sl-left-ol', label: 'Door + left sidelight + overlight', l: 1, r: 0, o: 1 },
    { id: 'sl-both-ol', label: 'Door + both sidelights + overlight', l: 1, r: 1, o: 1 }
  ];
  const SYSTEMS = [
    { id: 'AFL', name: 'Schüco AFL', minW: 700, maxW: 1300, minH: 1800, maxH: 2500, depth: '75 mm', uValue: 'Ud from 1.1 W/m²K', desc: 'Slim, cost-efficient aluminium door system with a 75 mm basic depth. Good thermal insulation for standard residential entrances.' },
    { id: 'ARL95', name: 'Schüco ARL 95', minW: 800, maxW: 1400, minH: 1900, maxH: 2600, depth: '95 mm', uValue: 'Ud from 0.86 W/m²K', desc: 'Panel-door system with a 95 mm leaf. Leaf-covering panel on the outside, rebated frame on the inside.' },
    { id: 'ASL95', name: 'Schüco ASL 95', minW: 800, maxW: 1500, minH: 1900, maxH: 2800, depth: '95 mm', uValue: 'Ud from 0.79 W/m²K', desc: 'Flush-fitting panel door: the leaf panel sits flush with the frame on the outside for a seamless façade.' },
    { id: 'EDGE95', name: 'Schüco EDGE 95', minW: 900, maxW: 1600, minH: 2000, maxH: 3000, depth: '95 mm', uValue: 'Ud from 0.72 W/m²K', desc: 'Premium system with fully concealed frame and leaf on both sides, suited to large-format pivot-look entrances.' }
  ];

  const MODELS = CODES.map(code => {
    const h = hash(code);
    let pattern = PATTERNS[h % PATTERNS.length];
    let types = TYPES.map(t => t.id), systems = SYSTEMS.map(s => s.id), variants = ['A', 'B'];
    if (h % 3 === 0) variants = ['A', 'B', 'C'];
    if (h % 7 === 0) types = ['single', 'sl-left', 'sl-right', 'sl-both'];
    if (h % 7 === 1) types = ['single', 'ol'];
    if (h % 5 === 0) systems = ['ARL95', 'ASL95', 'EDGE95'];
    if (h % 5 === 1) systems = ['AFL', 'ARL95', 'ASL95'];
    if (code === 'AL1 88E') { pattern = 'stripV'; types = TYPES.map(t => t.id); systems = SYSTEMS.map(s => s.id); variants = ['A', 'B']; }
    return { code, seed: h, pattern, glass: !SOLID.includes(pattern) };
  });

  const RULES = { models: {}, types: {}, systems: {} };
  MODELS.forEach(m => {
    const h = m.seed;
    let types = TYPES.map(t => t.id), systems = SYSTEMS.map(s => s.id), variants = ['A', 'B'];
    if (h % 3 === 0) variants = ['A', 'B', 'C'];
    if (h % 7 === 0) types = ['single', 'sl-left', 'sl-right', 'sl-both'];
    if (h % 7 === 1) types = ['single', 'ol'];
    if (h % 5 === 0) systems = ['ARL95', 'ASL95', 'EDGE95'];
    if (h % 5 === 1) systems = ['AFL', 'ARL95', 'ASL95'];
    if (m.code === 'AL1 88E') { types = TYPES.map(t => t.id); systems = SYSTEMS.map(s => s.id); variants = ['A', 'B']; }
    RULES.models[m.code] = { types, systems, variants };
  });
  TYPES.forEach(t => RULES.types[t.id] = { overlight: !!t.o });
  SYSTEMS.forEach(s => RULES.systems[s.id] = { minW: s.minW, maxW: s.maxW, minH: s.minH, maxH: s.maxH });

  const TEX = {
    fs: hex => `radial-gradient(rgba(255,255,255,.14) 1px, transparent 1.4px) 0 0/4px 4px, radial-gradient(rgba(0,0,0,.12) 1px, transparent 1.4px) 2px 2px/4px 4px, ${hex}`,
    wood: hex => `repeating-linear-gradient(92deg, rgba(0,0,0,.20) 0 1px, transparent 1px 5px, rgba(255,255,255,.08) 5px 7px, transparent 7px 12px), linear-gradient(90deg, rgba(0,0,0,.08), rgba(255,255,255,.06), rgba(0,0,0,.1)), ${hex}`,
    concrete: hex => `radial-gradient(rgba(0,0,0,.16) 1px, transparent 1.6px) 0 0/7px 7px, radial-gradient(rgba(255,255,255,.14) 1px, transparent 1.6px) 3px 4px/9px 9px, ${hex}`,
    metal: hex => `linear-gradient(135deg, rgba(255,255,255,.28), rgba(0,0,0,.16) 50%, rgba(255,255,255,.22)), ${hex}`,
    rust: hex => `radial-gradient(circle at 28% 30%, rgba(196,108,48,.7), transparent 42%), radial-gradient(circle at 72% 70%, rgba(58,22,10,.55), transparent 46%), ${hex}`,
    carbon: hex => `repeating-linear-gradient(45deg, rgba(255,255,255,.07) 0 2px, transparent 2px 4px), repeating-linear-gradient(-45deg, rgba(0,0,0,.3) 0 2px, transparent 2px 4px), ${hex}`
  };
  const col = (id, name, hex, tex) => ({ id, name, hex, tex: tex || null, bg: tex ? TEX[tex](hex) : hex });

  const RECBASE = [['9003', 'Signal white', '#ECECE7'], ['9010', 'Pure white', '#F1ECE1'], ['9016', 'Traffic white', '#F1F0EA'], ['9006', 'White aluminium', '#A1A1A0'], ['9007', 'Grey aluminium', '#878581'], ['6005', 'Moss green', '#114232'], ['7016', 'Anthracite grey', '#383E42'], ['8017', 'Chocolate brown', '#442F29']];
  const RECOMMENDED = [];
  RECBASE.forEach(([c, , hex]) => { RECOMMENDED.push(col(`rec-${c}-m`, `RAL ${c} matte`, hex)); RECOMMENDED.push(col(`rec-${c}-fs`, `RAL ${c} FS`, hex, 'fs')); });
  const FINISHES = [['F-29/80077', '#5B5652', 'fs'], ['Grigio Antico', '#6F6A63', 'concrete'], ['Punto Grigio', '#8B8B88', 'fs'], ['Quartz 1', '#9A968F', 'metal'], ['Quartz 2', '#6C6A66', 'metal'], ['Concrete Light', '#B5B2AC', 'concrete'], ['Concrete Dark', '#6D6B67', 'concrete'], ['Rust', '#8A4B2A', 'rust'], ['Archi Light', '#C9C4BB', 'concrete'], ['Archi Dark', '#3E3C3A', 'fs'], ['Carbon', '#2B2C2E', 'carbon'], ['Salt Lake Black', '#1F1F20', 'fs']]
    .map(([n, hex, t]) => col('fin-' + n.toLowerCase().replace(/[^a-z0-9]+/g, '-'), n, hex, t));
  const WOODGRAIN = [['Wenge FS', '#3B2A22'], ['Walnut dark FS', '#4A3022'], ['Light oak FS', '#C19A6B'], ['Golden oak FS', '#A5692E'], ['Dark oak FS', '#5B3A22'], ['Cherry', '#8E4A2E'], ['Mahogany', '#5D2A1C'], ['Oak rustic', '#8C6A46'], ['Zebrano L', '#C9B48E'], ['Zebrano D', '#6B5136']]
    .map(([n, hex]) => col('wood-' + n.toLowerCase().replace(/[^a-z0-9]+/g, '-'), n, hex, 'wood'));

  const RALSRC = '1000|Green beige|CDBA88;1001|Beige|D0B084;1002|Sand yellow|D2AA6D;1003|Signal yellow|F9A800;1004|Golden yellow|E49E00;1005|Honey yellow|CB8E00;1006|Maize yellow|E29000;1007|Daffodil yellow|E88C00;1011|Brown beige|AF804F;1012|Lemon yellow|DDAF27;1013|Oyster white|E3D9C6;1014|Ivory|DDC49A;1015|Light ivory|E6D2B5;1016|Sulfur yellow|F1DD38;1017|Saffron yellow|F6A950;1018|Zinc yellow|FACA30;1019|Grey beige|A48F7A;1020|Olive yellow|A08F65;1021|Rape yellow|F6B600;1023|Traffic yellow|F7B500;1024|Ochre yellow|BA8F4C;1026|Luminous yellow|FFFF00;1027|Curry|A77F0E;1028|Melon yellow|FF9B00;1032|Broom yellow|E2A300;1033|Dahlia yellow|F99A1C;1034|Pastel yellow|EB9C52;1035|Pearl beige|908370;1036|Pearl gold|80643F;1037|Sun yellow|F09200;' +
    '2000|Yellow orange|DA6E00;2001|Red orange|BA481B;2002|Vermilion|BF3922;2003|Pastel orange|F67828;2004|Pure orange|E25303;2005|Luminous orange|FF4D06;2007|Luminous bright orange|FFB200;2008|Bright red orange|ED6B21;2009|Traffic orange|DE5307;2010|Signal orange|D05D28;2011|Deep orange|E26E0E;2012|Salmon orange|D5654D;2013|Pearl orange|923E25;' +
    '3000|Flame red|A72920;3001|Signal red|9B2423;3002|Carmine red|9B2321;3003|Ruby red|861A22;3004|Purple red|6B1C23;3005|Wine red|59191F;3007|Black red|3E2022;3009|Oxide red|6D342D;3011|Brown red|782423;3012|Beige red|C5856D;3013|Tomato red|972E25;3014|Antique pink|CB7375;3015|Light pink|D8A0A6;3016|Coral red|A63D2F;3017|Rose|CB555D;3018|Strawberry red|C73F4A;3020|Traffic red|BB1E10;3022|Salmon pink|CF6955;3024|Luminous red|FF2D21;3026|Luminous bright red|FF2A1B;3027|Raspberry red|AB273C;3028|Pure red|CC2C24;3031|Orient red|A63437;3032|Pearl ruby red|701D23;3033|Pearl pink|A53A2D;' +
    '4001|Red lilac|816183;4002|Red violet|8D3C4B;4003|Heather violet|C4618C;4004|Claret violet|651E38;4005|Blue lilac|76689A;4006|Traffic purple|903373;4007|Purple violet|47243C;4008|Signal violet|844C82;4009|Pastel violet|9D8692;4010|Telemagenta|BC4077;4011|Pearl violet|6E6387;4012|Pearl blackberry|6B6B7F;' +
    '5000|Violet blue|314F6F;5001|Green blue|0F4C64;5002|Ultramarine blue|00387B;5003|Sapphire blue|1F3855;5004|Black blue|191E28;5005|Signal blue|005387;5007|Brilliant blue|376B8C;5008|Grey blue|2B3A44;5009|Azure blue|225F78;5010|Gentian blue|004F7C;5011|Steel blue|1A2B3C;5012|Light blue|0089B6;5013|Cobalt blue|193153;5014|Pigeon blue|637D96;5015|Sky blue|007CB0;5017|Traffic blue|005B8C;5018|Turquoise blue|058B8C;5019|Capri blue|005E83;5020|Ocean blue|00414B;5021|Water blue|007577;5022|Night blue|222D5A;5023|Distant blue|42698C;5024|Pastel blue|6093AC;5025|Pearl gentian blue|21697C;5026|Pearl night blue|0F3052;' +
    '6000|Patina green|3C7460;6001|Emerald green|366735;6002|Leaf green|325928;6003|Olive green|50533C;6004|Blue green|024442;6005|Moss green|114232;6006|Grey olive|3C392E;6007|Bottle green|2C3222;6008|Brown green|37342A;6009|Fir green|27352A;6010|Grass green|4D6F39;6011|Reseda green|6B7C59;6012|Black green|2F3D3A;6013|Reed green|7C765A;6014|Yellow olive|474135;6015|Black olive|3D3D36;6016|Turquoise green|00694C;6017|May green|587F40;6018|Yellow green|61993B;6019|Pastel green|B9CEAC;6020|Chrome green|37422F;6021|Pale green|8A9977;6022|Olive drab|3A3327;6024|Traffic green|008351;6025|Fern green|5E6E3B;6026|Opal green|005F4E;6027|Light green|7EBAB5;6028|Pine green|315442;6029|Mint green|006F3D;6032|Signal green|237F52;6033|Mint turquoise|46877F;6034|Pastel turquoise|7AACAC;6035|Pearl green|194D25;6036|Pearl opal green|04574B;6037|Pure green|008B29;6038|Luminous green|00B51A;' +
    '7000|Squirrel grey|7A888E;7001|Silver grey|8C979C;7002|Olive grey|817863;7003|Moss grey|7A7669;7004|Signal grey|9B9B9B;7005|Mouse grey|6C6E6B;7006|Beige grey|766A5E;7008|Khaki grey|745E3D;7009|Green grey|5D6058;7010|Tarpaulin grey|585C56;7011|Iron grey|52595D;7012|Basalt grey|575D5E;7013|Brown grey|575044;7015|Slate grey|4F5358;7016|Anthracite grey|383E42;7021|Black grey|2F3234;7022|Umbra grey|4C4A44;7023|Concrete grey|808076;7024|Graphite grey|45494E;7026|Granite grey|374345;7030|Stone grey|928E85;7031|Blue grey|5B686D;7032|Pebble grey|B5B0A1;7033|Cement grey|7F8274;7034|Yellow grey|92886F;7035|Light grey|C5C7C4;7036|Platinum grey|979392;7037|Dusty grey|7A7B7A;7038|Agate grey|B0B0A9;7039|Quartz grey|6B665E;7040|Window grey|989EA1;7042|Traffic grey A|8E9291;7043|Traffic grey B|4F5250;7044|Silk grey|B7B3A8;7045|Telegrey 1|8D9295;7046|Telegrey 2|7F868A;7047|Telegrey 4|C8C8C7;7048|Pearl mouse grey|817B73;' +
    '8000|Green brown|89693E;8001|Ochre brown|9D622B;8002|Signal brown|794D3E;8003|Clay brown|7E4B26;8004|Copper brown|8D4931;8007|Fawn brown|70452A;8008|Olive brown|724A25;8011|Nut brown|5A3826;8012|Red brown|66332B;8014|Sepia brown|4A3526;8015|Chestnut brown|5E2F26;8016|Mahogany brown|4C2B20;8017|Chocolate brown|442F29;8019|Grey brown|3D3635;8022|Black brown|1A1718;8023|Orange brown|A45729;8024|Beige brown|795038;8025|Pale brown|755847;8028|Terra brown|513A2A;8029|Pearl copper|7F4031;' +
    '9001|Cream|E9E0D2;9002|Grey white|D7D5CB;9003|Signal white|ECECE7;9004|Signal black|2B2B2C;9005|Jet black|0E0E10;9006|White aluminium|A1A1A0;9007|Grey aluminium|878581;9010|Pure white|F1ECE1;9011|Graphite black|27292B;9016|Traffic white|F1F0EA;9017|Traffic black|2A292A;9018|Papyrus white|C8CBC4;9022|Pearl light grey|858583;9023|Pearl dark grey|797B7A';
  const RAL = RALSRC.split(';').map(r => { const [c, n, hx] = r.split('|'); const o = col('ral-' + c, 'RAL ' + c, '#' + hx); o.code = c; o.label = n; return o; });

  const GLASS_GROUPS = [
    { name: 'Security glass for door', items: [
      { id: 'vsg-out', name: 'VSG outside', desc: 'Laminated safety glass on the outer pane', tex: 'clear' },
      { id: 'vsg-in', name: 'VSG inside', desc: 'Laminated safety glass on the inner pane', tex: 'clear' },
      { id: 'vsg-both', name: 'VSG double-sided', desc: 'Laminated safety glass on both panes', tex: 'clear' }] },
    { name: 'Ornament glass', items: [
      { id: 'chinchilla', name: 'Chinchilla white', desc: 'Pebbled obscure pattern', tex: 'dots' },
      { id: 'clear', name: 'Clear glass', desc: 'Transparent float glass', tex: 'clear' },
      { id: 'mastercarre', name: 'Mastercarre white', desc: 'Small square grid pattern', tex: 'squares' },
      { id: 'masterligne', name: 'Masterligne white', desc: 'Fine linear pattern', tex: 'lines' },
      { id: 'satinato', name: 'Satinato white', desc: 'Even satin obscure finish', tex: 'satin' }] },
    { name: 'Decorative glass', items: [
      { id: 'deco-stripes', name: 'Sandblasted stripes', desc: 'Clear glass with satin bands', tex: 'stripes' },
      { id: 'deco-grey', name: 'Grey tinted float', desc: 'Neutral grey body tint', tex: 'grey' },
      { id: 'deco-bronze', name: 'Bronze tinted float', desc: 'Warm bronze body tint', tex: 'bronze' }] }
  ];
  const GLASS_BG = {
    clear: 'linear-gradient(135deg, #a9bcc4 0%, #dbe6ea 38%, #b5c6cd 39%, #c9d7dc 100%)',
    dots: 'radial-gradient(rgba(255,255,255,.9) 1.4px, transparent 2px) 0 0/6px 6px, radial-gradient(rgba(150,165,172,.55) 1.4px, transparent 2px) 3px 3px/6px 6px, #dde4e7',
    squares: 'linear-gradient(rgba(150,165,172,.5) 1px, transparent 1px) 0 0/6px 6px, linear-gradient(90deg, rgba(150,165,172,.5) 1px, transparent 1px) 0 0/6px 6px, #e3e9eb',
    lines: 'repeating-linear-gradient(0deg, rgba(150,165,172,.55) 0 1px, transparent 1px 4px), #e3e9eb',
    satin: 'linear-gradient(135deg, #eef2f3, #dfe6e8)',
    stripes: 'repeating-linear-gradient(0deg, #e7ecee 0 6px, #b7c8cf 6px 12px)',
    grey: 'linear-gradient(135deg, #5f676a, #8a9396 40%, #646c6f 41%, #737c7f)',
    bronze: 'linear-gradient(135deg, #6f5843, #9a8068 40%, #735c47 41%, #7f6650)'
  };
  GLASS_GROUPS.forEach(g => g.items.forEach(i => i.bg = GLASS_BG[i.tex]));

  const LENGTHS = [550, 750, 950, 1150, 1600, 1900];
  const fam = (id, name, spec, profile, w, extra) => Object.assign({ id, name, spec, profile, w, options: LENGTHS.map(L => ({ id: `${id}-${L}`, label: `${name.split(' ')[0]} ${L / 10 >= 100 ? L / 10 : L / 10} — ${L} mm`, code: `${name.split(' ')[0]} ${L / 10}`, len: L })) }, extra || {});
  const HANDLES = [
    fam('OCR', 'OCR', 'Brushed stainless steel bar handle, Ø30 mm round profile, concealed fixings.', 'round', 30),
    fam('KCR', 'KCR', 'Brushed stainless steel bar handle, 30 × 30 mm square profile.', 'square', 30),
    fam('KCK', 'KCK', 'Brushed stainless steel bar handle, 40 × 40 mm square profile.', 'square', 40),
    fam('KCRF', 'KCRF dline', 'Square 30 × 30 mm bar with fin, prepared for the ekey dLine fingerprint reader.', 'square', 30, { fin: true }),
    fam('KCRFB', 'KCRF dline black', 'Black-coated 30 × 30 mm bar with fin, prepared for the ekey dLine fingerprint reader.', 'square', 30, { fin: true, black: true })
  ];
  HANDLES[2].options.splice(2, 0, { id: 'KCK-750H', label: 'KCK 750 Horizontal', code: 'KCK 750 H', len: 750, horizontal: true });
  HANDLES[3].options.forEach(o => { o.code = 'KCRF ' + o.len / 10; o.label = `KCRF ${o.len / 10} — ${o.len} mm`; });
  HANDLES[4].options.forEach(o => { o.code = 'KCRF ' + o.len / 10 + ' black'; o.label = `KCRF ${o.len / 10} black — ${o.len} mm`; });
  const INSIDE_HANDLES = [
    { id: 'lever-ss', name: 'Lever handle, brushed stainless steel' },
    { id: 'lever-blk', name: 'Lever handle, black' },
    { id: 'pull', name: 'Inside pull bar, matching outside handle' }
  ];

  const ACC_SERIES = { 'JZ 5': 'House number plate', 'JZ 10': 'House number plate XL', 'PZ 1': 'Letter plate', 'KZ 1': 'Doorbell push', 'OZ 1': 'Door viewer', 'PZ 5': 'Letter plate with logo' };
  const FIN = { B: 'brushed stainless', P: 'polished stainless', C: 'black' };
  const ACCESSORIES = 'JZB 51,JZP 50,JZC 51,JZB 101,JZP 100,JZC 101,PZB 11,PZP 10,PZC 11,KZB 11,KZP 10,KZC 11,OZB 11,OZP 10,OZC 11,PZB 51 LOGO,PZP 50 LOGO,PZC 51 LOGO'.split(',').map(code => {
    const kind = code.slice(0, 1) + code.slice(1, 2) + ' ' + code.split(' ')[1].slice(0, code.split(' ')[1].length - 1);
    const series = ACC_SERIES[kind] || 'Accessory';
    const f = code[2];
    return { code, name: series, finish: FIN[f], f, kind: code.slice(0, 2) + (code.includes('LOGO') ? 'L' : (code.includes('10') && code.startsWith('J') ? 'X' : '')) };
  });

  const LOCKS = [
    { id: 'SH2', name: 'SH 2', desc: 'Mechanical multi-point lock', items: ['Profile cylinder', '5 keys'] },
    { id: 'M4', name: 'M4 LOCK', desc: 'Motorised multi-point lock', items: ['Motor lock', 'Power supply', 'Cable transition'] },
    { id: 'AV3', name: 'AUTOLOCK AV3', desc: 'Automatic self-locking multi-point lock', items: ['Automatic lock', 'Profile cylinder'] },
    { id: 'AV3FP', name: 'AUTOLOCK AV3 set with fingerprint', desc: 'Self-locking lock with fingerprint access', items: ['AV3 lock', 'Fingerprint reader', 'Control unit', 'Power supply'], device: 'fp' },
    { id: 'EKEY', name: 'ekey dLine fingerprint', desc: 'Fingerprint reader in the frame', items: ['Adapter cable', 'Control unit', 'Cable transition', 'Power supply'], device: 'fp' },
    { id: 'EKEYB', name: 'ekey dLine fingerprint black', desc: 'Fingerprint reader in the frame, black', items: ['Adapter cable', 'Control unit', 'Cable transition', 'Power supply'], device: 'fpb' },
    { id: 'EUBS', name: 'eubioreader silver', desc: 'Frame-mounted biometric reader', items: ['Control unit r7-CU-201', 'Cables'], device: 'fp' },
    { id: 'EUBB', name: 'eubioreader black', desc: 'Frame-mounted biometric reader, black', items: ['Control unit r7-CU-201', 'Cables'], device: 'fpb' },
    { id: 'EUTP', name: 'eubiotouchpad', desc: 'Keypad with integrated fingerprint reader', items: ['Keypad with fingerprint reader', 'Mini control unit', 'Cable set'], device: 'pad' },
    { id: 'WKB', name: 'White keyboard WKB', desc: 'Code keypad, white', items: ['Keypad', 'Control unit'], device: 'padw' },
    { id: 'BKB', name: 'Black keyboard BKB', desc: 'Code keypad, black', items: ['Keypad', 'Control unit'], device: 'pad' },
    { id: 'EKEYH', name: 'ekey dLine fingerprint on handle', desc: 'Fingerprint reader integrated in the bar handle', items: ['Fingerprint reader', 'Control unit', 'Cable transition', 'Power supply'], device: 'fph' }
  ];

  const SHOWROOMS = ['No preference', 'Main showroom', 'Trade showroom', 'Video consultation'];
  const DEFAULT = {
    model: 'AL1 88E', variant: 'A', type: 'single', system: 'AFL', width: 1100, height: 2100,
    panel: '1side', overlight: 'fixed', opening: 'R-in',
    colours: { outside: 'rec-7016-fs', inside: 'rec-9016-m', frame: 'rec-7016-fs' },
    glass: 'satinato', handle: 'KCR-1600', handleColour: false, handleRal: '9005', insideHandle: 'lever-ss',
    accessories: [], lock: 'SH2'
  };

  const ALLCOL = [...RECOMMENDED, ...FINISHES, ...WOODGRAIN, ...RAL];
  const by = (arr, k) => Object.fromEntries(arr.map(x => [x[k], x]));
  export const D: any = {
    MODELS, TYPES, SYSTEMS, RULES, RECOMMENDED, FINISHES, WOODGRAIN, RAL, GLASS_GROUPS, HANDLES, INSIDE_HANDLES, ACCESSORIES, LOCKS, SHOWROOMS, DEFAULT,
    modelByCode: by(MODELS, 'code'), typeById: by(TYPES, 'id'), systemById: by(SYSTEMS, 'id'), colourById: by(ALLCOL, 'id'),
    glassById: by(GLASS_GROUPS.flatMap(g => g.items), 'id'), handleById: Object.fromEntries(HANDLES.flatMap(f => f.options.map(o => [o.id, Object.assign({ fam: f }, o)]))),
    lockById: by(LOCKS, 'id'), ralByCode: by(RAL, 'code'), insideById: by(INSIDE_HANDLES, 'id')
  };

