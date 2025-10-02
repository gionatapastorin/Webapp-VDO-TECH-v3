/**
* Vignes d’OR – WebApp unica (Nettoyage Clim + Hivernage MH)
* Configura qui gli ID e i nomi dei tab destinazione.
*/


const DATA_SPREADSHEET_ID = '1Tr8uwPSiIkej4LD9fENXcke2RYZmJ_CAQtBRx6qmTt4'; // ← cambia se necessario


// === CONFIG ===
const CODES_SPREADSHEET_ID = '13wRmPBlM94B8HzKTIVaPZq7ZkuyQTXfXSAdtbPMQZNc';
const TAB_CODES = 'CodesAccès';


/**
* Validazione codice d’accesso:
* - Cerca il codice in TAB CodesAccès (colonne: Code, Nom, Rôle, Actif, Expire)
* - Ritorna { ok, user: {name, role}, reason? }
*/
/**
 * Validazione codice d’accesso (solo Rôle = Technique):
 * Ritorna { ok, user:{name, role}, reason? }
 */
function validateAccessCode(code) {
  if (!code) return { ok: false, reason: 'Codice vuoto' };

  const sh = SpreadsheetApp.openById(CODES_SPREADSHEET_ID).getSheetByName(TAB_CODES);
  if (!sh) return { ok: false, reason: 'Tab CodesAccès non trovato' };

  const values = sh.getDataRange().getValues(); // header + righe
  const header = values[0].map(String);
  const idx = (name) => header.findIndex(h => h.trim().toLowerCase() === name.trim().toLowerCase());

  const iCode   = idx('code');
  const iNom    = idx('nom');
  const iRole   = (idx('rôle') !== -1 ? idx('rôle') : idx('role'));
  const iActif  = idx('actif');
  const iExpire = idx('expire');

  if (iCode === -1 || iNom === -1) {
    return { ok: false, reason: 'Colonne Code/Nom mancanti in CodesAccès' };
  }
  // Se manca la colonna ruolo, per sicurezza rifiutiamo
  if (iRole === -1) {
    return { ok: false, reason: 'Colonne Rôle manquante' };
  }

  const codeIn = String(code).trim();
  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const rowCode = String(row[iCode] || '').trim();
    if (!rowCode || rowCode !== codeIn) continue;

    const name  = String(row[iNom]  || '').trim();
    const role  = String(row[iRole] || '').trim();
    const actif = iActif !== -1 ? !!row[iActif] : true;

    // Scadenza opzionale
    if (iExpire !== -1 && row[iExpire]) {
      try {
        const exp = new Date(row[iExpire]);
        if (isFinite(exp) && exp < new Date()) return { ok: false, reason: 'Codice scaduto' };
      } catch (e) {}
    }
    if (!actif) return { ok: false, reason: 'Codice disattivato' };

    // ✅ Solo "Technique" (case-insensitive, accetta stringhe tipo "Équipe Technique", "Technique;Admin", ecc.)
    const hasTechnique = String(role).toLowerCase().split(/[^a-zà-ú]+/i).includes('technique');
    if (!hasTechnique) return { ok: false, reason: "Accès réservé à l'équipe Technique" };

    return { ok: true, user: { name: name || codeIn, role: role || '' } };
  }
  return { ok: false, reason: 'Code non valide' };
}

//FINE LOGIN


function doGet(e) {
 var ICON = 'https://i.ibb.co/gbbRG9Nx/1.png'; // icona unica HQ


 // Serve manifest.json (PWA)
 if (e && e.parameter && e.parameter.manifest === '1') {
   var manifest = {
     name: "Vignes d'OR – Equipe Technique",
     short_name: "Vignes d'OR",
     start_url: "/",
     display: "standalone",
     background_color: "#d4edbc",
     theme_color: "#11735D",
     icons: [
       { src: ICON, sizes: "192x192", type: "image/png", purpose: "any" },
       { src: ICON, sizes: "512x512", type: "image/png", purpose: "any" },
       { src: ICON, sizes: "192x192", type: "image/png", purpose: "maskable" },
       { src: ICON, sizes: "512x512", type: "image/png", purpose: "maskable" }
     ]
   };
   return ContentService.createTextOutput(JSON.stringify(manifest)).setMimeType(ContentService.MimeType.JSON);
 }


 // Serve l'icona come PNG dallo stesso dominio (per iOS):
 if (e && e.parameter && e.parameter.icon) {
   try {
     var resp = UrlFetchApp.fetch(ICON, {followRedirects:true, muteHttpExceptions:true});
     var blob = resp.getBlob().setName('icon.png');
     // Forza content-type PNG per iOS
     return ContentService.createBinaryOutput(blob.getBytes()).setMimeType(ContentService.MimeType.PNG);
   } catch (err) {
     return ContentService.createTextOutput('icon error').setMimeType(ContentService.MimeType.TEXT);
   }
 }


 return HtmlService.createTemplateFromFile('Index')
   .evaluate()
   .setTitle("Vignes d'OR – Equipe Technique")
   .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
   .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
   .setFaviconUrl(ICON);
}


function include(filename){
 return HtmlService.createHtmlOutputFromFile(filename).getContent();
}


// ===== Funzioni per "Nettoyage Clim" (pari alle originali) =====
/** Ritorna [{value: B, label: "B C"}] per le righe dove S è vuota/false */
function getMhOptions() { // <== nome richiesto dalla view CLIM
 const ss  = SpreadsheetApp.openById(DATA_SPREADSHEET_ID);
 const sh  = ss.getSheetByName('Avancement');
 if (!sh) throw new Error('Feuille "Avancement" introuvable.');
 const values = sh.getDataRange().getValues();
 const out = [];
 for (let i = 1; i < values.length; i++) {
   const row = values[i];
   const B = String(row[1] ?? '').trim();  // col B
   const C = String(row[2] ?? '').trim();  // col C
   const S = row[18];                      // col S
   if (!B) continue;
   if (S === '' || S === null || S === false) {
     out.push({ value: B, label: (B + (C ? ' ' + C : '')).trim() });
   }
 }
 return out;
}


/** Scrive: A=data/ora, B=n°MH, C=Qui */
function submitForm(payload) {
 const ss = SpreadsheetApp.openById(DATA_SPREADSHEET_ID);
 const sh = ss.getSheetByName('formCLIMA') || ss.insertSheet('formCLIMA');
 const now = Utilities.formatDate(new Date(), 'Europe/Paris', 'dd/MM/yyyy HH:mm:ss');
 sh.appendRow([now, payload.mh || '', payload.person || '']);
 return { row: sh.getLastRow() };
}


// ===== Funzioni per "Hivernage Technique" (pari alle originali) =====
/** Legge MH dove colonna O è vuota → {value:B,label:B+" "+C} */
function getMHOptions() { // <== nome richiesto dalla view Hiver
 const ss = SpreadsheetApp.openById(DATA_SPREADSHEET_ID);
 const sh = ss.getSheetByName('Avancement');
 if (!sh) return [];
 const values = sh.getDataRange().getValues();
 const out = [];
 for (let r = 1; r < values.length; r++) {
   const row = values[r];
   const numMH = row[1];      // B
   const colC  = row[2];      // C
   const colO  = row[14];     // O
   if (numMH && (colO === '' || colO === null)) {
     out.push({ value: String(numMH), label: String(numMH) + (colC ? (' ' + colC) : '') });
   }
 }
 return out;
}


/** Salva su formHIVERNAGEtec: A=data/ora FR, B=Qui, C=MH, D+=Ok */
function submitHivernage(payload) {
 const ss = SpreadsheetApp.openById(DATA_SPREADSHEET_ID);
 const sh = ss.getSheetByName('formHIVERNAGEtec') || ss.insertSheet('formHIVERNAGEtec');
 const nowStr = Utilities.formatDate(new Date(), 'Europe/Paris', 'dd/MM/yyyy HH:mm');
 const row = [];
 row.push(nowStr);                 // A
 row.push(payload.qui || '');      // B
 row.push(payload.mh  || '');      // C
 const checks = Array.isArray(payload.checks) ? payload.checks : [];
 for (let i = 0; i < checks.length; i++) row.push(checks[i] ? 'Ok' : '');
 sh.appendRow(row);
 return { row: sh.getLastRow() };
}
