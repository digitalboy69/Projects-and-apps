# Usage: python3 build.py            -> writes vedic-astro-suite-2.html (base64) + vedic-astro-suite-readable.html (plain)
#                                       AND regenerates symbols.idx + the AUTO block of AI_GUIDE.md
#        python3 build.py --guide    -> only regenerate symbols.idx + AI_GUIDE.md (fast, no HTML build; used by the git hook)
import re,base64,glob,sys,os,datetime
t=open('wrapper_template.html',encoding='utf-8').read()
t=t.replace('/*LOCPICKER*/',open('parts/locpicker.js',encoding='utf-8').read().replace('</script','<\\/script'))
b=''.join(open(p,encoding='utf-8').read() for p in sorted(glob.glob('parts/srcB_*.part')))
src={'srcA':open('parts/srcA.html',encoding='utf-8').read(),'srcB':b,'srcN':open('parts/srcN.html',encoding='utf-8').read(),'srcDev':open('parts/srcDev.html',encoding='utf-8').read()}
exec(open('tools_guide.py',encoding='utf-8').read())
if '--guide' in sys.argv:
    gen_guide(); sys.exit(0)
def fill(t,fn):
    for i in src:
        t,n=re.subn(r'(<script type="text/plain" id="%s">)\.\.(</script>)'%i,lambda m:m.group(1)+fn(src[i])+m.group(2),t,count=1);assert n==1
    return t
open('vedic-astro-suite-2.html','w',encoding='utf-8').write(fill(t,lambda x:base64.b64encode(x.encode()).decode()))
pl=fill(t,lambda x:'\n'+x.replace('</script','<\\/script').replace('<!--','<\\!--'))
old=pl[pl.index('const decode = id =>'):];old=old[:old.index('};')+2]
pl=pl.replace(old,"const decode = id => document.getElementById(id).textContent.replace(/<\\\\\\/script/gi,'</script').replace(/<\\\\!--/g,'<!--').replace(/^\\n/,'');")
open('vedic-astro-suite-readable.html','w',encoding='utf-8').write(pl);print('built')
gen_guide()
exec(open('protect.py',encoding='utf-8').read()); run()
