import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  AlertTriangle, 
  X, 
  Globe, 
  Search, 
  CheckCircle2, 
  Scale, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  UserCheck, 
  Lock, 
  Printer
} from 'lucide-react';

const TermsPolicyModal = ({
  isOpen,
  onClose,
  onAccept,
  defaultLang = 'en',
  showAcceptButton = true
}) => {
  const [lang, setLang] = useState(defaultLang);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const content = {
    en: {
      title: "TERMS OF USE & PRIVACY POLICY",
      subtitle: "Municipality of Gasan, Marinduque • MTFRB / BPLO Official Transport Portal",
      effectiveDate: "Effective Date: October 2024 (Updated for 2026 Operations)",
      searchPlaceholder: "Search policy, RA 10173, fares, penalties...",
      allTab: "All Sections",
      tabs: [
        { id: 'all', label: 'All Sections' },
        { id: 'terms', label: '1. Terms of Use' },
        { id: 'privacy', label: '2. Data Privacy (RA 10173)' },
        { id: 'obligations', label: '3. Operator Duties & Fares' },
        { id: 'penalties', label: '4. Penalties & Falsification' },
        { id: 'contact', label: '5. Appeals & Contact' }
      ],
      sections: [
        {
          id: 'terms',
          number: 'SECTION 1',
          title: 'TERMS OF USE & JURISDICTIONAL SCOPE',
          badge: 'RA 7160 Local Government Code',
          items: [
            {
              heading: '1.1 Official Purpose & Legal Mandate',
              text: 'The Gasan Tricycle Records and Application Management System (G-TRAMS) is the official electronic regulatory, licensing, and records management platform operated by the Local Government Unit (LGU) of Gasan, Marinduque, through the Business Permits and Licensing Office (BPLO) and the Municipal Tricycle Franchising and Regulatory Board (MTFRB). It is enacted pursuant to Section 447 of Republic Act No. 7160 (Local Government Code of 1991), which empowers the Sangguniang Bayan to regulate the operation of tricycles and grant franchises for the operation thereof within the territorial jurisdiction of the municipality.'
            },
            {
              heading: '1.2 Eligibility & User Qualifications',
              text: 'Access to and registration upon G-TRAMS is strictly reserved for: (a) Filipino citizens at least 18 years of age; (b) Bona fide residents of the Municipality of Gasan, Marinduque, as substantiated by valid barangay certifications; and/or (c) Duly recognized and active members/operators affiliated with registered Gasan Tricycle Operators and Drivers Associations (TODAs). Individuals submitting applications on behalf of senior citizens or legal entities must possess notarized Special Powers of Attorney (SPA).'
            },
            {
              heading: '1.3 Binding Agreement & Consent to Electronic Transactions',
              text: 'By checking "I Accept", creating an account, or transacting through G-TRAMS, you enter into a legally binding agreement with the Municipal Government of Gasan. You explicitly consent to conduct transactions electronically under Republic Act No. 8792 (Electronic Commerce Act of 2000), affirming that electronic submissions, notifications, and approvals carry identical legal force as paper-based counterparts.'
            }
          ]
        },
        {
          id: 'privacy',
          number: 'SECTION 2',
          title: 'DATA PRIVACY STATEMENT & STATUTORY RIGHTS',
          badge: 'Republic Act No. 10173 (DPA of 2012)',
          items: [
            {
              heading: '2.1 Statutory Commitment to Data Protection',
              text: 'The Municipal Government of Gasan strictly adheres to the principles of Transparency, Legitimate Purpose, and Proportionality as mandated by Republic Act No. 10173, otherwise known as the Data Privacy Act of 2012 (DPA), its Implementing Rules and Regulations (IRR), and issuances of the National Privacy Commission (NPC).'
            },
            {
              heading: '2.2 Exhaustive Scope of Personal & Sensitive Data Collected',
              text: 'To process, validate, and administer Motorized Tricycle Operator Permits (MTOP), the system collects and maintains the following categories of information: \n• Personal Identity Information: Full legal name, date of birth, residential address/barangay, civil status, mobile number, and email address.\n• Government Identifiers & Clearances: Tax Identification Number (TIN), Voter’s ID/Certificate, Barangay Clearance, and Philippine National Police (PNP) / NBI record clearances.\n• Vehicular & Licensing Records: Land Transportation Office (LTO) Professional Driver’s License details and validity, official LTO Certificate of Registration (CR) and Official Receipt (OR), vehicle make/model, motor engine number, chassis number, and allocated Municipal Commuter Hotline (MCH) body number.\n• Institutional Records: TODA Association endorsement certificate, TODA President verification signatures, and payment receipt reference codes.\n• Digital Audit & Telemetry: User IP addresses, device user-agents, login timestamps, and digital interaction audit trails.'
            },
            {
              heading: '2.3 Purpose and Lawful Basis for Processing',
              text: 'All collected data is processed exclusively for official municipal regulatory functions, specifically: (1) Verifying applicant identity and roadworthiness eligibility; (2) Allocating, renewing, transferring, or revoking MTOP franchises within statutory caps; (3) Enforcing authorized municipal routes and designated terminal zones; (4) Dispatching critical service notices, expiration reminders, and safety advisories via SMS/email; (5) Auditing revenue collection with the Municipal Treasury; and (6) Eliminating illegal "colorum" operations and duplicate franchise registrations.'
            },
            {
              heading: '2.4 Security, Confidentiality & Non-Disclosure',
              text: 'G-TRAMS implements strict administrative, physical, and technical safeguards, including SSL/TLS encryption for all data in transit, bcrypt password hashing, and role-based access control (RBAC). Under no circumstance will your personal information be sold, rented, monetized, or transferred to third-party commercial entities. Data may only be shared with authorized law enforcement agencies (LTO, PNP, Highway Patrol Group) pursuant to lawful judicial orders or emergency public safety investigations.'
            },
            {
              heading: '2.5 Your Rights as a Data Subject',
              text: 'Under Section 16 of RA 10173, you hold the following rights: (a) Right to be informed whether personal data pertaining to you is being processed; (b) Right to reasonable access upon demand; (c) Right to dispute and correct inaccurate or outdated information; (d) Right to suspend, withdraw, or order the blocking of your personal data upon legitimate grounds (subject to public record retention statutes); and (e) Right to lodge a formal grievance before the Gasan Municipal Data Protection Officer (DPO) or the National Privacy Commission (NPC).'
            }
          ]
        },
        {
          id: 'obligations',
          number: 'SECTION 3',
          title: 'OPERATOR OBLIGATIONS, ROAD SAFETY & FARE REGULATIONS',
          badge: 'Municipal Transport Code & RA 4136',
          items: [
            {
              heading: '3.1 Account Security & Integrity of Submissions',
              text: 'Account owners are strictly responsible for maintaining the confidentiality of their credentials and One-Time Passwords (OTPs). You must immediately notify the BPLO of any unauthorized access. Any application, document upload, or affirmation made through your authenticated account shall be conclusively deemed your authorized official act.'
            },
            {
              heading: '3.2 Mandatory Roadworthiness & Emission Standards',
              text: 'Every motorized tricycle granted a franchise must undergo and pass regular safety and emission inspections conducted by the Municipal Inspection Team. Vehicles must maintain functional headlights, taillights, signal lights, functional sidecar brakes, rear reflectors, clean passenger seating, and exhaust mufflers compliant with municipal noise and environmental ordinances. Operation of dilapidated units poses imminent public hazard and will trigger immediate permit suspension.'
            },
            {
              heading: '3.3 Strict Adherence to Official MTFRB Fare Matrix & 20% Mandatory Discount',
              text: 'Operators and drivers must permanently display the official, laminated Gasan MTFRB Fare Matrix inside the passenger sidecar visible to commuters. Overcharging fares beyond the prescribed municipal rate is strictly prohibited. Pursuant to Republic Act No. 9994 (Expanded Senior Citizens Act of 2010), Republic Act No. 7277 (Magna Carta for Persons with Disabilities), and Republic Act No. 11314 (Student Fare Discount Act), operators and drivers are legally bound to grant a mandatory TWENTY PERCENT (20%) DISCOUNT on regular passenger fares upon presentation of valid identification. Failure or refusal to grant this discount constitutes a direct transport code violation.'
            },
            {
              heading: '3.4 Assigned TODA Routes, Terminal Waiting & Prohibition of "Cutting Trip"',
              text: 'Operators must strictly operate within their authorized TODA route zone. Entering prohibited provincial thoroughfares, engaging in "cutting trip" (disembarking passengers before destination), refusing conveyance without valid cause, or operating outside registered TODA lines without Special Travel Permits (STP) issued by the MTFRB is strictly prohibited.'
            }
          ]
        },
        {
          id: 'penalties',
          number: 'SECTION 4',
          title: 'ANTI-FALSIFICATION, PENALTIES & FRANCHISE REVOCATION',
          badge: 'Article 172 Revised Penal Code & RA 10175',
          items: [
            {
              heading: '4.1 Criminal Liability for Document Falsification (Art. 172 Revised Penal Code)',
              text: 'The submission, uploading, or presentation of spurious, counterfeit, altered, or tampered documents—including but not limited to fraudulent LTO Driver’s Licenses, forged OR/CRs, counterfeit barangay clearances, fabricated TODA endorsements, or tampered engine/chassis numbers—constitutes a grave criminal offense under Article 172 of the Revised Penal Code (Falsification by Private Individuals and Use of Falsified Documents). Offenders face criminal prosecution punishable by imprisonment of prision correccional (up to 6 years) and punitive fines. Where digital media or computers are utilized, charges will be aggravated under Republic Act No. 10175 (Cybercrime Prevention Act of 2012).'
            },
            {
              heading: '4.2 Administrative Sanctions, Revocation & Blacklisting',
              text: 'Upon discovery of material misrepresentation, fraudulent filings, or repeated traffic offenses, the Municipal Government of Gasan, acting through the MTFRB and the Office of the Municipal Mayor, shall execute the following administrative actions:\n1. Immediate cancellation and dismissal of pending MTOP applications;\n2. Summary revocation of existing Motorized Tricycle Operator’s Permits;\n3. Permanent disqualification and blacklisting of the applicant, operator, and unit chassis from future franchise allocations within Gasan;\n4. Total forfeiture of all administrative, processing, and franchise filing fees paid to the Municipal Treasury;\n5. Formal transmittal of case dossiers to the Philippine National Police (PNP) and the Provincial Prosecutor of Marinduque for criminal indictment.'
            },
            {
              heading: '4.3 Platform Abuse, Hacking & Cyber Interference',
              text: 'Any individual who attempts to bypass security controls, inject malicious scripts, launch DDoS attacks, reverse engineer source code, scrape municipal data, or impersonate municipal officials will face immediate account termination, network IP blacklisting, and civil/criminal prosecution under RA 10175.'
            }
          ]
        },
        {
          id: 'contact',
          number: 'SECTION 5',
          title: 'AMENDMENTS, APPEALS & MUNICIPAL CONTACT DIRECTORY',
          badge: 'Administrative Redress & Due Process',
          items: [
            {
              heading: '5.1 Amendments & Ordinance Updates',
              text: 'The Local Government Unit of Gasan reserves the right to amend, update, or supplement these terms as required by newly enacted municipal ordinances, executive orders, or national legislation. Continued use of G-TRAMS subsequent to published amendments constitutes affirmative consent to the updated terms.'
            },
            {
              heading: '5.2 Administrative Redress & Right to Appeal',
              text: 'Any applicant or operator aggrieved by a franchise denial, suspension, or penalty order has the right to file a verified Motion for Reconsideration or Administrative Appeal before the Municipal Tricycle Franchising and Regulatory Board (MTFRB) within fifteen (15) calendar days from receipt of official notice. The Board shall resolve appeals in accordance with administrative due process.'
            },
            {
              heading: '5.3 Official Inquiries & Data Protection Directory',
              text: 'For regulatory inquiries, document clarifications, or data privacy concerns, please contact the municipal transport offices through official channels:\n• Office: Business Permits & Licensing Office (BPLO) / MTFRB Secretariat\n• Location: Ground Floor, Municipal Building, Mahanhlin, Gasan, Marinduque 4905\n• Telephone / Hotline: (042) 342-0123 / +63 912 345 6789\n• Official Email: bplo@gasan.gov.ph / mtfrb@gasan.gov.ph\n• Office Hours: Monday to Friday, 8:00 AM – 5:00 PM (Philippine Standard Time)'
            }
          ]
        }
      ]
    },
    tl: {
      title: "MGA TUNTUNIN SA PAGGAMIT AT PATAKARAN SA PRIVACY",
      subtitle: "Pamahalaang Bayan ng Gasan, Marinduque • Opisyal na Portal ng MTFRB / BPLO",
      effectiveDate: "Petsa ng Pagpapatupad: Oktubre 2024 (Na-update para sa 2026)",
      searchPlaceholder: "Maghanap ng paksa, RA 10173, pamasahe, parusa...",
      allTab: "Lahat ng Seksyon",
      tabs: [
        { id: 'all', label: 'Lahat ng Seksyon' },
        { id: 'terms', label: '1. Mga Tuntunin' },
        { id: 'privacy', label: '2. Data Privacy (RA 10173)' },
        { id: 'obligations', label: '3. Tungkulin at Pamasahe' },
        { id: 'penalties', label: '4. Parusa at Pamemeke' },
        { id: 'contact', label: '5. Apela at Kontak' }
      ],
      sections: [
        {
          id: 'terms',
          number: 'SEKSYON 1',
          title: 'MGA TUNTUNIN SA PAGGAMIT AT SAKLAW NG HURISDIKSYON',
          badge: 'RA 7160 Local Government Code',
          items: [
            {
              heading: '1.1 Opisyal na Layunin at Mandato Ayon sa Batas',
              text: 'Ang Gasan Tricycle Records and Application Management System (G-TRAMS) ang opisyal na electronic platform para sa regulasyon, paglilisensya, at pangangasiwa ng talaan ng prangkisa ng traysikel sa ilalim ng Lokal na Pamahalaan ng Gasan, Marinduque, sa pamamagitan ng Business Permits and Licensing Office (BPLO) at Municipal Tricycle Franchising and Regulatory Board (MTFRB). Ito ay pinapairal alinsunod sa Seksyon 447 ng Republic Act No. 7160 (Local Government Code of 1991), na nagbibigay-kapangyarihan sa Sangguniang Bayan na mag-apruba at magkaloob ng prangkisa sa operasyon ng traysikel sa nasasakupang bayan.'
            },
            {
              heading: '1.2 Kwalipikasyon ng Gumagamit at Rehistrasyon',
              text: 'Ang paggamit at pagpaparehistro sa G-TRAMS ay nakalaan lamang para sa: (a) Mamamayang Pilipino na may edad 18 pataas; (b) Lehitimong residente ng Bayan ng Gasan, Marinduque na pinatutunayan ng opisyal na Barangay Clearance; at/o (c) Aktibong miyembro o operator ng mga lehitimong samahan ng traysikel (TODA) sa Gasan. Ang mga kinatawan na nag-aasikaso para sa Senior Citizens ay kinakailangang magpakita ng notaryadong Special Power of Attorney (SPA).'
            },
            {
              heading: '1.3 May-bisang Kasunduan at Pahintulot sa Elektronikong Transaksyon',
              text: 'Sa pag-click ng "Tinatanggap Ko", paglikha ng account, o paggamit ng G-TRAMS, ikaw ay pumapasok sa isang may-bisang kasunduan sa Pamahalaang Bayan ng Gasan. Kusang-loob kang sumasang-ayon na makipagtransaksyon sa pamamagitan ng elektronikong paraan alinsunod sa Republic Act No. 8792 (E-Commerce Act of 2000), kung saan ang mga elektronikong dokumento at abiso ay may kapantay na bisa ng orihinal na papel.'
            }
          ]
        },
        {
          id: 'privacy',
          number: 'SEKSYON 2',
          title: 'PAHAYAG SA DATA PRIVACY AT MGA KARAPATAN SA ILALIM NG RA 10173',
          badge: 'Republic Act No. 10173 (Data Privacy Act of 2012)',
          items: [
            {
              heading: '2.1 Pangakong Proteksyon Ayon sa Batas',
              text: 'Mahigpit na ipinapatupad ng Pamahalaang Bayan ng Gasan ang mga prinsipyo ng Transparency (Pagiging Hayag), Legitimate Purpose (Wastong Layunin), at Proportionality alinsunod sa Republic Act No. 10173 o Data Privacy Act of 2012 (DPA), mga Alituntunin at Regulasyon nito, at mga sirkular ng National Privacy Commission (NPC).'
            },
            {
              heading: '2.2 Kumpletong Saklaw ng Impormasyong Kinokolekta',
              text: 'Upang maproseso, masuri, at mapamahalaan ang Motorized Tricycle Operator Permit (MTOP), kinokolekta at iniingatan ng sistema ang mga sumusunod:\n• Personal na Pagkakakilanlan: Buong legal na pangalan, petsa ng kapanganakan, tirahan/barangay, estado sibil, cellphone number, at email address.\n• Opisyal na ID at Clearance: TIN, Voter\'s ID/Certification, Barangay Clearance, at Police/NBI Clearance.\n• Talaan ng Sasakyan at Lisensya: LTO Professional Driver\'s License, LTO Certificate of Registration (CR) at Official Receipt (OR), brand/modelo ng traysikel, numero ng makina (engine number), numero ng tsasis (chassis number), at nakatalagang Municipal Commuter Hotline (MCH) body number.\n• Rekord sa Samahan: Sertipikasyon mula sa TODA, lagda at pagsang-ayon ng TODA President, at opisyal na resibo ng bayarin sa Ingat-Yaman.\n• Digital Audit Logs: IP address, uri ng browser/device, oras ng pag-login, at history ng transaksyon.'
            },
            {
              heading: '2.3 Layunin at Legal na Batayan ng Pagproseso',
              text: 'Ang lahat ng nakalap na datos ay eksklusibong gagamitin para sa opisyal na operasyon ng munisipyo: (1) Pagpapatunay sa pagkakakilanlan at kwalipikasyon ng aplikante; (2) Pagbibigay, pag-renew, paglilipat, o pagbawi ng MTOP alinsunod sa itinakdang limitasyon ng prangkisa; (3) Pagpapatupad ng tamang ruta at itinalagang terminal ng bawat TODA; (4) Pagpapadala ng SMS/email abiso ukol sa pagkapaso, inspeksyon, o anunsyo; (5) Pagsusuri sa koleksyon ng buwis at bayarin; at (6) Pagsugpo sa colorum at dobleng prangkisa.'
            },
            {
              heading: '2.4 Seguridad, Kumpidensyalidad at Proteksyon sa Datos',
              text: 'Nagpapatupad ang G-TRAMS ng mataas na antas ng seguridad kabilang ang SSL/TLS encryption, bcrypt password protection, at mahigpit na access control. Kailanman ay hindi ibebenta, ipapaupa, o ipapamahagi ang inyong personal na datos sa mga komersyal na kompanya. Ibabahagi lamang ito sa mga ahensya ng gobyerno (tulad ng LTO, PNP, o HPG) kapag may legal na utos ng hukuman o para sa kaligtasan ng publiko.'
            },
            {
              heading: '2.5 Ang Iyong mga Karapatan Bilang Data Subject',
              text: 'Sa ilalim ng Seksyon 16 ng RA 10173, taglay mo ang mga sumusunod na karapatan: (a) Karapatang maabisuhan kung paano pinoproseso ang iyong datos; (b) Karapatang humiling ng kopya ng iyong mga talaan; (c) Karapatang magwasto ng maling impormasyon; (d) Karapatang humiling na harangin o burahin ang datos kung may wastong legal na dahilan; at (e) Karapatang maghain ng opisyal na sumbong sa Municipal Data Protection Officer (DPO) ng Gasan o sa National Privacy Commission (NPC).'
            }
          ]
        },
        {
          id: 'obligations',
          number: 'SEKSYON 3',
          title: 'MGA TUNGKULIN NG OPERATOR, KALIGTASAN AT TARIPA SA PAMASAHE',
          badge: 'Ordinansa sa Transportasyon at RA 4136',
          items: [
            {
              heading: '3.1 Seguridad ng Account at Katotohanan ng mga Dokumento',
              text: 'Responsibilidad ng may-ari ng account na panatilihing lihim ang password at OTP. Ipagbigay-alam agad sa BPLO kung may hinalang may nakapasok sa iyong account nang walang pahintulot. Anumang aplikasyon o dokumentong naisumite gamit ang iyong account ay ituturing na opisyal at legal mong pananagutan.'
            },
            {
              heading: '3.2 Pamantayan sa Kaligtasan at Roadworthiness ng Sasakyan',
              text: 'Bawat traysikel na binigyan ng prangkisa ay dapat sumailalim sa opisyal na inspeksyon ng Munisipyo. Dapat gumagana ang headlight, signal light, preno ng sidecar, taillight, reflectors, maayos ang upuan, at sumusunod sa pamantayan sa usok at ingay ng tambutso. Ang pagpapasada ng kakarag-karag o delikadong yunit ay agarang ipapatawag at masususpinde.'
            },
            {
              heading: '3.3 Pagsunod sa Taripa ng MTFRB at Mandatory 20% Diskwento',
              text: 'Mahigpit na ipinag-uutos ang pagpapaskil ng opisyal at nakalaminang Taripa ng MTFRB sa loob ng sidecar na madaling makikita ng pasahero. Bawal ang paniningil nang higit sa itinakdang pamasahe (overcharging). Alinsunod sa Republic Act No. 9994 (Senior Citizens), Republic Act No. 7277 (PWDs), at Republic Act No. 11314 (Estudyante), obligado ang bawat drayber at operator na magbigay ng MANDATORYONG DALAWAMPUNG PORSYENTO (20%) NA DISKWENTO sa regular na pasahe sa pagpapakita ng wastong ID. Ang pagtangging magbigay ng diskwento ay may katapat na parusa sa ilalim ng batas.'
            },
            {
              heading: '3.4 Nakatakdang Ruta ng TODA at Pagbawal sa "Cutting Trip"',
              text: 'Ang pamamasada ay dapat limitado lamang sa ruta ng kinabibilangang TODA. Mahigpit na ipinagbabawal ang pagputol ng biyahe (cutting trip), pamimili ng pasahero (refusal of conveyance), o pamamasada sa labas ng itinalagang sona nang walang Special Travel Permit (STP) mula sa MTFRB.'
            }
          ]
        },
        {
          id: 'penalties',
          number: 'SEKSYON 4',
          title: 'BATAS LABAN SA PAMEMEKE, PARUSA AT PAGBAWI NG PRANGKISA',
          badge: 'Artikulo 172 Revised Penal Code at RA 10175',
          items: [
            {
              heading: '4.1 Kriminal na Pananagutan sa Pamemeke ng Dokumento (Art. 172 RPC)',
              text: 'Ang pagsusumite o paggamit ng pekeng lisensya, huwad na LTO OR/CR, palsipikadong Barangay Clearance, pekeng pirma ng TODA President, o binagong numero ng makina/tsasis ay isang mabigat na krimen sa ilalim ng Artikulo 172 ng Revised Penal Code ng Pilipinas (Falsification by Private Individuals). Ang sinumang mapapatunayan ay mahaharap sa kaparusahang pagkakakulong ng hanggang 6 na taon (prision correccional) at mabigat na multa. Kung ito ay ginamitan ng kompyuter o online system, masasampahan din ng kaso sa ilalim ng Republic Act No. 10175 (Cybercrime Prevention Act of 2012).'
            },
            {
              heading: '4.2 Administratibong Parusa, Pagbawi ng Prangkisa at Blacklisting',
              text: 'Kapag napatunayan ang pamemeke, pandaraya, o paulit-ulit na paglabag sa batas trapiko, ipatutupad ng Pamahalaang Bayan ng Gasan ang mga sumusunod:\n1. Agarang pagbasura at pagwawakas sa inihaing aplikasyon sa MTOP;\n2. Agarang pagbawi (revocation) sa umiiral na prangkisa ng traysikel;\n3. Panghabambuhay na diskwalipikasyon (blacklisting) ng aplikante, operator, at numero ng tsasis sa pagkuha ng prangkisa sa buong Gasan;\n4. Pagkaremata o hindi na maibabalik ang anumang binayarang bayarin sa Munisipyo;\n5. Pagsasampa ng kasong kriminal sa Tanggapan ng Marinduque Provincial Prosecutor at PNP.'
            },
            {
              heading: '4.3 Pag-atake sa Sistema at Ilegal na Aksyon',
              text: 'Ang sinumang magtangkang mag-hack, sumira, magpakalat ng malware, o magmanipula sa database ng G-TRAMS ay agarang haharangan ang access at pananagutin sa ilalim ng Cybercrime Law at iba pang kaugnay na batas.'
            }
          ]
        },
        {
          id: 'contact',
          number: 'SEKSYON 5',
          title: 'PAGBABAGO, APELA AT OPISYAL NA DIREKTORYO NG MUNISIPYO',
          badge: 'Due Process at Karapatan sa Pag-apela',
          items: [
            {
              heading: '5.1 Pagbabago sa mga Alituntunin',
              text: 'May karapatan ang Pamahalaang Bayan ng Gasan na amyendahan o baguhin ang mga tuntuning ito upang umayon sa mga bagong ordinansa ng Sangguniang Bayan o pambansang kautusan. Ang patuloy na paggamit ng G-TRAMS ay patunay ng iyong pagsang-ayon sa mga rebisyon.'
            },
            {
              heading: '5.2 Karapatang Mag-apela (Due Process)',
              text: 'Ang sinumang operator o aplikante na tinanggihan ang prangkisa o pinatawan ng parusa ay may karapatang maghain ng Motion for Reconsideration o pormal na apela sa MTFRB sa loob ng labinlimang (15) araw mula sa pagkatanggap ng opisyal na abiso.'
            },
            {
              heading: '5.3 Direktoryo ng Pakikipag-ugnayan sa Munisipyo',
              text: 'Para sa mga katanungan, beripikasyon ng prangkisa, o mga isyu sa data privacy, makipag-ugnayan sa opisyal na tanggapan:\n• Tanggapan: Business Permits & Licensing Office (BPLO) / MTFRB Secretariat\n• Lokasyon: Ground Floor, Gusaling Pamahalaan, Mahanhlin, Gasan, Marinduque 4905\n• Telepono / Hotline: (042) 342-0123 / +63 912 345 6789\n• Email: bplo@gasan.gov.ph / mtfrb@gasan.gov.ph\n• Oras ng Opisina: Lunes hanggang Biyernes, 8:00 AM – 5:00 PM'
            }
          ]
        }
      ]
    }
  };

  const currentData = content[lang];

  // Filter sections and items
  const filteredSections = useMemo(() => {
    return currentData.sections
      .filter(section => activeTab === 'all' || section.id === activeTab)
      .map(section => {
        if (!searchQuery.trim()) return section;
        const q = searchQuery.toLowerCase();
        const matchedItems = section.items.filter(item => 
          item.heading.toLowerCase().includes(q) || 
          item.text.toLowerCase().includes(q) ||
          section.title.toLowerCase().includes(q) ||
          section.badge.toLowerCase().includes(q)
        );
        return matchedItems.length > 0 ? { ...section, items: matchedItems } : null;
      })
      .filter(Boolean);
  }, [currentData, activeTab, searchQuery]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-modal-title"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7A1B22] via-[#63141A] to-[#450C10] text-white p-4 sm:p-5 flex-shrink-0 relative border-b border-amber-500/30">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center p-1.5 shadow-inner shrink-0">
                <img 
                  src="/gasan-seal.png" 
                  alt="Gasan Seal" 
                  className="w-full h-full object-contain filter drop-shadow" 
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#D4AF37] text-slate-950 text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded tracking-widest uppercase">
                    OFFICIAL LGU PORTAL
                  </span>
                  <span className="text-[10px] text-amber-200/80 font-medium hidden sm:inline">
                    RA 10173 & RA 7160
                  </span>
                </div>
                <h2 id="terms-modal-title" className="text-sm sm:text-base font-black tracking-wide text-white uppercase mt-0.5">
                  {currentData.title}
                </h2>
                <p className="text-[10px] sm:text-[11px] text-amber-100/80 font-medium hidden sm:block">
                  {currentData.subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Language Switcher */}
              <button 
                type="button"
                onClick={() => setLang(lang === 'en' ? 'tl' : 'en')}
                className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-amber-200 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 px-2.5 py-1 rounded-lg transition-all"
                title="Switch Language / Magpalit ng Wika"
              >
                <Globe size={13} className="text-[#D4AF37]" />
                <span>{lang === 'en' ? 'Tagalog' : 'English'}</span>
              </button>

              {/* Print Button */}
              <button 
                type="button"
                onClick={handlePrint}
                className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 px-2 py-1 rounded-lg transition-all"
                title="Print Terms"
              >
                <Printer size={13} />
              </button>

              {/* Close Button */}
              <button 
                type="button"
                onClick={onClose}
                className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Subheader & Search Bar */}
          <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="text-[10px] text-white/70 flex items-center gap-1.5">
              <Clock size={12} className="text-[#D4AF37]" />
              <span>{currentData.effectiveDate}</span>
            </div>

            <div className="relative flex-1 sm:max-w-xs">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/60" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={currentData.searchPlaceholder}
                className="w-full bg-black/25 text-white placeholder-white/50 text-[11px] pl-8 pr-7 py-1 rounded-lg border border-white/15 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 px-3 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-shrink-0">
          {currentData.tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-3 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#7A1B22] text-white shadow-sm'
                  : 'bg-white dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 text-slate-700 dark:text-slate-200 text-xs sm:text-[13px] leading-relaxed">
          {filteredSections.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="mx-auto text-amber-500 mb-2" size={32} />
              <p className="font-bold text-slate-700 dark:text-slate-300">
                {lang === 'en' ? 'No matching sections found.' : 'Walang nahanap na tugmang seksyon.'}
              </p>
              <button 
                onClick={() => setSearchQuery('')} 
                className="mt-2 text-xs text-[#7A1B22] dark:text-[#D4AF37] font-bold hover:underline"
              >
                {lang === 'en' ? 'Clear search filter' : 'Tanggalin ang filter'}
              </button>
            </div>
          ) : (
            filteredSections.map((section) => (
              <div 
                key={section.id} 
                className="bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#7A1B22] dark:text-[#D4AF37] bg-red-100/70 dark:bg-red-950/50 px-2 py-0.5 rounded">
                      {section.number}
                    </span>
                    <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white tracking-wide uppercase">
                      {section.title}
                    </h3>
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60">
                    {section.badge}
                  </span>
                </div>

                <div className="space-y-3.5">
                  {section.items.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <h4 className="font-black text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-[#7A1B22] dark:text-[#D4AF37] shrink-0" />
                        <span>{item.heading}</span>
                      </h4>
                      <p className="text-slate-600 dark:text-slate-300 pl-5 whitespace-pre-line leading-relaxed text-[11px] sm:text-xs">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Warning Notice Box */}
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl p-3.5 flex items-start gap-3 text-red-800 dark:text-red-300">
            <AlertTriangle className="shrink-0 text-red-600 dark:text-red-400 mt-0.5" size={18} />
            <div className="text-[11px] leading-relaxed">
              <p className="font-black uppercase tracking-wider mb-0.5">
                {lang === 'en' ? 'STRICT LEGAL ADVISORY' : 'MAHIGPIT NA BABALA SA ILALIM NG BATAS'}
              </p>
              <p>
                {lang === 'en'
                  ? 'Falsification of documents, providing false declarations, or operating colorum tricycles carries immediate franchise revocation, lifetime blacklisting, and criminal charges under Article 172 of the Revised Penal Code.'
                  : 'Ang pamemeke ng mga dokumento, pagsusumite ng maling impormasyon, o pamamasada ng colorum na traysikel ay may karampatang agarang pagbawi ng prangkisa, habambuhay na blacklisting, at kasong kriminal sa ilalim ng Artikulo 172 ng Revised Penal Code.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 text-center sm:text-left flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              {lang === 'en' 
                ? 'Certified compliant with Republic Act 10173 (Data Privacy Act of 2012).'
                : 'Sertipikadong sumusunod sa Republic Act 10173 (Data Privacy Act of 2012).'}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-all uppercase tracking-wider"
            >
              {lang === 'en' ? 'CLOSE' : 'ISARA'}
            </button>

            {showAcceptButton && (
              <button
                type="button"
                onClick={() => {
                  if (onAccept) onAccept();
                  onClose();
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-[#7A1B22] to-[#5A1419] hover:brightness-110 active:scale-[0.98] shadow-md transition-all uppercase tracking-wider"
              >
                <CheckCircle2 size={14} />
                <span>{lang === 'en' ? 'I ACCEPT & AGREE' : 'TINATANGGAP KO AT SUMASANG-AYON'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPolicyModal;
