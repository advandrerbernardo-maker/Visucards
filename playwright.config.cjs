const {defineConfig}=require('@playwright/test');

module.exports=defineConfig({
  testDir:'./tests',
  testMatch:'responsive.spec.cjs',
  fullyParallel:false,
  workers:1,
  retries:0,
  timeout:45000,
  expect:{timeout:8000},
  reporter:[['list'],['html',{open:'never',outputFolder:'playwright-report'}]],
  use:{
    baseURL:'http://127.0.0.1:4173',
    browserName:'chromium',
    headless:true,
    screenshot:'only-on-failure',
    trace:'retain-on-failure'
  },
  webServer:{
    command:'python3 -m http.server 4173 --bind 127.0.0.1',
    url:'http://127.0.0.1:4173/index.html',
    timeout:30000,
    reuseExistingServer:false
  }
});
