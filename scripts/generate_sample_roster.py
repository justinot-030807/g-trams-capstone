import os
import sys
import argparse
from PIL import Image, ImageDraw, ImageFont

def generate_roster(custom_name=None, custom_plate=None, custom_toda=None, custom_brgy=None):
    width, height = 1240, 1754  # A4 proportion
    image = Image.new('RGB', (width, height), color='#FFFFFF')
    draw = ImageDraw.Draw(image)

    # Borders
    draw.rectangle([30, 30, width-30, height-30], outline='#1F1D1B', width=3)
    draw.rectangle([36, 36, width-36, height-36], outline='#6B6761', width=1)

    # Fonts
    try:
        font_title = ImageFont.truetype('arial.ttf', 28)
        font_sub = ImageFont.truetype('arial.ttf', 18)
        font_head = ImageFont.truetype('arial.ttf', 20)
        font_bold = ImageFont.truetype('arialbd.ttf', 16)
        font_text = ImageFont.truetype('arial.ttf', 15)
        font_sm = ImageFont.truetype('arial.ttf', 13)
    except:
        font_title = font_sub = font_head = font_bold = font_text = font_sm = ImageFont.load_default()

    toda_name = custom_toda if custom_toda else 'BATODA (BACHAO TRICYCLE OPERATORS & DRIVERS ASSOCIATION)'

    # Government Header
    draw.text((width//2, 80), 'REPUBLIC OF THE PHILIPPINES', fill='#1F1D1B', font=font_sub, anchor='mm')
    draw.text((width//2, 110), 'PROVINCE OF MARINDUQUE — MUNICIPALITY OF GASAN', fill='#1F1D1B', font=font_sub, anchor='mm')
    draw.text((width//2, 140), 'TRICYCLE FRANCHISING AND REGULATORY BOARD (TFRB)', fill='#9E2A2B', font=font_head, anchor='mm')
    draw.line([(width//2 - 350, 165), (width//2 + 350, 165)], fill='#9E2A2B', width=2)

    draw.text((width//2, 210), 'OFFICIAL MASTERLIST OF ACCREDITED TODA MEMBERS', fill='#1F1D1B', font=font_title, anchor='mm')
    draw.text((width//2, 245), f'ASSOCIATION: {toda_name.upper()}', fill='#1F1D1B', font=font_head, anchor='mm')
    draw.text((width//2, 275), 'Calendar Year 2026 Official Endorsement Roster', fill='#6B6761', font=font_text, anchor='mm')

    # Table Header
    y = 330
    headers = ['NO.', 'MEMBER / OPERATOR NAME', 'BODY NO.', 'LTO PLATE NO.', 'BARANGAY RESIDENCE', 'STATUS']
    col_x = [60, 120, 520, 680, 880, 1100]

    draw.rectangle([50, y, width-50, y+38], fill='#F0ECE1', outline='#1F1D1B', width=1)
    for i, h in enumerate(headers):
        draw.text((col_x[i], y+12), h, fill='#1F1D1B', font=font_bold)

    # Base Members List
    members = [
        ('1', (custom_name.upper() if custom_name else 'JUAN M. DELA CRUZ'), '01', (custom_plate.upper() if custom_plate else '1234-AB'), (custom_brgy if custom_brgy else 'Bachao Ibaba'), 'ACTIVE'),
        ('2', 'PEDRO S. SANTOS', '02', '5678-CD', 'Bachao Ilaya', 'ACTIVE'),
        ('3', 'TESTER OPERATOR', '03', 'L154JX', 'Bachao Ibaba', 'ACTIVE'),
        ('4', 'ROBERTO V. REYES', '04', '9012-EF', 'Antipolo', 'ACTIVE'),
        ('5', 'MARIO D. BAUTISTA', '05', '3456-GH', 'Bachao Ilaya', 'ACTIVE'),
        ('6', 'EDGARDO C. RAMOS', '06', '7890-IJ', 'Bachao Ibaba', 'ACTIVE'),
        ('7', 'DANILO B. GARCIA', '07', '2345-KL', 'Antipolo', 'ACTIVE'),
        ('8', 'NOEL F. MENDOZA', '08', '6789-MN', 'Bachao Ilaya', 'ACTIVE'),
        ('9', 'ANTONIO L. MERCADO', '09', '8901-OP', 'Bachao Ibaba', 'ACTIVE'),
        ('10', 'VICENTE R. ALVAREZ', '10', '4321-QR', 'Antipolo', 'ACTIVE'),
        ('11', 'CRISTOPHER P. DIZON', '11', '8765-ST', 'Bachao Ilaya', 'ACTIVE'),
        ('12', 'BENJAMIN T. MORALES', '12', '2109-UV', 'Bachao Ibaba', 'ACTIVE'),
    ]

    y += 38
    for m in members:
        draw.rectangle([50, y, width-50, y+42], fill='#FFFFFF', outline='#E4E1DC', width=1)
        for i, val in enumerate(m):
            f = font_bold if i == 1 else font_text
            color = '#15803D' if i == 5 else '#1F1D1B'
            draw.text((col_x[i], y+12), val, fill=color, font=f)
        y += 42

    # Outer table border
    draw.rectangle([50, 330, width-50, y], outline='#1F1D1B', width=2)

    # Certification text
    y += 60
    cert_text = 'I HEREBY ATTEST AND CERTIFY UNDER PENALTY OF LAW THAT THE ABOVE-LISTED MOTORIZED TRICYCLE OPERATORS\nARE BONA FIDE, ACTIVE MEMBERS IN GOOD STANDING OF THIS ASSOCIATION FOR CALENDAR YEAR 2026.'
    draw.text((width//2, y), cert_text, fill='#1F1D1B', font=font_text, anchor='mm', align='center')

    # Signatures
    y += 120
    draw.line([(100, y), (450, y)], fill='#1F1D1B', width=2)
    draw.text((275, y+10), 'TESTER TODA PRES', fill='#1F1D1B', font=font_bold, anchor='mm')
    draw.text((275, y+30), 'TODA President / Authorized Signatory', fill='#6B6761', font=font_sm, anchor='mm')

    draw.line([(width-450, y), (width-100, y)], fill='#1F1D1B', width=2)
    draw.text((width-275, y+10), 'HON. MUNICIPAL MAYOR / BPLO', fill='#1F1D1B', font=font_bold, anchor='mm')
    draw.text((width-275, y+30), 'Approved & Received by LGU Gasan', fill='#6B6761', font=font_sm, anchor='mm')

    # Output paths
    os.makedirs('frontend/public', exist_ok=True)
    out1 = 'frontend/public/sample_toda_roster.png'
    out2 = 'sample_toda_roster.png'
    image.save(out1, 'PNG')
    image.save(out2, 'PNG')
    print(f'Successfully updated sample roster document!')
    if custom_name:
        print(f'-> Injected Member: {custom_name} (Plate: {custom_plate or "1234-AB"}, Brgy: {custom_brgy or "Bachao Ibaba"})')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Generate customized official TODA roster document')
    parser.add_argument('--name', type=str, help='Custom operator/member name to add')
    parser.add_argument('--plate', type=str, help='Plate number')
    parser.add_argument('--toda', type=str, help='TODA association name')
    parser.add_argument('--brgy', type=str, help='Barangay residence')
    args = parser.parse_args()

    generate_roster(args.name, args.plate, args.toda, args.brgy)
