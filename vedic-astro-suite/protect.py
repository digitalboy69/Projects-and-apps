"""Protected build: dist/index.html  (run automatically by build.py, or `python3 protect.py`).
Every code block (wrapper logic, location picker, 4 apps) is gzip-compressed, XOR-scrambled with a
per-build key, base64'd, and only decoded in the browser at start-up. A host allow-list stops the file
from running on other websites. This makes casual copying hard; it cannot make a browser app un-copyable.
EDIT ALLOWED_HOSTS to add your own domain."""
import re,base64,gzip,os,secrets,json
ALLOWED_HOSTS=['vercel.app','github.io','localhost','127.0.0.1']   # suffix match; add custom domains here
def run():
    s=open('vedic-astro-suite-2.html',encoding='utf-8').read()
    sc=[(m.start(),m.end(),m.group(1)) for m in re.finditer(r'<script([^>]*)>',s)]
    ends=[s.index('</script>',e) for _,e,_ in sc]
    lp=(sc[0][0],ends[0]+9); main=(sc[-1][0],ends[-1]+9)
    blocks={}
    for (a,e,attr),en in zip(sc,ends):
        m=re.search(r'id="(src\w+)"',attr)
        if m: blocks[m.group(1)]=base64.b64decode(s[e:en].strip()).decode('utf-8')
    lp_code=s[sc[0][1]:ends[0]]; main_code=s[sc[-1][1]:ends[-1]]
    old=main_code[main_code.index('const decode = id =>'):]; old=old[:old.index('};')+2]
    main_code=main_code.replace(old,'const decode = id => window.__S[id];')
    first=min(lp[0],*[sc[i][0] for i in range(len(sc)) if 'id="src' in sc[i][2]])
    head=s[:first]; tail=s[main[1]:]
    key=list(secrets.token_bytes(24))
    def enc(txt):
        b=gzip.compress(txt.encode('utf-8'),9,mtime=0)
        return base64.b64encode(bytes(c^key[i%len(key)] for i,c in enumerate(b))).decode()
    P={'lp':enc(lp_code),'main':enc(main_code),**{k:enc(v) for k,v in blocks.items()}}
    ld='''<script>
(function(){
var A=%s,H=location.hostname,ok=location.protocol==='file:'||!H||A.some(function(h){return H===h||H.slice(-h.length-1)==='.'+h});
if(!ok){document.body.innerHTML='<p style="font:16px system-ui;color:#ccc;padding:40px;text-align:center">This copy is not authorised to run on this site.</p>';return}
if(!window.DecompressionStream){document.body.insertAdjacentHTML('beforeend','<p style="position:fixed;z-index:9;left:0;right:0;bottom:30px;text-align:center;font:14px system-ui;color:#f99">Please update your browser (Chrome / Safari 16.4+ / Firefox 113+).</p>');return}
var K=%s,P=%s;
function d(b){var a=atob(b),u=new Uint8Array(a.length),i;for(i=0;i<a.length;i++)u[i]=a.charCodeAt(i)^K[i%%K.length];
return new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).text()}
function run(t){var e=document.createElement('script');e.text=t;document.head.appendChild(e);e.remove()}
window.__S={};
(async function(){var k;for(k in P){window.__S[k]=await d(P[k])}
run(window.__S.lp);run(window.__S.main);
for(k in window.__S){if(k!=='lp'&&k!=='main'&&k.indexOf('src')!==0)delete window.__S[k]}})();
})();
</script>'''%(json.dumps(ALLOWED_HOSTS),json.dumps(key),json.dumps(P))
    os.makedirs('dist',exist_ok=True)
    open('dist/index.html','w',encoding='utf-8').write(head+ld+tail)
    print('protected build: dist/index.html',os.path.getsize('dist/index.html')//1024,'KB')
if __name__=='__main__': run()
