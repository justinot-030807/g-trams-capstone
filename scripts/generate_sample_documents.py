import os
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'sample_docs')
os.makedirs(OUTPUT_DIR, exist_ok=True)

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

# ========================================================
# SET A: "TAMA" DOCUMENTS (JUAN DELA CRUZ - POB TODA)
# ========================================================

# 1. DRIVER'S LICENSE FRONT (VALID)
def generate_license_front():
    w, h = 860, 540
    img = Image.new('RGB', (w, h), color='#F9FAFB')
    d = ImageDraw.Draw(img)

    d.rectangle([0, 0, w, 80], fill='#0284C7')
    d.rectangle([0, 80, w, 88], fill='#F59E0B')
    
    d.text((w//2, 25), "REPUBLIC OF THE PHILIPPINES", fill='#FFFFFF', font=sub_f, anchor='mm')
    d.text((w//2, 50), "DEPARTMENT OF TRANSPORTATION - LAND TRANSPORTATION OFFICE", fill='#E0F2FE', font=sm_f, anchor='mm')
    d.text((w//2, 68), "DRIVER'S LICENSE", fill='#FEF08A', font=head_f, anchor='mm')

    d.rectangle([40, 115, 200, 315], fill='#E2E8F0', outline='#94A3B8', width=2)
    d.text((120, 215), "PHOTO", fill='#64748B', font=sub_f, anchor='mm')

    d.text((230, 115), "LICENSE NO.", fill='#64748B', font=sm_f)
    d.text((230, 130), "D02-14-098231", fill='#0F172A', font=title_f)

    d.text((580, 115), "EXPIRATION DATE", fill='#64748B', font=sm_f)
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
    d.text((60, 360), "DL CODES (AUTHORIZED VEHICLES):", fill='#64748B', font=sm_f)
    d.text((60, 380), "A, A1 (MOTORCYCLES / TRICYCLES)", fill='#0F172A', font=sub_f)

    d.text((460, 360), "CONDITIONS:", fill='#64748B', font=sm_f)
    d.text((460, 380), "NONE (1)", fill='#0F172A', font=sub_f)

    d.text((60, 430), "AGENCY CODE:", fill='#64748B', font=sm_f)
    d.text((60, 445), "D02 - BOAC / GASAN", fill='#0F172A', font=bold_f)

    d.text((460, 430), "BLOOD TYPE / BIOMETRICS:", fill='#94A3B8', font=sm_f)
    d.text((460, 445), "[EXCLUDED BY LGU DIRECTIVE]", fill='#94A3B8', font=bold_f)

    d.rectangle([0, h-25, w, h], fill='#0284C7')
    d.text((w//2, h-12), "OFFICIAL MOTORIZED OPERATOR CREDENTIAL • LTO PHILIPPINES", fill='#FFFFFF', font=sm_f, anchor='mm')

    out_path = os.path.join(OUTPUT_DIR, '01_license_front.png')
    img.save(out_path)
    print(f"Generated: {out_path}")

# 2. DRIVER'S LICENSE BACK
def generate_license_back():
    w, h = 860, 540
    img = Image.new('RGB', (w, h), color='#F8FAFC')
    d = ImageDraw.Draw(img)

    d.rectangle([0, 40, w, 110], fill='#1E293B')

    barcode_y = 150
    for x in range(60, w-60, 6):
        d.line([(x, barcode_y), (x, barcode_y + 60)], fill='#0F172A', width=3 if (x % 12 == 0) else 1)

    d.text((w//2, 230), "*884719203948*", fill='#0F172A', font=mono_f, anchor='mm')

    d.rectangle([40, 260, w-40, 450], fill='#FFFFFF', outline='#E2E8F0', width=2)
    d.text((60, 280), "CARD SERIAL NUMBER:", fill='#64748B', font=sm_f)
    d.text((60, 300), "SN-884719203948", fill='#0F172A', font=title_f)

    d.text((60, 350), "DRIVING RESTRICTION CODES REFERENCE:", fill='#64748B', font=sm_f)
    d.text((60, 370), "Code A : Motorcycle (L1, L2, L3)", fill='#334155', font=body_f)
    d.text((60, 390), "Code A1: Tricycle / Motorized Tricycle (L4, L5) - MTOP Compliant", fill='#047857', font=bold_f)

    d.text((60, 420), "OFFICIAL ISSUING OFFICER:", fill='#64748B', font=sm_f)
    d.text((60, 435), "ATTY. MARKUS V. DEL ROSARIO - REGIONAL DIRECTOR", fill='#0F172A', font=bold_f)

    out_path = os.path.join(OUTPUT_DIR, '02_license_back.png')
    img.save(out_path)
    print(f"Generated: {out_path}")

# 3. LTO CERTIFICATE OF REGISTRATION (CR) (MATCHING: JUAN DELA CRUZ)
def generate_lto_cr():
    w, h = 900, 1200
    img = Image.new('RGB', (w, h), color='#FFFFFF')
    d = ImageDraw.Draw(img)

    d.rectangle([20, 20, w-20, h-20], outline='#1E3A8A', width=3)
    d.rectangle([26, 26, w-26, h-26], outline='#93C5FD', width=1)

    d.text((w//2, 60), "REPUBLIC OF THE PHILIPPINES", fill='#1E3A8A', font=sub_f, anchor='mm')
    d.text((w//2, 85), "DEPARTMENT OF TRANSPORTATION", fill='#1E3A8A', font=bold_f, anchor='mm')
    d.text((w//2, 105), "LAND TRANSPORTATION OFFICE", fill='#1E3A8A', font=sub_f, anchor='mm')
    d.text((w//2, 140), "CERTIFICATE OF REGISTRATION", fill='#DC2626', font=title_f, anchor='mm')

    d.line([(40, 170), (w-40, 170)], fill='#1E3A8A', width=2)

    d.text((50, 190), "CR NUMBER:", fill='#475569', font=sm_f)
    d.text((50, 208), "0048192019", fill='#0F172A', font=title_f)

    d.text((450, 190), "DATE OF REGISTRATION:", fill='#475569', font=sm_f)
    d.text((450, 208), "2024-02-14", fill='#0F172A', font=sub_f)

    d.text((700, 190), "MV FILE NO.:", fill='#475569', font=sm_f)
    d.text((700, 208), "0401-00000389210", fill='#0F172A', font=bold_f)

    d.rectangle([40, 260, w-40, 360], fill='#F8FAFC', outline='#CBD5E1', width=1)
    d.text((55, 275), "NAME OF REGISTERED OWNER:", fill='#475569', font=sm_f)
    d.text((55, 295), "JUAN DELA CRUZ", fill='#0F172A', font=title_f)
    d.text((55, 330), "COMPLETE ADDRESS: BARANGAY I (POBLACION), GASAN, MARINDUQUE", fill='#334155', font=bold_f)

    specs = [
        ("PLATE NUMBER", "4528-TC", "ENGINE / MOTOR NO.", "KF51E7890123"),
        ("CHASSIS NUMBER / VIN", "MH1KF5178PK098231", "MAKE / BRAND", "HONDA"),
        ("SERIES / MODEL", "TMX 125 ALPHA", "YEAR MODEL", "2024"),
        ("COLOR", "BLACK", "BODY TYPE", "MOTORCYCLE WITH SIDECAR"),
        ("VEHICLE TYPE", "TRICYCLE / MOTORCYCLE", "VEHICLE CATEGORY", "L4 / L5"),
        ("CLASSIFICATION", "FOR HIRE / PUBLIC UTILITY", "DISPLACEMENT", "125 CC"),
        ("FUEL TYPE", "GASOLINE", "PASSENGER CAPACITY", "4 PERSONS"),
        ("GROSS VEHICLE WEIGHT", "310 KG", "NET CAPACITY", "220 KG")
    ]

    y_pos = 390
    for row in specs:
        lbl1, val1, lbl2, val2 = row
        d.rectangle([40, y_pos, w//2 - 10, y_pos + 60], fill='#FFFFFF', outline='#E2E8F0', width=1)
        d.text((55, y_pos + 8), lbl1, fill='#64748B', font=sm_f)
        d.text((55, y_pos + 26), val1, fill='#0F172A', font=bold_f)

        d.rectangle([w//2 + 10, y_pos, w - 40, y_pos + 60], fill='#FFFFFF', outline='#E2E8F0', width=1)
        d.text((w//2 + 25, y_pos + 8), lbl2, fill='#64748B', font=sm_f)
        d.text((w//2 + 25, y_pos + 26), val2, fill='#0F172A', font=bold_f)
        y_pos += 68

    d.rectangle([40, 960, w-40, 1040], fill='#FEF3C7', outline='#F59E0B', width=1)
    d.text((w//2, 985), "NOTICE: PAYMENT AMOUNTS AND CASHIER SIGNATURES EXCLUDED FROM OCR", fill='#92400E', font=bold_f, anchor='mm')
    d.text((w//2, 1010), "Official Registration Record Verified Under LTO Information Database System", fill='#B45309', font=sm_f, anchor='mm')

    d.text((w//2, 1120), "OFFICIAL CERTIFICATE OF REGISTRATION — LAND TRANSPORTATION OFFICE", fill='#64748B', font=sm_f, anchor='mm')

    out_path = os.path.join(OUTPUT_DIR, '03_lto_cr.png')
    img.save(out_path)
    print(f"Generated: {out_path}")

# 4. LTO OFFICIAL RECEIPT (OR)
def generate_lto_or():
    w, h = 900, 750
    img = Image.new('RGB', (w, h), color='#FFFFFF')
    d = ImageDraw.Draw(img)

    d.rectangle([20, 20, w-20, h-20], outline='#166534', width=3)
    d.rectangle([26, 26, w-26, h-26], outline='#86EFAC', width=1)

    d.text((w//2, 50), "REPUBLIC OF THE PHILIPPINES - LAND TRANSPORTATION OFFICE", fill='#166534', font=sub_f, anchor='mm')
    d.text((w//2, 80), "OFFICIAL RECEIPT (ANNUAL MOTOR VEHICLE REGISTRATION)", fill='#15803D', font=title_f, anchor='mm')

    d.line([(40, 105), (w-40, 105)], fill='#166534', width=2)

    d.text((50, 130), "OFFICIAL RECEIPT NO. (O.R. NO.):", fill='#475569', font=sm_f)
    d.text((50, 150), "1204-0000089271", fill='#0F172A', font=title_f)

    d.text((450, 130), "O.R. DATE:", fill='#475569', font=sm_f)
    d.text((450, 150), "2026-03-12", fill='#0F172A', font=sub_f)

    d.text((700, 130), "VALIDITY UNTIL:", fill='#475569', font=sm_f)
    d.text((700, 150), "2027-03-31", fill='#15803D', font=title_f)

    d.rectangle([40, 200, w-40, 290], fill='#F0FDF4', outline='#BBF7D0', width=1)
    d.text((55, 215), "PAYER / REGISTERED OPERATOR:", fill='#166534', font=sm_f)
    d.text((55, 235), "JUAN DELA CRUZ", fill='#0F172A', font=title_f)
    d.text((55, 265), "ADDRESS: BARANGAY I (POBLACION), GASAN, MARINDUQUE", fill='#334155', font=bold_f)

    d.rectangle([40, 310, w//2 - 10, 370], fill='#FFFFFF', outline='#E2E8F0', width=1)
    d.text((55, 320), "PLATE NUMBER", fill='#64748B', font=sm_f)
    d.text((55, 338), "4528-TC", fill='#0F172A', font=title_f)

    d.rectangle([w//2 + 10, 310, w - 40, 370], fill='#FFFFFF', outline='#E2E8F0', width=1)
    d.text((w//2 + 25, 320), "ISSUING DISTRICT OFFICE", fill='#64748B', font=sm_f)
    d.text((w//2 + 25, 338), "BOAC / GASAN DISTRICT OFFICE (1204)", fill='#0F172A', font=bold_f)

    d.rectangle([40, 385, w//2 - 10, 445], fill='#FFFFFF', outline='#E2E8F0', width=1)
    d.text((55, 395), "ENGINE NUMBER", fill='#64748B', font=sm_f)
    d.text((55, 413), "KF51E7890123", fill='#0F172A', font=bold_f)

    d.rectangle([w//2 + 10, 385, w - 40, 445], fill='#FFFFFF', outline='#E2E8F0', width=1)
    d.text((w//2 + 25, 395), "CHASSIS NUMBER", fill='#64748B', font=sm_f)
    d.text((w//2 + 25, 413), "MH1KF5178PK098231", fill='#0F172A', font=bold_f)

    d.rectangle([40, 470, w-40, 560], fill='#F8FAFC', outline='#CBD5E1', width=1)
    d.text((60, 490), "PAYMENT BREAKDOWN (RECORD ENTRY):", fill='#64748B', font=sm_f)
    d.text((60, 515), "MVUC Registration Fee + Stickers Settled", fill='#0F172A', font=bold_f)
    d.text((450, 490), "STATUS:", fill='#64748B', font=sm_f)
    d.text((450, 515), "PAID & VALIDATED (CURRENT ANNUAL RENEWAL)", fill='#15803D', font=bold_f)

    d.text((w//2, 650), "OFFICIAL RECEIPT PROVES VALID MOTOR VEHICLE RENEWAL REGISTRATION", fill='#64748B', font=sm_f, anchor='mm')

    out_path = os.path.join(OUTPUT_DIR, '04_lto_or.png')
    img.save(out_path)
    print(f"Generated: {out_path}")

# 5. BARANGAY CLEARANCE (POBLACION)
def generate_brgy_clearance():
    w, h = 900, 1100
    img = Image.new('RGB', (w, h), color='#FFFFFF')
    d = ImageDraw.Draw(img)

    d.rectangle([25, 25, w-25, h-25], outline='#9E2A2B', width=3)
    d.rectangle([32, 32, w-32, h-32], outline='#D4AF37', width=1)

    d.text((w//2, 65), "REPUBLIC OF THE PHILIPPINES", fill='#1F1D1B', font=sub_f, anchor='mm')
    d.text((w//2, 90), "PROVINCE OF MARINDUQUE — MUNICIPALITY OF GASAN", fill='#1F1D1B', font=bold_f, anchor='mm')
    d.text((w//2, 115), "OFFICE OF THE PUNONG BARANGAY — BARANGAY I (POBLACION)", fill='#9E2A2B', font=sub_f, anchor='mm')
    d.line([(100, 140), (w-100, 140)], fill='#9E2A2B', width=2)

    d.text((w//2, 190), "BARANGAY CLEARANCE", fill='#1F1D1B', font=title_f, anchor='mm')
    d.text((w//2, 220), "(FOR MOTORIZED TRICYCLE FRANCHISE APPLICATION / MTOP)", fill='#64748B', font=bold_f, anchor='mm')

    d.text((60, 270), "CONTROL NO.:", fill='#64748B', font=sm_f)
    d.text((60, 290), "BC-2026-POB-019", fill='#9E2A2B', font=title_f)

    d.text((600, 270), "DATE ISSUED:", fill='#64748B', font=sm_f)
    d.text((600, 290), "2026-04-10", fill='#0F172A', font=sub_f)

    text_p1 = "TO WHOM IT MAY CONCERN:"
    text_p2 = "This is to certify that MR. JUAN DELA CRUZ, of legal age, Filipino, is a bona fide resident"
    text_p3 = "of Barangay I (Poblacion), Municipality of Gasan, Province of Marinduque."
    text_p4 = "He is a person of good moral character, law-abiding citizen, and has NO DEROGATORY"
    text_p5 = "record or pending case filed in the Lupong Tagapamayapa of this Barangay."
    text_p6 = "This certification is issued upon the request of the applicant for the purpose of:"
    text_p7 = "MUNICIPAL TRICYCLE FRANCHISE (MTOP) APPLICATION / RENEWAL"

    y = 360
    d.text((60, y), text_p1, fill='#0F172A', font=bold_f); y += 40
    d.text((60, y), text_p2, fill='#1F1D1B', font=head_f); y += 30
    d.text((60, y), text_p3, fill='#1F1D1B', font=head_f); y += 40
    d.text((60, y), text_p4, fill='#1F1D1B', font=head_f); y += 30
    d.text((60, y), text_p5, fill='#1F1D1B', font=head_f); y += 45
    d.text((60, y), text_p6, fill='#64748B', font=bold_f); y += 30
    d.text((60, y), text_p7, fill='#9E2A2B', font=title_f); y += 80

    d.line([(550, y+80), (820, y+80)], fill='#0F172A', width=2)
    d.text((685, y+95), "HON. VICENTE MORALES", fill='#0F172A', font=sub_f, anchor='mm')
    d.text((685, y+118), "Punong Barangay", fill='#64748B', font=bold_f, anchor='mm')
    d.text((685, y+138), "Barangay I (Poblacion), Gasan", fill='#64748B', font=sm_f, anchor='mm')

    out_path = os.path.join(OUTPUT_DIR, '05_brgy_clearance.png')
    img.save(out_path)
    print(f"Generated: {out_path}")

# 6. TODA ENDORSEMENT CERTIFICATE (POB TODA)
def generate_toda_certificate():
    w, h = 900, 1100
    img = Image.new('RGB', (w, h), color='#FFFFFF')
    d = ImageDraw.Draw(img)

    d.rectangle([25, 25, w-25, h-25], outline='#D97706', width=3)
    d.rectangle([32, 32, w-32, h-32], outline='#FBBF24', width=1)

    d.text((w//2, 65), "FEDERATION OF TRICYCLE OPERATORS & DRIVERS ASSOCIATION", fill='#78350F', font=bold_f, anchor='mm')
    d.text((w//2, 95), "POB TODA (POBLACION CENTRAL OPERATORS ASSOCIATION)", fill='#B45309', font=title_f, anchor='mm')
    d.text((w//2, 125), "Municipal Route Zone: Central Zone (Poblacion Town Proper Loop)", fill='#64748B', font=bold_f, anchor='mm')
    d.line([(100, 150), (w-100, 150)], fill='#D97706', width=2)

    d.text((w//2, 200), "CERTIFICATE OF TODA MEMBERSHIP & ENDORSEMENT", fill='#1F1D1B', font=title_f, anchor='mm')

    d.text((60, 260), "CERTIFICATE NO.:", fill='#64748B', font=sm_f)
    d.text((60, 280), "POB-2026-088", fill='#B45309', font=title_f)

    d.text((600, 260), "DATE ISSUED:", fill='#64748B', font=sm_f)
    d.text((600, 280), "2026-04-08", fill='#0F172A', font=sub_f)

    text_lines = [
        ("THIS IS TO CERTIFY THAT:", True),
        ("MR. JUAN DELA CRUZ", "highlight"),
        ("is a duly accredited, active, and bona fide member of POB TODA (Poblacion Central).", False),
        ("He is authorized to operate his motorized tricycle unit under the route jurisdiction", False),
        ("assigned to this association in the Municipality of Gasan, Marinduque.", False),
        ("Designated Body No.: 01 | Authorized Route Zone: Central Zone", True),
        ("LTO Plate Number: 4528-TC | Make: Honda TMX 125", True),
        ("This endorsement is issued as an official prerequisite for Municipal Franchise (MTOP) issuance.", False)
    ]

    y = 350
    for t, style in text_lines:
        if style == "highlight":
            d.text((60, y), t, fill='#B45309', font=title_f)
            y += 45
        elif style is True:
            d.text((60, y), t, fill='#0F172A', font=bold_f)
            y += 35
        else:
            d.text((60, y), t, fill='#334155', font=head_f)
            y += 32

    y = 780
    d.line([(550, y+80), (820, y+80)], fill='#0F172A', width=2)
    d.text((685, y+95), "PEDRO SANTOS", fill='#0F172A', font=sub_f, anchor='mm')
    d.text((685, y+118), "TODA President — POB TODA", fill='#B45309', font=bold_f, anchor='mm')
    d.text((685, y+138), "Poblacion, Gasan, Marinduque", fill='#64748B', font=sm_f, anchor='mm')

    out_path = os.path.join(OUTPUT_DIR, '06_toda_certificate.png')
    img.save(out_path)
    print(f"Generated: {out_path}")

# 7. COMMUNITY TAX CERTIFICATE (CEDULA - JUAN DELA CRUZ)
def generate_cedula():
    w, h = 900, 650
    img = Image.new('RGB', (w, h), color='#FFFBEB')
    d = ImageDraw.Draw(img)

    d.rectangle([20, 20, w-20, h-20], outline='#78350F', width=2)
    d.rectangle([25, 25, w-25, h-25], outline='#D97706', width=1)

    d.text((w//2, 45), "COMMUNITY TAX CERTIFICATE (INDIVIDUAL) • CEDULA", fill='#78350F', font=title_f, anchor='mm')
    d.text((w//2, 70), "MUNICIPALITY OF GASAN — PROVINCE OF MARINDUQUE", fill='#92400E', font=bold_f, anchor='mm')

    d.line([(35, 90), (w-35, 90)], fill='#78350F', width=1)

    d.text((50, 110), "CTC NUMBER / SERIAL NO.:", fill='#64748B', font=sm_f)
    d.text((50, 130), "CC12026-0928174", fill='#78350F', font=title_f)

    d.text((450, 110), "YEAR:", fill='#64748B', font=sm_f)
    d.text((450, 130), "2026", fill='#0F172A', font=sub_f)

    d.text((650, 110), "DATE ISSUED:", fill='#64748B', font=sm_f)
    d.text((650, 130), "2026-01-18", fill='#0F172A', font=sub_f)

    d.rectangle([45, 175, w-45, 280], fill='#FEF3C7', outline='#FDE68A', width=1)
    d.text((60, 190), "TAXPAYER NAME (LAST, FIRST, MIDDLE):", fill='#64748B', font=sm_f)
    d.text((60, 210), "DELA CRUZ, JUAN M.", fill='#0F172A', font=title_f)

    d.text((60, 250), "ADDRESS: BARANGAY I (POBLACION), GASAN, MARINDUQUE", fill='#334155', font=bold_f)
    d.text((550, 250), "PLACE OF ISSUE: GASAN, MARINDUQUE", fill='#334155', font=bold_f)

    d.rectangle([45, 305, w-45, 430], fill='#FFFFFF', outline='#E5E7EB', width=1)
    d.text((60, 320), "A. BASIC COMMUNITY TAX (P5.00):", fill='#334155', font=bold_f)
    d.text((600, 320), "PHP 5.00", fill='#0F172A', font=mono_f)

    d.text((60, 350), "B. ADDITIONAL COMMUNITY TAX (GROSS RECEIPTS / INCOME):", fill='#334155', font=bold_f)
    d.text((600, 350), "PHP 50.00", fill='#0F172A', font=mono_f)

    d.line([(550, 380), (750, 380)], fill='#0F172A', width=1)
    d.text((60, 395), "TOTAL AMOUNT PAID (FEE RECORDED):", fill='#78350F', font=title_f)
    d.text((600, 395), "PHP 55.00", fill='#B45309', font=title_f)

    d.text((50, 480), "MUNICIPAL TREASURER / DEPUTY COLLECTOR:", fill='#64748B', font=sm_f)
    d.text((50, 500), "MARIA CLARA — MUNICIPAL TREASURY CASHIER", fill='#0F172A', font=bold_f)

    out_path = os.path.join(OUTPUT_DIR, '07_cedula.png')
    img.save(out_path)
    print(f"Generated: {out_path}")

# 8. TODA ROSTER MASTERLIST (POB TODA)
def generate_toda_roster():
    w, h = 1240, 1754
    img = Image.new('RGB', (w, h), color='#FFFFFF')
    d = ImageDraw.Draw(img)

    d.rectangle([30, 30, w-30, h-30], outline='#1F1D1B', width=3)
    d.rectangle([36, 36, w-36, h-36], outline='#D4AF37', width=1)

    d.text((w//2, 80), "REPUBLIC OF THE PHILIPPINES", fill='#1F1D1B', font=sub_f, anchor='mm')
    d.text((w//2, 110), "PROVINCE OF MARINDUQUE — MUNICIPALITY OF GASAN", fill='#1F1D1B', font=sub_f, anchor='mm')
    d.text((w//2, 140), "TRICYCLE FRANCHISING AND REGULATORY BOARD (TFRB)", fill='#9E2A2B', font=title_f, anchor='mm')
    d.line([(w//2 - 380, 165), (w//2 + 380, 165)], fill='#9E2A2B', width=2)

    d.text((w//2, 210), "OFFICIAL MASTERLIST OF ACCREDITED TODA MEMBERS", fill='#1F1D1B', font=title_f, anchor='mm')
    d.text((w//2, 245), "ASSOCIATION: POB TODA (POBLACION CENTRAL)", fill='#9E2A2B', font=title_f, anchor='mm')
    d.text((w//2, 280), "Calendar Year 2026 Official Endorsement Roster • Route Zone: Central Zone", fill='#64748B', font=sub_f, anchor='mm')

    y = 330
    headers = ['NO.', 'MEMBER / OPERATOR NAME', 'BODY NO.', 'LTO PLATE NO.', 'BARANGAY RESIDENCE', 'STATUS']
    col_x = [60, 130, 560, 720, 910, 1110]

    d.rectangle([50, y, w-50, y+42], fill='#F0ECE1', outline='#1F1D1B', width=1)
    for i, h_text in enumerate(headers):
        d.text((col_x[i], y+14), h_text, fill='#1F1D1B', font=bold_f)

    members = [
        ('1', 'JUAN DELA CRUZ', '01', '4528-TC', 'Barangay I (Poblacion)', 'ACTIVE'),
        ('2', 'PEDRO S. SANTOS', '02', '5678-CD', 'Barangay II (Poblacion)', 'ACTIVE'),
        ('3', 'ROBERTO V. REYES', '03', '9012-EF', 'Barangay III (Poblacion)', 'ACTIVE'),
        ('4', 'MARIO D. BAUTISTA', '04', '3456-GH', 'Barangay I (Poblacion)', 'ACTIVE'),
        ('5', 'EDGARDO C. RAMOS', '05', '7890-IJ', 'Barangay II (Poblacion)', 'ACTIVE'),
        ('6', 'DANILO B. GARCIA', '06', '2345-KL', 'Barangay III (Poblacion)', 'ACTIVE'),
        ('7', 'NOEL F. MENDOZA', '07', '6789-MN', 'Barangay I (Poblacion)', 'ACTIVE'),
        ('8', 'ANTONIO L. MERCADO', '08', '8901-OP', 'Barangay II (Poblacion)', 'ACTIVE')
    ]

    y_row = y + 42
    for m in members:
        num, name, body_no, plate, brgy, stat = m
        bg = '#FDFBF7' if int(num) % 2 == 0 else '#FFFFFF'
        d.rectangle([50, y_row, w-50, y_row + 40], fill=bg, outline='#E5E7EB', width=1)
        
        name_font = bold_f if 'JUAN DELA CRUZ' in name else body_f
        color = '#9E2A2B' if 'JUAN DELA CRUZ' in name else '#0F172A'

        d.text((col_x[0] + 10, y_row + 12), num, fill='#0F172A', font=bold_f)
        d.text((col_x[1], y_row + 12), name, fill=color, font=name_font)
        d.text((col_x[2], y_row + 12), body_no, fill='#0F172A', font=mono_f)
        d.text((col_x[3], y_row + 12), plate, fill='#0F172A', font=mono_f)
        d.text((col_x[4], y_row + 12), brgy, fill='#0F172A', font=body_f)
        d.text((col_x[5], y_row + 12), stat, fill='#15803D', font=bold_f)
        y_row += 40

    y_sig = y_row + 80
    d.line([(100, y_sig + 70), (400, y_sig + 70)], fill='#0F172A', width=2)
    d.text((250, y_sig + 85), "PEDRO SANTOS", fill='#0F172A', font=bold_f, anchor='mm')
    d.text((250, y_sig + 105), "TODA President (POB TODA)", fill='#64748B', font=sm_f, anchor='mm')

    d.line([(w - 400, y_sig + 70), (w - 100, y_sig + 70)], fill='#0F172A', width=2)
    d.text((w - 250, y_sig + 85), "HON. VICENTE MORALES", fill='#0F172A', font=bold_f, anchor='mm')
    d.text((w - 250, y_sig + 105), "Punong Barangay / Association Adviser", fill='#64748B', font=sm_f, anchor='mm')

    out_path = os.path.join(OUTPUT_DIR, '08_toda_roster.png')
    img.save(out_path)
    print(f"Generated: {out_path}")

# ========================================================
# SET B: "MALI" DOCUMENTS (MARIO SANTOS - ERROR TESTING)
# ========================================================

# 9. EXPIRED DRIVER'S LICENSE (FOR MARIO SANTOS)
def generate_mali_license_expired():
    w, h = 860, 540
    img = Image.new('RGB', (w, h), color='#FFF1F2')
    d = ImageDraw.Draw(img)

    d.rectangle([0, 0, w, 80], fill='#991B1B')
    d.rectangle([0, 80, w, 88], fill='#DC2626')
    
    d.text((w//2, 25), "REPUBLIC OF THE PHILIPPINES", fill='#FFFFFF', font=sub_f, anchor='mm')
    d.text((w//2, 50), "LAND TRANSPORTATION OFFICE - OFFICIAL DRIVER'S LICENSE", fill='#FEE2E2', font=sm_f, anchor='mm')
    d.text((w//2, 68), "DRIVER'S LICENSE [EXPIRED STATUS]", fill='#FEF08A', font=head_f, anchor='mm')

    d.rectangle([40, 115, 200, 315], fill='#FEE2E2', outline='#EF4444', width=2)
    d.text((120, 215), "PHOTO", fill='#DC2626', font=sub_f, anchor='mm')

    d.text((230, 115), "LICENSE NO.", fill='#64748B', font=sm_f)
    d.text((230, 130), "D02-09-014522", fill='#0F172A', font=title_f)

    # EXPIRED DATE IN 2022!
    d.text((580, 115), "EXPIRATION DATE (EXPIRED):", fill='#DC2626', font=bold_f)
    d.text((580, 130), "2022-05-10", fill='#DC2626', font=title_f)

    d.text((230, 175), "LAST NAME, FIRST NAME, MIDDLE NAME", fill='#64748B', font=sm_f)
    d.text((230, 190), "SANTOS, MARIO D.", fill='#0F172A', font=sub_f)

    d.text((230, 230), "NATIONALITY", fill='#64748B', font=sm_f)
    d.text((230, 245), "FILIPINO", fill='#0F172A', font=bold_f)

    d.text((360, 230), "SEX", fill='#64748B', font=sm_f)
    d.text((360, 245), "M", fill='#0F172A', font=bold_f)

    d.text((450, 230), "DATE OF BIRTH", fill='#64748B', font=sm_f)
    d.text((450, 245), "1988-05-10", fill='#0F172A', font=bold_f)

    d.text((230, 280), "ADDRESS", fill='#64748B', font=sm_f)
    d.text((230, 295), "ANTIPOLO, GASAN, MARINDUQUE", fill='#0F172A', font=bold_f)

    d.rectangle([40, 345, w-40, 480], fill='#FEF2F2', outline='#FCA5A5', width=1)
    d.text((60, 360), "RESTRICTION CODES:", fill='#64748B', font=sm_f)
    d.text((60, 380), "A (MOTORCYCLE ONLY - NO SIDECAR/TRICYCLE)", fill='#DC2626', font=sub_f)

    d.text((460, 360), "STATUS ALERT:", fill='#DC2626', font=bold_f)
    d.text((460, 380), "EXPIRED - RENEWAL REQUIRED", fill='#DC2626', font=sub_f)

    out_path = os.path.join(OUTPUT_DIR, '09_mali_license_expired.png')
    img.save(out_path)
    print(f"Generated: {out_path}")

# 10. CR WITH DIFFERENT REGISTERED OWNER (NAME MISMATCH)
def generate_mali_cr_mismatch():
    w, h = 900, 1100
    img = Image.new('RGB', (w, h), color='#FFFFFF')
    d = ImageDraw.Draw(img)

    d.rectangle([20, 20, w-20, h-20], outline='#991B1B', width=3)
    d.rectangle([26, 26, w-26, h-26], outline='#FCA5A5', width=1)

    d.text((w//2, 60), "REPUBLIC OF THE PHILIPPINES - LAND TRANSPORTATION OFFICE", fill='#991B1B', font=sub_f, anchor='mm')
    d.text((w//2, 90), "CERTIFICATE OF REGISTRATION [CR OWNER MISMATCH DEMO]", fill='#DC2626', font=title_f, anchor='mm')

    d.line([(40, 115), (w-40, 115)], fill='#991B1B', width=2)

    d.text((50, 130), "CR NUMBER:", fill='#475569', font=sm_f)
    d.text((50, 150), "0099812734", fill='#0F172A', font=title_f)

    # REGISTERED TO RICARDO DALISAY INSTEAD OF MARIO SANTOS
    d.rectangle([40, 200, w-40, 310], fill='#FEF2F2', outline='#EF4444', width=2)
    d.text((55, 215), "REGISTERED OWNER (NAME MISMATCH TEST):", fill='#DC2626', font=bold_f)
    d.text((55, 240), "RICARDO DALISAY", fill='#DC2626', font=title_f)
    d.text((55, 280), "ADDRESS: POBLACION, BOAC, MARINDUQUE", fill='#475569', font=bold_f)

    specs = [
        ("PLATE NUMBER", "9912-XY", "ENGINE / MOTOR NO.", "KF51E1122334"),
        ("CHASSIS NUMBER", "MH1KF5178PK998877", "MAKE / BRAND", "KAWASAKI"),
        ("SERIES / MODEL", "BARAKO II 175", "YEAR MODEL", "2021"),
        ("COLOR", "BLUE", "BODY TYPE", "MOTORCYCLE WITH SIDECAR")
    ]

    y_pos = 340
    for row in specs:
        lbl1, val1, lbl2, val2 = row
        d.rectangle([40, y_pos, w//2 - 10, y_pos + 60], fill='#FFFFFF', outline='#E2E8F0', width=1)
        d.text((55, y_pos + 8), lbl1, fill='#64748B', font=sm_f)
        d.text((55, y_pos + 26), val1, fill='#0F172A', font=bold_f)

        d.rectangle([w//2 + 10, y_pos, w - 40, y_pos + 60], fill='#FFFFFF', outline='#E2E8F0', width=1)
        d.text((w//2 + 25, y_pos + 8), lbl2, fill='#64748B', font=sm_f)
        d.text((w//2 + 25, y_pos + 26), val2, fill='#0F172A', font=bold_f)
        y_pos += 68

    d.rectangle([40, 650, w-40, 740], fill='#FEE2E2', outline='#EF4444', width=1)
    d.text((w//2, 680), "SYSTEM TEST: APPLICANT (MARIO SANTOS) IS NOT THE REGISTERED CR OWNER", fill='#DC2626', font=bold_f, anchor='mm')
    d.text((w//2, 710), "Demonstrates System Ownership Validation & Discrepancy Flagging in LGU Review", fill='#991B1B', font=sm_f, anchor='mm')

    out_path = os.path.join(OUTPUT_DIR, '10_mali_cr_different_owner.png')
    img.save(out_path)
    print(f"Generated: {out_path}")

if __name__ == '__main__':
    print(f"Generating sample documents into {OUTPUT_DIR}...")
    generate_license_front()
    generate_license_back()
    generate_lto_cr()
    generate_lto_or()
    generate_brgy_clearance()
    generate_toda_certificate()
    generate_cedula()
    generate_toda_roster()
    generate_mali_license_expired()
    generate_mali_cr_mismatch()
    print("ALL SAMPLE DOCUMENTS GENERATED SUCCESSFULLY!")
