// Keyboard support for legacy student overlays. Native <dialog> keeps its own trap.
export function installStudentDialogs(doc=document){
 const win=doc.defaultView,stack=[],returns=new WeakMap();
 const visible=el=>!!el&&!el.classList.contains('hidden')&&!el.hidden&&el.getClientRects().length>0;
 const overlays=()=>[...doc.querySelectorAll('.modal-backdrop')].filter(el=>el.id!=='schoolExplorerModal'&&visible(el));
 const focusable=el=>[...el.querySelectorAll('button,a[href],input,textarea,select,[tabindex]')].filter(b=>!b.disabled&&b.tabIndex>=0&&visible(b));
 function sync(){
  const shown=overlays(),old=stack.at(-1);
  for(let i=stack.length-1;i>=0;i--)if(!shown.includes(stack[i]))stack.splice(i,1);
  for(const el of shown)if(!stack.includes(el)){
   returns.set(el,doc.activeElement);stack.push(el);
   const panel=el.querySelector('section,[role=dialog]')||el;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
   const title=panel.querySelector('h2,h3');if(title&&!panel.hasAttribute('aria-labelledby')){if(!title.id)title.id=el.id+'Heading';panel.setAttribute('aria-labelledby',title.id)}
   if(!el.contains(doc.activeElement))focusable(el)[0]?.focus({preventScroll:true});
  }
  if(old&&!shown.includes(old)&&!doc.querySelector('dialog[open]')){
   const target=returns.get(old),top=stack.at(-1);
   if(target?.isConnected&&visible(target)&&(!top||top.contains(target)))target.focus({preventScroll:true});
   else if(top)focusable(top)[0]?.focus({preventScroll:true});
  }
 }
 new MutationObserver(sync).observe(doc.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden']});
 win.addEventListener('keydown',event=>{
  if(!['Tab','Escape'].includes(event.key)||doc.querySelector('dialog[open]'))return;
  sync();const top=stack.at(-1);if(!top)return;
  if(event.key==='Escape'){
   const close=top.querySelector('button[onclick*="close"]');if(!close||close.disabled)return;
   event.preventDefault();event.stopImmediatePropagation();close.click();return;
  }
  const items=focusable(top);if(!items.length){event.preventDefault();return}
  const first=items[0],last=items.at(-1),active=doc.activeElement;
  if(!top.contains(active)||event.shiftKey&&active===first||!event.shiftKey&&active===last){event.preventDefault();event.stopImmediatePropagation();(event.shiftKey?last:first).focus()}
 },true);
 sync();
}
