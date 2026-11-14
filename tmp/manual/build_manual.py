from pathlib import Path
import re,json
from xml.sax.saxutils import escape
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor,white
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph,Table,TableStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
R=Path(r'C:\Users\Hp\GTRAMS'); O=R/'output/manual'; O.mkdir(parents=True,exist_ok=True); I=R/'tmp/manual/screenshots'
for n,f in [('Arial','arial.ttf'),('Arial-Bold','arialbd.ttf'),('Arial-Italic','ariali.ttf')]:pdfmetrics.registerFont(TTFont(n,str(Path('C:/Windows/Fonts')/f)))
pdfmetrics.registerFontFamily('Arial',normal='Arial',bold='Arial-Bold',italic='Arial-Italic',boldItalic='Arial-Bold')
P=[]
def add(title,kicker,body,fig=[]):P.append(dict(title=title,kicker=kicker,body=body.strip(),fig=fig))
add('SYSTEM OVERVIEW','SECTION 2','''
## 2.1 Tungkol sa G-TRAMS
Ang <b>Gasan Tricycle Records and Application Management System</b> ay web application para sa pamamahala ng mga aplikasyon at records ng prangkisa ng traysikel sa Gasan, Marinduque. Pinag-uugnay nito ang operator, TODA, SB Franchising Staff, Municipal Cashier, at administrator sa ilalim ng Sangguniang Bayan / Office of the Municipal Vice Mayor.
## 2.2 Mga layunin
1. Pabilisin at ayusin ang aplikasyon at renewal ng 3-Year MTOP.
2. Bawasan ang maling entry at duplicate na plate, engine, at chassis numbers.
3. Magbigay ng application tracking, document review, at printable official forms.
4. Panatilihin ang malinaw na responsibilidad at access ng bawat user role.
## 2.3 Intended users at roles
<b>Operator / Driver:</b> nag-a-apply, nagre-renew, tumitingin sa status, at nagpi-print ng application form o approved certificate.
<b>TODA President:</b> nagpapatunay ng membership at namamahala sa roster ng sariling asosasyon.
<b>SB Staff / LLSA I:</b> sumusuri sa requirements, nagpapabalik para sa correction, at nagpoproseso ng franchise at cancellation documents.
<b>Municipal Cashier:</b> naghahanap ng assessment, tumatanggap ng bayad, at nagtatala ng Official Receipt (O.R.).
<b>System Administrator:</b> namamahala sa user accounts, roles, access, at audit records.
## 2.4 Pangunahing features
<b>5-Step Application Wizard:</b> operator, vehicle, clearances, Cedula, at review.
<b>Document tools:</b> uploads, OCR assistance kung available, at official form previews.
<b>Records at tracking:</b> status monitoring, TODA validation, masterlist search, at reports.
<b>Mobile access:</b> responsive pages at Progressive Web App (PWA) shortcut.
## Gabay sa mga pahina
Access at registration - p. 3; Operator - pp. 4-5; TODA at SB Staff - pp. 6-8; Troubleshooting at FAQs - p. 9; Security, Cashier, at Support - p. 10.
''')
add('ACCESS & GETTING STARTED','SECTIONS 3 & 4','''
## 3. Requirements at access
Gumamit ng PC, laptop, smartphone, o tablet na may updated Chrome, Edge, Firefox, o Safari at stable internet. Kailangan ang internet para sa login, upload, at submission. Buksan ang G-TRAMS link na ibinigay ng LGU o project team. Ang URL sa source ay <b>https://gtrams.gasan.gov.ph</b>; kumpirmahin ang active deployment bago gamitin.
## 4. Registration, login, at navigation
1. Buksan ang system. Piliin ang <b>Register</b> o registration link sa Login page.
2. Ilagay ang <b>Full Name</b>, piliin ang Barangay at kaugnay na TODA, at ilagay ang aktibong email o phone number ayon sa form.
3. Kumpletuhin ang required fields, gumawa ng password, at suriin ang entries bago piliin ang create/register button.
4. Sa Login, ilagay ang rehistradong email o phone number at password; piliin ang <b>Log In</b>.
5. Gamitin ang sidebar para sa Dashboard, Apply / Renew, Franchise Records, TODA Management, o Settings ayon sa role. Piliin ang <b>Log Out</b> pagkatapos gamitin.
<b>Resulta:</b> bubukas ang dashboard na pinapayagan ng account. Ang staff, cashier, at admin accounts ay manggagaling sa authorized administrator. Sa mobile, gamitin ang browser menu → Add to Home Screen kung nais ng PWA shortcut.
''',[1,2])
add('NEW FRANCHISE APPLICATION','SECTION 5.1 | OPERATOR MODULE','''
<b>Feature:</b> New Franchise Application - 5-Step Wizard. <b>Layunin:</b> magsumite ng aplikasyon para sa bagong 3-Year MTOP sa ilalim ng Municipal Ordinance No. 48 s. 1999.
1. Sa Operator Dashboard, piliin ang <b>Apply for Franchise / Apply / Renew</b>. Sa <b>Operator</b> step, suriin ang pangalan, address, TODA, at operator-driver details; kumpletuhin ang license requirements.
2. Sa <b>Vehicle</b> step, ilagay o i-verify ang plate, engine, chassis, make, at model. I-upload ang malinaw na LTO OR at CR. Suriin ang nabasang data kung may OCR.
3. Sa <b>Clearances</b> step, i-upload ang Barangay Clearance at TODA endorsement. Ayusin ang membership o route mismatch bago magpatuloy.
4. Sa <b>Cedula</b> step, ilagay ang CTC details at i-upload ang Cedula para sa kasalukuyang taon.
5. Sa <b>Review</b> step, suriin ang data at attachments. Buksan ang <b>Application Form (PDF)</b> o print preview, tanggapin ang declaration, at piliin ang <b>Submit Application</b>.
<b>Resulta:</b> maitatala ang application sa review queue at makikita ang tracking/status. Itabi ang reference number. Gamitin ang <b>Save Draft</b> kung kulang pa ang requirements; tingnan ang SMS notification kung available.
''',[3,4])
add('RENEWAL & MTOP CERTIFICATE','SECTION 5.1 | OPERATOR MODULE','''
## Franchise Renewal
<b>Layunin:</b> humiling ng renewal bago o matapos ang expiration ng franchise.
1. Sa dashboard, hanapin ang unit na <b>Expiring Soon</b> o <b>Expired</b>; piliin ang <b>Renew Franchise</b>.
2. Suriin ang dating franchise at vehicle details. I-upload ang kasalukuyang Cedula at updated OR/CR at iba pang hinihingi ng form.
3. Suriin ang renewal preview, saka piliin ang <b>Submit Renewal</b>.
<b>Resulta:</b> papasok ang request sa renewal review queue.
## Viewing / Printing Approved 3-Year MTOP
<b>Layunin:</b> tingnan o kumuha ng kopya ng approved certificate.
1. Sa approved/active unit, piliin ang <b>View Certificate</b>. Suriin ang permit number, operator, vehicle, at validity dates.
2. Piliin ang <b>Print / Save PDF</b>. Itakda ang paper size ayon sa official form, karaniwang Long Bond / Folio (8.5 × 13 in). I-enable ang Background graphics at tingnan ang print preview bago mag-save o print.
<b>Resulta:</b> certificate copy na may official details at QR verification kung kasama sa issued document. Tingnan ang eksaktong validity dates sa certificate.
''',[5,6])
add('TODA & FRANCHISING OPERATIONS','SECTIONS 5.2 & 5.3','''
## 5.2 TODA President - Roster Management
<b>Layunin:</b> patotohanan ang membership ng operator sa sariling asosasyon.
1. Mag-login bilang <b>TODA President</b> at buksan ang roster / membership page na available sa account.
2. Hanapin ang miyembro gamit ang pangalan o plate number. Ihambing sa records ng asosasyon.
3. Kung available, piliin ang <b>Add Member</b>, kumpletuhin ang required details, at i-save. Para sa pending membership, gamitin ang <b>Verify Member</b> matapos suriin.
<b>Resulta:</b> maitatala ang verified TODA affiliation. Ang Figure 7 ay staff registry; maaaring iba ang menus ng President account.
## 5.3 SB Staff / LLSA I - Operations Dashboard
<b>Layunin:</b> hanapin at unahin ang applications na kailangan ng aksyon.
1. Mag-login gamit ang authorized <b>SB Franchising Staff (LLSA I)</b> account.
2. Tingnan ang <b>Needs Review</b>, <b>For Signing</b>, at <b>Ready for Pickup</b> indicators. Buksan ang Needs Review o Approvals Queue.
3. Piliin ang application at buksan ang review record.
<b>Resulta:</b> lalabas ang application details at document inspection screen (p. 7).
''',[7,8])
add('REVIEW & CANCELLATION','SECTION 5.3 | SB STAFF / LLSA I','''
## Application Review & Document Inspection
<b>Layunin:</b> suriin ang requirements bago ipasa sa susunod na processing stage.
1. Sa Approvals Queue, buksan ang application. Ihambing ang operator at vehicle data sa OR, CR, license, CTC, at TODA endorsement.
2. Suriin ang bawat document tab at <b>Application Form (PDF)</b>. Kung may kulang o mali, gamitin ang revision / return action at ilagay ang malinaw na dahilan.
3. Kung kumpleto, piliin ang action para sa current stage. Sa Figure 9, ito ay <b>Send to cashier</b>. Tiyaking recorded ang payment at kumpleto ang required approval bago ang release.
<b>Resulta:</b> uusad ang request o maibabalik para sa correction. Hindi pa final approval ang pagpapadala sa cashier.
## Official Franchise Cancellation Processing
<b>Layunin:</b> maghanda ng cancellation document para sa validated request.
1. Buksan ang <b>Violations & Sanctions / Manage Revocations</b>; hanapin ang franchise at suriin ang dahilan, signed request, at receipt.
2. Buksan ang <b>Cancellation Letter</b> action kapag available. I-verify ang operator, franchise, ₱50 cancellation fee O.R. ayon sa source manual, at signatory.
3. Piliin ang <b>Print / Save PDF</b>. <b>Resulta:</b> maihahanda ang official cancellation letter. Figure 10 ay sanctions screen lamang; hindi pa nito ipinapakita ang letter preview.
''',[9,10])
add('MASTERLIST & USER ACCOUNTS','SECTIONS 5.3 & 5.5','''
## 5.3 Franchise Masterlist Filtering & Reports
<b>Layunin:</b> maghanap ng franchise at gumawa ng record o report.
1. Buksan ang <b>Franchise Records → Masterlist</b>.
2. Sa search field, ilagay ang pangalan, plate, motor, o chassis number. Gamitin ang <b>Status Filter</b> at iba pang filters kung available.
3. Suriin ang result at buksan ang <b>Details</b> ng tamang unit. Piliin ang <b>Print / Save as PDF</b> o report action na available sa account.
4. Suriin ang print/export preview bago i-save.
<b>Resulta:</b> makikita ang records na tumutugma sa napiling criteria.
## 5.5 System Administrator - User Management
<b>Layunin:</b> pamahalaan ang accounts at role permissions.
1. Mag-login bilang <b>System Administrator</b>; buksan ang <b>User Accounts / User Management</b>.
2. Hanapin ang account gamit ang search o role tabs. Suriin ang identity, role, at status bago magbago.
3. Para sa bagong account, gamitin ang add-user action kung available at piliin ang tamang role. Para sa existing account, buksan ang account action para sa authorized role change, reset, o deactivation.
4. I-save at suriin ang updated status. <b>Resulta:</b> maipapatupad ang access na angkop sa trabaho; itala ang pagbabago ayon sa office procedure.
''',[11,12])
T=[['Error / problema','Posibleng sanhi','Solusyon'],['Invalid credentials','Maling identifier o password.','Suriin ang email/phone at Caps Lock. Gamitin ang Forgot Password o humingi ng reset sa administrator.'],['Duplicate plate / engine / chassis','May kaparehong record.','Ihambing sa LTO OR/CR. Ipa-verify sa SB Staff ang existing record; huwag mag-imbento ng ibang identifier.'],['Expired license / invalid Cedula','Expired license o hindi current-year ang CTC.','I-renew ang license o kumuha ng current-year Cedula. I-update ang entry at attachment.'],['Invalid characters / missing data','Maling format o kulang ang required field.','Sundin ang field hints. Suriin ang number format, required fields, at OCR result bago mag-submit.'],['Network error / upload timeout','Mahina ang internet o malaki ang file.','I-check ang koneksyon at upload limit sa field. I-save ang draft; tingnan muna ang status bago ulitin ang submission.'],['Access denied','Walang permission ang role.','Bumalik sa sariling dashboard. Kung kailangan sa trabaho ang page, humingi ng access review sa administrator.']]
add('TROUBLESHOOTING & FAQs','SECTIONS 6 & 7','''
## 6. Common errors at solusyon
[TABLE]
## 7. Frequently Asked Questions
<b>1. Gaano katagal ang franchise validity?</b> Ang manual ay para sa 3-Year MTOP workflow. Tingnan ang eksaktong start at expiration dates sa iyong approved certificate.
<b>2. Ano ang LLSA I?</b> Local Legislative Staff Assistant I; ito ang SB staff role sa franchising workflow.
<b>3. Maaari bang mag-apply gamit ang cellphone?</b> Oo. Buksan ang system sa mobile browser at mag-upload ng malinaw at kumpletong litrato ng requirements.
<b>4. Paano ive-verify ang certificate?</b> I-scan ang QR code kung kasama sa issued certificate. Suriin ang record sa opisyal na verification page.
<b>5. Maaari bang mag-print ng blank form?</b> Kung available ang blank-form preview, buksan ito at piliin ang Print / Save as PDF. Suriin muna ang preview.
<b>6. Paano mag-request ng cancellation?</b> Sa unit options, piliin ang Cancel Franchise / Request Cancellation. Ilagay ang dahilan, i-upload ang signed request, at isumite. Ayon sa supplied manual, ₱50 ang fee sa Treasury; itabi ang O.R. para sa staff processing.
''')
add('SECURITY & SUPPORT','SECTIONS 8 & 9 | CASHIER QUICK GUIDE','''
## 8. Security at user reminders
1. Panatilihing pribado ang password. Gumamit lamang ng sariling authorized account at huwag magpahiram ng session.
2. Piliin ang <b>Log Out</b> pagkatapos gamitin, lalo na sa shared computer. Isara ang browser at huwag i-save ang password sa public device.
3. Hawakan nang maingat ang personal data alinsunod sa <b>Data Privacy Act of 2012 (R.A. 10173)</b>. Limitahan ang pagtingin, pag-download, at pagbabahagi sa kinakailangang authorized work.
4. Mag-upload lamang ng tunay at malinaw na dokumento. Suriin ang entries at huwag baguhin ang detalye para ma-bypass ang validation.
5. Sa screenshots para sa presentation o manual, gumamit ng sample accounts o takpan ang personal identifiers at confidential data.
## 5.4 Municipal Treasury / Cashier - Payment Collection
<b>Layunin:</b> itala ang assessed payment at Official Receipt.
1. Mag-login bilang <b>Cashier</b>. Hanapin ang operator o plate number sa Cashier Dashboard at suriin ang assessment.
2. Tanggapin ang bayad ayon sa approved assessment. Ang supplied manual ay may ₱500 franchise fee at ₱50 cancellation fee; kumpirmahin ang payable amount sa Treasury.
3. Ilagay ang wastong <b>O.R. Number</b> mula sa physical receipt at piliin ang <b>Process Payment</b>. Suriin ang saved record.
<b>Resulta:</b> magiging recorded/paid ang payment at uusad ang request ayon sa workflow. Hindi kapalit ng final approval ang payment record.
## 9. Support at contact channels
<b>SB / Office of the Municipal Vice Mayor:</b> Municipal Building, Gasan, Marinduque - para sa requirements, status, corrections, at cancellation processing.
<b>Municipal Treasury / Cashier:</b> Municipal Building, Gasan - para sa assessment, bayad, at O.R. concerns.
<b>MarSU CICS / G-TRAMS project team:</b> College of Information and Computing Sciences, Marinduque State University, Boac, Marinduque. College email: <b>cics@mscmarinduque.edu.ph</b> (nakalimbag sa supplied official deliverable).
<b>Kapag humihingi ng tulong:</b> ihanda ang role, reference number, petsa/oras, eksaktong error, at redacted screenshot. Huwag isama ang password. Kumpirmahin sa LGU ang kasalukuyang office window, contact person, email, at phone bago isumite ang final manual.
''')
C={1:'Welcome and Login page: email/phone, password, and Log In.',2:'Operator Registration: full name, Barangay, TODA, and contact fields.',3:'Application wizard - Step 1: Operator & Driver Information.',4:'Official MTOP Application Form preview (upper portion).',5:'Franchise Renewal Application and previous franchise details.',6:'Approved MTOP electronic certificate preview (upper portion).',7:'Staff TODA Association & Masterlist Registry (not a President-role capture).',8:'SB Franchising Operations Dashboard and workflow indicators.',9:'Application review: document tabs and Send to cashier action.',10:'Violations & Progressive Sanctions; cancellation letter not shown.',11:'Franchise Masterlist: search, status filter, and record table.',12:'Admin User Management with roles and account status.'}
W,H=595.276,841.89; RED=HexColor('#9e2a2b'); GOLD=HexColor('#d4af37'); NAVY=HexColor('#211850'); BG=HexColor('#fbfbf9'); INK=HexColor('#29262a')
def para(s,size=10,head=False):return Paragraph(s,ParagraphStyle('x',fontName='Arial-Bold' if head else 'Arial',fontSize=size,leading=size*1.25,textColor=RED if head else INK))
def items(body,size,width):
 out=[]
 for s in body.splitlines():
  if not s.strip():continue
  if s=='[TABLE]':
   t=Table([[para(escape(v),size-.3) for v in row] for row in T],colWidths=[width*.24,width*.24,width*.52]);t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),HexColor('#efddde')),('ROWBACKGROUNDS',(0,1),(-1,-1),[white,HexColor('#f7f3f1')]),('GRID',(0,0),(-1,-1),.35,HexColor('#ded6d1')),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]));_,ht=t.wrap(width,9999);out.append((t,ht,8));continue
  head=s.startswith('## ');q=para(s[3:] if head else s,size+.5 if head else size,head);_,ht=q.wrap(width,9999);out.append((q,ht,7 if head else 4))
 return out
pdf=O/'Deliverable7_Group4_UsersManual.pdf';c=canvas.Canvas(str(pdf),pagesize=(W,H));c.setTitle('G-TRAMS User’s Manual | Group 4 | Deliverable 7');c.setAuthor('Group 4 | MarSU CICS')
def base(n):
 c.setFillColor(BG);c.rect(0,0,W,H,stroke=0,fill=1);c.setFillColor(NAVY);c.setFont('Arial-Bold',8);c.drawString(42,H-38,'G-TRAMS');c.drawRightString(W-42,H-38,'2026 / USER’S MANUAL');c.setStrokeColor(GOLD);c.setLineWidth(.6);c.line(42,40,W-42,40);c.setFont('Arial',7.5);c.setFillColor(INK);c.drawString(42,25,'MarSU CICS  |  LGU Gasan  |  Group 4');c.drawRightString(W-42,25,f'{n:02d} / 10')
base(1);c.setFillColor(RED);c.setFont('Arial-Bold',36);c.drawString(42,H-155,'USER’S');c.setFont('Arial-Bold',77);c.drawString(38,H-231,'MANUAL');c.setStrokeColor(RED);c.line(42,H-246,W-42,H-246)
q=para('G-TRAMS: Gasan Tricycle Records and<br/>Application Management System',15);_,hh=q.wrap(W-84,100);q.drawOn(c,42,H-260-hh)
c.drawImage(str(R/'frontend/public/gtrams-logo.png'),32,174,width=290,height=290,preserveAspectRatio=True,mask='auto')
c.setFillColor(GOLD);c.rect(332,406,W-332,25,stroke=0,fill=1);c.setFillColor(white);c.setFont('Arial-Bold',10);c.drawString(345,414,'DELIVERABLE #7 / GROUP 4')
s='<b>Marinduque State University</b><br/>College of Information and<br/>Computing Sciences (CICS)<br/><br/><b>Partner Agency</b><br/>Local Government Unit of Gasan<br/>Sangguniang Bayan / Office of<br/>the Municipal Vice Mayor<br/><br/><b>Statutory Basis</b><br/>Municipal Ordinance No. 48 s. 1999';q=para(s,10);_,hh=q.wrap(210,400);q.drawOn(c,345,392-hh)
q=para('<b>User’s Manual of the System</b><br/>BS Information Technology | Capstone Project<br/>Submission: Deliverable7_Group4_UsersManual.pdf',11);_,hh=q.wrap(W-84,100);q.drawOn(c,42,108-hh);c.showPage();metrics=[]
for n,d in enumerate(P,2):
 base(n);c.setFillColor(RED);c.setFont('Arial-Bold',8.5);c.drawString(42,H-66,d['kicker']);ts=24
 while pdfmetrics.stringWidth(d['title'],'Arial-Bold',ts)>W-84:ts-=.5
 c.setFont('Arial-Bold',ts);c.drawString(42,H-97,d['title']);c.setStrokeColor(GOLD);c.line(42,H-109,W-42,H-109);y=H-124;wid=W-84
 fw=460;figs=[]
 for f in d['fig']:
  fp=next(I.glob(f'Figure_{f:02d}_*.png'));im=Image.open(fp);figs.append((f,fp,im.width,im.height))
 def fh(fw):return sum(fw*ih/iw+25 for f,fp,iw,ih in figs)+(8 if figs else 0)
 size=10.3 if figs else 11.3;its=items(d['body'],size,wid)
 while sum(t[1]+t[2] for t in its)>y-54-fh(fw) and size>9.1:size-=.1;its=items(d['body'],size,wid)
 if sum(t[1]+t[2] for t in its)>y-54-fh(fw):
  fw=390;size=10.3;its=items(d['body'],size,wid)
  while sum(t[1]+t[2] for t in its)>y-54-fh(fw) and size>9.1:size-=.1;its=items(d['body'],size,wid)
 if sum(t[1]+t[2] for t in its)>y-54-fh(fw):raise ValueError(f'Page {n} overflow: body {sum(t[1]+t[2] for t in its)} available {y-54-fh(fw)}')
 for q,ht,gap in its:q.drawOn(c,42,y-ht);y-=ht+gap
 if figs:
  y-=8
  for f,fp,iw,ih in figs:
   ht=fw*ih/iw;x=(W-fw)/2;c.drawImage(str(fp),x,y-ht,width=fw,height=ht);c.setStrokeColor(HexColor('#d9d2cc'));c.rect(x,y-ht,fw,ht,stroke=1,fill=0);q=para(f'Figure {f}. '+C[f],8.1);_,qh=q.wrap(wid,100);q.drawOn(c,42,y-ht-qh-4);y-=ht+25
 metrics.append({'page':n,'body_font':round(size,1),'image_width':fw if figs else None,'lowest_y':round(y,1)});c.showPage()
c.save();(O/'layout_metrics.json').write_text(json.dumps(metrics,indent=2),encoding='utf-8')
md=['# G-TRAMS User’s Manual — Page-by-page copy','','## Page 1 — Cover','','G-TRAMS: Gasan Tricycle Records and Application Management System\n\nUser’s Manual of the System\n\nMarinduque State University — College of Information and Computing Sciences (CICS)\n\nLocal Government Unit of Gasan — Sangguniang Bayan / Office of the Municipal Vice Mayor\n\nMunicipal Ordinance No. 48 s. 1999\n\nBS Information Technology | Capstone Project | Deliverable #7 | Group 4\n\nSubmission filename: Deliverable7_Group4_UsersManual.pdf']
for n,d in enumerate(P,2):
 md+=['',f'## Page {n} — {d["title"]}','',d['kicker'],'',d['body'].replace('<b>','**').replace('</b>','**').replace('[TABLE]','\n'.join(['| '+' | '.join(row)+' |' for row in T[:1]]+['|---|---|---|']+['| '+' | '.join(row)+' |' for row in T[1:]]))]
 for f in d['fig']:md+=['',f'Figure {f}. {C[f]}']
(O/'GTRAMS_Canva_PageByPage_Copy.md').write_text('\n'.join(md),encoding='utf-8');print(json.dumps({'pdf':str(pdf),'pages':10,'metrics':metrics},indent=2))



