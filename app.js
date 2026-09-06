(() => {
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx_ap0Pmfr0waFk8AHpoJBqccaIa4ZyS1b7QLdL5jm_tDJV1BAUQZuLbyVK10UBwy9a/exec";
  const form = document.getElementById("form");
  const message = document.getElementById("message");
  const scoreItems = [
    ["healthScore", "体調・健康状態"], ["energyScore", "日中のエネルギー"],
    ["sleepScore", "睡眠の質"], ["dietConfidenceScore", "食事を続けられる自信"],
    ["lifeSatisfactionScore", "生活全体の満足度"]
  ];
  document.getElementById("scores").innerHTML = scoreItems.map(([name,label]) => `<div class="score"><div class="score-head"><label for="${name}">${label}</label><output for="${name}">5</output></div><input id="${name}" name="${name}" type="range" min="1" max="10" value="5"><div class="score-scale"><span>1 低い</span><span>10 とても良い</span></div></div>`).join("");
  scoreItems.forEach(([name]) => { const el=form.elements[name]; el.addEventListener("input",()=>el.parentElement.querySelector("output").textContent=el.value); });

  const values = name => [...form.querySelectorAll(`[name="${name}"]:checked`)].map(el=>el.value);
  const showError = (name,on) => { const el=form.querySelector(`[data-error="${name}"]`); if(el) el.style.display=on?"block":"none"; };
  const syncOther = name => { const wrap=form.querySelector(`[data-other="${name}"]`); if(!wrap)return; const on=values(name).includes("その他"); wrap.style.display=on?"block":"none"; if(!on) wrap.querySelector("textarea").value=""; };
  ["dietStatus","currentProblems","joinReasons"].forEach(name => form.querySelectorAll(`[name="${name}"]`).forEach(el=>el.addEventListener("change",()=>syncOther(name))));
  form.querySelectorAll("[data-limit]").forEach(group => group.querySelectorAll("input").forEach(el=>el.addEventListener("change",()=>{ const checked=[...group.querySelectorAll("input:checked")]; if(checked.length>Number(group.dataset.limit)){el.checked=false;alert(`選択は${group.dataset.limit}つまでです。`);} syncOther(el.name); })));

  const text = name => String(form.elements[name]?.value||"").trim();
  const withOther = name => { const selected=values(name); const other=text(`${name}Other`); return selected.map(v=>v==="その他"&&other?`その他：${other}`:v).join(" / "); };
  function validate(){
    let ok=true; ["basic","dietStatus","practicePeriod","currentProblems","joinReasons","decisionFactor","priorityArea","biggestChange","threeMonthGoal","firstAction"].forEach(k=>showError(k,false));
    if(!text("profileName")||!text("sex")||!text("age")){showError("basic",true);ok=false;}
    ["dietStatus","practicePeriod","priorityArea"].forEach(n=>{if(!values(n).length){showError(n,true);ok=false;}});
    ["currentProblems","joinReasons"].forEach(n=>{if(!values(n).length||values(n).length>3){showError(n,true);ok=false;}});
    [["dietStatus","dietStatusOther"],["currentProblems","currentProblemsOther"],["joinReasons","joinReasonsOther"]].forEach(([n,o])=>{if(values(n).includes("その他")&&!text(o)){showError(n,true);ok=false;}});
    ["decisionFactor","biggestChange","threeMonthGoal","firstAction"].forEach(n=>{if(!text(n)){showError(n,true);ok=false;}});
    if(!ok){form.querySelector('.error[style*="block"]')?.scrollIntoView({behavior:"smooth",block:"center"});} return ok;
  }
  function payload(){ return {
    submission_id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    client_submitted_at:new Date().toISOString(), profile_name:text("profileName"), sex:text("sex"), age:text("age"),
    diet_status:withOther("dietStatus"), practice_period:values("practicePeriod")[0]||"", current_problems:withOther("currentProblems"),
    join_reasons:withOther("joinReasons"), decision_factor:text("decisionFactor"), priority_area:values("priorityArea")[0]||"",
    biggest_change:text("biggestChange"), three_month_goal:text("threeMonthGoal"), numeric_goal:text("numericGoal"), first_action:text("firstAction"),
    health_score:text("healthScore"), energy_score:text("energyScore"), sleep_score:text("sleepScore"), diet_confidence_score:text("dietConfidenceScore"), life_satisfaction_score:text("lifeSatisfactionScore"),
    concerns:text("concerns"), support_request:text("supportRequest"), free_message:text("freeMessage")
  };}
  form.addEventListener("submit",async e=>{e.preventDefault();if(!validate())return;const button=form.querySelector("button");button.disabled=true;message.textContent="送信中です…（反映まで数十秒かかる場合があります）";try{if(!SCRIPT_URL.startsWith("https://script.google.com/macros/s/"))throw new Error("未設定");const body=new URLSearchParams(payload());const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);await fetch(SCRIPT_URL,{method:"POST",mode:"no-cors",body,signal:controller.signal});clearTimeout(timer);document.getElementById("hero").hidden=true;form.hidden=true;document.getElementById("complete").hidden=false;scrollTo({top:0,behavior:"auto"});}catch(err){console.error(err);message.textContent="送信できませんでした。通信環境をご確認のうえ、もう一度お試しください。";button.disabled=false;}});
})();

