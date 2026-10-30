// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// Owned DOM relationships only, for the exact engine/templates admitted by the
// preparer. Native Numbas/Knockout nodes, listeners and marking stay authoritative.
const set=(node,name,value)=>{if(node.getAttribute(name)!==value)node.setAttribute(name,value);};
const wrapperConflict=node=>node.hasAttribute('tabindex')||node.tabIndex>=0||node.isContentEditable||[...node.attributes].some(a=>a.name.startsWith('aria-'));
export function presentationalWrapper(node){
 return node.tagName==='LI'&&!wrapperConflict(node)&&!node.hasAttribute('role');
}
export function hasAnswerLabel(input,root){
 if(input.getAttribute('aria-label')?.trim())return true;
 const ids=input.getAttribute('aria-labelledby')?.trim().split(/\s+/u);
 if(ids?.length&&ids.every(id=>root.getElementById(id)?.textContent?.trim()))return true;
 return [...root.querySelectorAll('label')].some(label=>label.textContent.trim()&&(!!input.id&&label.getAttribute('for')===input.id||label.contains(input)));
}
const hasNativeAnswerLabel=(input,root)=>!!input.getAttribute('aria-label')?.trim()||[...root.querySelectorAll('label')].some(label=>label.textContent.trim()&&(!!input.id&&label.getAttribute('for')===input.id||label.contains(input)));
const visible=(node,view)=>{if(!node)return false;const style=view.getComputedStyle(node),box=node.getBoundingClientRect();return style.display!=='none'&&style.visibility!=='hidden'&&box.width>0&&box.height>0;};
export function installSkipNavigation(root,document,view){
 const skip=root.getElementById('skip-link'),layout=root.getElementById('everything');
 if(!skip||!layout||skip.parentElement!==layout)return;
 const navigation=document.createElement('nav');navigation.className='gw-numbas-skip-navigation';set(navigation,'aria-label','Skip navigation');layout.insertBefore(navigation,skip);navigation.append(skip);
 const temporary=new WeakSet();
 skip.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button>0||event.ctrlKey||event.altKey||event.metaKey||event.shiftKey)return;
  const href=skip.getAttribute('href');if(!['#infoDisplay','#questionContainer'].includes(href))return;
  const target=root.getElementById(href.slice(1));if(!visible(target,view))return;
  if(!target.hasAttribute('tabindex')){
   target.setAttribute('tabindex','-1');temporary.add(target);
   target.addEventListener('blur',()=>{if(!temporary.has(target))return;temporary.delete(target);if(target.getAttribute('tabindex')==='-1')target.removeAttribute('tabindex');},{once:true});
  }
  target.focus({preventScroll:true});
  if(root.activeElement!==target){if(temporary.has(target)){temporary.delete(target);if(target.getAttribute('tabindex')==='-1')target.removeAttribute('tabindex');}return;}
  event.preventDefault();target.scrollIntoView({block:'start',inline:'nearest',behavior:'instant'});
 });
}
// The pinned engine documents control_focus for embedded use. Guard only its
// instance helper: never replace HTMLElement.focus, cancel native input events,
// or restore focus later. Native scrolling and inside-frame behavior stay native.
export function embeddedNativeFocusPolicy(view,document){
 let api,descriptor;try{api=view.Numbas?.display_util;descriptor=api&&Object.getOwnPropertyDescriptor(api,'force_focus');}catch{return null;}
 if(!descriptor||typeof descriptor.value!=='function'||descriptor.writable!==true)return null;
 const original=descriptor.value;let connected=false;
 const ownedFrame=()=>{try{const frame=view.frameElement;return frame&&frame.getAttribute('data-gw-numbas-focus-owner')==='numbas-11.0-numberentry-v1'&&frame.contentDocument===document?frame:null;}catch{return null;}};
 function guarded(...args){
  if(connected){const frame=ownedFrame();if(frame){try{if(frame.ownerDocument.activeElement!==frame)return;}catch{/* Unknown parent access retains the native helper. */}}}
  return Reflect.apply(original,this,args);
 }
 return{
  connect(){if(!ownedFrame())return;const current=Object.getOwnPropertyDescriptor(api,'force_focus');if(current?.writable!==true||current.value!==original&&current.value!==guarded)return;api.force_focus=guarded;connected=true;},
  disconnect(){connected=false;const current=Object.getOwnPropertyDescriptor(api,'force_focus');if(current?.value===guarded&&current.writable===true)api.force_focus=original;}
 };
}
export function mountNumbasAccessibility(host,view=host.ownerDocument.defaultView){
 const document=host.ownerDocument,root=host.shadowRoot,wrapper=document.getElementById('with-stylesheet');
 if(!root||!wrapper||!wrapper.contains(host))return null;
 set(document.documentElement,'data-gw-numbas-layout-root','supported-template');
 const nativeFocus=embeddedNativeFocusPolicy(view,document);
 let serial=0,queued=false,connected=false;const ownedWrappers=new WeakSet(),ownedAssociations=new WeakMap();
 const heading=document.createElement('h1');heading.className='gw-numbas-a11y-heading';
 do{heading.id='gw-numbas-heading-'+(++serial);}while(document.getElementById(heading.id));
 // Only the owned context is a landmark; the connected host and native main stay outside it.
 const context=document.createElement('section');context.className='gw-numbas-a11y-context';set(context,'role','region');set(context,'aria-labelledby',heading.id);context.append(heading);
 wrapper.insertBefore(context,host);set(wrapper,'role','group');set(wrapper,'aria-labelledby',heading.id);
 const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href=new URL('./adapter.css',import.meta.url).href;set(stylesheet,'data-gw-numbas-shadow-style','owned');root.append(stylesheet);
 installSkipNavigation(root,document,view);
 const refresh=()=>{
  const nativeHeading=root.querySelector('#sideNav h1.exam-name');
  heading.textContent=nativeHeading?.textContent?.replace(/\s+/gu,' ').trim()||document.title||'Numbas activity';
  context.hidden=heading.hidden=[...root.querySelectorAll('h1')].some(node=>visible(node,view));
  const menu=root.getElementById('questionList');
  if(menu?.getAttribute('role')==='tablist'){
   for(const child of menu.children){
    if(ownedWrappers.has(child)&&wrapperConflict(child)){if(child.getAttribute('role')==='presentation')child.removeAttribute('role');ownedWrappers.delete(child);}
    if(presentationalWrapper(child)){set(child,'role','presentation');ownedWrappers.add(child);}
   }
   for(const tab of menu.querySelectorAll('[role="tab"]'))set(tab,'aria-selected',String(tab.getAttribute('aria-current')==='step'));
  }
  const sidebar=root.getElementById('sideNav'),expanded=root.querySelector('exam-container')?.classList.contains('show-sidebar');
  const container=root.querySelector('exam-container');if(container)set(container,'data-gw-numbas-layout','retained-content');
  // init() selected navMenu before numbas:loaded and installed its own click
  // listeners. Changing this IDREF earlier would prevent native initialization.
  if(sidebar)for(const toggle of root.querySelectorAll('button.navbar-toggle')){
   if(toggle.getAttribute('aria-controls')==='navMenu')set(toggle,'aria-controls',sidebar.id);
   if(toggle.getAttribute('aria-controls')===sidebar.id)set(toggle,'aria-expanded',String(!!expanded));
  }
  for(const part of root.querySelectorAll('section.part')){
   const prompt=part.querySelector(':scope > content-block');
   // Reference the existing ordinary rendered node, retaining every native
   // prompt/MathJax child. The custom host has a working Chromium name but some
   // accessibility scanners do not resolve its referenced contents reliably.
   const promptTarget=prompt?.querySelector(':scope > span');
   for(const input of part.querySelectorAll('answer-widget input')){
    if(!['text','number'].includes(input.type))continue;
    const owned=ownedAssociations.get(input);
    if(owned&&input.getAttribute('aria-labelledby')!==owned)ownedAssociations.delete(input);
    else if(owned&&(hasNativeAnswerLabel(input,root)||root.getElementById(owned)!==promptTarget)){
     input.removeAttribute('aria-labelledby');ownedAssociations.delete(input);
    }
    if(hasAnswerLabel(input,root))continue;
    if(!promptTarget?.textContent?.trim())continue;
    if(!promptTarget.id){let id;do{id='gw-numbas-prompt-'+(++serial);}while(root.getElementById(id));promptTarget.id=id;}
    set(input,'aria-labelledby',promptTarget.id);ownedAssociations.set(input,promptTarget.id);
   }
  }
  // The admitted template puts role=log on native details. Keep the native
  // disclosure/summary and its explicit polite live region; log is not a
  // permitted replacement role for details and is not used by native bindings.
  for(const feedback of root.querySelectorAll('details.feedbackMessages')){
   if(feedback.getAttribute('role')==='log')feedback.removeAttribute('role');
  }
  set(host,'data-gw-numbas-dom-adapter','active-supported-template');
 };
 const schedule=()=>{if(!connected||queued)return;queued=true;queueMicrotask(()=>{queued=false;if(connected&&host.isConnected)refresh();});};
 stylesheet.addEventListener('load',()=>{set(host,'data-gw-numbas-style','loaded');schedule();});
 stylesheet.addEventListener('error',()=>set(host,'data-gw-numbas-style','unavailable'));
 const observer=new view.MutationObserver(schedule),resize=new view.ResizeObserver(schedule);
 const reconnect=()=>{if(connected)return;connected=true;nativeFocus?.connect();observer.observe(root,{subtree:true,childList:true,characterData:true,attributes:true});resize.observe(host);view.addEventListener('resize',schedule);refresh();};
 const disconnect=()=>{connected=false;nativeFocus?.disconnect();observer.disconnect();resize.disconnect();view.removeEventListener('resize',schedule);};
 reconnect();return{refresh,disconnect,reconnect};
}
export function installNumbasAccessibility(document,view){
 const states=new Map();
 for(const host of document.querySelectorAll('numbas-exam')){
  const ready=()=>{if(!states.has(host)&&host.viewModel?.loaded?.()===true){const state=mountNumbasAccessibility(host,view);if(state)states.set(host,state);}};
  host.addEventListener('numbas:loaded',ready);ready();
 }
 view.addEventListener('pagehide',()=>{for(const state of states.values())state.disconnect();});
 view.addEventListener('pageshow',()=>{for(const [host,state]of states)if(host.isConnected)state.reconnect();});
}
if(typeof document!=='undefined'&&typeof window!=='undefined'){
 const start=()=>installNumbasAccessibility(document,window);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
