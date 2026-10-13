import re,base64
t=open('wrap_template.html',encoding='utf-8').read()
src={i:open(i+'.html',encoding='utf-8').read() for i in ('srcA','srcB','srcN','srcDev')}
def fill(t,fn):
    for i in src:
        t,n=re.subn(r'(<script type="text/plain" id="%s">)\.\.(</script>)'%i,lambda m:m.group(1)+fn(src[i])+m.group(2),t,count=1);assert n==1
    return t
src['srcB']=src['srcB'].replace('/*QRLIBS*/',open('qrlibs.js',encoding='utf-8').read().replace('</script','<\\/script'))
LP=open('locpicker.js',encoding='utf-8').read().replace('</script','<\\/script')
t=t.replace('/*LOCPICKER*/',LP)
b64=fill(t,lambda x:base64.b64encode(x.encode()).decode())
esc=lambda x:'\n'+x.replace('</script','<\\/script').replace('<!--','<\\!--')
pl=fill(t,esc)
old=pl[pl.index('const decode = id =>'):];old=old[:old.index('};')+2]
pl=pl.replace(old,"const decode = id => document.getElementById(id).textContent.replace(/<\\\\\\/script/gi,'</script').replace(/<\\\\!--/g,'<!--').replace(/^\\n/,'');")
open('out_b64.html','w',encoding='utf-8').write(b64);open('out_plain.html','w',encoding='utf-8').write(pl)
