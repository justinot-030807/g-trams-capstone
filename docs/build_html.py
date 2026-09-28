import os
import re

def md_table_to_html(md_text):
    lines = md_text.split('\n')
    html_lines = []
    in_table = False
    table_rows = []

    def flush_table():
        nonlocal in_table, table_rows, html_lines
        if not table_rows:
            return
        html_lines.append('<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse; width:100%; margin:15px 0; font-size:10.5pt; border:1px solid #4a5568;">')
        is_header = True
        for r_idx, r in enumerate(table_rows):
            # check if separator row like |:---|:---|
            if re.match(r'^\s*\|?\s*:?-+:?\s*(\|?\s*:?-+:?\s*)+\|?\s*$', r):
                is_header = False
                continue
            cells = [c.strip() for c in r.strip().strip('|').split('|')]
            tag = 'th' if is_header else 'td'
            bg = ' style="background-color:#edf2f7; font-weight:bold; text-align:left; border:1px solid #4a5568; padding:6px 8px; vertical-align:top;"' if is_header else ' style="border:1px solid #4a5568; padding:6px 8px; vertical-align:top;"'
            row_html = '<tr>' + ''.join(f'<{tag}{bg}>{c}</{tag}>' for c in cells) + '</tr>'
            html_lines.append(row_html)
            if is_header:
                is_header = False
        html_lines.append('</table>')
        table_rows = []
        in_table = False

    for line in lines:
        if line.strip().startswith('|') and line.strip().endswith('|'):
            in_table = True
            table_rows.append(line)
        else:
            if in_table:
                flush_table()
            if line.startswith('# '):
                html_lines.append(f'<h1 style="font-size:18pt; color:#1a365d; margin-top:24px; margin-bottom:8px; font-family:Calibri, Arial, sans-serif;">{line[2:]}</h1>')
            elif line.startswith('## '):
                html_lines.append(f'<h2 style="font-size:14pt; color:#2b6cb0; margin-top:20px; margin-bottom:6px; border-bottom:1.5px solid #cbd5e0; padding-bottom:4px; font-family:Calibri, Arial, sans-serif;">{line[3:]}</h2>')
            elif line.startswith('### '):
                html_lines.append(f'<h3 style="font-size:12pt; color:#2d3748; margin-top:16px; margin-bottom:6px; font-family:Calibri, Arial, sans-serif;">{line[4:]}</h3>')
            elif line.startswith('#### '):
                html_lines.append(f'<h4 style="font-size:11pt; color:#4a5568; margin-top:12px; margin-bottom:4px; font-family:Calibri, Arial, sans-serif;">{line[5:]}</h4>')
            elif line.strip() == '---':
                html_lines.append('<hr style="border:0; border-top:1px solid #cbd5e0; margin:20px 0;"/>')
            elif line.strip().startswith('* ') or line.strip().startswith('- '):
                l = line.strip()[2:]
                l = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', l)
                l = re.sub(r'`(.+?)`', r'<code style="background:#edf2f7; padding:2px 4px; font-size:10pt;">\1</code>', l)
                html_lines.append(f'<li style="margin-bottom:4px; line-height:1.4;">{l}</li>')
            elif line.strip():
                l = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', line)
                l = re.sub(r'\*(.+?)\*', r'<em>\1</em>', l)
                l = re.sub(r'`(.+?)`', r'<code style="background:#edf2f7; padding:2px 4px; font-size:10pt;">\1</code>', l)
                html_lines.append(f'<p style="margin:6px 0; line-height:1.45;">{l}</p>')
            else:
                html_lines.append('')
    if in_table:
        flush_table()
    return '\n'.join(html_lines)

# Process Test Cases
with open(r'C:\Users\Hp\.gemini\antigravity\brain\eb5b0fa2-190c-4a58-9346-8301379cd75d\G-TRAMS_Test_Cases_and_Scripts.md', encoding='utf-8') as f:
    tc_md = f.read()

tc_body = md_table_to_html(tc_md)
tc_html = f'''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Deliverable #4 - Test Cases and Scripts (G-TRAMS)</title>
<style>
body {{ font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #2d3748; margin: 30px auto; max-width: 1250px; padding: 20px; line-height: 1.5; }}
table {{ border-collapse: collapse; width: 100%; margin: 15px 0; font-size: 10pt; }}
th, td {{ border: 1px solid #4a5568; padding: 6px 8px; vertical-align: top; }}
th {{ background-color: #edf2f7; font-weight: bold; text-align: left; }}
@media print {{ body {{ margin: 0; padding: 10mm; }} }}
</style>
</head>
<body>
{tc_body}
</body>
</html>'''

with open(r'c:\Users\Hp\GTRAMS\docs\Deliverable4_Test_Cases.html', 'w', encoding='utf-8') as f:
    f.write(tc_html)
print('Generated: Deliverable4_Test_Cases.html')

# Process Test Plan
with open(r'C:\Users\Hp\.gemini\antigravity\brain\eb5b0fa2-190c-4a58-9346-8301379cd75d\G-TRAMS_Test_Plan_Document.md', encoding='utf-8') as f:
    tp_md = f.read()

tp_body = md_table_to_html(tp_md)
tp_html = f'''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Deliverable #4 - Test Plan (G-TRAMS)</title>
<style>
body {{ font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #2d3748; margin: 30px auto; max-width: 1250px; padding: 20px; line-height: 1.5; }}
table {{ border-collapse: collapse; width: 100%; margin: 15px 0; font-size: 10pt; }}
th, td {{ border: 1px solid #4a5568; padding: 6px 8px; vertical-align: top; }}
th {{ background-color: #edf2f7; font-weight: bold; text-align: left; }}
@media print {{ body {{ margin: 0; padding: 10mm; }} }}
</style>
</head>
<body>
{tp_body}
</body>
</html>'''

with open(r'c:\Users\Hp\GTRAMS\docs\Deliverable4_Test_Plan.html', 'w', encoding='utf-8') as f:
    f.write(tp_html)
print('Generated: Deliverable4_Test_Plan.html')
