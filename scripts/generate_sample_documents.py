import os
import shutil
from PIL import Image, ImageDraw, ImageFont

BASE_DOCS_DIR = os.path.join(os.path.dirname(__file__), '..', 'sample_docs')
TAMA_DIR = os.path.join(BASE_DOCS_DIR, 'TAMA')
MALI_DIR = os.path.join(BASE_DOCS_DIR, 'MALI')

os.makedirs(TAMA_DIR, exist_ok=True)
os.makedirs(MALI_DIR, exist_ok=True)

# Clean out old loose files in sample_docs root if any
for f in os.listdir(BASE_DOCS_DIR):
    fpath = os.path.join(BASE_DOCS_DIR, f)
    if os.path.isfile(fpath):
        os.remove(fpath)

def get_fonts():
    try:
        title = ImageFont.truetype('arialbd.ttf', 24)
        subtitle = ImageFont.truetype('arialbd.ttf', 16)
        heading = ImageFont.truetype('arialbd.ttf', 14)
        body_bold = ImageFont.truetype('arialbd.ttf', 12)
        body = ImageFont.truetype('arial.ttf', 12)
        mono = ImageFont.truetype('courbd.ttf', 13)
        small = ImageFont.truetype('arial.ttf', 10)
    except:
        title = subtitle = heading = body_bold = body = mono = small = ImageFont.load_default()
    return title, subtitle, heading, body_bold, body, mono, small

title_f, sub_f, head_f, bold_f, body_f, mono_f, sm_f = get_fonts()

# ==============================================================================
# FOLDER 1: TAMA (JUAN DELA CRUZ - POB TODA - CENTRAL ZONE)
# ==============================================================================

def make_tama_license_front():
    w, h = 860, 540
    img = Image.new('RGB', (w, h), color='#F9FAFB')
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w, 80], fill='#0284C7')
    d.rectangle([0, 80, w, 88], fill='#F59E0B')
    d.text((w//2, 25), "REPUBLIC OF THE PHILIPPINES", fill='#FFFFFF', font=sub_f, anchor='mm')
    d.text((w//2, 50), "LAND TRANSPORTATION OFFICE - OFFICIAL DRIVER'S LICENSE", fill='#E0F2FE', font=sm_f, anchor='mm')
    d.text((w//2, 68), "DRIVER'S LICENSE", fill='#FEF08A', font=head_f, anchor='mm')

    d.rectangle([40, 115, 200, 315], fill='#E2E8F0', outline='#94A3B8', width=2)
    d.text((120, 215), "PHOTO", fill='#64748B', font=sub_f, anchor='mm')

    d.text((230, 115), "LICENSE NO.", fill='#64748B', font=sm_f)
    d.text((230, 130), "D02-14-098231", fill='#0F172A', font=title_f)
    d.text((580, 115), "EXPIRATION DATE (VALID)", fill='#15803D', font=bold_f)
    d.text((580, 130), "2028-08-15", fill='#15803D', font=sub_f)

    d.text((230, 175), "LAST NAME, FIRST NAME, MIDDLE NAME", fill='#64748B', font=sm_f)
    d.text((230, 190), "DELA CRUZ, JUAN M.", fill='#0F172A', font=sub_f)
    d.text((230, 230), "NATIONALITY", fill='#64748B', font=sm_f)
    d.text((230, 245), "FILIPINO", fill='#0F172A', font=bold_f)
    d.text((360, 230), "SEX", fill='#64748B', font=sm_f)
    d.text((360, 245), "M", fill='#0F172A', font=bold_f)
    d.text((450, 230), "DATE OF BIRTH", fill='#64748B', font=sm_f)
    d.text((450, 245), "1992-08-15", fill='#0F172A', font=bold_f)
    d.text((230, 280), "ADDRESS", fill='#64748B', font=sm_f)
    d.text((230, 295), "BARANGAY I (POBLACION), GASAN, MARINDUQUE", fill='#0F172A', font=bold_f)

    d.rectangle([40, 345, w-40, 480], fill='#F1F5F9', outline='#CBD5E1', width=1)
    d.text((60, 360), "AUTHORIZED DL CODES:", fill='#64748B', font=sm_f)
    d.text((60, 380), "A, A1 (MOTORCYCLES / TRICYCLES)", fill='#047857', font=sub_f)
    d.text((460, 360), "CONDITIONS:", fill='#64748B', font=sm_f)
    d.text((460, 380), "NONE (1)", fill='#0F172A', font=sub_f)
    d.text((60, 430), "AGENCY CODE:", fill='#64748B', font=sm_f)
    d.text((60, 445), "D02 - BOAC / GASAN DISTRICT OFFICE", fill='#0F172A', font=bold_f)
    d.text((460, 430), "BLOOD TYPE / BIOMETRICS:", fill='#94A3B8', font=sm_f)
    d.text((460, 445), "[EXCLUDED BY LGU DIRECTIVE]", fill='#94A3B8', font=bold_f)

    out = os.path.join(TAMA_DIR, '01_license_front_TAMA.png')
    img.save(out)

def make_tama_license_back():
    w, h = 860, 540
    img = Image.new('RGB', (w, h), color='#F8FAFC')
    d = ImageDraw.Draw(img)
    d.rectangle([0, 40, w, 110], fill='#1E293B')
    for x in range(60, w-60, 6):
        d.line([(x, 150), (x, 210)], fill='#0F172A', width=3 if (x % 12 == 0) else 1)
    d.text((w//2, 230), "*884719203948*", fill='#0F172A', font=mono_f, anchor='mm')
    d.rectangle([40, 260, w-40, 450], fill='#FFFFFF', outline='#E2E8F0', width=2)
    d.text((60, 280), "CARD SERIAL NUMBER:", fill='#64748B', font=sm_f)
    d.text((60, 300), "SN-884719203948", fill='#0F172A', font=title_f)
    d.text((60, 350), "DRIVING RESTRICTION CODES REFERENCE:", fill='#64748B', font=sm_f)
    d.text((60, 370), "Code A : Motorcycle (L1, L2, L3)", fill='#334155', font=body_f)
    d.text((60, 390), "Code A1: Tricycle / Motorized Tricycle (L4, L5) - Authorized Operator", fill='#047857', font=bold_f)
    out = os.path.join(TAMA_DIR, '02_license_back_TAMA.png')
    img.save(out)

def make_tama_cr():
    w, h = 900, 1150
    img = Image.new('RGB', (w, h), color='#FFFFFF')
    d = ImageDraw.Draw(img)
    d.rectangle([20, 20, w-20, h-20], outline='#1E3A8A', width=3)
    d.rectangle([26, 26, w-26, h-26], outline='#93C5FD', width=1)
    d.text((w//2, 50), "REPUBLIC OF THE PHILIPPINES - LAND TRANSPORTATION OFFICE", fill='#1E3A8A', font=sub_f, anchor='mm')
    d.text((w//2, 80), "CERTIFICATE OF REGISTRATION (CR)", fill='#DC2626', font=title_f, anchor='mm')
    d.line([(40, 105), (w-40, 105)], fill='#1E3A8A', width=2)

    d.text((50, 120), "CR NUMBER: 0048192019", fill='#0F172A', font=title_f)
    d.text((480, 120), "CR DATE: 2024-02-14", fill='#0F172A', font=sub_f)
    d.text((700, 120), "MV FILE: 0401-0003892", fill='#0F172A', font=bold_f)

    d.rectangle([40, 160, w-40, 250], fill='#F8FAFC', outline='#CBD5E1', width=1)
    d.text((55, 175), "NAME OF REGISTERED OWNER:", fill='#475569', font=sm_f)
    d.text((55, 195), "JUAN DELA CRUZ", fill='#0F172A', font=title_f)
    d.text((55, 225), "ADDRESS: BARANGAY I (POBLACION), GASAN, MARINDUQUE", fill='#334155', font=bold_f)

    specs = [
        ("PLATE NUMBER", "4528-TC", "ENGINE / MOTOR NO.", "KF51E7890123"),
        ("CHASSIS NUMBER / VIN", "MH1KF5178PK098231", "MAKE / BRAND", "HONDA"),
        ("SERIES / MODEL", "TMX 125 ALPHA", "YEAR MODEL", "2024"),
        ("COLOR", "BLACK", "BODY TYPE", "MOTORCYCLE WITH SIDECAR"),
        ("VEHICLE TYPE", "TRICYCLE / MOTORCYCLE", "CLASSIFICATION", "FOR HIRE / PUV"),
        ("FUEL TYPE", "GASOLINE", "PASSENGER CAPACITY", "4 PERSONS")
    ]
    y_pos = 280
    for row in specs:
        lbl1, val1, lbl2, val2 = row
        d.rectangle([40, y_pos, w//2 - 10, y_pos + 55], fill='#FFFFFF', outline='#E2E8F0', width=1)
        d.text((55, y_pos + 6), lbl1, fill='#64748B', font=sm_f)
        d.text((55, y_pos + 24), val1, fill='#0F172A', font=bold_f)
        d.rectangle([w//2 + 10, y_pos, w - 40, y_pos + 55], fill='#FFFFFF', outline='#E2E8F0', width=1)
        d.text((w//2 + 25, y_pos + 6), lbl2, fill='#64748B', font=sm_f)
        d.text((w//2 + 25, y_pos + 24), val2, fill='#0F172A', font=bold_f)
        y_pos += 65

    d.rectangle([40, 800, w-40, 870], fill='#FEF3C7', outline='#F59E0B', width=1)
    d.text((w//2, 825), "NOTICE: PAYMENT AMOUNTS AND CASHIER SIGNATURES EXCLUDED FROM OCR", fill='#92400E', font=bold_f, anchor='mm')
    d.text((w//2, 850), "Official Registration Record Verified Under LTO Information Database System", fill='#B45309', font=sm_f, anchor='mm')
    out = os.path.join(TAMA_DIR, '03_lto_cr_TAMA.png')
    img.save(out)

def make_tama_or():
    w, h = 900, 680
    img = Image.new('RGB', (w, h), color='#FFFFFF')
    d = ImageDraw.Draw(img)
    d.rectangle([20, 20, w-20, h-20], outline='#166534', width=3)
    d.text((w//2, 50), "REPUBLIC OF THE PHILIPPINES - LAND TRANSPORTATION OFFICE", fill='#166534', font=sub_f, anchor='mm')
    d.text((w//2, 80), "OFFICIAL RECEIPT (ANNUAL REGISTRATION RENEWAL)", fill='#15803D', font=title_f, anchor='mm')
    d.line([(40, 105), (w-40, 105)], fill='#166534', width=2)
    d.text((50, 130), "OFFICIAL RECEIPT NO.: 1204-0000089271", fill='#0F172A', font=title_f)
    d.text((550, 130), "O.R. DATE: 2026-03-12", fill='#0F172A', font=sub_f)
    d.text((50, 180), "REGISTERED OPERATOR: JUAN DELA CRUZ", fill='#0F172A', font=title_f)
    d.text((50, 220), "PLATE NO: 4528-TC | ENGINE: KF51E7890123 | CHASSIS: MH1KF5178PK098231", fill='#334155', font=bold_f)
    d.text((50, 260), "VALIDITY UNTIL: 2027-03-31", fill='#15803D', font=title_f)
    d.text((50, 310), "ISSUING DISTRICT: BOAC / GASAN DISTRICT OFFICE (1204)", fill='#64748B', font=bold_f)
    d.rectangle([40, 360, w-40, 450], fill='#F0FDF4', outline='#BBF7D0', width=1)
    d.text((w//2, 405), "STATUS: PAID & VALIDATED (CURRENT ANNUAL RENEWAL)", fill='#15803D', font=title_f, anchor='mm')
    out = os.path.join(TAMA_DIR, '04_lto_or_TAMA.png')
    img.save(out)

def make_tama_brgy_clearance():
    w, h = 900, 1000
    img = Image.new('RGB', (w, h), color='#FFFFFF')
    d = ImageDraw.Draw(img)
    d.rectangle([25, 25, w-25, h-25], outline='#9E2A2B', width=3)
    d.text((w//2, 60), "REPUBLIC OF THE PHILIPPINES — MUNICIPALITY OF GASAN", fill='#1F1D1B', font=sub_f, anchor='mm')
    d.text((w//2, 85), "OFFICE OF THE PUNONG BARANGAY — BARANGAY I (POBLACION)", fill='#9E2A2B', font=bold_f, anchor='mm')
    d.text((w//2, 130), "BARANGAY CLEARANCE", fill='#1F1D1B', font=title_f, anchor='mm')
    d.text((60, 180), "CONTROL NO.: BC-2026-POB-019", fill='#9E2A2B', font=title_f)
    d.text((600, 180), "DATE ISSUED: 2026-04-10", fill='#0F172A', font=sub_f)
    text = "This is to certify that MR. JUAN DELA CRUZ, resident of Barangay I (Poblacion), Gasan,\nhas NO DEROGATORY RECORD and is certified for Motorized Tricycle Franchise (MTOP) issuance."
    d.text((60, 260), text, fill='#1F1D1B', font=head_f)
    d.text((600, 500), "HON. VICENTE MORALES", fill='#0F172A', font=sub_f)
    d.text((600, 525), "Punong Barangay (Poblacion)", fill='#64748B', font=bold_f)
    out = os.path.join(TAMA_DIR, '05_brgy_clearance_TAMA.png')
    img.save(out)

def make_tama_toda_certificate():
    w, h = 900, 1000
    img = Image.new('RGB', (w, h), color='#FFFFFF')
    d = ImageDraw.Draw(img)
    d.rectangle([25, 25, w-25, h-25], outline='#D97706', width=3)
    d.text((w//2, 60), "POB TODA (POBLACION CENTRAL OPERATORS ASSOCIATION)", fill='#B45309', font=title_f, anchor='mm')
    d.text((w//2, 90), "Municipal Route: Central Zone (Poblacion Town Proper Loop)", fill='#64748B', font=bold_f, anchor='mm')
    d.text((w//2, 140), "TODA ENDORSEMENT CERTIFICATE", fill='#1F1D1B', font=title_f, anchor='mm')
    d.text((60, 190), "CERTIFICATE NO.: POB-2026-088", fill='#B45309', font=title_f)
    d.text((600, 190), "DATE ISSUED: 2026-04-08", fill='#0F172A', font=sub_f)
    text = "THIS IS TO CERTIFY THAT MR. JUAN DELA CRUZ is a duly accredited active member of POB TODA.\nDesignated Body No.: 01 | Plate: 4528-TC | Unit Make: Honda TMX 125."
    d.text((60, 270), text, fill='#1F1D1B', font=head_f)
    d.text((600, 500), "PEDRO SANTOS", fill='#0F172A', font=sub_f)
    d.text((600, 525), "TODA President (POB TODA)", fill='#64748B', font=bold_f)
    out = os.path.join(TAMA_DIR, '06_toda_certificate_TAMA.png')
    img.save(out)

def make_tama_cedula():
    w, h = 900, 600
    img = Image.new('RGB', (w, h), color='#FFFBEB')
    d = ImageDraw.Draw(img)
    d.rectangle([20, 20, w-20, h-20], outline='#78350F', width=2)
    d.text((w//2, 45), "COMMUNITY TAX CERTIFICATE (CEDULA) • 2026", fill='#78350F', font=title_f, anchor='mm')
    d.text((w//2, 70), "MUNICIPALITY OF GASAN — PROVINCE OF MARINDUQUE", fill='#92400E', font=bold_f, anchor='mm')
    d.text((50, 110), "CTC NO.: CC12026-0928174", fill='#78350F', font=title_f)
    d.text((600, 110), "DATE ISSUED: 2026-01-18", fill='#0F172A', font=sub_f)
    d.text((50, 170), "TAXPAYER: JUAN DELA CRUZ", fill='#0F172A', font=title_f)
    d.text((50, 210), "ADDRESS: BARANGAY I (POBLACION), GASAN, MARINDUQUE", fill='#334155', font=bold_f)
    d.text((50, 260), "TOTAL AMOUNT PAID: PHP 55.00", fill='#B45309', font=title_f)
    d.text((50, 310), "COLLECTING CASHIER: MARIA CLARA", fill='#0F172A', font=bold_f)
    out = os.path.join(TAMA_DIR, '07_cedula_TAMA.png')
    img.save(out)

def make_tama_toda_roster():
    w, h = 1240, 1754
    img = Image.new('RGB', (w, h), color='#FFFFFF')
    d = ImageDraw.Draw(img)
    d.rectangle([30, 30, w-30, h-30], outline='#1F1D1B', width=3)
    d.text((w//2, 80), "OFFICIAL MASTERLIST OF ACCREDITED TODA MEMBERS", fill='#1F1D1B', font=title_f, anchor='mm')
    d.text((w//2, 115), "ASSOCIATION: POB TODA (POBLACION CENTRAL)", fill='#9E2A2B', font=title_f, anchor='mm')
    d.text((w//2, 145), "Calendar Year 2026 Official Endorsement Roster • Route Zone: Central Zone", fill='#64748B', font=sub_f, anchor='mm')

    y = 200
    headers = ['NO.', 'MEMBER / OPERATOR NAME', 'BODY NO.', 'LTO PLATE NO.', 'BARANGAY', 'STATUS']
    col_x = [60, 130, 560, 720, 910, 1110]
    d.rectangle([50, y, w-50, y+42], fill='#F0ECE1', outline='#1F1D1B', width=1)
    for i, h_text in enumerate(headers):
        d.text((col_x[i], y+14), h_text, fill='#1F1D1B', font=bold_f)

    members = [
        ('1', 'JUAN DELA CRUZ', '01', '4528-TC', 'Barangay I (Poblacion)', 'ACTIVE'),
        ('2', 'PEDRO S. SANTOS', '02', '5678-CD', 'Barangay II (Poblacion)', 'ACTIVE'),
        ('3', 'ROBERTO V. REYES', '03', '9012-EF', 'Barangay III (Poblacion)', 'ACTIVE'),
        ('4', 'MARIO D. BAUTISTA', '04', '3456-GH', 'Barangay I (Poblacion)', 'ACTIVE'),
        ('5', 'EDGARDO C. RAMOS', '05', '7890-IJ', 'Barangay II (Poblacion)', 'ACTIVE')
    ]
    y_row = y + 42
    for m in members:
        num, name, body_no, plate, brgy, stat = m
        bg = '#FDFBF7' if int(num) % 2 == 0 else '#FFFFFF'
        d.rectangle([50, y_row, w-50, y_row + 40], fill=bg, outline='#E5E7EB', width=1)
        d.text((col_x[0] + 10, y_row + 12), num, fill='#0F172A', font=bold_f)
        d.text((col_x[1], y_row + 12), name, fill='#9E2A2B' if 'JUAN DELA CRUZ' in name else '#0F172A', font=bold_f)
        d.text((col_x[2], y_row + 12), body_no, fill='#0F172A', font=mono_f)
        d.text((col_x[3], y_row + 12), plate, fill='#0F172A', font=mono_f)
        d.text((col_x[4], y_row + 12), brgy, fill='#0F172A', font=body_f)
        d.text((col_x[5], y_row + 12), stat, fill='#15803D', font=bold_f)
        y_row += 40

    out = os.path.join(TAMA_DIR, '08_toda_roster_TAMA.png')
    img.save(out)

# ==============================================================================
# FOLDER 2: MALI (ERROR DETECTION & VALIDATION DEMO FOR MARIO SANTOS)
# ==============================================================================

def make_mali_license_expired():
    w, h = 860, 540
    img = Image.new('RGB', (w, h), color='#FFF1F2')
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w, 80], fill='#991B1B')
    d.text((w//2, 25), "REPUBLIC OF THE PHILIPPINES - LAND TRANSPORTATION OFFICE", fill='#FFFFFF', font=sub_f, anchor='mm')
    d.text((w//2, 55), "DRIVER'S LICENSE [EXPIRED DOCUMENT TEST]", fill='#FEF08A', font=head_f, anchor='mm')

    d.rectangle([40, 115, 200, 315], fill='#FEE2E2', outline='#EF4444', width=2)
    d.text((120, 215), "PHOTO", fill='#DC2626', font=sub_f, anchor='mm')

    d.text((230, 115), "LICENSE NO.", fill='#64748B', font=sm_f)
    d.text((230, 130), "D02-09-014522", fill='#0F172A', font=title_f)
    d.text((580, 115), "EXPIRATION DATE (PAST / EXPIRED)", fill='#DC2626', font=bold_f)
    d.text((580, 130), "2022-05-10", fill='#DC2626', font=title_f)

    d.text((230, 175), "NAME: SANTOS, MARIO D.", fill='#0F172A', font=title_f)
    d.text((230, 220), "ADDRESS: ANTIPOLO, GASAN, MARINDUQUE", fill='#0F172A', font=bold_f)
    d.rectangle([40, 350, w-40, 460], fill='#FEE2E2', outline='#EF4444', width=2)
    d.text((w//2, 390), "AI OCR TEST TRIGGER: EXPIRED LICENSE (YEAR 2022)", fill='#991B1B', font=title_f, anchor='mm')
    d.text((w//2, 420), "System will highlight the expiration date in red and show correction alert.", fill='#DC2626', font=body_f, anchor='mm')

    out = os.path.join(MALI_DIR, '01_mali_license_EXPIRED.png')
    img.save(out)

def make_mali_license_wrong_code():
    w, h = 860, 540
    img = Image.new('RGB', (w, h), color='#FFFBEB')
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w, 80], fill='#D97706')
    d.text((w//2, 25), "REPUBLIC OF THE PHILIPPINES - LAND TRANSPORTATION OFFICE", fill='#FFFFFF', font=sub_f, anchor='mm')
    d.text((w//2, 55), "DRIVER'S LICENSE [NO TRICYCLE RESTRICTION CODE]", fill='#FEF08A', font=head_f, anchor='mm')

    d.text((230, 130), "D02-18-005612", fill='#0F172A', font=title_f)
    d.text((230, 180), "NAME: SANTOS, MARIO D.", fill='#0F172A', font=title_f)
    d.text((580, 130), "EXPIRY: 2029-01-10", fill='#15803D', font=title_f)
    d.rectangle([40, 340, w-40, 460], fill='#FEF3C7', outline='#F59E0B', width=2)
    d.text((60, 360), "DL RESTRICTION CODES PRINTED ON CARD:", fill='#92400E', font=bold_f)
    d.text((60, 390), "CODE B ONLY (PASSENGER CARS ONLY - NO MOTORCYCLE / TRICYCLE)", fill='#DC2626', font=title_f)
    d.text((60, 425), "ERROR: LGU requires DL Code A or A1 for Tricycle Franchise operation.", fill='#B45309', font=body_f)

    out = os.path.join(MALI_DIR, '02_mali_license_WRONG_CODE.png')
    img.save(out)

def make_mali_cr_mismatch():
    w, h = 900, 1000
    img = Image.new('RGB', (w, h), color='#FFFFFF')
    d = ImageDraw.Draw(img)
    d.rectangle([20, 20, w-20, h-20], outline='#991B1B', width=3)
    d.text((w//2, 50), "LTO CERTIFICATE OF REGISTRATION [CR OWNER MISMATCH]", fill='#DC2626', font=title_f, anchor='mm')
    d.rectangle([40, 140, w-40, 240], fill='#FEF2F2', outline='#EF4444', width=2)
    d.text((55, 155), "REGISTERED OWNER IN DOCUMENT:", fill='#DC2626', font=bold_f)
    d.text((55, 180), "RICARDO DALISAY", fill='#DC2626', font=title_f)
    d.text((55, 215), "(Applicant entered: MARIO SANTOS)", fill='#991B1B', font=head_f)

    d.text((50, 280), "PLATE NO.: 9912-XY | CHASSIS: MH1KF5178PK998877", fill='#0F172A', font=title_f)
    d.rectangle([40, 400, w-40, 500], fill='#FEE2E2', outline='#EF4444', width=1)
    d.text((w//2, 440), "AI OCR TEST TRIGGER: APPLICANT IS NOT THE CR OWNER", fill='#991B1B', font=title_f, anchor='mm')
    d.text((w//2, 470), "System flags this application in Kayla's review with 'CR Owner Mismatch'.", fill='#DC2626', font=body_f, anchor='mm')

    out = os.path.join(MALI_DIR, '03_mali_cr_NAME_MISMATCH.png')
    img.save(out)

def make_mali_cr_fake_chassis():
    w, h = 900, 1000
    img = Image.new('RGB', (w, h), color='#FFFFFF')
    d = ImageDraw.Draw(img)
    d.rectangle([20, 20, w-20, h-20], outline='#991B1B', width=3)
    d.text((w//2, 50), "LTO CERTIFICATE OF REGISTRATION [CHASSIS SERIAL MISMATCH]", fill='#DC2626', font=title_f, anchor='mm')
    d.text((50, 150), "REGISTERED OWNER: MARIO SANTOS", fill='#0F172A', font=title_f)
    d.rectangle([40, 220, w-40, 320], fill='#FEF2F2', outline='#EF4444', width=2)
    d.text((55, 240), "CHASSIS NUMBER IN DOCUMENT:", fill='#DC2626', font=bold_f)
    d.text((55, 270), "CHASSIS-INVALID-XXXXX-9999", fill='#DC2626', font=title_f)
    d.rectangle([40, 400, w-40, 500], fill='#FEE2E2', outline='#EF4444', width=1)
    d.text((w//2, 440), "AI OCR TEST TRIGGER: CHASSIS NUMBER DOES NOT MATCH FORM INPUT", fill='#991B1B', font=title_f, anchor='mm')
    out = os.path.join(MALI_DIR, '04_mali_cr_FAKE_CHASSIS.png')
    img.save(out)

def make_mali_brgy_wrong_municipality():
    w, h = 900, 1000
    img = Image.new('RGB', (w, h), color='#FFFFFF')
    d = ImageDraw.Draw(img)
    d.rectangle([25, 25, w-25, h-25], outline='#991B1B', width=3)
    d.text((w//2, 60), "PROVINCE OF MARINDUQUE — MUNICIPALITY OF BOAC", fill='#991B1B', font=title_f, anchor='mm')
    d.text((w//2, 95), "OFFICE OF THE PUNONG BARANGAY — BARANGAY MURALLON (BOAC)", fill='#991B1B', font=bold_f, anchor='mm')
    d.text((w//2, 150), "BARANGAY CLEARANCE [WRONG JURISDICTION / NON-GASAN]", fill='#DC2626', font=title_f, anchor='mm')
    d.text((60, 230), "RESIDENT: MARIO SANTOS | RESIDENCY: BOAC, MARINDUQUE", fill='#0F172A', font=title_f)
    d.rectangle([40, 350, w-40, 480], fill='#FEF2F2', outline='#EF4444', width=2)
    d.text((w//2, 400), "ERROR: CLEARANCE IS ISSUED BY MUNICIPALITY OF BOAC", fill='#991B1B', font=title_f, anchor='mm')
    d.text((w//2, 435), "G-TRAMS is for Gasan Municipality only. Address outside Gasan will be flagged.", fill='#DC2626', font=body_f, anchor='mm')
    out = os.path.join(MALI_DIR, '05_mali_brgy_WRONG_MUNICIPALITY.png')
    img.save(out)

def make_mali_toda_unauthorized():
    w, h = 900, 1000
    img = Image.new('RGB', (w, h), color='#FFFFFF')
    d = ImageDraw.Draw(img)
    d.rectangle([25, 25, w-25, h-25], outline='#991B1B', width=3)
    d.text((w//2, 60), "FAKE / UNAUTHORIZED TRICYCLE ASSOCIATION OF MARINDUQUE", fill='#991B1B', font=title_f, anchor='mm')
    d.text((w//2, 100), "CERTIFICATE OF ENDORSEMENT [UNACCREDITED TODA DEMO]", fill='#DC2626', font=title_f, anchor='mm')
    d.text((60, 200), "ENDORSED TO: MARIO SANTOS", fill='#0F172A', font=title_f)
    d.rectangle([40, 300, w-40, 440], fill='#FEF2F2', outline='#EF4444', width=2)
    d.text((w//2, 350), "ERROR: UNACCREDITED ASSOCIATION", fill='#991B1B', font=title_f, anchor='mm')
    d.text((w//2, 385), "Association is not in the official 17 accredited TODA directory of Gasan.", fill='#DC2626', font=body_f, anchor='mm')
    out = os.path.join(MALI_DIR, '06_mali_toda_UNAUTHORIZED_ASSOCIATION.png')
    img.save(out)

def make_mali_cedula_expired():
    w, h = 900, 600
    img = Image.new('RGB', (w, h), color='#FFF1F2')
    d = ImageDraw.Draw(img)
    d.rectangle([20, 20, w-20, h-20], outline='#991B1B', width=2)
    d.text((w//2, 45), "COMMUNITY TAX CERTIFICATE [EXPIRED TAX YEAR 2020]", fill='#991B1B', font=title_f, anchor='mm')
    d.text((50, 110), "CTC NO.: CC2020-0012948", fill='#991B1B', font=title_f)
    d.text((600, 110), "YEAR ISSUED: 2020 (EXPIRED)", fill='#DC2626', font=title_f)
    d.text((50, 170), "TAXPAYER: SANTOS, MARIO D.", fill='#0F172A', font=title_f)
    d.rectangle([40, 250, w-40, 350], fill='#FEE2E2', outline='#EF4444', width=1)
    d.text((w//2, 290), "ERROR: OLD CEDULA (MUST BE ISSUED FOR CURRENT YEAR 2026)", fill='#991B1B', font=title_f, anchor='mm')
    out = os.path.join(MALI_DIR, '07_mali_cedula_EXPIRED_YEAR.png')
    img.save(out)

def make_mali_not_a_document():
    w, h = 800, 800
    img = Image.new('RGB', (w, h), color='#F1F5F9')
    d = ImageDraw.Draw(img)
    d.rectangle([40, 40, w-40, h-40], fill='#E2E8F0', outline='#94A3B8', width=3)
    d.text((w//2, h//2 - 50), "RANDOM BLURRY IMAGE / SELFIE", fill='#64748B', font=title_f, anchor='mm')
    d.text((w//2, h//2 + 10), "[NOT A VALID GOVERNMENT DOCUMENT]", fill='#DC2626', font=title_f, anchor='mm')
    d.text((w//2, h//2 + 60), "Tests Gemini Vision OCR rejection when image is unreadable or wrong document type.", fill='#475569', font=body_f, anchor='mm')
    out = os.path.join(MALI_DIR, '08_mali_NOT_A_DOCUMENT_BLURRY.png')
    img.save(out)

if __name__ == '__main__':
    print(f"Generating TAMA documents into {TAMA_DIR}...")
    make_tama_license_front()
    make_tama_license_back()
    make_tama_cr()
    make_tama_or()
    make_tama_brgy_clearance()
    make_tama_toda_certificate()
    make_tama_cedula()
    make_tama_toda_roster()

    print(f"Generating MALI documents into {MALI_DIR}...")
    make_mali_license_expired()
    make_mali_license_wrong_code()
    make_mali_cr_mismatch()
    make_mali_cr_fake_chassis()
    make_mali_brgy_wrong_municipality()
    make_mali_toda_unauthorized()
    make_mali_cedula_expired()
    make_mali_not_a_document()

    print("SUCCESS: ALL TAMA AND MALI DOCUMENTS ORGANIZED INTO SEPARATE FOLDERS!")
