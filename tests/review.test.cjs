const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const sql=fs.readFileSync('backend/schema_preparacao.sql','utf8');

test('modo revisão está integrado à biblioteca',()=>{
  for(const id of ['start-review','tab-revisao','review-title','review-answer','review-reveal','review-again','review-remember','review-free']){
    assert.ok(html.includes('id="'+id+'"'),'Ausente: '+id);
  }
  assert.match(html,/function startReview\(force=false\)/);
  assert.match(html,/function finishReview\(remembered\)/);
});

test('avaliação local não consome novas cotas de PDF ou cards',()=>{
  const a=html.indexOf('function finishReview(');
  const b=html.indexOf("$('#pick-file').onclick",a);
  assert.ok(a>0 && b>a);
  const logic=html.slice(a,b);
  assert.doesNotMatch(logic,/state\.(?:cardCount|pdfCount)\s*\+\+/);
  assert.match(logic,/state\.reviews/);
  assert.match(logic,/persist\(\)/);
});

test('scripts embarcados não possuem erros de sintaxe',()=>{
  const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
  assert.ok(scripts.length>=3);
  for(const script of scripts)assert.doesNotThrow(()=>new vm.Script(script[1]));
});

test('esquema futuro habilita RLS para todas as tabelas',()=>{
  for(const tbl of ['visu_cards','visu_reviews','visu_combos','visu_combo_items','visu_entitlements','visu_subscriptions','visu_month_usage']){
    assert.ok(sql.includes('alter table public.'+tbl+' enable row level security;'), 'Sem RLS: '+tbl);
  }
});

test('assinatura, direitos de combos e cotas não têm escrita do cliente',()=>{
  assert.doesNotMatch(sql,/grant\s+(insert|update|delete)\s+on\s+public\.visu_(entitlements|subscriptions|month_usage)/i);
  for(const name of ['visu_entitlement_owner_read','visu_subscription_owner_read','visu_combo_items_access','visu_usage_owner_read']){
    assert.ok(sql.includes(name),'Política ausente: '+name);
  }
});
