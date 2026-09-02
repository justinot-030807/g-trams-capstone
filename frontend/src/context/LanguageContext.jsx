import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // TopNavbar & Sidebar
    'nav.dashboard': 'Dashboard',
    'nav.franchiseServices': 'Franchise Services',
    'nav.applyRenew': 'Apply / Renew',
    'nav.myProfile': 'My Profile',
    'nav.todaPortal': 'TODA Portal',
    'nav.submitMembers': 'Submit Members',
    'nav.helpSupport': 'Help & Support',
    'nav.profileSettings': 'Profile Settings',
    'nav.logOut': 'Log Out',
    'nav.notifications': 'Notifications',
    'nav.allCaughtUp': 'All caught up',
    'nav.unreadUpdates': 'unread update(s)',
    'nav.markAllRead': 'Mark all read',
    'nav.noNotifications': 'No new notifications',
    'nav.noNotificationsDesc': 'System updates and approval notices will appear here.',
    'nav.roleOperator': 'OPERATOR',
    'nav.roleTodaPresident': 'TODA PRESIDENT',
    'nav.roleAdmin': 'ADMINISTRATOR',

    // Operator Dashboard
    'dashboard.badge': 'Operator Portal',
    'dashboard.welcome': 'Welcome',
    'dashboard.welcomeSub': 'Manage your active and pending franchises securely.',
    'dashboard.garageTitle': 'My Franchise Garage',
    'dashboard.garageSub': 'Assigned tricycle units under your account',
    'dashboard.unitCapacity': 'Unit Capacity',
    'dashboard.noUnitsTitle': 'No Franchise Units Found',
    'dashboard.noUnitsDesc': 'Your garage is currently empty. Register your tricycle unit for a franchise.',
    'dashboard.applyNew': 'Apply New Franchise',
    'dashboard.pendingPlate': 'PENDING PLATE',
    'dashboard.routeZone': 'Route Zone',
    'dashboard.motorNumber': 'Motor Number',
    'dashboard.chassisNumber': 'Chassis Number',
    'dashboard.makeModel': 'Make & Model',
    'dashboard.toda': 'TODA',
    'dashboard.operator': 'Operator',
    'dashboard.validUntil': 'Valid Until',
    'dashboard.approvedPaymentTitle': 'Approved! Next Step: Payment',
    'dashboard.approvedPaymentDesc': 'Present your Claim Stub to the Municipal Cashier to pay the fee and claim your Official Permit.',
    'dashboard.appProgress': 'Application Progress',
    'dashboard.stepSubmitted': 'Submitted',
    'dashboard.stepReview': 'Review',
    'dashboard.stepPayment': 'Payment',
    'dashboard.stepActive': 'Active',
    'dashboard.attentionTitle': 'Application Needs Attention',
    'dashboard.attentionDesc': 'Please review the reason below and click "Fix Issues" to re-submit corrected details.',
    'dashboard.expiredTitle': 'Franchise Expired',
    'dashboard.expiredDesc': 'Your franchise validity has ended. Click "Renew Franchise" to submit your updated CTC/Cedula.',
    'dashboard.statusActive': 'Active',
    'dashboard.statusReadyPickup': 'Awaiting Payment',
    'dashboard.statusPending': 'Pending',
    'dashboard.statusCancelled': 'Cancelled',
    'dashboard.statusExpired': 'Expired',
    'dashboard.btnViewDetails': 'View Details',
    'dashboard.btnViewStub': 'View Stub',
    'dashboard.btnDownload': 'Download',
    'dashboard.btnRenew': 'Renew Franchise',
    'dashboard.btnFixIssues': 'Fix Issues',
    'dashboard.btnPendingReview': 'Pending Review',
    'dashboard.modalSpecsTitle': 'Unit Specifications',
    'dashboard.btnClose': 'Close',
    'dashboard.claimStubTitle': 'Payment & Claim Stub',
    'dashboard.claimStubHeader': 'Franchise Claim Stub',
    'dashboard.municipality': 'Municipality of Gasan',
    'dashboard.totalAmountDue': 'Total Amount Due',
    'dashboard.penaltyNote': '* Amount may vary if late penalties apply.',
    'dashboard.applicantName': 'Applicant Name',
    'dashboard.plateNo': 'Tricycle Plate No.',
    'dashboard.applicationType': 'Application Type',
    'dashboard.dateApproved': 'Date Approved',
    'dashboard.claimInstructions': 'Please present this stub (Digital or Printed) to the Municipal Cashier to process your payment and claim your Official Dry-Sealed Franchise Permit.',
    'dashboard.savePdf': 'Save as PDF / Print',

    // Manage Profile
    'profile.title': 'Account Settings',
    'profile.subtitle': 'Update personal details, credentials, and app preferences.',
    'profile.publicInfo': 'Public Information',
    'profile.uploadPhotoHint': 'Click to upload photo (JPG / PNG)',
    'profile.fullName': 'Full Name',
    'profile.contact': 'Email / Contact Number',
    'profile.toda': 'TODA Association',
    'profile.address': 'Registered Address / Barangay',
    'profile.locked': 'Locked',
    'profile.saveBtn': 'Save Information',
    'profile.preferencesTitle': 'App Preferences',
    'profile.language': 'Language',
    'profile.languageDesc': 'Select preferred system language',
    'profile.theme': 'Theme Display',
    'profile.themeDesc': 'Toggle light or dark mode styling',
    'profile.light': 'Light',
    'profile.dark': 'Dark',
    'profile.changePassword': 'Change Password',
    'profile.currentPassword': 'Current Password',
    'profile.newPassword': 'New Password',
    'profile.confirmNewPassword': 'Confirm New Password',
    'profile.updatePasswordBtn': 'Update Password',
    'profile.confirmTitle': 'Confirm Update?',
    'profile.confirmProfileDesc': 'Are you sure you want to update your profile details?',
    'profile.confirmPassDesc': 'Are you sure you want to change your account password?',
    'profile.cancel': 'Cancel',
    'profile.yesUpdate': 'Yes, Update',
    'profile.successProfile': 'Profile details updated successfully!',
    'profile.successPass': 'Password changed successfully!',
    'profile.passMismatch': 'New passwords do not match!'
  },
  fil: {
    // TopNavbar & Sidebar
    'nav.dashboard': 'Dashboard',
    'nav.franchiseServices': 'Mga Serbisyo sa Prangkisa',
    'nav.applyRenew': 'Mag-apply / Mag-renew',
    'nav.myProfile': 'Aking Profile',
    'nav.todaPortal': 'Portal ng TODA',
    'nav.submitMembers': 'Isumite ang mga Miyembro',
    'nav.helpSupport': 'Tulong at Gabay',
    'nav.profileSettings': 'Mga Setting ng Profile',
    'nav.logOut': 'Mag-log Out',
    'nav.notifications': 'Mga Notipikasyon',
    'nav.allCaughtUp': 'Wala nang bagong abiso',
    'nav.unreadUpdates': 'bagong abiso',
    'nav.markAllRead': 'Markahan lahat bilang nabasa',
    'nav.noNotifications': 'Walang bagong notipikasyon',
    'nav.noNotificationsDesc': 'Lilitaw dito ang mga update sa system at abiso sa pag-apruba.',
    'nav.roleOperator': 'OPERATOR',
    'nav.roleTodaPresident': 'PANGULO NG TODA',
    'nav.roleAdmin': 'ADMINISTRATOR',

    // Operator Dashboard
    'dashboard.badge': 'Operator Portal',
    'dashboard.welcome': 'Maligayang Pagdating',
    'dashboard.welcomeSub': 'Pamahalaan ang iyong aktibo at nakabinbing mga prangkisa nang ligtas.',
    'dashboard.garageTitle': 'Garahe ng Aking Prangkisa',
    'dashboard.garageSub': 'Mga nakatalagang yunit ng traysikel sa ilalim ng iyong account',
    'dashboard.unitCapacity': 'Kapasidad ng Yunit',
    'dashboard.noUnitsTitle': 'Walang Nahanap na Yunit ng Prangkisa',
    'dashboard.noUnitsDesc': 'Kasalukuyang walang laman ang iyong garahe. Iparehistro ang iyong yunit ng traysikel para sa prangkisa.',
    'dashboard.applyNew': 'Mag-apply ng Bagong Prangkisa',
    'dashboard.pendingPlate': 'NAGHIHINTAY NG PLAKA',
    'dashboard.routeZone': 'Sona ng Ruta',
    'dashboard.motorNumber': 'Numero ng Motor',
    'dashboard.chassisNumber': 'Numero ng Chassis',
    'dashboard.makeModel': 'Brand at Modelo',
    'dashboard.toda': 'TODA',
    'dashboard.operator': 'Operator',
    'dashboard.validUntil': 'May Bisa Hanggang',
    'dashboard.approvedPaymentTitle': 'Aprubado Na! Susunod na Hakbang: Pagbabayad',
    'dashboard.approvedPaymentDesc': 'Ipakita ang iyong Claim Stub sa Ingat-Yaman ng Munisipyo (Municipal Cashier) upang magbayad ng bayarin at makuha ang iyong Opisyal na Permiso.',
    'dashboard.appProgress': 'Progreso ng Aplikasyon',
    'dashboard.stepSubmitted': 'Naisumite',
    'dashboard.stepReview': 'Sinusuri',
    'dashboard.stepPayment': 'Pagbabayad',
    'dashboard.stepActive': 'Aktibo',
    'dashboard.attentionTitle': 'Kailangang Bigyang-Pansin ang Aplikasyon',
    'dashboard.attentionDesc': 'Pakisuri ang dahilan sa ibaba at i-click ang "Ayusin ang mga Isyu" upang muling isumite ang naitamang impormasyon.',
    'dashboard.expiredTitle': 'Paso na ang Prangkisa',
    'dashboard.expiredDesc': 'Tapos na ang bisa ng iyong prangkisa. I-click ang "I-renew ang Prangkisa" upang isumite ang iyong updated na CTC/Sedula.',
    'dashboard.statusActive': 'Aktibo',
    'dashboard.statusReadyPickup': 'Naghihintay ng Bayad',
    'dashboard.statusPending': 'Nakabinbin',
    'dashboard.statusCancelled': 'Kinansela',
    'dashboard.statusExpired': 'Paso Na',
    'dashboard.btnViewDetails': 'Tingnan ang Detalye',
    'dashboard.btnViewStub': 'Tingnan ang Stub',
    'dashboard.btnDownload': 'I-download',
    'dashboard.btnRenew': 'I-renew ang Prangkisa',
    'dashboard.btnFixIssues': 'Ayusin ang mga Isyu',
    'dashboard.btnPendingReview': 'Kasalukuyang Sinusuri',
    'dashboard.modalSpecsTitle': 'Mga Detalye ng Yunit',
    'dashboard.btnClose': 'Isara',
    'dashboard.claimStubTitle': 'Stub sa Pagbabayad at Pagkuha',
    'dashboard.claimStubHeader': 'Claim Stub ng Prangkisa',
    'dashboard.municipality': 'Bayan ng Gasan',
    'dashboard.totalAmountDue': 'Kabuuang Halagang Babayaran',
    'dashboard.penaltyNote': '* Maaaring magbago ang halaga kung may multa sa pagka-antala.',
    'dashboard.applicantName': 'Pangalan ng Aplikante',
    'dashboard.plateNo': 'Plaka ng Traysikel',
    'dashboard.applicationType': 'Uri ng Aplikasyon',
    'dashboard.dateApproved': 'Petsa ng Pag-apruba',
    'dashboard.claimInstructions': 'Mangyaring ipakita ang stub na ito (Digital o Nakaimprenta) sa Ingat-Yaman ng Munisipyo upang iproseso ang pagbabayad at makuha ang iyong Opisyal na Permiso.',
    'dashboard.savePdf': 'I-save bilang PDF / I-print',

    // Manage Profile
    'profile.title': 'Mga Setting ng Account',
    'profile.subtitle': 'I-update ang personal na impormasyon, mga kredensyal, at mga kagustuhan sa app.',
    'profile.publicInfo': 'Pampublikong Impormasyon',
    'profile.uploadPhotoHint': 'I-click upang mag-upload ng larawan (JPG / PNG)',
    'profile.fullName': 'Buong Pangalan',
    'profile.contact': 'Email / Numero ng Telepono',
    'profile.toda': 'Asosasyon ng TODA',
    'profile.address': 'Rehistradong Tirahan / Barangay',
    'profile.locked': 'Naka-lock',
    'profile.saveBtn': 'I-save ang Impormasyon',
    'profile.preferencesTitle': 'Mga Kagustuhan sa App',
    'profile.language': 'Wika (Language)',
    'profile.languageDesc': 'Piliin ang nais na wika ng sistema',
    'profile.theme': 'Tema ng Display',
    'profile.themeDesc': 'Pumili sa pagitan ng maliwanag (light) o madilim (dark) na mode',
    'profile.light': 'Maliwanag',
    'profile.dark': 'Madilim',
    'profile.changePassword': 'Palitan ang Password',
    'profile.currentPassword': 'Kasalukuyang Password',
    'profile.newPassword': 'Bagong Password',
    'profile.confirmNewPassword': 'Kumpirmahin ang Bagong Password',
    'profile.updatePasswordBtn': 'I-update ang Password',
    'profile.confirmTitle': 'Kumpirmahin ang Pag-update?',
    'profile.confirmProfileDesc': 'Sigurado ka bang nais mong i-update ang mga detalye ng iyong profile?',
    'profile.confirmPassDesc': 'Sigurado ka bang nais mong palitan ang iyong password?',
    'profile.cancel': 'Kanselahin',
    'profile.yesUpdate': 'Oo, I-update',
    'profile.successProfile': 'Matagumpay na na-update ang mga detalye ng profile!',
    'profile.successPass': 'Matagumpay na napalitan ang password!',
    'profile.passMismatch': 'Hindi tugma ang mga bagong password!'
  }
};

// Aliases for Tagalog / Filipino codes
translations.tl = translations.fil;
translations.tagalog = translations.fil;

const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (key, fallback) => fallback || key,
  changeLanguage: () => {}
});

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem('gtrams_lang');
    if (saved === 'fil' || saved === 'tl' || saved === 'tagalog') return 'fil';
    return 'en';
  });

  const changeLanguage = async (newLang) => {
    const normalized = (newLang === 'fil' || newLang === 'tl' || newLang === 'tagalog') ? 'fil' : 'en';
    setLanguageState(normalized);
    localStorage.setItem('gtrams_lang', normalized);

    // Sync preference with backend if logged in
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ language: normalized })
        });
      } catch (err) {
        console.error('Failed to sync language preference with backend:', err);
      }
    }
  };

  const t = (key, fallback) => {
    const currentDict = translations[language] || translations.en;
    if (currentDict && currentDict[key]) {
      return currentDict[key];
    }
    const enDict = translations.en;
    if (enDict && enDict[key]) {
      return enDict[key];
    }
    return fallback !== undefined ? fallback : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
export default LanguageContext;
