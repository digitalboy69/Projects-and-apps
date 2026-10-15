/* CUSTOMER LAYER — injected only into the customer edition (tools/build_customer.py). Not part of the original app.
   1) no copying of chart/report data   2) brand + accent from the astrologer's profile   3) per-customer feature flags */
(function(){
  var P=window; try{ if(window.parent&&window.parent!==window) P=window.parent; }catch(e){}
  var B={},F={}; try{ B=P.__VAX_BRAND||{}; F=P.__VAX_FEATURES||{}; }catch(e){}
  function isEd(n){ while(n){ if(n.nodeType===1){ var t=n.tagName; if(t==='INPUT'||t==='TEXTAREA'||t==='SELECT'||n.isContentEditable) return true; } n=n.parentNode; } return false; }
  function selText(){ var a=document.activeElement; try{ if(a&&(a.tagName==='TEXTAREA'||a.tagName==='INPUT')&&typeof a.selectionStart==='number') return a.value.substring(a.selectionStart,a.selectionEnd); }catch(e){} try{ return String(window.getSelection()||''); }catch(e){ return ''; } }
  var URLONLY=/^https?:\/\/\S+$/;
  /* 1. clipboard: allow only a single link (the chart share link); block everything else */
  try{
    var cb=navigator.clipboard;
    if(cb){
      var w=cb.writeText&&cb.writeText.bind(cb);
      cb.writeText=function(t){ if(w&&URLONLY.test(String(t))) return w(t); return Promise.reject(new DOMException('Copy is disabled','NotAllowedError')); };
      cb.write=function(){ return Promise.reject(new DOMException('Copy is disabled','NotAllowedError')); };
    }
  }catch(e){}
  try{
    var ex=document.execCommand.bind(document);
    document.execCommand=function(c,a,v){
      var k=String(c).toLowerCase();
      if(k==='copy'||k==='cut'){
        if(URLONLY.test(selText().trim())) return ex(c,a,v);
        var ae=document.activeElement; if(ae&&ae.isContentEditable) return ex(c,a,v);
        return false;
      }
      return ex(c,a,v);
    };
  }catch(e){}
  document.addEventListener('copy',function(e){ if(!isEd(e.target)&&!URLONLY.test(selText().trim())) e.preventDefault(); },true);
  document.addEventListener('contextmenu',function(e){ if(!isEd(e.target)) e.preventDefault(); },true);
  /* 2. CSS: no text selection outside inputs/notes; developer pieces hidden; accent colour */
  var css='html,body{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}input,textarea,select,[contenteditable],[contenteditable] *{-webkit-user-select:text;user-select:text}'
    +'.vcx-hide,#contactDevBtn,#contactModal,.export-dev{display:none!important}';
  function mix(h,t){ var n=parseInt(h.slice(1),16),r=n>>16,g=(n>>8)&255,b=n&255; function m(x){return Math.round(x+(255-x)*t);} return '#'+((1<<24)+(m(r)<<16)+(m(g)<<8)+m(b)).toString(16).slice(1); }
  if(B.accent&&/^#[0-9a-f]{6}$/i.test(B.accent)&&B.accent.toLowerCase()!=='#d4a24a'){ css+=':root{--gold:'+B.accent+'!important;--gold-bright:'+mix(B.accent,.28)+'!important}'; }
  if(F.share===false) css+='#inShareBtn,#inShareN{display:none!important}';
  var st=document.createElement('style'); st.textContent=css; (document.head||document.documentElement).appendChild(st);
  /* 3. hide every "Copy …" control (keeps Export/Download and the share-link copy) */
  var SEL='button,a,[role=button],.menu-action-btn,.vax-fb,.srch-g';
  function isCopy(el){
    if(el.id==='shCopy'||el.classList.contains('vcx-hide')) return false;
    if(el.matches('[data-mt-copy],[data-vb-copy],[data-nm-copy],[data-a="copy"]')) return true;
    if(/copy/i.test(el.id||'')) return true;
    var tx=(el.textContent||'').replace(/[^A-Za-z ]/g,' ').trim();
    if(/^copy\b/i.test(tx)) return true;
    var tt=(el.getAttribute('title')||'')+' '+(el.getAttribute('aria-label')||'');
    return /\bcopy\b/i.test(tt)&&!/link/i.test(tt);
  }
  var pend=false;
  function scan(){ pend=false; var l=document.querySelectorAll(SEL); for(var i=0;i<l.length;i++){ if(isCopy(l[i])) l[i].classList.add('vcx-hide'); } }
  function sched(){ if(!pend){ pend=true; requestAnimationFrame(scan); } }
  function start(){ scan(); try{ new MutationObserver(sched).observe(document.documentElement,{childList:true,subtree:true}); }catch(e){} }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
  /* 4. brand line on the text report */
  window.addEventListener('load',function(){
    var o=window.buildFullReportText;
    if(typeof o==='function'&&B.brand_name){
      window.buildFullReportText=function(){
        var r=o.apply(this,arguments);
        if(typeof r!=='string') return r;
        var h=[B.brand_name,B.tagline,B.phone].filter(Boolean).join(' · ');
        return h+'\n'+new Array(Math.min(h.length,60)+1).join('=')+'\n\n'+r+'\n\n— '+B.brand_name;
      };
    }
  });
})();
