# Usage: python3 build.py -> writes vedic-astro-suite-2.html (base64) and vedic-astro-suite-readable.html (plain)
import re,base64,glob
t=open('wrapper_template.html',encoding='utf-8').read()
t=t.replace('/*LOCPICKER*/',open('parts/locpicker.js',encoding='utf-8').read().replace('</script','<\\/script'))
b=''.join(open(p,encoding='utf-8').read() for p in sorted(glob.glob('parts/srcB_*.part')))
src={'srcA':open('parts/srcA.html',encoding='utf-8').read(),'srcB':b,'srcN':open('parts/srcN.html',encoding='utf-8').read(),'srcDev':open('parts/srcDev.html',encoding='utf-8').read()}
def fill(t,fn):
    for i in src:
        t,n=re.subn(r'(<script type="text/plain" id="%s">)\.\.(</script>)'%i,lambda m:m.group(1)+fn(src[i])+m.group(2),t,count=1);assert n==1
    return t
open('vedic-astro-suite-2.html','w',encoding='utf-8').write(fill(t,lambda x:base64.b64encode(x.encode()).decode()))
pl=fill(t,lambda x:'\n'+x.replace('</script','<\\/script').replace('<!--','<\\!--'))
old=pl[pl.index('const decode = id =>'):];old=old[:old.index('};')+2]
pl=pl.replace(old,"const decode = id => document.getElementById(id).textContent.replace(/<\\\\\\/script/gi,'</script').replace(/<\\\\!--/g,'<!--').replace(/^\\n/,'');")
open('vedic-astro-suite-readable.html','w',encoding='utf-8').write(pl);print('built')
