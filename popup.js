// Clipboard Transformer - popup logic
// Runs in the popup context. On load, attempts to read the clipboard (requires user gesture for some browsers).

const detectedEl = document.getElementById('detected-format')
const statusEl = document.getElementById('status')
const outputEl = document.getElementById('output')

const btnCSVComma = document.getElementById('to-csv-comma')
const btnCSVPipe = document.getElementById('to-csv-pipe')
const btnJSON = document.getElementById('to-json')
const btnTSV = document.getElementById('to-tsv')
const btnJOOQ = document.getElementById('to-jooq')
const btnDetect = document.getElementById('detect')
const pasteInput = document.getElementById('paste-input')
const btnUsePaste = document.getElementById('use-paste')

let lastClipboardText = ''
let detected = 'n/a'

// Helpers for storing whether auto-detect should be enabled
function permissionContainsClipboard(){
  return new Promise(resolve=>{
    if(typeof chrome==='undefined' || !chrome.permissions || !chrome.permissions.contains) return resolve(false)
    try{
      chrome.permissions.contains({permissions:['clipboardRead']}, granted=>resolve(!!granted))
    }catch(e){ resolve(false) }
  })
}

function setAutoDetectFlag(){
  return new Promise(resolve=>{
    if(typeof chrome!=='undefined' && chrome.storage && chrome.storage.local){
      chrome.storage.local.set({clipboardAutodetect:true}, ()=>resolve())
    }else{
      try{ localStorage.setItem('clipboardAutodetect','1') }catch(e){}
      resolve()
    }
  })
}

function getAutoDetectFlag(){
  return new Promise(resolve=>{
    if(typeof chrome!=='undefined' && chrome.storage && chrome.storage.local){
      chrome.storage.local.get(['clipboardAutodetect'], res=>resolve(Boolean(res.clipboardAutodetect)))
    }else{
      try{ resolve(Boolean(localStorage.getItem('clipboardAutodetect'))) }catch(e){ resolve(false) }
    }
  })
}

function setStatus(s){ statusEl.textContent = s }

async function readClipboardText(){
  try{
    const text = await navigator.clipboard.readText()
    lastClipboardText = text
    // if read succeeds, enable auto-detect for future popup opens
    try{ await setAutoDetectFlag() }catch(e){}
    // hide the detect button if present
    try{ if(btnDetect) btnDetect.style.display = 'none' }catch(e){}
    return text
  }catch(e){
    // Common cases: NotAllowedError (needs user gesture), NotFoundError (no clipboard data)
    if(e.name==='NotAllowedError' || e.name==='NotReadableError'){
      setStatus('Clipboard access blocked — click "Detect clipboard" to allow')
    }else{
      setStatus('Unable to read clipboard: '+(e.message||e.name))
    }
    return ''
  }
}

function detectFormat(text){
  if(!text || !text.trim()) return 'n/a'
  const trimmed = text.trim()
  // JSON detection
  if((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))){
    try{ JSON.parse(trimmed); return 'JSON' } catch(e){}
  }
  // JOOQ-ish detection: lines like (1, 'a', true), (2, 'b', false)
  const jooqLike = /^\(?\s*\d+\s*(,\s*'.*?')+/m
  if(jooqLike.test(trimmed)) return 'JOOQ'
  // CSV vs TSV vs PSV: count separators on first non-empty line
  const lines = trimmed.split(/\r?\n/).filter(l=>l.trim())
  if(lines.length===0) return 'n/a'
  const first = lines[0]
  const commas = first.split(',').length
  const pipes = first.split('|').length
  const tabs = first.split('\t').length
  if(tabs>commas && tabs>pipes) return 'TSV'
  if(pipes>commas && pipes>tabs) return 'CSV (pipe)'
  if(commas>tabs && commas>pipes) return 'CSV (comma)'
  return 'n/a'
}

// CSV parsing respecting quotes (basic)
function parseCSV(text, sep=','){
  const rows = []
  let cur = []
  let i=0
  let field = ''
  let inQuotes = false
  while(i<text.length){
    const ch = text[i]
    if(inQuotes){
      if(ch==='"'){
        if(text[i+1]==='"'){ field += '"'; i+=2; continue }
        inQuotes=false; i++; continue
      }
      field += ch; i++; continue
    }
    if(ch==='"'){ inQuotes=true; i++; continue }
    if(ch===sep){ cur.push(field); field=''; i++; continue }
    if(ch==='\n' || ch==='\r'){
      // handle CRLF
      if(ch==='\r' && text[i+1]==='\n') i++
      cur.push(field); field=''
      rows.push(cur); cur=[]
      i++; continue
    }
    field += ch; i++
  }
  // push last
  if(field!=='' || cur.length>0){ cur.push(field); rows.push(cur) }
  return rows
}

function toCSVFromRows(rows, separator=','){
  return rows.map(r=>r.map(cell=>{
    if(cell==null) return ''
    const s = String(cell)
    const needsQuote = s.includes(separator) || s.includes('"') || s.includes('\n')
    if(needsQuote){
      return '"'+s.replace(/"/g,'""')+'"'
    }
    return s
  }).join(separator)).join('\n')
}

function toTSVFromRows(rows){
  return rows.map(r=>r.map(c=>c==null?'':String(c)).join('\t')).join('\n')
}

function rowsToJSON(rows){
  if(rows.length===0) return '[]'
  const header = rows[0]
  if(header.every(h=>h!=='')){
    const arr = rows.slice(1).map(r=>{
      const obj = {}
      for(let i=0;i<header.length;i++) obj[header[i]||`col${i+1}`] = r[i]||''
      return obj
    })
    return JSON.stringify(arr, null, 2)
  }
  // otherwise return array of arrays
  return JSON.stringify(rows, null, 2)
}

function rowsToJooq(rows){
  // Produce lines like (v1, v2, 'v3'), ... — we assume numeric if looks numeric
  return rows.map(r=>{
    const parts = r.map(cell=>{
      if(cell==null || cell==='') return 'NULL'
      const s = String(cell)
      if(/^\d+(\.\d+)?$/.test(s)) return s
      if(/^(true|false)$/i.test(s)) return s.toLowerCase()
      return "'"+s.replace(/'/g,"\\'")+"'"
    })
    return '('+parts.join(', ')+')'
  }).join(',\n')
}

function parseTSV(text){
  return text.split(/\r?\n/).map(line=>line.split('\t'))
}

function parseJooq(text){
  // Very lenient: extract parenthesized comma-separated values per line
  const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(l=>l)
  const rows = []
  for(const line of lines){
    const m = line.match(/\((.*)\)/)
    if(!m) continue
    const inside = m[1]
    // split by commas not in quotes
    const parts = []
    let cur=''
    let inQ=false
    for(let i=0;i<inside.length;i++){
      const ch = inside[i]
      if(ch==="'"){
        inQ = !inQ; cur+=ch; continue
      }
      if(ch===',' && !inQ){ parts.push(cur.trim()); cur=''; continue }
      cur+=ch
    }
    if(cur!=='') parts.push(cur.trim())
    const cleaned = parts.map(p=>{
      if(p.startsWith("'") && p.endsWith("'")) return p.slice(1,-1).replace(/\\'/g,"'")
      if(/^NULL$/i.test(p)) return ''
      return p
    })
    rows.push(cleaned)
  }
  return rows
}

async function doDetectAndShow(){
  const text = await readClipboardText()
  detected = detectFormat(text)
  detectedEl.textContent = detected
  setStatus(text? 'Ready' : 'Click Detect to read clipboard')
}

// Called when the user clicks the Detect button (user gesture allowed by browser)
btnDetect.addEventListener('click', async ()=>{
  setStatus('Reading clipboard...')
  let text = await readClipboardText()
  // If still blocked and chrome.permissions is available, try requesting optional permissions
  if(!text && typeof chrome !== 'undefined' && chrome.permissions && chrome.permissions.request){
    try{
      const granted = await new Promise(resolve=>{
        chrome.permissions.request({permissions:['clipboardRead','clipboardWrite']}, granted=>resolve(granted))
      })
      if(granted){
        setStatus('Permissions granted, reading...')
        text = await readClipboardText()
      }else{
        setStatus('Permissions not granted — use the paste box below')
      }
    }catch(e){
      // ignore permission API errors
    }
  }
  detected = detectFormat(text)
  detectedEl.textContent = detected
  if(text) setStatus('Ready')
})

btnUsePaste.addEventListener('click', ()=>{
  const text = pasteInput.value
  if(!text || !text.trim()){ setStatus('Paste some data first'); return }
  lastClipboardText = text
  detected = detectFormat(text)
  detectedEl.textContent = detected
  setStatus('Using pasted data')
})

async function convertAndCopy(to){
  const text = lastClipboardText || await readClipboardText()
  if(!text){ setStatus('No clipboard text'); return }
  let rows = []
  try{
    if(detected==='JSON'){
      const parsed = JSON.parse(text)
      if(Array.isArray(parsed)){
        if(parsed.length>0 && typeof parsed[0]==='object' && !Array.isArray(parsed[0])){
          const keys = Object.keys(parsed[0])
          rows = [keys].concat(parsed.map(o=>keys.map(k=>o[k]||'')))
        }else if(Array.isArray(parsed[0])){
          rows = parsed
        }else{
          rows = [[String(parsed)]]
        }
      }else{
        rows = [[String(parsed)]]
      }
    }else if(detected==='CSV (comma)'){
      rows = parseCSV(text, ',')
    }else if(detected==='CSV (pipe)'){
      rows = parseCSV(text, '|')
    }else if(detected==='TSV'){
      rows = parseTSV(text)
    }else if(detected==='JOOQ'){
      rows = parseJooq(text)
    }else{
      // fallback: try CSV then TSV
      try{ rows = parseCSV(text, ',') }catch(e){ rows = parseTSV(text) }
    }
  }catch(e){ setStatus('Parse error: '+e.message); return }

  let out = ''
  if(to==='CSV-comma') out = toCSVFromRows(rows, ',')
  else if(to==='CSV-pipe') out = toCSVFromRows(rows, '|')
  else if(to==='TSV') out = toTSVFromRows(rows)
  else if(to==='JSON') out = rowsToJSON(rows)
  else if(to==='JOOQ') out = rowsToJooq(rows)

  try{
    await navigator.clipboard.writeText(out)
    outputEl.value = out
    setStatus('Copied to clipboard')
  }catch(e){
    outputEl.value = out
    setStatus('Could not copy automatically — select and copy manually')
  }
}

// Wire buttons
btnCSVComma.addEventListener('click', ()=>convertAndCopy('CSV-comma'))
btnCSVPipe.addEventListener('click', ()=>convertAndCopy('CSV-pipe'))
btnJSON.addEventListener('click', ()=>convertAndCopy('JSON'))
btnTSV.addEventListener('click', ()=>convertAndCopy('TSV'))
btnJOOQ.addEventListener('click', ()=>convertAndCopy('JOOQ'))

// On popup open, try to read clipboard and detect format
document.addEventListener('DOMContentLoaded', async ()=>{
  // If previously allowed (or permission exists), auto-detect without needing the Detect button.
  const autoFlag = await getAutoDetectFlag()
  const hasPerm = await permissionContainsClipboard()
  if(autoFlag || hasPerm){
    try{ if(btnDetect) btnDetect.style.display = 'none' }catch(e){}
    await doDetectAndShow()
  }else{
    // try once silently — it may succeed in some browsers
    await doDetectAndShow()
    // if detect did not find data, leave the Detect button visible as a fallback
  }
})
