"""3D app date entry: Julian/BC engine functions and the Day/Month/Year checker (run in node, no browser)."""
import subprocess, re, sys, json
root = __file__.rsplit('/tests/', 1)[0]
eng = open(root + '/apps/sky3d/js/01-astro-engine.js').read()
frm = open(root + '/apps/sky3d/js/37-natal-form-location.js').read()
m = re.search(r"window\.ndCheck=function.*?\n  \};\n", frm, re.S)
dim = re.search(r"const greg=.*?\n  const dim=.*?\n", frm, re.S).group(0)
js = eng + "\nconst window={};const MN=new Array(12).fill('M');\n" + dim + m.group(0) + """
const out={};
out.jd1=toJulianDay(2000,1,1,12,0,0);
out.jdj=toJulianDay(-4712,1,1,12,0,0);
out.jd333=toJulianDay(333,1,27,12,0,0);
out.gap=toJulianDay(1582,10,15,0,0,0)-toJulianDay(1582,10,4,0,0,0);
out.p=[parseDob('-000499-03-14'),parseDob('1990-05-17'),parseDob('0000-01-01')];
out.f=[formatDobStr(-499,3,14),formatDobStr(0,1,1),formatDobStr(33,4,3)];
out.h=dobHuman('-000499-03-14')+'|'+dobHuman('1990-05-17');
const ndCheck=window.ndCheck;out.c=[ndCheck(14,3,500,'BC').str,ndCheck(29,2,1500,'AD').ok,ndCheck(29,2,1700,'AD').ok,ndCheck(10,10,1582,'AD').ok,ndCheck(31,4,2000,'AD').ok,ndCheck(1,1,4714,'BC').ok];
console.log(JSON.stringify(out));
"""
r = subprocess.run(['node', '-e', js], capture_output=True, text=True)
if r.returncode: print(r.stderr[-800:]); print('FAIL node'); sys.exit(1)
o = json.loads(r.stdout.strip().splitlines()[-1]); bad = []
def chk(n, c):
    if not c: bad.append(n)
chk('J2000', o['jd1'] == 2451545.0)
chk('JD -4712', o['jdj'] == 0.0)
chk('JD 333-01-27 (Meeus 1842713.0)', o['jd333'] == 1842713.0)
chk('1582 gap is 1 day', o['gap'] == 1.0)
chk('parseDob', o['p'] == [[-499, 3, 14], [1990, 5, 17], [0, 1, 1]])
chk('formatDobStr', o['f'] == ['-000499-03-14', '0000-01-01', '0033-04-03'])
chk('dobHuman', o['h'] == '14 March 500 BC|17 May 1990')
chk('ndCheck', o['c'] == ['-000499-03-14', True, False, False, False, False])
for p in ['index.html']:
    h = open(root + '/apps/sky3d/index.html').read()
    chk('form fields', all(i in h for i in ['id="ndDay"', 'id="ndMon"', 'id="ndYear"', 'id="ndEra"', 'id="natalDob"']))
print('FAIL ' + ', '.join(bad) if bad else 'ALL PASS')
sys.exit(1 if bad else 0)
