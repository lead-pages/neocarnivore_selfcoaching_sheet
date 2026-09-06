const CONFIG = {
  SPREADSHEET_ID: "1xTsoNRazvXAh7lAsp5h1c1t2OZ4volnidJ2QiciRCd4",
  RESPONSE_SHEET: "回答",
  SUMMARY_SHEET: "集計",
  HEADERS: ["回答日時","送信ID","端末送信日時","Discordプロフィール名","性別","年齢","現在の食事スタイル","実践期間","現在の悩み","参加理由","参加を決めた一番の理由","最優先で変えたい分野","今一番変えたいこと","3か月後の目標","数字で表せる目標","最初の7日間の行動","体調・健康状態","日中のエネルギー","睡眠の質","継続への自信","生活全体の満足度","始めるうえでの不安","期待するサポート","自由記述"],
  CHARTS: [
    {title:"現在の食事スタイル",column:7,cell:"A4",anchor:[1,4]},
    {title:"実践期間",column:8,cell:"D4",anchor:[1,15]},
    {title:"最優先で変えたい分野",column:12,cell:"G4",anchor:[18,4]}
  ]
};

function doGet(){return output_({ok:true,name:"肉食版 初回セルフコーチングシート"});}
function doPost(e){
  const lock=LockService.getScriptLock();
  try{
    lock.waitLock(8000);
    const p=(e&&e.parameter)||{};
    validate_(p);
    const ss=SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sh=ss.getSheetByName(CONFIG.RESPONSE_SHEET);
    if(!sh) throw new Error("回答シートがありません");
    const id=clean_(p.submission_id,100);
    if(id && sh.getLastRow()>1 && sh.getRange(2,2,sh.getLastRow()-1,1).createTextFinder(id).matchEntireCell(true).findNext()) return output_({ok:true,duplicate:true});
    const row=[new Date(),id,clean_(p.client_submitted_at,50),clean_(p.profile_name,100),clean_(p.sex,20),number_(p.age),clean_(p.diet_status,500),clean_(p.practice_period,50),clean_(p.current_problems,1000),clean_(p.join_reasons,1000),clean_(p.decision_factor,3000),clean_(p.priority_area,100),clean_(p.biggest_change,3000),clean_(p.three_month_goal,3000),clean_(p.numeric_goal,500),clean_(p.first_action,3000),score_(p.health_score),score_(p.energy_score),score_(p.sleep_score),score_(p.diet_confidence_score),score_(p.life_satisfaction_score),clean_(p.concerns,3000),clean_(p.support_request,3000),clean_(p.free_message,3000)];
    sh.getRange(sh.getLastRow()+1,1,1,row.length).setValues([row]);
    updateSummary_(ss,sh);
    return output_({ok:true});
  }catch(err){console.error(err);return output_({ok:false,error:String(err.message||err)});}finally{try{lock.releaseLock();}catch(_){}}
}

function setup(){
  const ss=SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let response=ss.getSheetByName(CONFIG.RESPONSE_SHEET)||ss.insertSheet(CONFIG.RESPONSE_SHEET);
  let summary=ss.getSheetByName(CONFIG.SUMMARY_SHEET)||ss.insertSheet(CONFIG.SUMMARY_SHEET);
  response.clear(); summary.clear(); summary.getCharts().forEach(c=>summary.removeChart(c));
  response.getRange(1,1,1,CONFIG.HEADERS.length).setValues([CONFIG.HEADERS]).setBackground("#3124e8").setFontColor("#ffffff").setFontWeight("bold").setWrap(true);
  response.setFrozenRows(1); response.getRange("A:A").setNumberFormat("yyyy/mm/dd hh:mm:ss"); response.setColumnWidth(1,150); response.setColumnWidth(2,230); response.setColumnWidth(4,170);
  for(let c=7;c<=24;c++) response.setColumnWidth(c,c>=11?260:180);
  summary.getRange("A1:I1").merge().setValue("肉食版 初回セルフコーチングシート｜集計").setBackground("#3124e8").setFontColor("#ffffff").setFontSize(18).setFontWeight("bold").setHorizontalAlignment("center");
  summary.getRange("A2:B2").setValues([["回答数",0]]).setFontWeight("bold");
  summary.getRange("A4:B4").setValues([["現在の食事スタイル","件数"]]).setBackground("#f0efff").setFontWeight("bold");
  summary.getRange("D4:E4").setValues([["実践期間","件数"]]).setBackground("#f0efff").setFontWeight("bold");
  summary.getRange("G4:H4").setValues([["最優先で変えたい分野","件数"]]).setBackground("#f0efff").setFontWeight("bold");
  summary.setFrozenRows(1); summary.setColumnWidths(1,9,150); updateSummary_(ss,response); createCharts_(summary);
  const otherSheets=ss.getSheets().filter(s=>![CONFIG.RESPONSE_SHEET,CONFIG.SUMMARY_SHEET].includes(s.getName())); otherSheets.forEach(s=>ss.deleteSheet(s));
}

function updateSummary_(ss,response){
  const summary=ss.getSheetByName(CONFIG.SUMMARY_SHEET); if(!summary)return;
  const last=response.getLastRow(); summary.getRange("B2").setValue(Math.max(0,last-1));
  const data=last>1?response.getRange(2,1,last-1,CONFIG.HEADERS.length).getDisplayValues():[];
  writeCounts_(summary,"A5",countSingle_(data,6)); writeCounts_(summary,"D5",countSingle_(data,7)); writeCounts_(summary,"G5",countSingle_(data,11));
  const scores=[16,17,18,19,20].map(i=>data.map(r=>Number(r[i])).filter(n=>n>=1&&n<=10));
  summary.getRange("A18:B23").setValues([["現在地スコア","平均"],["体調・健康状態",avg_(scores[0])],["日中のエネルギー",avg_(scores[1])],["睡眠の質",avg_(scores[2])],["継続への自信",avg_(scores[3])],["生活全体の満足度",avg_(scores[4])]]); summary.getRange("A18:B18").setBackground("#f0efff").setFontWeight("bold"); summary.getRange("B19:B23").setNumberFormat("0.0");
}
function createCharts_(s){
  [{range:"A4:B14",pos:[1,10],title:"現在の食事スタイル"},{range:"D4:E14",pos:[16,10],title:"実践期間"},{range:"G4:H14",pos:[31,10],title:"最優先で変えたい分野"},{range:"A18:B23",pos:[31,1],title:"現在地スコア平均"}].forEach(x=>s.insertChart(s.newChart().asColumnChart().addRange(s.getRange(x.range)).setPosition(x.pos[0],x.pos[1],0,0).setOption("title",x.title).setOption("legend",{position:"none"}).setOption("colors",["#5447ff"]).build()));
}
function writeCounts_(s,start,rows){const r=s.getRange(start).offset(0,0,10,2);r.clearContent();if(rows.length)r.offset(0,0,Math.min(10,rows.length),2).setValues(rows.slice(0,10));}
function countSingle_(data,index){const map={};data.forEach(r=>{const v=r[index];if(v)map[v]=(map[v]||0)+1;});return Object.entries(map).sort((a,b)=>b[1]-a[1]);}
function avg_(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:0;}
function validate_(p){["profile_name","sex","age","diet_status","practice_period","current_problems","join_reasons","decision_factor","priority_area","biggest_change","three_month_goal","first_action"].forEach(k=>{if(!String(p[k]||"").trim())throw new Error(`必須項目が不足しています: ${k}`);});}
function clean_(v,max){return String(v==null?"":v).trim().slice(0,max);}
function number_(v){const n=Number(v);return Number.isFinite(n)?n:"";}
function score_(v){const n=Number(v);return n>=1&&n<=10?n:"";}
function output_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}

