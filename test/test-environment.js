(() => {
  'use strict';
  const prefix='rpg-staging-v1:';
  for(const name of ['localStorage','sessionStorage']) {
    const raw=window[name];
    const keys=()=>Object.keys(raw).filter(k=>k.startsWith(prefix));
    const isolated={getItem:k=>raw.getItem(prefix+k),setItem:(k,v)=>raw.setItem(prefix+k,v),removeItem:k=>raw.removeItem(prefix+k),clear:()=>keys().forEach(k=>raw.removeItem(k)),key:i=>keys()[i]?.slice(prefix.length)??null,get length(){return keys().length;}};
    Object.defineProperty(window,name,{value:isolated});
  }
  const blocked=url=>String(url).includes('dgqtxavsymvwjeyyyjle.supabase.co');
  const fetchOriginal=window.fetch;
  window.fetch=function(input,...args){if(blocked(input?.url||input))return Promise.reject(new Error('테스트 사이트에서는 실제 데이터베이스에 연결할 수 없습니다.'));return fetchOriginal.call(this,input,...args);};
  const open=XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open=function(method,url,...args){if(blocked(url))throw new Error('Production access blocked');return open.call(this,method,url,...args);};
  const Socket=window.WebSocket;
  window.WebSocket=class extends Socket{constructor(url,...args){if(blocked(url))throw new Error('Production access blocked');super(url,...args);}};
  document.addEventListener('DOMContentLoaded',()=>{
    document.title='[테스트] '+document.title;
    if(window.top!==window)return;
    const bar=document.createElement('div');
    bar.textContent='🧪 테스트 사이트 · 실제 학생 기록과 분리되어 있어요';
    bar.style.cssText='position:fixed;top:0;left:0;right:0;height:30px;line-height:30px;z-index:2147483647;background:#ffdf79;color:#473600;text-align:center;font:bold 13px/30px sans-serif';
    document.body.prepend(bar);
    document.body.style.paddingTop='30px';document.body.style.boxSizing='border-box';
  });
})();
