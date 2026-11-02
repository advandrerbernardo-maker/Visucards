const {test,expect}=require('@playwright/test');

// Executado em Chromium real, com as mesmas páginas e componentes publicados.
// Regressões em telas pequenas bloqueiam a publicação no GitHub Pages.
const viewports=[
  {width:320,height:568,name:'Android compacto 320px'},
  {width:360,height:740,name:'Android 360px'},
  {width:390,height:844,name:'Android 390px'},
  {width:430,height:932,name:'Celular grande 430px'},
  {width:768,height:1024,name:'Tablet 768px'},
  {width:1024,height:768,name:'Tablet paisagem 1024px'},
  {width:1440,height:900,name:'Computador 1440px'}
];

async function checkLayout(page,context){
  const report=await page.evaluate(()=>{
    const width=document.documentElement.clientWidth;
    const selectors=[
      '.sidebar','.brand','.nav','.nav button','main',
      '.topbar','.hero','.home-card-shortcut','.home-card-shortcut-icon',
      '.home-card-shortcut-copy','.home-card-shortcut-tail','.panel','.panel-head',
      '.folder-create','#folder-grid','.folder-tile','.folder-current',
      '.librarytools','.ranking-hero','.ranking-head',
      '.ranking-periods','.ranking-entry',
      '.swipe-reader','.swipe-head','.swipe-stage','.swipe-card',
      '.swipe-gamebar','.swipe-footer','#card-grid .premium-card'
    ];
    const clipped=[];
    for(const selector of selectors){
      for(const element of document.querySelectorAll(selector)){
        if(!element.getClientRects().length)continue;
        const rect=element.getBoundingClientRect();
        if(rect.width===0||rect.height===0)continue;
        if(rect.left < -2||rect.right > width+2){
          clipped.push({
            selector,
            left:Math.round(rect.left),
            right:Math.round(rect.right),
            screen:width
          });
        }
      }
    }
    const bodyWidth=Math.max(document.body.scrollWidth,document.documentElement.scrollWidth);
    return {width,bodyWidth,clipped};
  });
  expect(report.bodyWidth,context+': rolagem horizontal indesejada').toBeLessThanOrEqual(report.width+2);
  expect(report.clipped,context+': controles cortados nas laterais').toEqual([]);
}

for(const viewport of viewports){
  test('Responsividade '+viewport.name,async({browser})=>{
    const context=await browser.newContext({
      viewport:{width:viewport.width,height:viewport.height},
      isMobile:viewport.width<=430,
      hasTouch:viewport.width<=430
    });
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    try{
      await page.goto('/index.html',{waitUntil:'domcontentloaded'});
      await expect(page.locator('#target-folder option')).toHaveCount(2);
      await expect(page.locator('#home-my-cards')).toBeVisible();
      await expect(page.locator('#home-card-count')).toHaveText('0 cards');
      await checkLayout(page,'Tela Criar e atalho Meus Cards, '+viewport.name);
      await page.locator('#home-my-cards').click();
      await expect(page.locator('#home-shortcut-message')).toContainText('Você ainda não tem cards salvos');
      await expect(page.locator('#swipe-reader')).toBeHidden();
      await checkLayout(page,'Atalho sem cards, '+viewport.name);

      // A prévia usa os cards editoriais originais, não uma cópia simplificada.
      await page.locator('#demo').click();
      await expect(page.locator('#card-grid .premium-card')).toHaveCount(2);
      await checkLayout(page,'Prévia de cards, '+viewport.name);

      await page.locator('[data-tab="biblioteca"]').click();
      await expect(page.locator('#folder-grid .folder-tile')).toHaveCount(1);
      await checkLayout(page,'Biblioteca, '+viewport.name);
      await page.locator('#folder-name-input').fill('Direito Constitucional e Legislação Administrativa');
      await page.locator('#create-folder').click();
      await expect(page.locator('#folder-grid .folder-tile')).toHaveCount(2);
      await page.locator('[data-openfolder]').last().click();
      await expect(page.locator('#current-folder-name')).toContainText('Direito Constitucional');
      await checkLayout(page,'Pasta aberta, '+viewport.name);

      await page.locator('[data-tab="ranking"]').click();
      await expect(page.locator('.ranking-entry')).toHaveCount(5);
      await checkLayout(page,'Ranking semanal, '+viewport.name);
      await page.locator('[data-ranking-period="monthly"]').click();
      await checkLayout(page,'Ranking mensal, '+viewport.name);
      await page.locator('[data-ranking-period="all"]').click();
      await checkLayout(page,'Ranking geral, '+viewport.name);

      await page.locator('#ranking-test').click();
      await expect(page.locator('#swipe-reader')).toBeVisible();
      await expect(page.locator('#swipe-card .premium-card')).toHaveCount(1);
      await checkLayout(page,'Leitura rápida / XP, '+viewport.name);
      await page.locator('#swipe-learn').click();
      await expect(page.locator('#swipe-counter')).toContainText('2 de 5');
      // O card entra deslizando por ~230 ms. A distância temporária faz parte da
      // animação, não é um erro de responsividade da posição final.
      await page.locator('#swipe-card').evaluate(async element=>{
        await Promise.all(element.getAnimations().map(animation=>animation.finished.catch(()=>{})));
      });
      await checkLayout(page,'Leitura após confirmar XP, '+viewport.name);
      await page.locator('#swipe-close').click();
      await expect(page.locator('#swipe-reader')).toBeHidden();

      // Simula biblioteca local com dois cards próprios, sem PDF ou backend.
      await page.evaluate(()=>{
        localStorage.setItem('visucards_demo_v1',JSON.stringify({cards:[
          {id:'atalho-1',title:'LEITURA DIRETA DO CARD',text:'Um card salvo aparece no modo leitura sem entrar na biblioteca.',source:'Teste de responsividade',color:0,layout:'caderno'},
          {id:'atalho-2',title:'SEGUNDO CARD',text:'O deslize lateral permite avançar de forma rápida.',source:'Teste de responsividade',color:1,layout:'caderno'}
        ]}));
      });
      await page.reload({waitUntil:'domcontentloaded'});
      await expect(page.locator('#home-card-count')).toHaveText('2 cards');
      await checkLayout(page,'Atalho inicial com cards salvos, '+viewport.name);
      await page.locator('#home-my-cards').click();
      await expect(page.locator('#swipe-reader')).toBeVisible();
      await expect(page.locator('#swipe-heading')).toHaveText('Meus Cards');
      await expect(page.locator('#swipe-counter')).toHaveText('1 de 2');
      await checkLayout(page,'Atalho direto para swipe, '+viewport.name);
      const swipeBox=await page.locator('#swipe-stage').boundingBox();
      expect(swipeBox,'Área de deslize não deve desaparecer').toBeTruthy();
      const gestureY=swipeBox.y+Math.min(swipeBox.height/2,75);
      await page.mouse.move(swipeBox.x+swipeBox.width*.75,gestureY);
      await page.mouse.down();
      await page.mouse.move(swipeBox.x+swipeBox.width*.2,gestureY,{steps:8});
      await page.mouse.up();
      await expect(page.locator('#swipe-counter')).toHaveText('2 de 2');
      await page.locator('#swipe-card').evaluate(async element=>{
        await Promise.all(element.getAnimations().map(animation=>animation.finished.catch(()=>{})));
      });
      await checkLayout(page,'Atalho após deslize lateral, '+viewport.name);
      await page.locator('#swipe-close').click();
      await expect(page.locator('#swipe-reader')).toBeHidden();
      expect(errors,'Erros inesperados no JavaScript, '+viewport.name).toEqual([]);
    }finally{
      await context.close();
    }
  });
}
